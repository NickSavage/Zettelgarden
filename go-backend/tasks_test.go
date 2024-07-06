package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"go-backend/models"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/gorilla/mux"
)

func makeTaskRequestSuccess(t *testing.T, id int) *httptest.ResponseRecorder {

	token, _ := generateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/tasks/"+strconv.Itoa(id), nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", strconv.Itoa(id))

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/tasks/{id}", jwtMiddleware(s.GetTaskRoute))
	router.ServeHTTP(rr, req)

	return rr
}

func makeTasksRequestSuccess(t *testing.T, params string) *httptest.ResponseRecorder {

	token, _ := generateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/tasks/?"+params, nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.GetTasksRoute))
	handler.ServeHTTP(rr, req)

	return rr
}
func TestGetTaskSuccess(t *testing.T) {
	setup()
	defer teardown()

	rr := makeTaskRequestSuccess(t, 1)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var task models.Task
	parseJsonResponse(t, rr.Body.Bytes(), &task)
	if task.ID != 1 {
		t.Errorf("handler returned wrong task, got %v want %v", task.ID, 1)
	}
	if task.UserID != 1 {
		t.Errorf("handler returned task for wrong user, got %v want %v", task.UserID, 1)
	}
}

func TestGetTaskWrongUser(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(2)

	req, err := http.NewRequest("GET", "/api/tasks/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/tasks/{id}", jwtMiddleware(s.GetTaskRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
	if rr.Body.String() != "unable to access task\n" {
		t.Errorf("handler returned wrong body, got %v want %v", rr.Body.String(), "unable to access task\n")
	}

}

func TestGetTasksSuccess(t *testing.T) {

	setup()
	defer teardown()

	rr := makeTasksRequestSuccess(t, "")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var tasks []models.Task
	parseJsonResponse(t, rr.Body.Bytes(), &tasks)
	if len(tasks) != 20 {
		t.Errorf("wrong number of tasks returned, got %v want %v", len(tasks), 20)
	}
}

func TestUpdateTaskSuccess(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)
	expected := "ooga booga"

	rr := makeCardRequestSuccess(t, 1)
	var task models.Task
	parseJsonResponse(t, rr.Body.Bytes(), &task)

	if task.Title == expected {
		t.Errorf("something is wrong, title has changed already")
	}
	task.Title = expected
	jsonData, err := json.Marshal(task)

	req, err := http.NewRequest("PUT", "/api/tasks/1", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr = httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/tasks/{id}", jwtMiddleware(s.UpdateTaskRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	rr = makeTaskRequestSuccess(t, 1)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	parseJsonResponse(t, rr.Body.Bytes(), &task)
	if task.Title != expected {
		t.Errorf("handler return wrong title, got %v want %v", task.Title, expected)
	}
}

func TestCreateTaskSuccess(t *testing.T) {
	setup()
	defer teardown()

	var task models.Task
	var newTask models.Task
	token, _ := generateTestJWT(1)

	expectedTitle := "Test Task"
	expectedScheduledDate := sql.NullTime{
		Time:  time.Date(2024, 7, 5, 10, 0, 0, 0, time.UTC),
		Valid: true,
	}
	expectedDueDate := sql.NullTime{
		Time:  time.Date(2024, 7, 10, 10, 0, 0, 0, time.UTC),
		Valid: true,
	}
	expected := models.Task{
		CardPK:        1,
		ScheduledDate: expectedScheduledDate,
		DueDate:       expectedDueDate,
		Title:         expectedTitle,
		IsComplete:    false,
	}
	jsonData, _ := json.Marshal(expected)
	req, err := http.NewRequest("POST", "/api/tasks/", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.CreateTaskRoute))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}
	parseJsonResponse(t, rr.Body.Bytes(), &task)

	rr = makeTaskRequestSuccess(t, task.ID)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	parseJsonResponse(t, rr.Body.Bytes(), &newTask)
	if newTask.Title != expectedTitle {
		t.Errorf("handler returned wrong task title: got %v want %v", newTask.Title, expectedTitle)
	}
	if newTask.ScheduledDate != expectedScheduledDate {
		t.Errorf("handler returned wrong task scheduled date: got %v want %v", newTask.ScheduledDate, expectedScheduledDate)
	}
	if newTask.DueDate != expectedDueDate {
		t.Errorf("handler returned wrong task due date: got %v want %v", newTask.DueDate, expectedDueDate)
	}
}

func TestDeleteTaskSuccess(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)

	// Now, delete the created task
	deleteReq, err := http.NewRequest("DELETE", "/api/tasks/"+strconv.Itoa(1), nil)
	if err != nil {
		t.Fatal(err)
	}
	deleteReq.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/tasks/{id}", jwtMiddleware(s.DeleteTaskRoute))
	router.ServeHTTP(rr, deleteReq)

	if status := rr.Code; status != http.StatusNoContent {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}

	// Verify the task is marked as deleted
	getReq, err := http.NewRequest("GET", "/api/tasks/"+strconv.Itoa(1), nil)
	if err != nil {
		t.Fatal(err)
	}
	getReq.Header.Set("Authorization", "Bearer "+token)

	rr = makeTaskRequestSuccess(t, 1)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
}
