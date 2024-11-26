package handlers

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

const MODEL = "gpt-4"

func (s *Handler) GetChatConversationRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	vars := mux.Vars(r)
	conversationID := vars["id"]

	messages, err := s.QueryChatConversation(userID, conversationID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func (s *Handler) QueryChatConversation(userID int, conversationID string) ([]models.ChatCompletion, error) {
	var messages []models.ChatCompletion

	query := `
    SELECT id, user_id, conversation_id, sequence_number, role, 
           content, refusal, model, tokens, created_at
    FROM chat_completions
    WHERE user_id = $1 AND conversation_id = $2
    ORDER BY sequence_number ASC
    `

	rows, err := s.DB.Query(query, userID, conversationID)
	if err != nil {
		log.Printf("err querying chat conversation: %v", err)
		return nil, fmt.Errorf("unable to retrieve chat conversation")
	}
	defer rows.Close()

	for rows.Next() {
		var message models.ChatCompletion
		if err := rows.Scan(
			&message.ID,
			&message.UserID,
			&message.ConversationID,
			&message.SequenceNumber,
			&message.Role,
			&message.Content,
			&message.Refusal,
			&message.Model,
			&message.Tokens,
			&message.CreatedAt,
		); err != nil {
			log.Printf("err scanning chat message: %v", err)
			return nil, fmt.Errorf("unable to process chat message")
		}
		messages = append(messages, message)
	}

	if err = rows.Err(); err != nil {
		log.Printf("err iterating chat messages: %v", err)
		return nil, fmt.Errorf("error processing chat conversation")
	}

	return messages, nil
}

func (s *Handler) PostChatMessageRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	// vars := mux.Vars(r)

	// Parse the incoming message
	var newMessage models.ChatCompletion
	if err := json.NewDecoder(r.Body).Decode(&newMessage); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if newMessage.Content == "" {
		http.Error(w, "Content is required", http.StatusBadRequest)
		return
	}

	if newMessage.ConversationID == "" {
		uuid, err := uuid.NewRandom()
		if err != nil {
			http.Error(w, "Failed to generate conversation ID", http.StatusInternalServerError)
			return
		}
		newMessage.ConversationID = uuid.String()

	}
	// Add the message to the conversation
	message, err := s.AddChatMessage(userID, newMessage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(message)
}

func (s *Handler) AddChatMessage(userID int, message models.ChatCompletion) (models.ChatCompletion, error) {
	log.Printf("do we run?")
	// First, get the next sequence number for this conversation
	var nextSequence int
	err := s.DB.QueryRow(`
        SELECT COALESCE(MAX(sequence_number), 0) + 1
        FROM chat_completions
        WHERE conversation_id = $1
    `, message.ConversationID).Scan(&nextSequence)
	if err != nil {
		log.Printf("error getting next sequence number: %v", err)
		return models.ChatCompletion{}, fmt.Errorf("failed to determine message sequence")
	}

	// Insert the new message
	query := `
        INSERT INTO chat_completions (
            user_id, 
            conversation_id, 
            sequence_number, 
            role, 
            content, 
            model, 
            refusal,
            tokens
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at
    `

	var insertedMessage models.ChatCompletion
	insertedMessage = message
	insertedMessage.UserID = userID
	insertedMessage.SequenceNumber = nextSequence

	err = s.DB.QueryRow(
		query,
		userID,
		message.ConversationID,
		nextSequence,
		"user",
		message.Content,
		MODEL,
		message.Refusal,
		message.Tokens,
	).Scan(&insertedMessage.ID, &insertedMessage.CreatedAt)

	if err != nil {
		log.Printf("error inserting chat message: %v", err)
		return models.ChatCompletion{}, fmt.Errorf("failed to save chat message")
	}

	return insertedMessage, nil
}
