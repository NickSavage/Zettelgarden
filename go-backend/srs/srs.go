package srs

import (
	"errors"
	"fmt"
	"go-backend/models"
	"go-backend/server"
	"log"
	"math"
)

var p = struct {
	w []float64
}{
	w: []float64{
		0.4072,
		1.1829,
		3.1262,
		15.4722,
		7.2102,
		0.5316,
		1.0651,
		0.0234,
		1.616,
		0.1544,
		1.0824,
		1.9813,
		0.0953,
		0.2975,
		2.2042,
		0.2407,
		2.9466,
		0.5034,
		0.6567,
	},
}

// initStability computes the initial stability.
func initStability(r models.Rating) float64 {
	if r < 1 || int(r) > len(p.w) {
		// Error handling for out of bounds access
		fmt.Println("Error: Rating out of bounds")
		return 0.1
	}
	return math.Max(p.w[r-1], 0.1)
}

// initDifficulty computes the initial difficulty and clamps it between 1 and 10.
func initDifficulty(r models.Rating) float64 {
	if len(p.w) <= 5 {
		// Error handling for insufficient parameters
		fmt.Println("Error: Insufficient weights in slice p.w")
		return 1
	}
	difficulty := p.w[4] - math.Exp(p.w[5]*(float64(r)-1)) + 1
	return math.Min(math.Max(difficulty, 1), 10)
}

func InitCardAsFlashcard(s *server.Server, userID, cardPK int) error {
	stability := 0
	difficulty := 0
	query := `
        UPDATE cards SET flashcard_state = 'new', flashcard_due = NOW(),
        flashcard_difficulty = $1, flashcard_stability = $2
        WHERE id = $3 AND user_id = $4 AND is_flashcard = TRUE
        `
	_, err := s.DB.Exec(query, stability, difficulty, cardPK, userID)
	if err != nil {
		log.Printf("init flashcard err %v", err)
		return err
	}
	return nil
}

func GetFlashcard(s *server.Server, userID, cardPK int) (models.Flashcard, error) {

	var card models.Flashcard

	err := s.DB.QueryRow(`
	SELECT
	id, card_id, user_id, title, body, created_at, updated_at,
        flashcard_state, flashcard_reps, flashcard_lapses, flashcard_last_review,
        flashcard_due, flashcard_stability, flashcard_difficulty
	FROM cards 
	WHERE is_deleted = FALSE AND card_id = $1 AND user_id = $2
	`, cardPK, userID).Scan(
		&card.ID,
		&card.CardID,
		&card.UserID,
		&card.Title,
		&card.Body,
		&card.CreatedAt,
		&card.UpdatedAt,
		&card.State,
		&card.Reps,
		&card.Lapses,
		&card.LastReview,
		&card.Due,
		&card.Stability,
		&card.Difficulty,
	)
	if err != nil {
		log.Printf("err %v", err)
		return models.Flashcard{}, fmt.Errorf("something went wrong")
	}
	return card, nil
}

func Next(s *server.Server, userID int) (int, error) {
	var count int
	var result int

	err := s.DB.QueryRow(`
        SELECT count(id) FROM cards
        WHERE is_flashcard = TRUE and user_id = $1 AND 
        DATE(flashcard_due) <= DATE(NOW())
`, userID).Scan(&count)
	if err != nil {
		log.Printf("get next flashcard err %v", err)
		return 0, fmt.Errorf("unable to access card")
	}
	if count < 1 {
		return -1, nil
	}

	err = s.DB.QueryRow(`
        SELECT id FROM cards
        WHERE is_flashcard = TRUE AND user_id = $1 AND
        DATE(flashcard_due) <= DATE(NOW())
        ORDER BY RANDOM()
        LIMIT 1
	`, userID).Scan(&result)
	if err != nil {
		log.Printf("get next flashcard err %v", err)
		return 0, fmt.Errorf("unable to access card")
	}

	return result, nil

}

func UpdateCardFromReview(s *server.Server, userID int, cardPK int, rating models.Rating) error {

	flashcard, err := GetFlashcard(s, userID, cardPK)
	if err != nil {
		log.Printf("get flashcard error %v", err)
		return err
	}
	flashcard_reps_inc := 1
	flashcard_lapses_inc := 0

	var flashcard_state string
	flashcardDueDays := 0
	flashcardDueMins := 0
	if flashcard.State == "New" || flashcard.State == "" {
		flashcard_state = "Learning"
		if rating == models.Again || rating == models.Hard {
			flashcardDueMins = 5
		} else if rating == models.Good {
			flashcardDueMins = 10
		} else {
			flashcardDueDays = 4
		}

	} else if flashcard.State == "Learning" || flashcard.State == "Relearning" {
		if rating == models.Again {
			flashcard_state = "Learning"
		} else {
			flashcard_state = "Review"
		}
	} else if flashcard.State == "Review" {
		if rating == models.Again {
			flashcard_state = "Relearning"
		} else {
			flashcard_state = "Review"
		}

	} else {
		return errors.New("flashcard is in an inconsistent state")
	}

	if rating == models.Again {
		flashcard_lapses_inc += 1
	}
	query := `
        UPDATE cards
        SET
          flashcard_due = NOW() + MAKE_INTERVAL(days => $1, mins => $2),
          flashcard_reps = flashcard_reps + $3,
flashcard_lapses = flashcard_lapses + $4,
          flashcard_last_review = NOW(),
flashcard_state = $5

        WHERE id = $6 AND user_id = $7
        `
	_, err = s.DB.Exec(
		query,
		flashcardDueDays,
		flashcardDueMins,
		flashcard_reps_inc,
		flashcard_lapses_inc,
		flashcard_state,
		cardPK,
		userID,
	)
	if err != nil {
		log.Printf("record flashcard review err %v", err)
		return fmt.Errorf("unable to update card: %v", err.Error())

	}
	return nil
}

func RecordFlashcardReview(s *server.Server, userID int, cardPK int, rating models.Rating) error {
	query := `INSERT INTO flashcard_reviews (card_pk, user_id, rating) VALUES ($1, $2, $3)`

	_, err := s.DB.Exec(query, cardPK, userID, rating)
	if err != nil {
		log.Printf("record flashcard review err %v", err)
		return fmt.Errorf("unable to record flashcard review: %v", err.Error())

	}
	return nil
}
