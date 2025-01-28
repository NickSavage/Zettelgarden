package handlers

import (
	"encoding/json"
	"fmt"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/lib/pq"
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
           content, refusal, model, tokens, created_at, card_chunks
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
		var cardChunks []int32 // Use int32 instead of int
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
			pq.Array(&cardChunks), // Use int32 array
		); err != nil {
			log.Printf("err scanning chat message: %v", err)
			return nil, fmt.Errorf("unable to process chat message")
		}

		// Convert int32 to int
		message.ReferencedCardPKs = make([]int, len(cardChunks))
		for i, v := range cardChunks {
			message.ReferencedCardPKs[i] = int(v)
		}

		cards, _ := s.GetPartialCardsFromChunks(userID, message.ReferencedCardPKs)

		message.ReferencedCards = cards
		messages = append(messages, message)
	}

	if err = rows.Err(); err != nil {
		log.Printf("err iterating chat messages: %v", err)
		return nil, fmt.Errorf("error processing chat conversation")
	}

	return messages, nil
}

func (s *Handler) AddContextualCards(userID int, message models.ChatCompletion) (models.ChatCompletion, error) {
	cards := []models.Card{}
	if len(message.ReferencedCardPKs) == 0 {
		return message, nil
	}
	for _, cardPK := range message.ReferencedCardPKs {
		card, err := s.QueryFullCard(userID, cardPK)
		if err != nil {
			log.Printf("error getting card: %v", err)
			return models.ChatCompletion{}, err
		}
		cards = append(cards, card)
	}
	cardString := "Contextual cards: "
	for _, card := range cards {
		cardString += fmt.Sprintf("%v - %v\n", card.Title, card.Body)
	}
	message.Content = cardString + message.Content
	return message, nil
}

