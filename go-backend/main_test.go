package main

import (
	"bytes"
	"encoding/json"
	"go-backend/models"
	"io"
	"log"
	"mime/multipart"
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

	s.s3 = createS3Client()

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
	if rr.Body.String() != "unable to access file\n" {
		t.Errorf("handler returned wrong body, got %v want %v", rr.Body.String(), "unable to access file\n")
	}
}

func TestEditFileSuccess(t *testing.T) {
	setup()
	defer teardown()

	new_name := "new_name.txt"
	token, _ := generateTestJWT(1)
	fileData := models.EditFileMetadataParams{
		Name: new_name,
	}
	body, err := json.Marshal(fileData)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest("PATCH", "/api/files/1", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware((s.editFileMetadata)))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		log.Printf("%v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var file models.File
	parseJsonResponse(t, rr.Body.Bytes(), &file)
	if file.Name != new_name {
		t.Errorf("handler returned wrong file name, got %v want %v", file.Name, new_name)
	}
	if file.CardPK != 1 {
		t.Errorf("handler returned wrong file, got id %v want %v", file.ID, 1)
	}
}

func TestEditFileWrongUser(t *testing.T) {
	setup()
	defer teardown()
	new_name := "new_name.txt"
	token, _ := generateTestJWT(2)
	fileData := models.EditFileMetadataParams{
		Name: new_name,
	}
	body, err := json.Marshal(fileData)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest("PATCH", "/api/files/1", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware((s.editFileMetadata)))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		log.Printf("%v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
	if rr.Body.String() != "unable to access file\n" {
		t.Errorf("handler returned wrong body, got %v want %v", rr.Body.String(), "unable to access file\n")
	}
}

func TestUploadFileSuccess(t *testing.T) {
	setup()
	defer teardown()

	// Create a buffer to write our multipart form data
	var buffer bytes.Buffer
	writer := multipart.NewWriter(&buffer)

	// Add file field
	fileWriter, err := writer.CreateFormFile("file", "test.txt")
	if err != nil {
		t.Fatal(err)
	}

	// Open a test file to upload
	testFile, err := os.Open("./testdata/test.txt")
	if err != nil {
		t.Fatal(err)
	}
	defer testFile.Close()

	// Copy the file content to the form field
	_, err = io.Copy(fileWriter, testFile)
	if err != nil {
		t.Fatal(err)
	}

	// Add card_pk field
	err = writer.WriteField("card_pk", "1")
	if err != nil {
		t.Fatal(err)
	}

	// Close the writer to finalize the multipart form
	writer.Close()

	token, _ := generateTestJWT(1)
	req, err := http.NewRequest("POST", "/api/files/upload", &buffer)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.uploadFile))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response models.File
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	if err != nil {
		t.Fatal(err)
	}
	if response.Name != "test.txt" {
		t.Errorf("handler returned unexpected body: got %v want %v",
			rr.Body.String(), "File uploaded successfully")
	}
}
func TestDownloadFile(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
}

func TestDeleteFile(t *testing.T) {
	setup()
	defer teardown()
	t.Errorf("not implemented yet")
}
