package handlers

import (
	"go-backend/models"
	"go-backend/tests"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetMailingListSubscribersSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Add a test subscriber first
	_, err := s.DB.Exec(`
		INSERT INTO mailing_list (email, welcome_email_sent)
		VALUES ($1, $2)
	`, "test@example.com", true)
	if err != nil {
		t.Fatal(err)
	}

	token, _ := tests.GenerateTestJWT(1) // Admin user
	req, err := http.NewRequest("GET", "/api/mailing-list", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(s.JwtMiddleware(s.GetMailingListSubscribersRoute))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var subscribers []models.MailingList
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &subscribers)
	if len(subscribers) != 1 {
		t.Errorf("handler returned wrong number of subscribers: got %v want %v", len(subscribers), 1)
	}
	if subscribers[0].Email != "test@example.com" {
		t.Errorf("handler returned wrong email: got %v want %v", subscribers[0].Email, "test@example.com")
	}
}

func TestGetMailingListSubscribersUnauthorized(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	token, _ := tests.GenerateTestJWT(2) // Non-admin user
	req, err := http.NewRequest("GET", "/api/mailing-list", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(s.JwtMiddleware(s.GetMailingListSubscribersRoute))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusUnauthorized)
	}
}
