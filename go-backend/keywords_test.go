package main

import (
	"go-backend/models"
	//	"log"
	"net/http"
	"testing"
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
