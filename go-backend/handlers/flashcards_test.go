package handlers

import (
	"bytes"
	"encoding/json"
	"go-backend/models"
	"go-backend/tests"
	"log"

	"github.com/gorilla/mux"

	//	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
)

func getNextFlashcard(s *Handler, t *testing.T) *httptest.ResponseRecorder {

	token, _ := tests.GenerateTestJWT(1)
	req, err := http.NewRequest("GET", "/api/flashcards", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/flashcards", s.JwtMiddleware(s.FlashcardGetNextRoute))
	router.ServeHTTP(rr, req)
	return rr
}

func TestFlashcardGetNextNoCards(t *testing.T) {
	s := setup()
	defer tests.Teardown()
	token, _ := tests.GenerateTestJWT(2)

	req, err := http.NewRequest("GET", "/api/flashcards", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/flashcards", s.JwtMiddleware(s.FlashcardGetNextRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
	expectedResult := "Next card not found\n"
	if rr.Body.String() != expectedResult {
		t.Errorf("wrong body returned, got %v want %v", rr.Body.String(), expectedResult)
	}

}

func TestFlashcardGetNextSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	rr := getNextFlashcard(s, t)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	log.Printf("body %v", rr.Body.String())

	var card models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
	if card.UserID != 1 {
		t.Errorf("handler returned card for wrong user, got %v want %v", card.UserID, 1)
	}
	if !card.IsFlashcard {
		t.Errorf("handler returned a card that isn't a flashcard, id %v", card.ID)
	}
	if card.ID != 6 {
		if card.ID != 7 {
			if card.ID != 8 {
				t.Errorf("handler returned wrong card, got %v want 6, 7 or 8", card.ID)
			}
		}

	}
}

func TestFlashcardRecordNextSuccess(t *testing.T) {

	s := setup()
	defer tests.Teardown()

	rr := getNextFlashcard(s, t)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var card models.Card
	var originalID int
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
	originalID = card.ID

	params := models.FlashcardRecordNextParams{
		CardPK: originalID,
		Rating: models.Good,
	}
	jsonData, _ := json.Marshal(params)
	req, err := http.NewRequest("POST", "/api/flashcards", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	token, _ := tests.GenerateTestJWT(1)
	req.Header.Set("Authorization", "Bearer "+token)

	rr = httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/flashcards", s.JwtMiddleware(s.FlashcardRecordNextRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var secondCard models.Card

	tests.ParseJsonResponse(t, rr.Body.Bytes(), &secondCard)

	log.Printf("body %v", rr.Body.String())
	if secondCard.UserID != 1 {
		t.Errorf("handler returned card for wrong user, got %v want %v", secondCard.UserID, 1)
	}
	if !secondCard.IsFlashcard {
		t.Errorf("handler returned a card that isn't a flashcard, id %v", secondCard.ID)
	}
	if secondCard.ID == originalID {
		t.Errorf("handler returned the same card when it shouldn't have")

	}

}

func TestFlashcardRecordNextLogSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	var logCount int
	_ = s.DB.QueryRow("SELECT count(*) FROM flashcard_reviews").Scan(&logCount)

	rr := getNextFlashcard(s, t)
	var card models.Card
	var originalID int
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
	originalID = card.ID

	params := models.FlashcardRecordNextParams{
		CardPK: originalID,
		Rating: models.Good,
	}
	jsonData, _ := json.Marshal(params)
	req, err := http.NewRequest("POST", "/api/flashcards", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	token, _ := tests.GenerateTestJWT(1)
	req.Header.Set("Authorization", "Bearer "+token)

	rr = httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/flashcards", s.JwtMiddleware(s.FlashcardRecordNextRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var newLogCount int
	_ = s.DB.QueryRow("SELECT count(*) FROM flashcard_reviews").Scan(&newLogCount)
	if newLogCount != logCount+1 {
		t.Errorf("handler returned wrong log count, got %v want %v", newLogCount, logCount+1)
	}
}
