package handlers

import (
	"go-backend/llms"
	"log"
)

func (s *Handler) GenerateMemory(userID uint, cardContent string) {
	client := llms.NewDefaultClient(s.DB)
	_, err := llms.GenerateUserMemory(s.DB, client, userID, cardContent)
	if err != nil {
		log.Printf("error generating user memory: %v", err)
	}
}
