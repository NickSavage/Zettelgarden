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

// func TestPostChatMessage(t *testing.T) {
// 	s := setup()
// 	defer tests.Teardown()

// 	conversationID := "550e8400-e29b-41d4-a716-446655440000"
// 	token, _ := tests.GenerateTestJWT(1)

// 	// Get initial state
// 	req, _ := http.NewRequest("GET", "/api/chat/"+conversationID, nil)
// 	req.Header.Set("Authorization", "Bearer "+token)

// 	rr := httptest.NewRecorder()
// 	router := mux.NewRouter()
// 	router.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.GetChatConversationRoute))
// 	router.ServeHTTP(rr, req)

// 	var initialMessages []models.ChatCompletion
// 	tests.ParseJsonResponse(t, rr.Body.Bytes(), &initialMessages)
// 	initialLength := len(initialMessages)

// 	// Post new message
// 	newMessage := models.ChatCompletion{
// 		ConversationID: conversationID,
// 		Content:        "This is a new test message",
// 	}

// 	jsonBody, _ := json.Marshal(newMessage)
// 	postReq, _ := http.NewRequest("POST", "/api/chat/"+conversationID, bytes.NewBuffer(jsonBody))
// 	postReq.Header.Set("Authorization", "Bearer "+token)
// 	postReq.Header.Set("Content-Type", "application/json")

// 	postRr := httptest.NewRecorder()
// 	postRouter := mux.NewRouter()
// 	postRouter.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.PostChatMessageRoute))
// 	postRouter.ServeHTTP(postRr, postReq)

// 	if status := postRr.Code; status != http.StatusOK {
// 		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
// 		t.Errorf("error response: %v", postRr.Body.String())
// 	}

// 	// Verify the result
// 	finalReq, _ := http.NewRequest("GET", "/api/chat/"+conversationID, nil)
// 	finalReq.Header.Set("Authorization", "Bearer "+token)

// 	finalRr := httptest.NewRecorder()
// 	finalRouter := mux.NewRouter()
// 	finalRouter.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.GetChatConversationRoute))
// 	finalRouter.ServeHTTP(finalRr, finalReq)

// 	var finalMessages []models.ChatCompletion
// 	tests.ParseJsonResponse(t, finalRr.Body.Bytes(), &finalMessages)

//		if len(finalMessages) != initialLength+1 {
//			t.Errorf("expected message count to increase by 1, got %d, want %d",
//				len(finalMessages), initialLength+1)
//		}
// //	}
// func TestCreateNewChatConversation(t *testing.T) {
// 	s := setup()
// 	defer tests.Teardown()

// 	token, _ := tests.GenerateTestJWT(1)

// 	// Create new message without conversation ID
// 	newMessage := models.ChatCompletion{
// 		Content: "This is the first message in a new conversation",
// 	}

// 	jsonBody, _ := json.Marshal(newMessage)
// 	req, _ := http.NewRequest("POST", "/api/chat", bytes.NewBuffer(jsonBody))
// 	req.Header.Set("Authorization", "Bearer "+token)
// 	req.Header.Set("Content-Type", "application/json")

// 	rr := httptest.NewRecorder()
// 	router := mux.NewRouter()
// 	router.HandleFunc("/api/chat", s.JwtMiddleware(s.PostChatMessageRoute))
// 	router.ServeHTTP(rr, req)

// 	// Check response status
// 	if status := rr.Code; status != http.StatusOK {
// 		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
// 		t.Errorf("error response: %v", rr.Body.String())
// 	}

// 	// Parse the response
// 	var responseMessage models.ChatCompletion
// 	if err := json.NewDecoder(rr.Body).Decode(&responseMessage); err != nil {
// 		t.Fatalf("Failed to decode response: %v", err)
// 	}

// 	// Verify the response
// 	if responseMessage.ConversationID == "" {
// 		t.Error("Expected conversation ID to be generated, got empty string")
// 	}
// 	if responseMessage.SequenceNumber != 1 {
// 		t.Errorf("First message should have sequence number 1, got %d", responseMessage.SequenceNumber)
// 	}
// 	if responseMessage.UserID != 1 {
// 		t.Errorf("Message should be associated with user 1, got %d", responseMessage.UserID)
// 	}

// 	// Now verify we can retrieve the conversation
// 	getReq, _ := http.NewRequest("GET", "/api/chat/"+responseMessage.ConversationID, nil)
// 	getReq.Header.Set("Authorization", "Bearer "+token)

// 	getRr := httptest.NewRecorder()
// 	getRouter := mux.NewRouter()
// 	getRouter.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.GetChatConversationRoute))
// 	getRouter.ServeHTTP(getRr, getReq)

// 	if status := getRr.Code; status != http.StatusOK {
// 		t.Errorf("GET handler returned wrong status code: got %v want %v", status, http.StatusOK)
// 	}

// 	var conversationMessages []models.ChatCompletion
// 	if err := json.NewDecoder(getRr.Body).Decode(&conversationMessages); err != nil {
// 		t.Fatalf("Failed to decode conversation: %v", err)
// 	}

//		// Verify conversation contains our message
//		if len(conversationMessages) != 1 {
//			t.Errorf("Expected conversation to have 1 message, got %d", len(conversationMessages))
//		}
//		if len(conversationMessages) > 0 {
//			firstMessage := conversationMessages[0]
//			if firstMessage.ConversationID != responseMessage.ConversationID {
//				t.Errorf("Conversation ID mismatch: got %v want %v",
//					firstMessage.ConversationID, responseMessage.ConversationID)
//			}
//			if firstMessage.Content != newMessage.Content {
//				t.Errorf("Message content mismatch: got %v want %v",
//					firstMessage.Content, newMessage.Content)
//			}
//		}
//	}
func TestGetUserConversations(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	token, _ := tests.GenerateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/chat", nil)
	if err != nil {
		t.Fatal(err)
	}

	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/chat", s.JwtMiddleware(s.GetUserConversationsRoute))
	router.ServeHTTP(rr, req)

	// Check status code
	if status := rr.Code; status != http.StatusOK {
		log.Printf("err %v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Parse and check response
	var conversations []models.ConversationSummary
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &conversations)

	// Assuming there should be at least one conversation in the test database
	if len(conversations) == 0 {
		t.Error("handler returned no conversations, expected at least one")
	}

	// Check the first conversation has expected fields
	if len(conversations) > 0 {
		conv := conversations[0]

		// Check conversation ID is not empty
		if conv.ID == "" {
			t.Error("conversation ID is empty")
		}

		// Check message count is positive
		if conv.MessageCount <= 0 {
			t.Errorf("invalid message count: got %v, want > 0", conv.MessageCount)
		}

		// Check created_at is not zero
		if conv.CreatedAt.IsZero() {
			t.Error("created_at is zero")
		}

		// Check model is not empty
		if conv.Model == "" {
			t.Error("model is empty")
		}
	}

	// Check conversations are ordered by created_at DESC
	if len(conversations) > 1 {
		for i := 0; i < len(conversations)-1; i++ {
			if conversations[i].CreatedAt.Before(conversations[i+1].CreatedAt) {
				t.Error("conversations are not properly ordered by created_at DESC")
				break
			}
		}
	}
}
