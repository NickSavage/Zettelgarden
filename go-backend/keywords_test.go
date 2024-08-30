package main

import (
	"bytes"
	"encoding/json"
	"go-backend/models"
	//	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
)

func TestGetCardKeywords(t *testing.T) {
	setup()
	defer teardown()

	rr := makeCardRequestSuccess(t, 1)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var card models.Card
	parseJsonResponse(t, rr.Body.Bytes(), &card)
	if len(card.Keywords) != 9 {
		t.Errorf("wrong number of keywords associated with card, got %v want %v", len(card.Keywords), 9)
	}

}

func TestSetCardKeywords(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)

	data := models.PutCardKeywordsParams{
		Keywords: []string{"keyword1"},
	}

	jsonData, _ := json.Marshal(data)
	req, err := http.NewRequest("PUT", "/api/cards/keywords/1", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}

	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/cards/keywords/{id}", jwtMiddleware(s.PutCardKeywordsRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	rr = makeCardRequestSuccess(t, 1)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var card models.Card
	parseJsonResponse(t, rr.Body.Bytes(), &card)
	if len(card.Keywords) != 1 {
		t.Errorf("wrong number of keywords associated with card, got %v want %v", len(card.Keywords), 1)
	}
	if card.Keywords[0].Keyword != "keyword1" {
		t.Errorf("wrong keyword returned, got %v want %v", card.Keywords[0].Keyword, "keyword1")
	}

}