func (s *Handler) PostChatMessageRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	newConversation := false
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
		newConversation = true
		uuid, err := uuid.NewRandom()
		if err != nil {
			http.Error(w, "Failed to generate conversation ID", http.StatusInternalServerError)
			return
		}
		newMessage.ConversationID = uuid.String()

	}
	newMessage, err := s.AddContextualCards(userID, newMessage)
	if err != nil {
		log.Printf("error adding contextual cards: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Add the message to the conversation
	message, err := s.AddChatMessage(userID, newMessage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	message, err = s.GetChatCompletion(userID, message.ConversationID)
	if err != nil {
		log.Printf("error getting chat completion: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if newConversation {
		summary, err := llms.CreateConversationSummary(s.Server.LLMClient, message)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		s.WriteConversationSummary(userID, summary)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(message)
}

func (s *Handler) WriteConversationSummary(userID int, summary models.ConversationSummary) error {
	query := `
        INSERT INTO chat_conversations (
            user_id,
            id,
            message_count,
            created_at,
            model,
            title
        ) VALUES ($1, $2, $3, NOW(), $4, $5)
    `

	_, err := s.DB.Exec(
		query,
		userID,
		summary.ID,
		summary.MessageCount,
		summary.Model,
		summary.Title,
	)

	if err != nil {
		log.Printf("error inserting conversation summary: %v", err)
		return fmt.Errorf("failed to save conversation summary")
	}

	return nil
}

func (s *Handler) AddChatMessage(userID int, message models.ChatCompletion) (models.ChatCompletion, error) {
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

	var insertedMessage = message
	insertedMessage.UserID = userID
	insertedMessage.SequenceNumber = nextSequence

	err = s.DB.QueryRow(
		query,
		userID,
		message.ConversationID,
		nextSequence,
		"user",
		message.Content,
		models.MODEL,
		message.Refusal,
		message.Tokens,
	).Scan(&insertedMessage.ID, &insertedMessage.CreatedAt)

	if err != nil {
		log.Printf("error inserting chat message: %v", err)
		return models.ChatCompletion{}, fmt.Errorf("failed to save chat message")
	}

	return insertedMessage, nil
}

func (s *Handler) GetChatCompletion(userID int, conversationID string) (models.ChatCompletion, error) {

	messages, err := s.GetChatMessagesInConversation(userID, conversationID)
	if err != nil {
		log.Printf("error getting chat messages: %v", err)
		return models.ChatCompletion{}, err
	}

	// Get the next sequence number
	var nextSequence int
	err = s.DB.QueryRow(`
        SELECT COALESCE(MAX(sequence_number), 0) + 1
        FROM chat_completions
        WHERE conversation_id = $1
    `, conversationID).Scan(&nextSequence)
	if err != nil {
		log.Printf("error getting next sequence: %v", err)
		return models.ChatCompletion{}, fmt.Errorf("failed to process response")
	}

	completion, err := llms.ChatCompletion(s.Server.LLMClient, messages)
	if err != nil {
		log.Printf("error generating chat completion: %v", err)
		return models.ChatCompletion{}, err
	}

	completion.UserID = userID
	completion.ConversationID = conversationID
	completion.SequenceNumber = nextSequence

	s.WriteChatCompletionToDatabase(userID, completion)

	return completion, nil
}
func (s *Handler) QueryUserConversations(userID int) ([]models.ConversationSummary, error) {
	query := `
        SELECT 
            c.id as conversation_id,
            c.title,
            COUNT(m.id) as message_count,
            c.updated_at,
            c.created_at,
            c.model
        FROM chat_conversations c
        LEFT JOIN chat_completions m ON c.id = m.conversation_id
        WHERE c.user_id = $1
        GROUP BY c.id, c.title, c.updated_at, c.created_at, c.model
        ORDER BY c.created_at DESC
    `

	rows, err := s.DB.Query(query, userID)
	if err != nil {
		log.Printf("err querying user conversations: %v", err)
		return nil, fmt.Errorf("unable to retrieve user conversations")
	}
	defer rows.Close()

	var conversations []models.ConversationSummary
	for rows.Next() {
		var conversation models.ConversationSummary
		if err := rows.Scan(
			&conversation.ID,
			&conversation.Title,
			&conversation.MessageCount,
			&conversation.UpdatedAt,
			&conversation.CreatedAt,
			&conversation.Model,
		); err != nil {
			log.Printf("err scanning conversation summary: %v", err)
			return nil, fmt.Errorf("unable to process conversation summary")
		}
		conversations = append(conversations, conversation)
	}

	if err = rows.Err(); err != nil {
		log.Printf("err iterating conversations: %v", err)
		return nil, fmt.Errorf("error processing conversations")
	}

	log.Printf("conversations: %v", conversations)
	return conversations, nil
}

func (s *Handler) GetUserConversationsRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	conversations, err := s.QueryUserConversations(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conversations)
}

func (s *Handler) GetChatMessagesInConversation(userID int, conversationID string) ([]models.ChatCompletion, error) {

	// First, get all previous messages in this conversation
	query := `
        SELECT user_id, role, content, model, card_chunks
        FROM chat_completions
        WHERE conversation_id = $1 AND user_id = $2
        ORDER BY sequence_number ASC
    `
	rows, err := s.DB.Query(query, conversationID, userID)
	if err != nil {
		log.Printf("error querying chat history: %v", err)
		return []models.ChatCompletion{}, fmt.Errorf("failed to retrieve chat history")
	}
	defer rows.Close()

	var messages []models.ChatCompletion

	for rows.Next() {
		var msg models.ChatCompletion
		if err := rows.Scan(
			&msg.UserID,
			&msg.Role,
			&msg.Content,
			&msg.Model,
			pq.Array(&msg.ReferencedCardPKs),
		); err != nil {
			log.Printf("error scanning message: %v", err)
			return []models.ChatCompletion{}, fmt.Errorf("failed to process chat history")
		}

		cards, _ := s.GetPartialCardsFromChunks(userID, msg.ReferencedCardPKs)
		msg.ReferencedCards = cards
		messages = append(messages, msg)

	}
	return messages, nil
}

func (s *Handler) WriteChatCompletionToDatabase(userID int, completion models.ChatCompletion) error {
	// Insert the completion into the database
	query := `
        INSERT INTO chat_completions (
            user_id, conversation_id, sequence_number, role, 
            content, model, tokens
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at
    `
	err := s.DB.QueryRow(
		query,
		userID,
		completion.ConversationID,
		completion.SequenceNumber,
		completion.Role,
		completion.Content,
		completion.Model,
		completion.Tokens,
	).Scan(&completion.ID, &completion.CreatedAt)

	if err != nil {
		log.Printf("error inserting completion: %v", err)
		return fmt.Errorf("failed to save response")
	}
	return nil

}
