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

func TestGetAllFiles(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/files", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.getAllFiles))
	handler.ServeHTTP(rr, req)

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

	token := ""
	req, err := http.NewRequest("GET", "/api/files", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.getAllFiles))
	handler.ServeHTTP(rr, req)

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
	//	defer teardown()

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

	if status := rr.Code; status != http.StatusNotFound {
		log.Printf("%v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
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

	if status := rr.Code; status != http.StatusCreated {
		log.Printf(rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var response models.UploadFileResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	if err != nil {
		t.Fatal(err)
	}
	if response.File.Name != "test.txt" {
		t.Errorf("handler returned unexpected body: got %v want %v",
			rr.Body.String(), "File uploaded successfully")
	}
}

func TestUploadFileNoFile(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)
	req, err := http.NewRequest("POST", "/api/files/upload", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.uploadFile))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestUploadFileNotAllowed(t *testing.T) {
	setup()
	defer teardown()

	var buffer bytes.Buffer
	writer := multipart.NewWriter(&buffer)

	var count int
	err := s.db.QueryRow("SELECT count(*) FROM files").Scan(&count)
	if err != nil {
		log.Fatal(err)
	}

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

	token, _ := generateTestJWT(2)
	req, err := http.NewRequest("POST", "/api/files/upload", &buffer)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.uploadFile))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusForbidden {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusForbidden)
	}
	var newCount int
	err = s.db.QueryRow("SELECT count(*) FROM files").Scan(&newCount)
	if err != nil {
		log.Fatal(err)
	}
	if count != newCount {
		t.Errorf("function created a file when it shouldn't have. old count %v new count %v", count, newCount)
	}

}

func TestDownloadFile(t *testing.T) {
	setup()
	defer teardown()
	s.uploadTestFile()

	token, _ := generateTestJWT(1)
	req, err := http.NewRequest("POST", "/api/files/download/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.downloadFile))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	if rr.Body.String() != "hello world" {
		t.Errorf("received wrong data: got %v want %v", rr.Body.String(), "hello world")
	}
}

func TestDeleteFile(t *testing.T) {
	setup()
	defer teardown()
	s.uploadTestFile()

	token, _ := generateTestJWT(1)

	req, err := http.NewRequest("DELETE", "/api/files/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.deleteFile))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	req, err = http.NewRequest("GET", "/api/files/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr = httptest.NewRecorder()
	handler = http.HandlerFunc(jwtMiddleware(s.getFileMetadata))

	handler.ServeHTTP(rr, req)
	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)

	}
}
