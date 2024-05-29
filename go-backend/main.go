package main

import (
	"bytes"
	"context"
	"database/sql"
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

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

var s *Server

type Server struct {
	db             *sql.DB
	s3             *s3.Client
	testing        bool
	jwt_secret_key []byte
}

type Claims struct {
	Sub   int    `json:"sub"`
	Fresh bool   `json:"fresh"`
	Type  string `json:"type"`
	jwt.RegisteredClaims
}

func jwtMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("hi")
		tokenStr := r.Header.Get("Authorization")

		if tokenStr == "" {
			http.Error(w, "Authorization header is missing", http.StatusUnauthorized)
			return
		}

		tokenStr = tokenStr[len("Bearer "):]

		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return s.jwt_secret_key, nil
		})

		if err != nil {
			if err == jwt.ErrSignatureInvalid {
				http.Error(w, "Invalid token signature", http.StatusUnauthorized)
				return
			}
			http.Error(w, "Invalid token", http.StatusBadRequest)
			return
		}

		if !token.Valid {
			log.Printf("token not valid")
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Add the claims to the request context
		ctx := context.WithValue(r.Context(), "current_user", claims.Sub)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func (s *Server) getAllFiles(w http.ResponseWriter, r *http.Request) {
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
			log.Printf("%v", err)
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
	WHERE files.id = $1 and cards.user_id = $2`, id, userID)

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

func (s *Server) getFileMetadata(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	file, err := s.queryFile(userID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(file)
}

func (s *Server) editFileMetadata(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	cardPKStr := r.PathValue("id")
	cardPK, err := strconv.Atoi(cardPKStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var data models.EditFileMetadataParams
	log.Printf("data %v", r.Body)
	bodyBytes, _ := ioutil.ReadAll(r.Body)
	log.Printf("Received body: %s", string(bodyBytes))
	r.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes)) // Reconstruct the body for further use

	err = json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		log.Printf("error %v", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	_, err = s.queryFile(userID, cardPK)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = s.db.Exec("UPDATE files SET name = $1 WHERE id = $2", data.Name, cardPK)

	if err != nil {
		log.Printf("Failed to update file metadata: %v", err)
		http.Error(w, "Failed to update file metadata", http.StatusInternalServerError)
		return
	}

	file, err := s.queryFile(userID, cardPK)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(file)

}

type UploadFileParams struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
}

func userCanUploadFile(userID int, header *multipart.FileHeader) error {
	return nil
}

func (s *Server) uploadFile(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
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
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	cardPK := r.FormValue("card_pk")
	if cardPK == "undefined" {
		http.Error(w, "No PK given", http.StatusBadRequest)
		return
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

	log.Printf("file %s", s3Key)
	uploadObject(s.s3, s3Key, tempFile.Name())

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
		log.Printf("error %v", err)
		http.Error(w, "Unable to execute query", http.StatusInternalServerError)
		return
	}
	newFile, err := s.queryFile(userID, lastInsertId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newFile)
}

func main() {
	s = &Server{}

	dbConfig := databaseConfig{}
	dbConfig.host = os.Getenv("DB_HOST")
	dbConfig.port = os.Getenv("DB_PORT")
	dbConfig.user = os.Getenv("DB_USER")
	dbConfig.password = os.Getenv("DB_PASS")
	dbConfig.databaseName = os.Getenv("DB_NAME")

	db, err := ConnectToDatabase(dbConfig)
	if err != nil {
		log.Fatalf("Unable to connect to the database: %v\n", err)
	}
	s.db = db
	s.s3 = createS3Client()

	s.jwt_secret_key = []byte(os.Getenv("SECRET_KEY"))

	http.HandleFunc("GET /api/files", jwtMiddleware(s.getAllFiles))
	http.HandleFunc("POST /api/files/upload", jwtMiddleware(s.uploadFile))
	http.HandleFunc("GET /api/files/{id}", jwtMiddleware(s.getFileMetadata))
	http.HandleFunc("PATCH /api/files/{id}/", jwtMiddleware(s.editFileMetadata))
	//http.HandleFunc("DELETE /api/files/{I}/", deleteFile)
	//http.HandleFunc("GET /api/files/download/{id}", helloWorld)
	http.ListenAndServe(":8080", nil)
}
