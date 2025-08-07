package main

import (
	//	"bytes"
	"context"
	//"encoding/json"
	"fmt"
	"go-backend/handlers"
	"go-backend/mail"
	"go-backend/migrations"
	"go-backend/models"
	"go-backend/server"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	openai "github.com/sashabaranov/go-openai"
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

		// Update last_seen asynchronously
		go func() {
			_, err := s.DB.Exec("UPDATE users SET last_seen = NOW() WHERE id = $1", claims.Sub)
			if err != nil {
				log.Printf("Error updating last_seen: %v", err)
			}
		}()

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
	// Set up logging based on environment
	if os.Getenv("ZETTEL_DEV") != "true" {
		file, err := handlers.OpenLogFile(os.Getenv("ZETTEL_BACKEND_LOG_LOCATION"))
		if err != nil {
			log.Fatal(err)
		}
		log.SetOutput(file)
	}

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


	s.Mail = &mail.MailClient{
		Host:     os.Getenv("MAIL_HOST"),
		Password: os.Getenv("MAIL_PASSWORD"),
		Queue:    mail.NewEmailQueue(),
		DB:       s.DB,
	}
	log.Printf("email server: %v", s.Mail)
	s.JwtSecretKey = []byte(os.Getenv("SECRET_KEY"))
	config := openai.DefaultConfig(os.Getenv("ZETTEL_LLM_KEY"))
	config.BaseURL = os.Getenv("ZETTEL_LLM_ENDPOINT")


	if os.Getenv("ZETTEL_RUN_CHUNKING_EMBEDDING") == "true" {
		go func() {
			start := time.Now()
			migrations.RunEmbeddings(h)
			elapsed := time.Since(start)
			fmt.Printf("Operation took %v\n", elapsed)
		}()

	}

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
	addProtectedRoute(r, "/api/cards/next-root-id", h.GetNextRootCardIDRoute, "GET")
	addProtectedRoute(r, "/api/cards/pinned", h.GetPinnedCardsRoute, "GET")
	addProtectedRoute(r, "/api/cards/{id}", h.GetCardRoute, "GET")
	addProtectedRoute(r, "/api/cards/{id}", h.UpdateCardRoute, "PUT")
	addProtectedRoute(r, "/api/cards/{id}", h.DeleteCardRoute, "DELETE")
	addProtectedRoute(r, "/api/cards/{id}/audit", h.GetCardAuditEventsRoute, "GET")
	addProtectedRoute(r, "/api/cards/{id}/related", h.GetRelatedCardsRoute, "GET")
	addProtectedRoute(r, "/api/cards/{id}/pin", h.PinCardRoute, "POST")
	addProtectedRoute(r, "/api/cards/{id}/pin", h.UnpinCardRoute, "DELETE")

	addProtectedRoute(r, "/api/templates", h.GetTemplatesRoute, "GET")
	addProtectedRoute(r, "/api/templates", h.CreateTemplateRoute, "POST")
	addProtectedRoute(r, "/api/templates/{id}", h.GetTemplateRoute, "GET")
	addProtectedRoute(r, "/api/templates/{id}", h.UpdateTemplateRoute, "PUT")
	addProtectedRoute(r, "/api/templates/{id}", h.DeleteTemplateRoute, "DELETE")

	addProtectedRoute(r, "/api/search", h.SearchRoute, "POST")

	addProtectedRoute(r, "/api/users/{id}", h.GetUserRoute, "GET")
	addProtectedRoute(r, "/api/users/{id}", h.UpdateUserRoute, "PUT")
	addProtectedRoute(r, "/api/users", h.GetUsersRoute, "GET")
	addRoute(r, "/api/users", h.CreateUserRoute, "POST")
	addProtectedRoute(r, "/api/users/{id}/subscription", h.GetUserSubscriptionRoute, "GET")
	addProtectedRoute(r, "/api/user/memory", h.GetUserMemoryRoute, "GET")
	addProtectedRoute(r, "/api/user/memory", h.UpdateUserMemoryRoute, "PUT")
	addProtectedRoute(r, "/api/current", h.GetCurrentUserRoute, "GET")
	addProtectedRoute(r, "/api/admin", h.GetUserAdminRoute, "GET")

	addProtectedRoute(r, "/api/tasks/{id}", h.GetTaskRoute, "GET")
	addProtectedRoute(r, "/api/tasks", h.GetTasksRoute, "GET")
	addProtectedRoute(r, "/api/tasks", h.CreateTaskRoute, "POST")
	addProtectedRoute(r, "/api/tasks/{id}", h.UpdateTaskRoute, "PUT")
	addProtectedRoute(r, "/api/tasks/{id}", h.DeleteTaskRoute, "DELETE")
	addProtectedRoute(r, "/api/tasks/{id}/audit", h.GetTaskAuditEventsRoute, "GET")

	addProtectedRoute(r, "/api/tags", h.GetTagsRoute, "GET")
	addProtectedRoute(r, "/api/tags", h.CreateTagRoute, "POST")
	addProtectedRoute(r, "/api/tags/id/{id}", h.DeleteTagRoute, "DELETE")

	addProtectedRoute(r, "/api/url/parse", h.ParseURLRoute, "POST")

	addProtectedRoute(r, "/api/chat", h.GetUserConversationsRoute, "GET")
	addProtectedRoute(r, "/api/chat/{id}", h.GetChatConversationRoute, "GET")
	addProtectedRoute(r, "/api/chat", h.PostChatMessageRoute, "POST")

	addProtectedRoute(r, "/api/llms/configurations", h.GetUserLLMConfigurationsRoute, "GET")
	addProtectedRoute(r, "/api/llms/providers", h.GetUserLLMProvidersRoute, "GET")
	addProtectedRoute(r, "/api/llms/providers", h.CreateLLMProviderRoute, "POST")
	addProtectedRoute(r, "/api/llms/providers/{id}", h.UpdateLLMProviderRoute, "PUT")
	addProtectedRoute(r, "/api/llms/providers/{id}", h.DeleteLLMProviderRoute, "DELETE")
	addProtectedRoute(r, "/api/llms/models", h.CreateLLMModelRoute, "POST")
	addProtectedRoute(r, "/api/llms/models/{id}", h.DeleteLLMModelRoute, "DELETE")
	addProtectedRoute(r, "/api/llms/models/{id}", h.UpdateLLMConfigurationRoute, "PUT")

	addRoute(r, "/api/mailing-list", h.AddToMailingListRoute, "POST")
	addProtectedRoute(r, "/api/mailing-list", h.GetMailingListSubscribersRoute, "GET")
	addProtectedRoute(r, "/api/mailing-list/messages", h.GetMailingListMessagesRoute, "GET")
	addProtectedRoute(r, "/api/mailing-list/messages/send", h.SendMailingListMessageRoute, "POST")
	addProtectedRoute(r, "/api/mailing-list/messages/recipients", h.GetMessageRecipientsRoute, "GET")
	addProtectedRoute(r, "/api/mailing-list/unsubscribe", h.UnsubscribeMailingListRoute, "POST")

	addRoute(r, "/api/billing/create_checkout_session", h.CreateCheckoutSession, "POST")
	addRoute(r, "/api/billing/success", h.GetSuccessfulSessionData, "GET")
	addRoute(r, "/api/webhook", h.HandleWebhook, "POST")

	addProtectedRoute(r, "/api/entities", h.GetEntitiesRoute, "GET")
	addProtectedRoute(r, "/api/entities/name/{name}", h.GetEntityByNameRoute, "GET")
	addProtectedRoute(r, "/api/entities/merge", h.MergeEntitiesRoute, "POST")
	addProtectedRoute(r, "/api/entities/id/{id}", h.DeleteEntityRoute, "DELETE")
	addProtectedRoute(r, "/api/entities/id/{id}", h.UpdateEntityRoute, "PUT")
	addProtectedRoute(r, "/api/entities/{entityId}/cards/{cardId}", h.AddEntityToCardRoute, "POST")
	addProtectedRoute(r, "/api/entities/{entityId}/cards/{cardId}", h.RemoveEntityFromCardRoute, "DELETE")

	// Pinned searches routes
	addProtectedRoute(r, "/api/searches/pin", h.PinSearchRoute, "POST")
	addProtectedRoute(r, "/api/searches/pin/{id}", h.UnpinSearchRoute, "DELETE")
	addProtectedRoute(r, "/api/searches/pinned", h.GetPinnedSearchesRoute, "GET")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{os.Getenv("ZETTEL_URL")},
		AllowCredentials: true,
		AllowedHeaders:   []string{"authorization", "content-type"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		// Enable Debugging for testing, consider disabling in production
		//Debug: true,
	})

	handler := c.Handler(r)

	port := os.Getenv("ZETTEL_PORT")
	if port == "" {
		port = "8080"
	}
	http.ListenAndServe(":"+port, handler)
}
