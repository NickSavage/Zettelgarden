package main

import (
	"context"
	"database/sql"
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
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Add the claims to the request context
		ctx := context.WithValue(r.Context(), "current_user", claims.Sub)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
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
	http.HandleFunc("POST /api/files/upload/", jwtMiddleware(s.uploadFile))
	http.HandleFunc("GET /api/files/{id}", jwtMiddleware(s.getFileMetadata))
	http.HandleFunc("PATCH /api/files/{id}/", jwtMiddleware(s.editFileMetadata))
	http.HandleFunc("DELETE /api/files/{id}/", jwtMiddleware(s.deleteFile))
	http.HandleFunc("GET /api/files/download/{id}/", jwtMiddleware(s.downloadFile))

	http.HandleFunc("GET /api/cards/", jwtMiddleware(s.getCards))
	http.HandleFunc("POST /api/cards/", jwtMiddleware(s.createCard))
	http.HandleFunc("GET /api/cards/{id}/", jwtMiddleware(s.getCard))
	http.HandleFunc("PUT /api/cards/{id}/", jwtMiddleware(s.UpdateCardRoute))
	http.HandleFunc("DELETE /api/cards/{id}/", jwtMiddleware(s.DeleteCardRoute))

	http.HandleFunc("GET /api/admin/", jwtMiddleware(s.getUserAdmin))
	http.ListenAndServe(":8080", nil)
}
