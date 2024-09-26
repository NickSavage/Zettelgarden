package srs

import (
	"database/sql"
	"errors"
	"go-backend/models"
	"go-backend/server"
	"go-backend/tests"
	// "net/http"
	// "net/http/httptest"
	"log"
	"testing"
	"time"
)

func testFlashcardQuery(s *server.Server, id int) (models.Flashcard, error) {
	query := `
SELECT id, flashcard_due, flashcard_reps, flashcard_lapses, flashcard_last_review, flashcard_state
FROM cards WHERE id = $1
`
	var flashcard models.Flashcard
	var state sql.NullString
	err := s.DB.QueryRow(query, id).Scan(
		&flashcard.ID,
		&flashcard.Due,
		&flashcard.Reps,
		&flashcard.Lapses,
		&flashcard.LastReview,
		&state,
	)
	if err != nil {
		log.Printf("err %v", err)
		return models.Flashcard{}, err
	}
	if !state.Valid {
		log.Printf("err %v", state)
		return models.Flashcard{}, errors.New("state was nil when it should not have been")
	}
	flashcard.State = state.String
	return flashcard, err

}
func sameDate(t1, t2 time.Time) bool {
	return t1.Year() == t2.Year() && t1.Month() == t2.Month() && t1.Day() == t2.Day()
}

func TestUpdateFlashcardAgain(t *testing.T) {
	s := tests.Setup()
	defer tests.Teardown()

	flashcard, err := testFlashcardQuery(s, 6)
	if err != nil {
		t.Errorf("unable to get beginning flashcard")
	}

	UpdateCardFromReview(s, 1, flashcard.ID, models.Again)

	newFlashcard, err := testFlashcardQuery(s, 6)
	if err != nil {
		t.Errorf("unable to get ending flashcard")
	}

	if flashcard.Lapses+1 != newFlashcard.Lapses {
		t.Errorf(
			"lapses were not incremented when they should have been, got %v want %v",
			newFlashcard.Lapses,
			flashcard.Lapses+1,
		)
	}
	if newFlashcard.State != "Again" {
		t.Errorf("wrong state returned, got %v want %v", newFlashcard.State, "Again")
	}

	if newFlashcard.LastReview == nil {
		t.Error("last review timestamp was not set")
	} else if flashcard.LastReview != nil && !newFlashcard.LastReview.After(*flashcard.LastReview) {
		t.Errorf(
			"last review timestamp was not updated correctly, got %v, want greater than %v",
			newFlashcard.LastReview,
			flashcard.LastReview,
		)
	}
	if newFlashcard.Due == nil {

		t.Error("due timestamp was not set")
	} else if !sameDate(*flashcard.Due, *newFlashcard.Due) {
		t.Errorf(
			"due date changed when it should not have, got %v, want %v",
			newFlashcard.Due,
			flashcard.Due,
		)
	}

}
