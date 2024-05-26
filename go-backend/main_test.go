package main

import (
	"database/sql"
	"fmt"
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
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASS")
	dbname := "zettelkasten_testing"

	psqlInfo := fmt.Sprintf("host=%v port=%v user=%v "+
		"password=%v dbname=%v sslmode=disable",
		host, port, user, password, dbname)

	db, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatalf("Unable to connect to the database: %v\n", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal(err)
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
