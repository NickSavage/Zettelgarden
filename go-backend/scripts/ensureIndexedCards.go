package main

import (
	"database/sql"
	"fmt"
	"go-backend/handlers"
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

	s := handlers.Handler{
		DB: db,
	}

	rows, _ := db.Query("select a.id, a.user_id from cards as a left join card_embeddings as b on a.id = b.card_pk WHERE b.card_pk is null")

	for rows.Next() {
		var cardPK int
		var userID int
		if err := rows.Scan(&cardPK, &userID); err != nil {
			log.Fatalf("something is wrong: %v", err.Error())
			return
		}
		log.Printf("%v %v", cardPK, userID)
		s.ChunkEmbedCard(userID, cardPK)
	}

	rows, _ = db.Query("select id, user_id, name, type, description from entities where embedding_1024 is null")

	for rows.Next() {
		var entityPK int
		var userID int
		var name, entity_type, description string

		if err := rows.Scan(&entityPK, &userID, &name, &entity_type, &description); err != nil {
			log.Fatalf("something is wrong: %v", err.Error())
			return
		}

		entity := models.Entity{
			ID:          entityPK,
			UserID:      userID,
			Name:        name,
			Type:        entity_type,
			Description: description,
		}

		s.CalculateEmbeddingForEntity(entity)
		log.Printf("%v %v", entityPK, userID)
	}
}
