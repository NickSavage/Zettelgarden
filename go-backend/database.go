package main

import (
	"database/sql"
	"fmt"
	"log"
)

type databaseConfig struct {
	host         string
	port         string
	user         string
	password     string
	databaseName string
}

func ConnectToDatabase(dbConfig databaseConfig) (*sql.DB, error) {
	psqlInfo := fmt.Sprintf("host=%v port=%v user=%v "+
		"password=%v dbname=%v sslmode=disable",
		dbConfig.host, dbConfig.port, dbConfig.user, dbConfig.password, dbConfig.databaseName)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatalf("Unable to connect to the database: %v\n", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}
	return db, err
}
