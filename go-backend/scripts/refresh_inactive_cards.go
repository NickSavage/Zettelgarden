package main

import (
	"go-backend/handlers"
	"go-backend/models"
	"go-backend/server"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	dbConfig := models.DatabaseConfig{}
	dbConfig.Host = os.Getenv("DB_HOST")
	dbConfig.Port = os.Getenv("DB_PORT")
	dbConfig.User = os.Getenv("DB_USER")
	dbConfig.Password = os.Getenv("DB_PASS")
	dbConfig.DatabaseName = os.Getenv("DB_NAME")

	db, err := server.ConnectToDatabase(dbConfig)

	s := &handlers.Handler{
		Server: &server.Server{
			DB: db,
		},
		DB: db,
	}
	if err != nil {
		log.Fatalf("unable to connect to db: %v", err.Error())
		return
	}
	rows, _ := db.Query("SELECT id FROM users")
	for rows.Next() {
		var userID int
		if err := rows.Scan(&userID); err != nil {
			log.Fatalf("something is wrong: %v", err.Error())
			return
		}

		log.Printf("user %v", userID)

		s.GenerateInactiveCards(userID)
	}
}
