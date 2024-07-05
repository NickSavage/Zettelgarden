package main

import (
	"go-backend/models"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

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
