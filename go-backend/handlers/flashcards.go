package handlers

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
)

func (s *Handler) GetNextFlashcard(userID int) (models.Card, error) {
	var count int
	var result int

	err := s.DB.QueryRow(`
SELECT count(id) FROM cards WHERE is_flashcard = TRUE and user_id = $1
`, userID).Scan(&count)
	if err != nil {
		log.Printf("get next flashcard err %v", err)
		return models.Card{}, fmt.Errorf("unable to access card")
	}
	if count < 1 {
		return models.Card{ID: -1}, nil
	}

	err = s.DB.QueryRow(`
SELECT id FROM cards WHERE is_flashcard = TRUE AND user_id = $1
ORDER BY RANDOM()
LIMIT 1
	`, userID).Scan(&result)
	if err != nil {
		log.Printf("get next flashcard err %v", err)
		return models.Card{}, fmt.Errorf("unable to access card")
	}

	card, err := s.QueryFullCard(userID, result)
	return card, err

}

func (s *Handler) FlashcardGetNextRoute(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	card, err := s.GetNextFlashcard(userID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	if card.ID == -1 {
		http.Error(w, "Next card not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)
}

func (s *Handler) RecordFlashcardReview(userID int, cardPK int, rating models.Rating) error {
	query := `INSERT INTO flashcard_reviews (card_pk, user_id, rating) VALUES ($1, $2, $3)`

	_, err := s.DB.Exec(query, cardPK, userID, rating)
	if err != nil {
		log.Printf("record flashcard review err %v", err)
		return fmt.Errorf("unable to record flashcard review: %v", err.Error())

	}
	return nil
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
	err = s.RecordFlashcardReview(userID, params.CardPK, params.Rating)
	if err != nil {
		http.Error(w, fmt.Sprintf("unable to log card review: %v", err.Error()), http.StatusBadRequest)
	}

	card, err := s.GetNextFlashcard(userID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)

}
