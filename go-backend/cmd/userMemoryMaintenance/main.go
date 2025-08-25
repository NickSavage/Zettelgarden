package main

import (
	"log"

	"go-backend/bootstrap"
	"go-backend/llms"
	"go-backend/server"
)

func processUserMemory(s *server.Server, userID uint) {
	client := llms.NewDefaultClient(s.DB, int(userID))
	llms.CompressUserMemory(s.DB, client, userID)

	_, err := s.DB.Exec("UPDATE users SET memory_has_changed = false WHERE id = $1", userID)
	if err != nil {
		log.Printf("failed to update memory_has_changed flag for user %d: %v", userID, err)
	}
}

func main() {
	s := bootstrap.InitServer()

	rows, err := s.DB.Query("SELECT id FROM users WHERE memory_has_changed = true")
	if err != nil {
		log.Fatalf("query failed: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var userID uint
		if err := rows.Scan(&userID); err != nil {
			log.Printf("failed to scan user ID: %v", err)
			continue
		}
		processUserMemory(s, userID)
	}

	if err := rows.Err(); err != nil {
		log.Printf("rows iteration error: %v", err)
	}
}
