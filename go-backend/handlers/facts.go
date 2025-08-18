package handlers

import (
	"go-backend/llms"
	"go-backend/models"
	"log"
)

// ExtractSaveCardFacts deletes and re-inserts facts for a given card.
func (s *Handler) ExtractSaveCardFacts(userID int, card models.Card, facts []string) error {
	tx, _ := s.DB.Begin()
	_, err := tx.Exec("DELETE FROM facts WHERE card_pk = $1 AND user_id = $2", card.ID, userID)
	if err != nil {
		log.Printf("error deleting old facts: %v", err)
		tx.Rollback()
		return err
	}

	for _, fact := range facts {
		if fact == "" {
			continue
		}
		embedding, err := llms.GetEmbedding1024(fact, false)
		if err != nil {
			log.Printf("error generating embedding for fact: %v", err)
			tx.Rollback()
			return err
		}
		_, err = tx.Exec(`
			INSERT INTO facts (card_pk, user_id, fact, embedding_1024, created_at, updated_at)
			VALUES ($1, $2, $3, $4, NOW(), NOW())
		`, card.ID, userID, fact, embedding)
		if err != nil {
			log.Printf("error inserting fact: %v", err)
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}
