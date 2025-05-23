package handlers

import (
	"fmt"
	"go-backend/models"
	"go-backend/tests"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
)

// func TestGetChatConversation(t *testing.T) {
// 	s := setup()
// 	defer tests.Teardown()

// 	id := "550e8400-e29b-41d4-a716-446655440000"
// 	token, _ := tests.GenerateTestJWT(1)

// 	req, err := http.NewRequest("GET", "/api/chat/"+id, nil)
// 	if err != nil {
// 		t.Fatal(err)
// 	}
// 	req.Header.Set("Authorization", "Bearer "+token)
// 	req.SetPathValue("id", id)

// 	rr := httptest.NewRecorder()
// 	router := mux.NewRouter()
// 	router.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.GetChatConversationRoute))
// 	router.ServeHTTP(rr, req)

// 	if status := rr.Code; status != http.StatusOK {
// 		log.Printf("err %v", rr.Body.String())
// 		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
// 	}
// 	var messages []models.ChatCompletion
// 	tests.ParseJsonResponse(t, rr.Body.Bytes(), &messages)
// 	if len(messages) != 6 {
// 		t.Errorf("handler returned wrong number of messages, got %v want %v", len(messages), 6)
// 	}
// 	for _, message := range messages {
// 		if message.UserID != 1 {
// 			t.Errorf("handler returned message for wrong user, got %v want %v", message.UserID, 1)
// 			break
// 		}
// 	}
// }

// // func TestPostChatMessage(t *testing.T) {
// // 	s := setup()
// // 	defer tests.Teardown()

// // 	conversationID := "550e8400-e29b-41d4-a716-446655440000"
// // 	token, _ := tests.GenerateTestJWT(1)

// // 	// Get initial state
// // 	req, _ := http.NewRequest("GET", "/api/chat/"+conversationID, nil)
// // 	req.Header.Set("Authorization", "Bearer "+token)

// // 	rr := httptest.NewRecorder()
// // 	router := mux.NewRouter()
// // 	router.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.GetChatConversationRoute))
// // 	router.ServeHTTP(rr, req)

// // 	var initialMessages []models.ChatCompletion
// // 	tests.ParseJsonResponse(t, rr.Body.Bytes(), &initialMessages)
// // 	initialLength := len(initialMessages)

// // 	// Post new message
// // 	newMessage := models.ChatCompletion{
// // 		ConversationID: conversationID,
// // 		Content:        "This is a new test message",
// // 	}

// // 	jsonBody, _ := json.Marshal(newMessage)
// // 	postReq, _ := http.NewRequest("POST", "/api/chat/"+conversationID, bytes.NewBuffer(jsonBody))
// // 	postReq.Header.Set("Authorization", "Bearer "+token)
// // 	postReq.Header.Set("Content-Type", "application/json")

// // 	postRr := httptest.NewRecorder()
// // 	postRouter := mux.NewRouter()
// // 	postRouter.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.PostChatMessageRoute))
// // 	postRouter.ServeHTTP(postRr, postReq)

// // 	if status := postRr.Code; status != http.StatusOK {
// // 		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
// // 		t.Errorf("error response: %v", postRr.Body.String())
// // 	}

// // 	// Verify the result
// // 	finalReq, _ := http.NewRequest("GET", "/api/chat/"+conversationID, nil)
// // 	finalReq.Header.Set("Authorization", "Bearer "+token)

// // 	finalRr := httptest.NewRecorder()
// // 	finalRouter := mux.NewRouter()
// // 	finalRouter.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.GetChatConversationRoute))
// // 	finalRouter.ServeHTTP(finalRr, finalReq)

// // 	var finalMessages []models.ChatCompletion
// // 	tests.ParseJsonResponse(t, finalRr.Body.Bytes(), &finalMessages)

// //		if len(finalMessages) != initialLength+1 {
// //			t.Errorf("expected message count to increase by 1, got %d, want %d",
// //				len(finalMessages), initialLength+1)
// //		}
// // //	}
// // func TestCreateNewChatConversation(t *testing.T) {
// // 	s := setup()
// // 	defer tests.Teardown()

