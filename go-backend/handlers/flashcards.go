package handlers

import (
	"encoding/json"
	//	"go-backend/models"
	"fmt"
	"log"
	"net/http"
)

func (s *Handler) GetNextFlashcard(userID int) (int, error) {
	var count int
	var result int

	err := s.DB.QueryRow(`
SELECT count(id) FROM cards WHERE is_flashcard = TRUE and user_id = $1
`, userID).Scan(&count)
	if err != nil {
		log.Printf("get next flashcard err %v", err)
		return result, fmt.Errorf("unable to access card")
	}
	if count < 1 {
		return -1, fmt.Errorf("no cards available")
	}

	err = s.DB.QueryRow(`
SELECT id FROM cards WHERE is_flashcard = TRUE AND user_id = $1
ORDER BY RANDOM()
LIMIT 1
	`, userID).Scan(&result)
	if err != nil {
		log.Printf("get next flashcard err %v", err)
		return result, fmt.Errorf("unable to access card")
	}
	return result, nil

}

func (s *Handler) FlashcardGetNextRoute(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	cardPK, err := s.GetNextFlashcard(userID)
	if cardPK == -1 {
		http.Error(w, "Next card not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	card, err := s.QueryFullCard(userID, cardPK)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)
}

func (s *Handler) FlashcardRecordNextRoute(w http.ResponseWriter, r *http.Request) {

	//	userID := r.Context().Value("current_user").(int)

	//var params models.FlashcardRecordNextParams

	//decoder := json.NewDecoder(r.Body)
	//err := decoder.Decode(&params)

}
