package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"sort"

	_ "github.com/lib/pq"
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

func (s *Server) resetDatabase() error {
	_, err := s.db.Exec(`
			DROP TABLE IF EXISTS users CASCADE;
			DROP TABLE IF EXISTS cards CASCADE;
			DROP TABLE IF EXISTS backlinks CASCADE;
			DROP TABLE IF EXISTS card_views CASCADE;
			DROP TABLE IF EXISTS files CASCADE;
			DROP TABLE IF EXISTS migrations CASCADE;
			DROP TABLE IF EXISTS stripe_plans CASCADE;
			CREATE TABLE IF NOT EXISTS migrations (
				id SERIAL PRIMARY KEY,
				migration_name VARCHAR(255) NOT NULL,
				applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
		`)
	if err != nil {
		return err
	}

	return nil
}
func (s *Server) runMigrations() {
	if s.testing {
		if err := s.resetDatabase(); err != nil {
			log.Fatal(err)
		}
	}

	queryString := "SELECT * FROM migrations WHERE migration_name = $1"
	insertString := "INSERT INTO migrations (migration_name) VALUES ($1)"

	files, err := ioutil.ReadDir("../backend/schema")
	if err != nil {
		log.Fatal(err)
	}

	var fileNames []string
	for _, file := range files {
		fileNames = append(fileNames, file.Name())
	}
	sort.Strings(fileNames)

	for _, fileName := range fileNames {
		var result string
		err = s.db.QueryRow(queryString, fileName).Scan(&result)

		if err == sql.ErrNoRows {
			content, err := ioutil.ReadFile("../backend/schema/" + fileName)
			if err != nil {
				log.Fatal(err)
			}

			tx, err := s.db.Begin()
			if err != nil {
				log.Fatal(err)
			}

			_, err = tx.Exec(string(content))
			if err != nil {
				tx.Rollback()
				log.Fatal(err)
			}

			_, err = tx.Exec(insertString, fileName)
			if err != nil {
				tx.Rollback()
				log.Fatal(err)
			}

			err = tx.Commit()
			if err != nil {
				log.Fatal(err)
			}

			//	fmt.Println("Running migration:", fileName)
		} else if err != nil {
			log.Fatal(err)
		}
	}
}
