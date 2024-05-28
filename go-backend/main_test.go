package main

import (
	"bytes"
	"encoding/json"
	"go-backend/models"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	_ "github.com/lib/pq"
)

func setup() {
	var err error
	dbConfig := databaseConfig{}
	dbConfig.host = os.Getenv("DB_HOST")
	dbConfig.port = os.Getenv("DB_PORT")
	dbConfig.user = os.Getenv("DB_USER")
	dbConfig.password = os.Getenv("DB_PASS")
	dbConfig.databaseName = "zettelkasten_testing"

	db, err := ConnectToDatabase(dbConfig)
	if err != nil {
		log.Fatalf("Unable to connect to the database: %v\n", err)
	}
	s = &Server{}
	s.db = db
	s.testing = true

	s.runMigrations()
	s.importTestData()

}

func teardown() {
	//s.resetDatabase()
}

func parseJsonResponse(t *testing.T, body []byte, x interface{}) {
	err := json.Unmarshal(body, &x)
	if err != nil {
		t.Fatalf("could not unmarshal response: %v", err)
	}
}

func sendRequest(t *testing.T, method string, url string, token string, function http.HandlerFunc) *httptest.ResponseRecorder {

	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(function)

	handler.ServeHTTP(rr, req)
	return rr
}

func TestGetAllFiles(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)
	rr := sendRequest(t, "GET", "/api/files", token, jwtMiddleware(s.getAllFiles))

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var files []models.File
	parseJsonResponse(t, rr.Body.Bytes(), &files)
	if len(files) != 20 {
		t.Fatalf("wrong length of results, got %v want %v", len(files), 20)
	}
}
func TestGetAllFilesNoToken(t *testing.T) {
	setup()
	defer teardown()

	rr := sendRequest(t, "GET", "/api/files", "", jwtMiddleware(s.getAllFiles))

	//	print("%v", rr.Code)
	if status := rr.Code; status == http.StatusOK {
		t.Errorf("handler returned wrong status code, got %v want %v", rr.Code, http.StatusBadRequest)
	}
	if rr.Body.String() != "Invalid token\n" {
		t.Errorf("handler returned wrong body, got %v want %v", rr.Body.String(), "Invalid token")
	}
}

func TestGetFileSuccess(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)

	log.Printf("%v", token)
	req, err := http.NewRequest("GET", "/api/files/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware((s.getFileMetadata)))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		log.Printf("%v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var file models.File
	parseJsonResponse(t, rr.Body.Bytes(), &file)
	if file.ID != 1 {
		t.Errorf("handler returned wrong file, got %v want %v", file.ID, 1)
	}

}

func TestGetFileWrongUser(t *testing.T) {

	setup()
	defer teardown()

	token, _ := generateTestJWT(2)

	req, err := http.NewRequest("GET", "/api/files/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware((s.getFileMetadata)))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		log.Printf("%v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
	if rr.Body.String() != "Unable to access file\n" {
		t.Errorf("handler returned wrong body, got %v want %v", rr.Body.String(), "Unable to access file\n")
	}
}

func TestEditFileSuccess(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)
	fileData := struct {
		CardPK int    `json:"id"`
		Name   string `json:"name"`
	}{
		CardPK: 1,
		Name:   "asdasda",
	}
	body, err := json.Marshal(fileData)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest("PATCH", "/api/files", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware((s.editFileMetadata)))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		log.Printf("%v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}
	var file models.File
	parseJsonResponse(t, rr.Body.Bytes(), &file)
	if file.Name != "example.txt" {
		t.Errorf("handler returned wrong file name, got %v want %v", file.Name, "example.txt")
	}
}

func TestEditFileWrongUser(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
}

func TestDeleteFile(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
}

func TestUploadFileSuccess(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
}
func TestDownloadFile(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
}
