package main

import (
	"database/sql"
	"fmt"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func ConnectToDatabase(dbConfig models.DatabaseConfig) (*sql.DB, error) {
	psqlInfo := fmt.Sprintf("host=%v port=%v user=%v "+
		"password=%v dbname=%v sslmode=disable",
		dbConfig.Host, dbConfig.Port, dbConfig.User, dbConfig.Password, dbConfig.DatabaseName)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatalf("Unable to connect to the database: %v\n", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}
	return db, err
}

func main() {

	dbConfig := models.DatabaseConfig{}
	dbConfig.Host = os.Getenv("DB_HOST")
	dbConfig.Port = os.Getenv("DB_PORT")
	dbConfig.User = os.Getenv("DB_USER")
	dbConfig.Password = os.Getenv("DB_PASS")
	dbConfig.DatabaseName = os.Getenv("DB_NAME")

	db, err := ConnectToDatabase(dbConfig)

	if err != nil {
		log.Fatalf("unable to connect to db: %v", err.Error())
		return
	}

	rows, _ := db.Query("SELECT id FROM users WHERE memory_has_changed = true")
	for rows.Next() {
		var userID uint
		if err := rows.Scan(&userID); err != nil {
			log.Fatalf("something is wrong: %v", err.Error())
			return
		}

		client := llms.NewDefaultClient(db, int(userID))
		llms.CompressUserMemory(db, client, userID)

		_, err := db.Exec("UPDATE users SET memory_has_changed = false WHERE id = $1", userID)
		if err != nil {
			log.Printf("failed to update memory_has_changed flag for user %d: %v", userID, err)
		}
	}

}
