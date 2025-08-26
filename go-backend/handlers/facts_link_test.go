package handlers

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
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
}

// Test merging two facts successfully
func TestMergeFactsRoute_Success(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	var fact1ID, fact2ID int
	_ = s.DB.QueryRow(`INSERT INTO facts (user_id, card_pk, fact, created_at, updated_at)
					   VALUES (1, 1, 'fact 1', NOW(), NOW()) RETURNING id`).Scan(&fact1ID)
	_ = s.DB.QueryRow(`INSERT INTO facts (user_id, card_pk, fact, created_at, updated_at)
					   VALUES (1, 1, 'fact 2', NOW(), NOW()) RETURNING id`).Scan(&fact2ID)

	token, _ := tests.GenerateTestJWT(1)
	payload := fmt.Sprintf(`{"fact1_id": %d, "fact2_id": %d}`, fact1ID, fact2ID)
	req := httptest.NewRequest("POST", "/api/facts/merge", bytes.NewReader([]byte(payload)))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/facts/merge", s.JwtMiddleware(s.MergeFactsRoute)).Methods("POST")
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	// Check that fact2 is deleted
	var exists bool
	err := s.DB.QueryRow("SELECT true FROM facts WHERE id=$1", fact2ID).Scan(&exists)
	if err == nil {
		t.Fatalf("expected fact2 to be deleted but found")
	}
}

// Test merge with same fact IDs should error
func TestMergeFactsRoute_SelfMergeError(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	var factID int
	_ = s.DB.QueryRow(`INSERT INTO facts (user_id, card_pk, fact, created_at, updated_at)
					   VALUES (1, 1, 'fact x', NOW(), NOW()) RETURNING id`).Scan(&factID)

	token, _ := tests.GenerateTestJWT(1)
	payload := fmt.Sprintf(`{"fact1_id": %d, "fact2_id": %d}`, factID, factID)
	req := httptest.NewRequest("POST", "/api/facts/merge", strings.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/facts/merge", s.JwtMiddleware(s.MergeFactsRoute)).Methods("POST")
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