// // 	token, _ := tests.GenerateTestJWT(1)

// // 	// Create new message without conversation ID
// // 	newMessage := models.ChatCompletion{
// // 		Content: "This is the first message in a new conversation",
// // 	}

// // 	jsonBody, _ := json.Marshal(newMessage)
// // 	req, _ := http.NewRequest("POST", "/api/chat", bytes.NewBuffer(jsonBody))
// // 	req.Header.Set("Authorization", "Bearer "+token)
// // 	req.Header.Set("Content-Type", "application/json")

// // 	rr := httptest.NewRecorder()
// // 	router := mux.NewRouter()
// // 	router.HandleFunc("/api/chat", s.JwtMiddleware(s.PostChatMessageRoute))
// // 	router.ServeHTTP(rr, req)

// // 	// Check response status
// // 	if status := rr.Code; status != http.StatusOK {
// // 		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
// // 		t.Errorf("error response: %v", rr.Body.String())
// // 	}

// // 	// Parse the response
// // 	var responseMessage models.ChatCompletion
// // 	if err := json.NewDecoder(rr.Body).Decode(&responseMessage); err != nil {
// // 		t.Fatalf("Failed to decode response: %v", err)
// // 	}

// // 	// Verify the response
// // 	if responseMessage.ConversationID == "" {
// // 		t.Error("Expected conversation ID to be generated, got empty string")
// // 	}
// // 	if responseMessage.SequenceNumber != 1 {
// // 		t.Errorf("First message should have sequence number 1, got %d", responseMessage.SequenceNumber)
// // 	}
// // 	if responseMessage.UserID != 1 {
// // 		t.Errorf("Message should be associated with user 1, got %d", responseMessage.UserID)
// // 	}

// // 	// Now verify we can retrieve the conversation
// // 	getReq, _ := http.NewRequest("GET", "/api/chat/"+responseMessage.ConversationID, nil)
// // 	getReq.Header.Set("Authorization", "Bearer "+token)

// // 	getRr := httptest.NewRecorder()
// // 	getRouter := mux.NewRouter()
// // 	getRouter.HandleFunc("/api/chat/{id}", s.JwtMiddleware(s.GetChatConversationRoute))
// // 	getRouter.ServeHTTP(getRr, getReq)

// // 	if status := getRr.Code; status != http.StatusOK {
// // 		t.Errorf("GET handler returned wrong status code: got %v want %v", status, http.StatusOK)
// // 	}

// // 	var conversationMessages []models.ChatCompletion
// // 	if err := json.NewDecoder(getRr.Body).Decode(&conversationMessages); err != nil {
// // 		t.Fatalf("Failed to decode conversation: %v", err)
// // 	}

// //		// Verify conversation contains our message
// //		if len(conversationMessages) != 1 {
// //			t.Errorf("Expected conversation to have 1 message, got %d", len(conversationMessages))
// //		}
// //		if len(conversationMessages) > 0 {
// //			firstMessage := conversationMessages[0]
// //			if firstMessage.ConversationID != responseMessage.ConversationID {
// //				t.Errorf("Conversation ID mismatch: got %v want %v",
// //					firstMessage.ConversationID, responseMessage.ConversationID)
// //			}
// //			if firstMessage.Content != newMessage.Content {
// //				t.Errorf("Message content mismatch: got %v want %v",
// //					firstMessage.Content, newMessage.Content)
// //			}
// //		}
// //	}
// func TestGetUserConversations(t *testing.T) {
// 	s := setup()
// 	defer tests.Teardown()

// 	token, _ := tests.GenerateTestJWT(1)

// 	req, err := http.NewRequest("GET", "/api/chat", nil)
// 	if err != nil {
// 		t.Fatal(err)
// 	}

// 	req.Header.Set("Authorization", "Bearer "+token)

// 	rr := httptest.NewRecorder()
// 	router := mux.NewRouter()
// 	router.HandleFunc("/api/chat", s.JwtMiddleware(s.GetUserConversationsRoute))
// 	router.ServeHTTP(rr, req)

