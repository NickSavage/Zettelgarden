package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"go-backend/models"
	"io"
	"io/ioutil"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

func (s *Server) GetAllFilesRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	rows, err := s.db.Query(`
	SELECT
    f.id, f.name, f.type, f.path, f.filename, f.size,
    f.created_by, f.updated_by, f.card_pk, f.is_deleted,
    f.created_at, f.updated_at,
    c.id, c.card_id, c.title, c.created_at, c.updated_at
FROM
    files as f
JOIN
    cards as c ON f.card_pk = c.id
	WHERE f.is_deleted = FALSE AND c.user_id = $1`, userID)

	defer rows.Close()

	var files []models.File

	for rows.Next() {
		var file models.File
		var partialCard models.PartialCard
		if err := rows.Scan(
			&file.ID,
			&file.Name,
			&file.Filetype,
			&file.Path,
			&file.Filename,
			&file.Size,
			&file.CreatedBy,
			&file.UpdatedBy,
			&file.CardPK,
			&file.IsDeleted,
			&file.CreatedAt,
			&file.UpdatedAt,
			&partialCard.ID,
			&partialCard.CardID,
			&partialCard.Title,
			&partialCard.CreatedAt,
			&partialCard.UpdatedAt,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		file.Card = partialCard
		files = append(files, file)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	jsonResponse, err := json.Marshal(files)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Write the JSON response
	w.WriteHeader(http.StatusOK)
	w.Write(jsonResponse)
}

func (s *Server) queryFile(userID int, id int) (models.File, error) {

	row := s.db.QueryRow(`
	SELECT files.id, files.name, files.type, files.path, files.filename, files.size, files.created_by, files.updated_by, files.card_pk, files.is_deleted, 
	files.created_at, files.updated_at, cards.id, cards.card_id, cards.title, cards.created_at, cards.updated_at

	FROM files
	JOIN cards ON files.card_pk = cards.id
	WHERE files.is_deleted = FALSE and files.id = $1 and cards.user_id = $2`, id, userID)

	var file models.File
	var partialCard models.PartialCard

	if err := row.Scan(
		&file.ID,
		&file.Name,
		&file.Filetype,
		&file.Path,
		&file.Filename,
		&file.Size,
		&file.CreatedBy,
		&file.UpdatedBy,
		&file.CardPK,
		&file.IsDeleted,
		&file.CreatedAt,
		&file.UpdatedAt,
		&partialCard.ID,
		&partialCard.CardID,
		&partialCard.Title,
		&partialCard.CreatedAt,
		&partialCard.UpdatedAt,
	); err != nil {
		return models.File{}, errors.New("unable to access file")
	}
	file.Card = partialCard
	return file, nil
}

func getFilesFromCardPK(userID int, cardPK int) ([]models.File, error) {

	files := []models.File{}
	rows, err := s.db.Query(`
	SELECT 
	files.id, files.name, files.type, files.path, files.filename, 
	files.size, files.created_by, files.updated_by, files.card_pk,
	files.is_deleted, files.created_at, files.updated_at
	FROM files
	WHERE files.is_deleted = FALSE and files.card_pk = $1`, cardPK)

	if err != nil {
		return files, err
	}

	defer rows.Close()

	for rows.Next() {
		var file models.File
		if err := rows.Scan(
			&file.ID,
			&file.Name,
			&file.Filetype,
			&file.Path,
			&file.Filename,
			&file.Size,
			&file.CreatedBy,
			&file.UpdatedBy,
			&file.CardPK,
			&file.IsDeleted,
			&file.CreatedAt,
			&file.UpdatedAt,
		); err != nil {
			return files, err
		}
		files = append(files, file)
	}

	if err := rows.Err(); err != nil {
		return files, err
	}
	return files, nil

}

func (s *Server) GetFileMetadataRoute(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)

	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	file, err := s.queryFile(userID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(file)
}

func (s *Server) EditFileMetadataRoute(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	filePK, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var data models.EditFileMetadataParams
	bodyBytes, _ := ioutil.ReadAll(r.Body)
	r.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes)) // Reconstruct the body for further use

	err = json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	_, err = s.queryFile(userID, filePK)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = s.db.Exec("UPDATE files SET name = $1, card_pk = $2 WHERE id = $3", data.Name, data.CardPK, filePK)

	if err != nil {
		http.Error(w, "Failed to update file metadata", http.StatusInternalServerError)
		return
	}

	file, err := s.queryFile(userID, filePK)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(file)

}

