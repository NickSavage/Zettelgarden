package handlers

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"go-backend/tests"

	"github.com/gorilla/mux"
)

func TestLinkFactToCardHandler(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	log.Printf("aoeao")
	// Insert a fact manually linked to card 1
	var factID int
	err := s.DB.QueryRow(`
        INSERT INTO facts (user_id, card_pk, fact, created_at, updated_at)
        VALUES ($1, $2, 'test fact', NOW(), NOW())
        RETURNING id
    `, 1, 1).Scan(&factID)
	if err != nil {
		t.Fatalf("failed to insert fact: %v", err)
	}

	// Target card to link fact to (card 2 exists in seeded test data)
	cardID := 2

	token, _ := tests.GenerateTestJWT(1)
	url := fmt.Sprintf("/api/facts/%d/cards/%d", factID, cardID)
	req, _ := http.NewRequest("POST", url, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("factID", fmt.Sprintf("%d", factID))
	req.SetPathValue("cardID", fmt.Sprintf("%d", cardID))

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/facts/{factID}/cards/{cardID}", s.JwtMiddleware(s.LinkFactToCardHandler))
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", rr.Code, rr.Body.String())
	}

	// Verify row exists in fact_card_junction
	var exists bool
	err = s.DB.QueryRow("SELECT true FROM fact_card_junction WHERE fact_id=$1 AND card_pk=$2", factID, cardID).Scan(&exists)
	if err != nil {
		t.Fatalf("expected link row, got error: %v", err)
	}
}