// 	// Check status code
// 	if status := rr.Code; status != http.StatusOK {
// 		log.Printf("err %v", rr.Body.String())
// 		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
// 	}

// 	// Parse and check response
// 	var conversations []models.ConversationSummary
// 	tests.ParseJsonResponse(t, rr.Body.Bytes(), &conversations)

// 	// Assuming there should be at least one conversation in the test database
// 	if len(conversations) == 0 {
// 		t.Error("handler returned no conversations, expected at least one")
// 	}

// 	// Check the first conversation has expected fields
// 	if len(conversations) > 0 {
// 		conv := conversations[0]

// 		// Check conversation ID is not empty
// 		if conv.ID == "" {
// 			t.Error("conversation ID is empty")
// 		}

// 		// Check message count is positive
// 		if conv.MessageCount <= 0 {
// 			t.Errorf("invalid message count: got %v, want > 0", conv.MessageCount)
// 		}

// 		// Check created_at is not zero
// 		if conv.CreatedAt.IsZero() {
// 			t.Error("created_at is zero")
// 		}

// 		// Check model is not empty
// 		if conv.Model == "" {
// 			t.Error("model is empty")
// 		}
// 	}

// 	// Check conversations are ordered by created_at DESC
// 	if len(conversations) > 1 {
// 		for i := 0; i < len(conversations)-1; i++ {
// 			if conversations[i].CreatedAt.Before(conversations[i+1].CreatedAt) {
// 				t.Error("conversations are not properly ordered by created_at DESC")
// 				break
// 			}
// 		}
// 	}
// }

