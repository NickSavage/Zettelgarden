package bootstrap

import (
	"log"
	"os"

	"go-backend/models"
	"go-backend/server"
)

func InitServer() *server.Server {
	dbConfig := models.DatabaseConfig{
		Host:         os.Getenv("DB_HOST"),
		Port:         os.Getenv("DB_PORT"),
		User:         os.Getenv("DB_USER"),
		Password:     os.Getenv("DB_PASS"),
		DatabaseName: os.Getenv("DB_NAME"),
	}

	db, err := server.ConnectToDatabase(dbConfig)
	if err != nil {
		log.Fatalf("Unable to connect to the database: %v\n", err)
	}

	s := &server.Server{
		DB:        db,
		SchemaDir: "./schema",
	}

	server.RunMigrations(s)
	return s
}
