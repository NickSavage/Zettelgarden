package handlers

import (
	"bytes"
	"encoding/json"
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
func TestPostChatMessage(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	conversationID := "550e8400-e29b-41d4-a716-446655440000"
	token, _ := tests.GenerateTestJWT(1)

	// Get initial state
	req, _ := http.NewRequest("GET", "/api/chat/"+conversationID, nil)
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.GetChatConversationRoute))
	router.ServeHTTP(rr, req)

	var initialMessages []models.ChatCompletion
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &initialMessages)
	initialLength := len(initialMessages)

	// Post new message
	newMessage := models.ChatCompletion{
		ConversationID: conversationID,
		Role:           "user",
		Content:        "This is a new test message",
		Model:          "gpt-4",
	}

	jsonBody, _ := json.Marshal(newMessage)
	postReq, _ := http.NewRequest("POST", "/api/chat/"+conversationID, bytes.NewBuffer(jsonBody))
	postReq.Header.Set("Authorization", "Bearer "+token)
	postReq.Header.Set("Content-Type", "application/json")

	postRr := httptest.NewRecorder()
	postRouter := mux.NewRouter()
	postRouter.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.PostChatMessageRoute))
	postRouter.ServeHTTP(postRr, postReq)

	if status := postRr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
		t.Errorf("error response: %v", postRr.Body.String())
	}

	// Verify the result
	finalReq, _ := http.NewRequest("GET", "/api/chat/"+conversationID, nil)
	finalReq.Header.Set("Authorization", "Bearer "+token)

	finalRr := httptest.NewRecorder()
	finalRouter := mux.NewRouter()
	finalRouter.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.GetChatConversationRoute))
	finalRouter.ServeHTTP(finalRr, finalReq)

	var finalMessages []models.ChatCompletion
	tests.ParseJsonResponse(t, finalRr.Body.Bytes(), &finalMessages)

	if len(finalMessages) != initialLength+1 {
		t.Errorf("expected message count to increase by 1, got %d, want %d",
			len(finalMessages), initialLength+1)
	}
}