func TestGetUserLLMConfigurations(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	token, _ := tests.GenerateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/llms/configurations", nil)
	if err != nil {
		t.Fatal(err)
	}

	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/llms/configurations", s.JwtMiddleware(s.GetUserLLMConfigurationsRoute))
	router.ServeHTTP(rr, req)

	// Check status code
	if status := rr.Code; status != http.StatusOK {
		log.Printf("error response: %v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	// Parse and check response
	var configurations []models.UserLLMConfiguration
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &configurations)

	// Should have at least one configuration from test data
	if len(configurations) == 0 {
		t.Error("handler returned no configurations, expected at least one")
	}

	// Check the first configuration has expected fields
	if len(configurations) > 0 {
		config := configurations[0]

		// Check basic fields
		if config.ID <= 0 {
			t.Error("configuration ID is invalid")
		}

		if config.UserID != 1 {
			t.Errorf("wrong user ID: got %v, want 1", config.UserID)
		}

		if config.ModelID <= 0 {
			t.Error("model ID is invalid")
		}

		// Check custom settings
		if config.CustomSettings == nil {
			t.Error("custom settings is nil")
		}

		// Check timestamps
		if config.CreatedAt.IsZero() {
			t.Error("created_at is zero")
		}

		if config.UpdatedAt.IsZero() {
			t.Error("updated_at is zero")
		}

		// Check nested model data
		if config.Model == nil {
			t.Error("model information is missing")
		} else {
			if config.Model.Name == "" {
				t.Error("model name is empty")
			}

			if config.Model.ModelIdentifier == "" {
				t.Error("model identifier is empty")
			}

			// Check nested provider data
			if config.Model.Provider == nil {
				t.Error("provider information is missing")
			} else {
				if config.Model.Provider.Name == "" {
					t.Error("provider name is empty")
				}

				if config.Model.Provider.BaseURL == "" {
					t.Error("provider base URL is empty")
				}
			}
		}

		// Verify the test data matches what we expect
		if config.ID == 1 {
			temp, ok := config.CustomSettings["temperature"]
			if !ok || temp != 0.7 {
				t.Errorf("wrong temperature setting: got %v, want 0.7", temp)
			}

			maxTokens, ok := config.CustomSettings["max_tokens"]
			if !ok || maxTokens != float64(1000) {
				t.Errorf("wrong max_tokens setting: got %v, want 1000", maxTokens)
			}
		}
	}
}

func TestDeleteLLMModel(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	token, _ := tests.GenerateTestJWT(1)

	randomName := fmt.Sprintf("Test Provider %d", time.Now().UnixNano())

	// First create a provider
	provider := models.LLMProvider{
		Name:           randomName,
		BaseURL:        "https://api.test-provider.com",
		APIKeyRequired: true,
		APIKey:         "test-api-key",
	}

	providerJsonBody := tests.CreateJsonBody(t, provider)
	providerReq, _ := http.NewRequest("POST", "/api/llms/providers", providerJsonBody)
	providerReq.Header.Set("Authorization", "Bearer "+token)
	providerReq.Header.Set("Content-Type", "application/json")

	providerRr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/llms/providers", s.JwtMiddleware(s.CreateLLMProviderRoute))
	router.ServeHTTP(providerRr, providerReq)

	// Check if provider creation was successful
	if status := providerRr.Code; status != http.StatusOK {
		t.Fatalf("failed to create provider: got status %v, response: %v", status, providerRr.Body.String())
	}

	var createdProvider models.LLMProvider
	tests.ParseJsonResponse(t, providerRr.Body.Bytes(), &createdProvider)

	// Create a model
	modelReq := models.CreateLLMModelRequest{
		ProviderID:      createdProvider.ID,
		Name:            "Test Model",
		ModelIdentifier: "test-model-1",
	}

	modelJsonBody := tests.CreateJsonBody(t, modelReq)
	createReq, _ := http.NewRequest("POST", "/api/llms/models", modelJsonBody)
	createReq.Header.Set("Authorization", "Bearer "+token)
	createReq.Header.Set("Content-Type", "application/json")

	createRr := httptest.NewRecorder()
	router = mux.NewRouter()
	router.HandleFunc("/api/llms/models", s.JwtMiddleware(s.CreateLLMModelRoute))
	router.ServeHTTP(createRr, createReq)

	// Check if model creation was successful
	if status := createRr.Code; status != http.StatusOK {
		t.Fatalf("failed to create model: got status %v, response: %v", status, createRr.Body.String())
	}

	var createdModel models.LLMModel
	tests.ParseJsonResponse(t, createRr.Body.Bytes(), &createdModel)

	// Now delete the model
	deleteReq, err := http.NewRequest("DELETE", fmt.Sprintf("/api/llms/models/%d", createdModel.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	deleteReq.Header.Set("Authorization", "Bearer "+token)

	deleteRr := httptest.NewRecorder()
	router = mux.NewRouter()
	router.HandleFunc("/api/llms/models/{id}", s.JwtMiddleware(s.DeleteLLMModelRoute))
	router.ServeHTTP(deleteRr, deleteReq)

	if status := deleteRr.Code; status != http.StatusNoContent {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
		t.Errorf("error response: %v", deleteRr.Body.String())
	}
}

func TestUpdateLLMConfiguration(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	token, _ := tests.GenerateTestJWT(1)

	// First, get existing configurations to find one to update
	req, _ := http.NewRequest("GET", "/api/llms/configurations", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/llms/configurations", s.JwtMiddleware(s.GetUserLLMConfigurationsRoute))
	router.ServeHTTP(rr, req)

	var configurations []models.UserLLMConfiguration
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &configurations)
	if len(configurations) == 0 {
		t.Fatal("no configurations found for testing")
	}

	configToUpdate := configurations[0]

	// Test cases
	testCases := []struct {
		name           string
		updateData     UpdateLLMConfigurationRequest
		expectedStatus int
		validate       func(t *testing.T, response models.UserLLMConfiguration)
	}{
		{
			name: "Update name and model identifier",
			updateData: UpdateLLMConfigurationRequest{
				Name:            "Updated Test Model",
				ModelIdentifier: "updated-test-model",
				CustomSettings: map[string]interface{}{
					"temperature": 0.8,
				},
			},
			expectedStatus: http.StatusOK,
			validate: func(t *testing.T, response models.UserLLMConfiguration) {
				if response.Model.Name != "Updated Test Model" {
					t.Errorf("expected name to be 'Updated Test Model', got %s", response.Model.Name)
				}
				if response.Model.ModelIdentifier != "updated-test-model" {
					t.Errorf("expected model_identifier to be 'updated-test-model', got %s", response.Model.ModelIdentifier)
				}
				temp, ok := response.CustomSettings["temperature"]
				if !ok || temp != 0.8 {
					t.Errorf("expected temperature to be 0.8, got %v", temp)
				}
			},
		},
		{
			name: "Set as default configuration",
			updateData: UpdateLLMConfigurationRequest{
				IsDefault: true,
			},
			expectedStatus: http.StatusOK,
			validate: func(t *testing.T, response models.UserLLMConfiguration) {
				if !response.IsDefault {
					t.Error("configuration was not set as default")
				}

				// Verify other configurations are not default
				req, _ := http.NewRequest("GET", "/api/llms/configurations", nil)
				req.Header.Set("Authorization", "Bearer "+token)
				rr := httptest.NewRecorder()
				router := mux.NewRouter()
				router.HandleFunc("/api/llms/configurations", s.JwtMiddleware(s.GetUserLLMConfigurationsRoute))
				router.ServeHTTP(rr, req)

				var allConfigs []models.UserLLMConfiguration
				tests.ParseJsonResponse(t, rr.Body.Bytes(), &allConfigs)

				defaultCount := 0
				for _, config := range allConfigs {
					if config.IsDefault {
						defaultCount++
					}
				}
				if defaultCount != 1 {
					t.Errorf("expected exactly one default configuration, found %d", defaultCount)
				}
			},
		},
		{
			name: "Update custom settings",
			updateData: UpdateLLMConfigurationRequest{
				CustomSettings: map[string]interface{}{
					"temperature": 0.9,
					"max_tokens":  2000,
				},
			},
			expectedStatus: http.StatusOK,
			validate: func(t *testing.T, response models.UserLLMConfiguration) {
				temp, ok := response.CustomSettings["temperature"]
				if !ok || temp != 0.9 {
					t.Errorf("expected temperature to be 0.9, got %v", temp)
				}
				maxTokens, ok := response.CustomSettings["max_tokens"]
				if !ok || maxTokens != float64(2000) {
					t.Errorf("expected max_tokens to be 2000, got %v", maxTokens)
				}
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			jsonBody := tests.CreateJsonBody(t, tc.updateData)
			req, _ := http.NewRequest(
				"PUT",
				fmt.Sprintf("/api/llms/configurations/%d", configToUpdate.ID),
				jsonBody,
			)
			req.Header.Set("Authorization", "Bearer "+token)
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			router := mux.NewRouter()
			router.HandleFunc("/api/llms/configurations/{id}", s.JwtMiddleware(s.UpdateLLMConfigurationRoute))
			router.ServeHTTP(rr, req)

			if status := rr.Code; status != tc.expectedStatus {
				t.Errorf("handler returned wrong status code: got %v want %v", status, tc.expectedStatus)
				t.Errorf("error response: %v", rr.Body.String())
				return
			}

			if tc.expectedStatus == http.StatusOK {
				var response models.UserLLMConfiguration
				tests.ParseJsonResponse(t, rr.Body.Bytes(), &response)
				tc.validate(t, response)

				// Verify basic fields are preserved
				if response.ID != configToUpdate.ID {
					t.Errorf("configuration ID changed: got %v want %v", response.ID, configToUpdate.ID)
				}
				if response.UserID != configToUpdate.UserID {
					t.Errorf("user ID changed: got %v want %v", response.UserID, configToUpdate.UserID)
				}
				if response.Model == nil {
					t.Error("model information is missing")
				}
				if response.Model.Provider == nil {
					t.Error("provider information is missing")
				}
				if response.UpdatedAt.Before(configToUpdate.UpdatedAt) || response.UpdatedAt.Equal(configToUpdate.UpdatedAt) {
					t.Error("updated_at timestamp was not updated")
				}
			}
		})
	}
}
