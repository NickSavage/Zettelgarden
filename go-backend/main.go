package main

import (
	"database/sql"
	"fmt"
	"net/http"
)

type Server struct {
	db      *sql.DB
	testing bool
}

func helloWorld(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "hello world")
}

func main() {
	createS3Client()
	//http.HandleFunc("GET /api/files", getAllFiles)
	//http.HandleFunc("POST /api/files/upload", uplpadFile)
	//http.HandleFunc("GET /api/files/{I}/", getFileMetadata)
	//http.HandleFunc("PATCH /api/files/{I}/", editFile)
	//http.HandleFunc("DELETE /api/files/{I}/", deleteFile)
	//http.HandleFunc("GET /api/files/download/{id}", helloWorld)
	http.ListenAndServe(":8080", nil)
}
