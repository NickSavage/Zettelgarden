package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"go-backend/models"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/golang-jwt/jwt/v4"
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

func (s *Server) getFileMetadata(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	id := r.PathValue("id")

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
		log.Printf("%v", err)
		http.Error(w, "Unable to access file", http.StatusBadRequest)
		return
	}
	file.Card = partialCard
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(file)
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
	//http.HandleFunc("POST /api/files/upload", uplpadFile)
	http.HandleFunc("GET /api/files/{id}", jwtMiddleware(s.getFileMetadata))
	//http.HandleFunc("PATCH /api/files/{I}/", editFile)
	//http.HandleFunc("DELETE /api/files/{I}/", deleteFile)
	//http.HandleFunc("GET /api/files/download/{id}", helloWorld)
	http.ListenAndServe(":8080", nil)
}
