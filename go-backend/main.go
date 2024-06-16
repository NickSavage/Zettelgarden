package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"go-backend/models"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/golang-jwt/jwt/v4"
	"github.com/rs/cors"
)

var s *Server

type Server struct {
	db             *sql.DB
	s3             *s3.Client
	testing        bool
	jwt_secret_key []byte
	mail           *MailClient
	TestInspector  *TestInspector
}

type MailClient struct {
	Host     string
	Password string
}

type TestInspector struct {
	EmailsSent int
}

func admin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("current_user").(int)
		user, err := s.QueryUser(userID)
		if err != nil {
			http.Error(w, "User not found", http.StatusBadRequest)
			return
		}
		if !user.IsAdmin {
			http.Error(w, "Access denied", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	}
}

func jwtMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenStr := r.Header.Get("Authorization")

		if tokenStr == "" {
			http.Error(w, "Authorization header is missing", http.StatusUnauthorized)
			return
		}

		tokenStr = tokenStr[len("Bearer "):]

		claims := &models.Claims{}

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

type Email struct {
	Subject   string `json:"subject"`
	Recipient string `json:"recipient"`
	Body      string `json:"body"`
}

func (s *Server) SendEmail(subject, recipient, body string) error {
	if s.testing {
		s.TestInspector.EmailsSent += 1
		return nil
	}
	email := Email{
		Subject:   subject,
		Recipient: recipient,
		Body:      body,
	}

	// Convert email struct to JSON

	emailJSON, err := json.Marshal(email)
	if err != nil {
		return err
	}
	go func() {

		// Create a new request
		req, err := http.NewRequest("POST", s.mail.Host+"/api/send", bytes.NewBuffer(emailJSON))
		if err != nil {
			return
		}

		// Set headers
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", s.mail.Password)

		// Send the request
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return
		}
		defer resp.Body.Close()

		// Check the response status code
		if resp.StatusCode != http.StatusOK {
			log.Printf("failed to send email: %s", resp.Status)
			return
		}
	}()
	return nil
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

	s.mail = &MailClient{
		Host:     os.Getenv("MAIL_HOST"),
		Password: os.Getenv("MAIL_PASSWORD"),
	}
	s.jwt_secret_key = []byte(os.Getenv("SECRET_KEY"))

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/auth/", jwtMiddleware(s.CheckTokenRoute))
	mux.HandleFunc("POST /api/login/", s.LoginRoute)
	mux.HandleFunc("POST /api/reset-password/", s.ResetPasswordRoute)
	mux.HandleFunc("GET /api/email-validate/", jwtMiddleware(s.ResendEmailValidationRoute))
	mux.HandleFunc("POST /api/email-validate/", s.ValidateEmailRoute)
	mux.HandleFunc("POST /api/request-reset/", s.RequestPasswordResetRoute)

	mux.HandleFunc("GET /api/files", jwtMiddleware(s.GetAllFilesRoute))
	mux.HandleFunc("POST /api/files/upload/", jwtMiddleware(s.UploadFileRoute))
	mux.HandleFunc("GET /api/files/{id}", jwtMiddleware(s.GetFileMetadataRoute))
	mux.HandleFunc("PATCH /api/files/{id}/", jwtMiddleware(s.EditFileMetadataRoute))
	mux.HandleFunc("DELETE /api/files/{id}/", jwtMiddleware(s.DeleteFileRoute))
	mux.HandleFunc("GET /api/files/download/{id}/", jwtMiddleware(s.DownloadFileRoute))

	mux.HandleFunc("GET /api/cards/", jwtMiddleware(s.GetCardsRoute))
	mux.HandleFunc("POST /api/cards/", jwtMiddleware(s.CreateCardRoute))
	mux.HandleFunc("POST /api/next/", jwtMiddleware(s.NextIDRoute))
	mux.HandleFunc("GET /api/cards/{id}/", jwtMiddleware(s.GetCardRoute))
	mux.HandleFunc("PUT /api/cards/{id}/", jwtMiddleware(s.UpdateCardRoute))
	mux.HandleFunc("DELETE /api/cards/{id}/", jwtMiddleware(s.DeleteCardRoute))

	mux.HandleFunc("GET /api/users/{id}/", jwtMiddleware(admin(s.GetUserRoute)))
	mux.HandleFunc("PUT /api/users/{id}/", jwtMiddleware(s.UpdateUserRoute))
	mux.HandleFunc("GET /api/users/", jwtMiddleware(admin(s.GetUsersRoute)))
	mux.HandleFunc("POST /api/users/", s.CreateUserRoute)
	mux.HandleFunc("GET /api/users/{id}/subscription/", jwtMiddleware(admin(s.GetUserSubscriptionRoute)))
	mux.HandleFunc("GET /api/current/", jwtMiddleware(s.GetCurrentUserRoute))
	mux.HandleFunc("GET /api/admin/", jwtMiddleware(s.GetUserAdminRoute))

	handler := cors.Default().Handler(mux)
	http.ListenAndServe(":8080", handler)
}
