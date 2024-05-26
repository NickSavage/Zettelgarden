package main

import (
	"database/sql"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	_ "github.com/lib/pq"
)

var db *sql.DB

func setup() {
	var err error
	dbConfig := databaseConfig{}
	dbConfig.host = os.Getenv("DB_HOST")
	dbConfig.port = os.Getenv("DB_PORT")
	dbConfig.user = os.Getenv("DB_USER")
	dbConfig.password = os.Getenv("DB_PASS")
	dbConfig.databaseName = "zettelkasten_testing"

	db, err = ConnectToDatabase(dbConfig)
	if err != nil {
		log.Fatalf("Unable to connect to the database: %v\n", err)
	}
}

func teardown() {
	log.Printf("bye")

}
func TestUploadFileSuccess(t *testing.T) {
	setup()
	defer teardown()
	req, err := http.NewRequest("GET", "/api/files/download/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(helloWorld)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	expected := "hello world"
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}
	if err := db.Ping(); err != nil {
		t.Errorf("Cannot reach database")
	}
}

func TestGetAllFiles(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
}

func TestGetFileSuccess(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
}

func TestGetFileWrongUser(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
}

func TestEditFileSuccess(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
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

func TestDownloadFile(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
}
