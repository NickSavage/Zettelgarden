package handlers

import (
	"go-backend/models"
	"go-backend/tests"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
)

func TestGetChatConversation(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	id := "550e8400-e29b-41d4-a716-446655440000"
	token, _ := tests.GenerateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/chat/"+id, nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", id)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.GetChatConversationRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		log.Printf("err %v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var messages []models.ChatCompletion
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &messages)
	if len(messages) != 6 {
		t.Errorf("handler returned wrong number of messages, got %v want %v", len(messages), 6)
	}
	for _, message := range messages {
		if message.UserID != 1 {
			t.Errorf("handler returned message for wrong user, got %v want %v", message.UserID, 1)
			break
		}
	}
}
