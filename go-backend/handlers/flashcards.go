package handlers

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
)

func (s *Handler) FlashcardGetNextRoute(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	cardPK, err := s.Server.SRSClient.Next(userID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	if cardPK == -1 {
		http.Error(w, "Next card not found", http.StatusNotFound)
		return
	}
	card, err := s.QueryFullCard(userID, cardPK)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)
}

func (s *Handler) FlashcardRecordNextRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	var params models.FlashcardRecordNextParams

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&params)
	if err != nil {
		log.Printf("flashcard redcord params err %v", err)
		http.Error(w, fmt.Sprintf("error parsing json: %v", err.Error()), http.StatusBadRequest)
	}
	err = s.Server.SRSClient.RecordFlashcardReview(userID, params.CardPK, params.Rating)
	if err != nil {
		http.Error(w, fmt.Sprintf("unable to log card review: %v", err.Error()), http.StatusBadRequest)
	}

	cardPK, err := s.Server.SRSClient.Next(userID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	card, err := s.QueryFullCard(userID, cardPK)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)

}