func userCanUploadFile(userID int, header *multipart.FileHeader) error {
	user, err := s.QueryUser(userID)
	if err != nil {
		return fmt.Errorf("unknown problem")
	}
	if !user.CanUploadFiles {
		return fmt.Errorf("user does not have permissions to upload files")
	}
	var alreadyUploaded int
	err = s.db.QueryRow(`SELECT COALESCE(sum(size), 0) FROM files WHERE created_by = $1`, userID).Scan(&alreadyUploaded)
	if err != nil {
		return err
	}
	if alreadyUploaded+int(header.Size) > user.MaxFileStorage {
		return fmt.Errorf("out of storage")
	}
	return nil
}

func (s *Server) UploadFileRoute(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		log.Printf("1")
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "No file part", http.StatusBadRequest)
		return
	}
	defer file.Close()
	err = userCanUploadFile(userID, handler)
	if err != nil {
		log.Printf("e?")
		log.Printf("err %v", err.Error())
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	var cardPK int
	cardPKForm := r.FormValue("card_pk")
	if cardPKForm == "undefined" {
		cardPK = -1
	} else {
		cardPK, err = strconv.Atoi(cardPKForm)
		if err != nil {
			http.Error(w, "No PK given", http.StatusBadRequest)
			return
		}
	}

	tempFile, err := os.CreateTemp("/tmp", "upload-*.tmp")
	if err != nil {
		http.Error(w, "Unable to create temp file", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())

	// Write the file content to the temporary file
	if _, err := file.Seek(0, 0); err != nil {
		http.Error(w, "Unable to seek file", http.StatusInternalServerError)
		return
	}
	if _, err := tempFile.ReadFrom(file); err != nil {
		http.Error(w, "Unable to read file", http.StatusInternalServerError)
		return
	}
	uuidKey := uuid.New().String()
	s3Key := fmt.Sprintf("%s/%s", strconv.Itoa(userID), uuidKey)

	s.uploadObject(s.s3, s3Key, tempFile.Name())

	fileSize, err := tempFile.Seek(0, io.SeekEnd)
	if err != nil {
		http.Error(w, "Unable to determine file size", http.StatusInternalServerError)
		return
	}
	var lastInsertId int
	query := `INSERT INTO files (name, type, path, filename,
		size, card_pk, created_by, updated_by, updated_at) VALUES
		($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id;`
	err = s.db.QueryRow(query,
		handler.Filename,
		handler.Header.Get("Content-Type"),
		s3Key,
		s3Key,
		fileSize,
		cardPK,
		userID,
		userID).Scan(&lastInsertId)
	if err != nil {
		http.Error(w, "Unable to execute query", http.StatusInternalServerError)
		return
	}
	newFile, err := s.queryFile(userID, lastInsertId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	output := models.UploadFileResponse{
		Message: "File successfully uploaded",
		File:    newFile,
	}
	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(output)
}

func (s *Server) DownloadFileRoute(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	cardPK, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	file, err := s.queryFile(userID, cardPK)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	s3Output, err := s.downloadObject(s.s3, file.Filename, "")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	w.Header().Set("Content-Type", "application/octet-stream")
	if s.testing {
		return
	}
	// Copy the file content to the response
	if _, err := io.Copy(w, s3Output.Body); err != nil {
		http.Error(w, "Unable to send file", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", file.Filename))

}

func (s *Server) DeleteFileRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	cardPK, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	file, err := s.queryFile(userID, cardPK)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	query := `UPDATE files SET is_deleted = true WHERE id = $1`
	_, err = s.db.Exec(query, cardPK)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	err = s.deleteObject(s.s3, file.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		_, _ = s.db.Exec(`UPDATE files SET is_deleted = false WHERE id = $1`, cardPK)
		return
	}
}
