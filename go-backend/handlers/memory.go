package handlers

import (
	"encoding/json"
	"go-backend/llms"
	"log"
	"net/http"
)

func (s *Handler) GenerateMemory(userID uint, cardContent string) {
	client := llms.NewDefaultClient(s.DB)
	_, err := llms.GenerateUserMemory(s.DB, client, userID, cardContent)
	if err != nil {
		log.Printf("error generating user memory: %v", err)
	}
}

func (s *Handler) GetUserMemoryRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	memory, err := llms.GetUserMemory(s.DB, uint(userID))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"memory": memory})
}
