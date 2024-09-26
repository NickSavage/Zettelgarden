package srs

import (
	"database/sql"
	"fmt"
	"go-backend/models"
	"log"
)

type Client struct {
	DB *sql.DB
}

func (c *Client) InitCardAsFlashcard(userID, cardPK int) error {
	query := `
        UPDATE cards SET flashcard_state = 'new', flashcard_due = NOW()
        WHERE id = $1 AND user_id = $2 AND is_flashcard = TRUE
        `
	_, err := c.DB.Exec(query, cardPK, userID)
	if err != nil {
		log.Printf("init flashcard err %v", err)
		return err
	}
	return nil
}

func (c *Client) Next(userID int) (int, error) {
	var count int
	var result int

	err := c.DB.QueryRow(`
        SELECT count(id) FROM cards
        WHERE is_flashcard = TRUE and user_id = $1 AND 
        DATE(flashcard_due) <= CURRENT_DATE
`, userID).Scan(&count)
	if err != nil {
		log.Printf("get next flashcard err %v", err)
		return 0, fmt.Errorf("unable to access card")
	}
	if count < 1 {
		return -1, nil
	}

	err = c.DB.QueryRow(`
        SELECT id FROM cards
        WHERE is_flashcard = TRUE AND user_id = $1 AND
        DATE(flashcard_due) <= CURRENT_DATE
        ORDER BY RANDOM()
        LIMIT 1
	`, userID).Scan(&result)
	if err != nil {
		log.Printf("get next flashcard err %v", err)
		return 0, fmt.Errorf("unable to access card")
	}

	return result, nil

}

func (c *Client) RecordFlashcardReview(userID int, cardPK int, rating models.Rating) error {
	query := `
        UPDATE cards
        SET
          flashcard_due = (NOW()) + INTERVAL '1 day',
          flashcard_reps = flashcard_reps + 1,
          flashcard_last_review = NOW()
        WHERE id = $1 AND user_id = $2
        `
	_, err := c.DB.Exec(query, cardPK, userID)
	if err != nil {
		log.Printf("record flashcard review err %v", err)
		return fmt.Errorf("unable to update card: %v", err.Error())

	}
	query = `INSERT INTO flashcard_reviews (card_pk, user_id, rating) VALUES ($1, $2, $3)`

	_, err = c.DB.Exec(query, cardPK, userID, rating)
	if err != nil {
		log.Printf("record flashcard review err %v", err)
		return fmt.Errorf("unable to record flashcard review: %v", err.Error())

	}
	return nil
}
