package main

import (
	"database/sql"
	"fmt"
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
	rows, _ := db.Query("SELECT id FROM users")
	for rows.Next() {
		var userID int
		if err := rows.Scan(&userID); err != nil {
			log.Fatalf("something is wrong: %v", err.Error())
			return
		}

		log.Printf("user %v", userID)

		tx, _ := db.Begin()
		_, err := tx.Exec("DELETE FROM inactive_cards WHERE user_id = $1", userID)
		if err != nil {
			tx.Rollback()
			log.Fatal(err.Error())
			return
		}
		query := `
	INSERT INTO inactive_cards (card_pk, user_id, card_updated_at)
SELECT c.id, c.user_id, c.updated_at
FROM cards c
LEFT JOIN (
    SELECT card_pk, MAX(created_at) AS recent_view
    FROM card_views
    GROUP BY card_pk
) cv ON c.id = cv.card_pk
WHERE c.user_id = $1 AND c.is_deleted = FALSE AND
 c.title != '' AND c.card_id NOT LIKE 'MM%' AND c.card_id NOT LIKE 'READ%'
ORDER BY cv.recent_view DESC, RANDOM()
LIMIT 20;
	`
		_, err = tx.Exec(query, userID)
		if err != nil {
			log.Printf("err %v", err)
		}
		if err := tx.Commit(); err != nil {
			log.Fatalf("committing error: %v", err.Error())
			return
		}
	}
}
