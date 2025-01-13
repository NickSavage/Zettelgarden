package handlers

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func createTestHandler() *Handler {
	// Use test database URL from environment or fallback to default
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://localhost:5432/zettelkasten_test?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal(err)
	}

	return &Handler{
		DB: db,
	}
}

func createTestUser(h *Handler) int {
	var userID int
	err := h.DB.QueryRow(`
		INSERT INTO users (email, password_hash, created_at, updated_at)
		VALUES ($1, $2, NOW(), NOW())
		RETURNING id
	`, "test@example.com", "test_hash").Scan(&userID)

	if err != nil {
		log.Fatal(err)
	}

	return userID
}

func cleanupTestData(h *Handler) {
	_, err := h.DB.Exec(`
		DELETE FROM audit_events;
		DELETE FROM users WHERE email = 'test@example.com';
	`)
	if err != nil {
		log.Printf("Error cleaning up test data: %v", err)
	}
}
