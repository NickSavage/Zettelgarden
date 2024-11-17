package main

import (
	//	"bytes"
	"context"
	//"encoding/json"
	"go-backend/handlers"
	"go-backend/models"
	"go-backend/server"
	"log"
	"net/http"
	"os"
	// "time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"github.com/stripe/stripe-go"
)

var s *server.Server
var h *handlers.Handler

func admin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("current_user").(int)
		user, err := h.QueryUser(userID)
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
			return s.JwtSecretKey, nil
		})

		if err != nil {
			if err == jwt.ErrSignatureInvalid {
				http.Error(w, "Invalid token signature", http.StatusUnauthorized)
				return
			}
			http.Error(w, "Invalid token", http.StatusUnauthorized)
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

func addProtectedRoute(r *mux.Router, path string, handler http.HandlerFunc, method string) *mux.Route {
	return r.HandleFunc(path, jwtMiddleware(handlers.LogRoute(handler))).Methods(method)

}

func addRoute(r *mux.Router, path string, handler http.HandlerFunc, method string) *mux.Route {
	return r.HandleFunc(path, handlers.LogRoute(handler)).Methods(method)
}

func main() {
	// file, err := handlers.OpenLogFile(os.Getenv("ZETTEL_BACKEND_LOG_LOCATION"))
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// log.SetOutput(file)
	s = &server.Server{}

	dbConfig := models.DatabaseConfig{}
	dbConfig.Host = os.Getenv("DB_HOST")
	dbConfig.Port = os.Getenv("DB_PORT")
	dbConfig.User = os.Getenv("DB_USER")
	dbConfig.Password = os.Getenv("DB_PASS")
	dbConfig.DatabaseName = os.Getenv("DB_NAME")

	db, err := server.ConnectToDatabase(dbConfig)

	if err != nil {
		log.Fatalf("Unable to connect to the database: %v\n", err)
	}
	s.DB = db
	s.SchemaDir = "./schema"
	server.RunMigrations(s)

	h = &handlers.Handler{
		Server: s,
		DB:     s.DB,
	}

	s.S3 = h.CreateS3Client()

	s.StripeKey = os.Getenv("STRIPE_SECRET_KEY")
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	s.Mail = &server.MailClient{
		Host:     os.Getenv("MAIL_HOST"),
		Password: os.Getenv("MAIL_PASSWORD"),
	}
	log.Printf("email server: %v", s.Mail)
	s.JwtSecretKey = []byte(os.Getenv("SECRET_KEY"))

	go func() {
		h.SyncStripePlans()
	}()

	r := mux.NewRouter()
	addProtectedRoute(r, "/api/auth", h.CheckTokenRoute, "GET")
	addRoute(r, "/api/login", h.LoginRoute, "POST")
	addRoute(r, "/api/reset-password", h.ResetPasswordRoute, "POST")
	addRoute(r, "/api/email-validate", h.ValidateEmailRoute, "POST")
	addRoute(r, "/api/request-reset", h.RequestPasswordResetRoute, "POST")

	addProtectedRoute(r, "/api/files", h.GetAllFilesRoute, "GET")
	addProtectedRoute(r, "/api/files/upload", h.UploadFileRoute, "POST")
	addProtectedRoute(r, "/api/files/{id}", h.GetFileMetadataRoute, "GET")
	addProtectedRoute(r, "/api/files/{id}", h.EditFileMetadataRoute, "PATCH")
	addProtectedRoute(r, "/api/files/{id}", h.DeleteFileRoute, "DELETE")
	addProtectedRoute(r, "/api/files/download/{id}", h.DownloadFileRoute, "GET")

	addProtectedRoute(r, "/api/cards", h.GetCardsRoute, "GET")
	addProtectedRoute(r, "/api/cards", h.CreateCardRoute, "POST")
	addProtectedRoute(r, "/api/next", h.NextIDRoute, "POST")
	addProtectedRoute(r, "/api/search", h.SemanticSearchCardsRoute, "GET")
	addProtectedRoute(r, "/api/cards/{id}", h.GetCardRoute, "GET")
	addProtectedRoute(r, "/api/cards/{id}", h.UpdateCardRoute, "PUT")
	addProtectedRoute(r, "/api/cards/{id}", h.DeleteCardRoute, "DELETE")
	addProtectedRoute(r, "/api/cards/{id}/related", h.GetRelatedCardsRoute, "GET")

	addProtectedRoute(r, "/api/users/{id}", h.GetUserRoute, "GET")
	addProtectedRoute(r, "/api/users/{id}", h.UpdateUserRoute, "PUT")
	addProtectedRoute(r, "/api/users", h.GetUsersRoute, "GET")
	addRoute(r, "/api/users", h.CreateUserRoute, "POST")
	addProtectedRoute(r, "/api/users/{id}/subscription", h.GetUserSubscriptionRoute, "GET")
	addProtectedRoute(r, "/api/current", h.GetCurrentUserRoute, "GET")
	addProtectedRoute(r, "/api/admin", h.GetUserAdminRoute, "GET")

	addProtectedRoute(r, "/api/tasks/{id}", h.GetTaskRoute, "GET")
	addProtectedRoute(r, "/api/tasks", h.GetTasksRoute, "GET")
	addProtectedRoute(r, "/api/tasks", h.CreateTaskRoute, "POST")
	addProtectedRoute(r, "/api/tasks/{id}", h.UpdateTaskRoute, "PUT")
	addProtectedRoute(r, "/api/tasks/{id}", h.DeleteTaskRoute, "DELETE")

	addProtectedRoute(r, "/api/tags", h.GetTagsRoute, "GET")
	addProtectedRoute(r, "/api/tags/id/{id}", h.DeleteTagRoute, "DELETE")

	addProtectedRoute(r, "/api/url/parse", h.ParseURLRoute, "POST")

	addRoute(r, "/api/billing/create_checkout_session", h.CreateCheckoutSession, "POST")
	addRoute(r, "/api/billing/success", h.GetSuccessfulSessionData, "GET")
	addRoute(r, "/api/webhook", h.HandleWebhook, "POST")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{os.Getenv("ZETTEL_URL")},
		AllowCredentials: true,
		AllowedHeaders:   []string{"authorization", "content-type"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		// Enable Debugging for testing, consider disabling in production
		//Debug: true,
	})

	handler := c.Handler(r)
	http.ListenAndServe(":8080", handler)
}
