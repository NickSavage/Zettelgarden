package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

type Server struct {
	DB        *sql.DB
	Testing   bool
	SchemaDir string
}

func main() {
	dbConfig := DatabaseConfig{}
	dbConfig.Host = os.Getenv("DB_HOST")
	dbConfig.Port = os.Getenv("DB_PORT")
	dbConfig.User = os.Getenv("DB_USER")
	dbConfig.Password = os.Getenv("DB_PASS")
	dbConfig.DatabaseName = os.Getenv("DB_NAME")

	db, _ := ConnectToDatabase(dbConfig)

	s := Server{
		DB:        db,
		SchemaDir: "./schema",
	}
	log.Printf("%v", s)

	authPassword := os.Getenv("AUTH_PASSWORD")
	if authPassword == "" {
		log.Fatal("AUTH_PASSWORD environment variable is not set")
	}

	r := mux.NewRouter()

	// Authentication middleware
	authMiddleware := func(expectedPassword string) mux.MiddlewareFunc {
		return func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				authHeader := r.Header.Get("Authorization")
				if authHeader != expectedPassword {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
				next.ServeHTTP(w, r)
			})
		}
	}

	// Apply middleware globally
	r.Use(authMiddleware(authPassword))

	// Hello World route (requires authentication)
	r.Handle("/hello", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello, World!"))
	}))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{os.Getenv("ZETTEL_URL")},
		AllowCredentials: true,
		AllowedHeaders:   []string{"authorization", "content-type"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		// Enable Debugging for testing, consider disabling in production
		//Debug: true,
	})

	handler := c.Handler(r)

	http.ListenAndServe(":8078", handler)
}
