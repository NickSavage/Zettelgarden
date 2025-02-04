package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/lib/pq"
)

const MODEL = "gpt-4"

func (s *Handler) GetChatConversationRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	vars := mux.Vars(r)
	conversationID := vars["id"]
	log.Printf("conversationID: %v", conversationID)

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
           content, user_query, refusal, model, tokens, created_at, card_chunks
    FROM chat_completions
    WHERE user_id = $1 AND conversation_id = $2
    ORDER BY sequence_number ASC
    `
	rows, err := s.DB.Query(query, userID, conversationID)
	if err != nil {
		log.Printf("err querying chat conversation: %v", err)
		log.Printf("conversationID: %v", conversationID)
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
			&message.UserQuery,
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
	cardString := "# Contextual cards: "
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
	if newMessage.UserQuery == "" {
		http.Error(w, "User query is required", http.StatusBadRequest)
		return
	}
	newMessage.Content = newMessage.UserQuery

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

	// add prompt on top of	context and user message
	prompt := `
	# Explanation
	You are a research assistant helping the user of a zettelkasten answer questions, 
	make connections, etc. The user will potentially be giving you specific 'cards' as context, including 
	the cards title and body text. Use this to help the user answer their questions.

	One thing to note about cards is that they often have references as backlinks. Anything with square brackets
	around it is a reference to another card.

	As an example, in the following card, the 'goodbye world' card is linked to Hello World, so the card itself in context
	is Hello World.

	Example Card:
	Title: Hello World
	Body: [A.1] - Goodbye World

	Feel free to ask the user questions yourself if you are not sure what they mean. 
	Your default is to ask for information before answering, unless you are sure.
	
	If you think the user wants you to show them an updated card, please respond in JSON with the new title
	 and body in the following format: 

	 %s

	Example e
	`
	exampleJson := "```card{'title': 'Hello World', 'Body': '[A.1] - Goodbye World'}```"
	newMessage.Content = fmt.Sprintf(prompt, exampleJson) + "\n" + newMessage.Content

	// Add the message to the conversation
	message, err := s.AddChatMessage(userID, newMessage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	model, err := s.QueryLLMModel(message.ConfigurationID)
	if err != nil {
		log.Printf("error getting model: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	client := llms.NewClientFromModel(s.DB, model)

	message, err = s.GetChatCompletion(userID, client, message.ConversationID)
	if err != nil {
		log.Printf("error getting chat completion: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if newConversation {
		summaryClient := llms.NewDefaultClient(s.DB)
		summary, err := llms.CreateConversationSummary(summaryClient, message)
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

func (s *Handler) QueryLLMModel(configurationID int) (models.LLMModel, error) {
	log.Printf("querying llm model: %v", configurationID)
	query := `
        SELECT 
            m.id, 
            m.name, 
            m.model_identifier, 
            m.description, 
            m.is_active,
            p.id as provider_id,
            p.name as provider_name,
            p.base_url,
            p.api_key_required,
            p.api_key
        FROM llm_models m
        JOIN user_llm_configurations uc ON m.id = uc.model_id
        JOIN llm_providers p ON m.provider_id = p.id
        WHERE uc.id = $1
    `
	var model models.LLMModel
	var provider models.LLMProvider

	err := s.DB.QueryRow(query, configurationID).Scan(
		&model.ID,
		&model.Name,
		&model.ModelIdentifier,
		&model.Description,
		&model.IsActive,
		&provider.ID,
		&provider.Name,
		&provider.BaseURL,
		&provider.APIKeyRequired,
		&provider.APIKey,
	)
	if err != nil {
		log.Printf("error querying llm model: %v", err)
		return models.LLMModel{}, err
	}

	model.Provider = &provider
	model.ProviderID = provider.ID

	return model, nil
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
            tokens,
            user_query

        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
		message.UserQuery,
	).Scan(&insertedMessage.ID, &insertedMessage.CreatedAt)

	if err != nil {
		log.Printf("error inserting chat message: %v", err)
		return models.ChatCompletion{}, fmt.Errorf("failed to save chat message")
	}

	return insertedMessage, nil
}

func (s *Handler) GetChatCompletion(userID int, client *models.LLMClient, conversationID string) (models.ChatCompletion, error) {

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

	completion, err := llms.ChatCompletion(client, messages)
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
	log.Printf("writing chat completion to database: %v", completion)
	query := `
        INSERT INTO chat_completions (
            user_id, conversation_id, sequence_number, role, 
            content, model, tokens, user_query
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
		completion.UserQuery,
	).Scan(&completion.ID, &completion.CreatedAt)

	if err != nil {
		log.Printf("error inserting completion: %v", err)
		return fmt.Errorf("failed to save response")
	}
	return nil

}

func (s *Handler) GetUserLLMConfigurationsRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	query := `
        SELECT 
            uc.id,
            uc.user_id,
            uc.model_id,
            uc.custom_settings,
            uc.is_default,
            uc.created_at,
            uc.updated_at,
            m.id as model_id,
            m.name as model_name,
            m.model_identifier,
            m.description,
            m.is_active,
            p.id as provider_id,
            p.name as provider_name,
            p.base_url,
            p.api_key_required
        FROM user_llm_configurations uc
        JOIN llm_models m ON uc.model_id = m.id
        JOIN llm_providers p ON m.provider_id = p.id
        WHERE uc.user_id = $1
        ORDER BY uc.is_default DESC, uc.created_at DESC
    `

	rows, err := s.DB.Query(query, userID)
	if err != nil {
		log.Printf("error querying user LLM configurations: %v", err)
		http.Error(w, "Failed to retrieve LLM configurations", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var configurations []models.UserLLMConfiguration
	for rows.Next() {
		var config models.UserLLMConfiguration
		var provider models.LLMProvider
		var model models.LLMModel
		var customSettings []byte

		err := rows.Scan(
			&config.ID,
			&config.UserID,
			&config.ModelID,
			&customSettings,
			&config.IsDefault,
			&config.CreatedAt,
			&config.UpdatedAt,
			&model.ID,
			&model.Name,
			&model.ModelIdentifier,
			&model.Description,
			&model.IsActive,
			&provider.ID,
			&provider.Name,
			&provider.BaseURL,
			&provider.APIKeyRequired,
		)
		if err != nil {
			log.Printf("error scanning LLM configuration: %v", err)
			http.Error(w, "Failed to process LLM configurations", http.StatusInternalServerError)
			return
		}

		// Parse custom settings JSON
		if err := json.Unmarshal(customSettings, &config.CustomSettings); err != nil {
			config.CustomSettings = make(map[string]interface{})
		}

		model.Provider = &provider
		model.IsDefault = config.IsDefault
		config.Model = &model
		configurations = append(configurations, config)
	}

	if err = rows.Err(); err != nil {
		log.Printf("error iterating LLM configurations: %v", err)
		http.Error(w, "Error processing LLM configurations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(configurations)
}

func (s *Handler) CreateLLMProviderRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	// Parse the incoming provider data
	var provider models.LLMProvider
	if err := json.NewDecoder(r.Body).Decode(&provider); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if provider.Name == "" {
		http.Error(w, "Provider name is required", http.StatusBadRequest)
		return
	}

	// Insert the new provider
	query := `
        INSERT INTO llm_providers (
            name,
            base_url,
            api_key_required,
            api_key,
            user_id
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at, updated_at
    `

	err := s.DB.QueryRow(
		query,
		provider.Name,
		provider.BaseURL,
		provider.APIKeyRequired,
		provider.APIKey,
		userID,
	).Scan(&provider.ID, &provider.CreatedAt, &provider.UpdatedAt)

	if err != nil {
		log.Printf("error creating LLM provider: %v", err)
		http.Error(w, "Failed to create LLM provider", http.StatusInternalServerError)
		return
	}

	// Return the created provider
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(provider)
}

func (s *Handler) GetUserLLMProvidersRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	log.Printf("userID: %v", userID)

	query := `
        SELECT 
            id,
            name,
            base_url,
            api_key_required,
            api_key,
            created_at,
            updated_at
        FROM llm_providers
        WHERE user_id = $1 OR user_id IS NULL
        ORDER BY created_at DESC
    `

	rows, err := s.DB.Query(query, userID)
	log.Printf("rows: %v", rows)
	if err != nil {
		log.Printf("error querying LLM providers: %v", err)
		http.Error(w, "Failed to retrieve LLM providers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var providers []models.LLMProvider
	for rows.Next() {
		var provider models.LLMProvider
		err := rows.Scan(
			&provider.ID,
			&provider.Name,
			&provider.BaseURL,
			&provider.APIKeyRequired,
			&provider.APIKey,
			&provider.CreatedAt,
			&provider.UpdatedAt,
		)
		if err != nil {
			log.Printf("error scanning LLM provider: %v", err)
			continue
		}
		providers = append(providers, provider)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(providers)
}

func (s *Handler) UpdateLLMProviderRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	vars := mux.Vars(r)
	providerID := vars["id"]

	// Parse the incoming provider data
	var provider models.LLMProvider
	if err := json.NewDecoder(r.Body).Decode(&provider); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if provider.Name == "" {
		http.Error(w, "Provider name is required", http.StatusBadRequest)
		return
	}

	// Update the provider
	query := `
        UPDATE llm_providers 
        SET 
            name = $1,
            base_url = $2,
            api_key_required = $3,
            api_key = $4,
            updated_at = NOW()
        WHERE id = $5 AND (user_id = $6 OR user_id IS NULL)
        RETURNING id, created_at, updated_at
    `

	err := s.DB.QueryRow(
		query,
		provider.Name,
		provider.BaseURL,
		provider.APIKeyRequired,
		provider.APIKey,
		providerID,
		userID,
	).Scan(&provider.ID, &provider.CreatedAt, &provider.UpdatedAt)

	if err != nil {
		log.Printf("error updating LLM provider: %v", err)
		http.Error(w, "Failed to update LLM provider", http.StatusInternalServerError)
		return
	}

	// Return the updated provider
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(provider)
}

func (s *Handler) DeleteLLMProviderRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	vars := mux.Vars(r)
	providerID := vars["id"]

	// First check if there are any models using this provider
	var modelCount int
	err := s.DB.QueryRow(`
        SELECT COUNT(*) 
        FROM llm_models 
        WHERE provider_id = $1
    `, providerID).Scan(&modelCount)

	if err != nil {
		log.Printf("error checking for dependent models: %v", err)
		http.Error(w, "Failed to check provider dependencies", http.StatusInternalServerError)
		return
	}

	if modelCount > 0 {
		http.Error(w, "Cannot delete provider with associated models", http.StatusBadRequest)
		return
	}

	// Delete the provider
	result, err := s.DB.Exec(`
        DELETE FROM llm_providers 
        WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
    `, providerID, userID)

	if err != nil {
		log.Printf("error deleting LLM provider: %v", err)
		http.Error(w, "Failed to delete LLM provider", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("error getting rows affected: %v", err)
		http.Error(w, "Failed to confirm deletion", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Provider not found or you don't have permission to delete it", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Handler) CreateLLMModelRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	// Parse the request
	var req models.CreateLLMModelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" || req.ModelIdentifier == "" {
		http.Error(w, "Name and model identifier are required", http.StatusBadRequest)
		return
	}

	// Start a transaction
	tx, err := s.DB.Begin()
	if err != nil {
		log.Printf("error starting transaction: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// First, insert the model
	var modelID int
	err = tx.QueryRow(`
        INSERT INTO llm_models (
            provider_id,
            name,
            model_identifier,
            is_active,
			description
        ) VALUES ($1, $2, $3, true, $4)
        RETURNING id
    `, req.ProviderID, req.Name, req.ModelIdentifier, "").Scan(&modelID)

	if err != nil {
		log.Printf("error creating LLM model: %v", err)
		http.Error(w, "Failed to create LLM model", http.StatusInternalServerError)
		return
	}

	// Then, create a default configuration for the user
	_, err = tx.Exec(`
        INSERT INTO user_llm_configurations (
            user_id,
            model_id,
            custom_settings,
            is_default
        ) VALUES ($1, $2, '{}', false)
    `, userID, modelID)

	if err != nil {
		log.Printf("error creating user LLM configuration: %v", err)
		http.Error(w, "Failed to create user configuration", http.StatusInternalServerError)
		return
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		log.Printf("error committing transaction: %v", err)
		http.Error(w, "Failed to save changes", http.StatusInternalServerError)
		return
	}

	// Return the created model
	var model models.LLMModel
	err = s.DB.QueryRow(`
        SELECT 
            m.id,
            m.provider_id,
            m.name,
            m.model_identifier,
            m.description,
            m.is_active,
            m.created_at,
            m.updated_at
        FROM llm_models m
        WHERE m.id = $1
    `, modelID).Scan(
		&model.ID,
		&model.ProviderID,
		&model.Name,
		&model.ModelIdentifier,
		&model.Description,
		&model.IsActive,
		&model.CreatedAt,
		&model.UpdatedAt,
	)

	if err != nil {
		log.Printf("error retrieving created model: %v", err)
		http.Error(w, "Model created but failed to retrieve details", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(model)
}

func (s *Handler) DeleteLLMModelRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	vars := mux.Vars(r)
	modelID := vars["id"]

	// Start a transaction
	tx, err := s.DB.Begin()
	if err != nil {
		log.Printf("error starting transaction: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// First, delete all user configurations for this model
	_, err = tx.Exec(`
        DELETE FROM user_llm_configurations 
        WHERE model_id = $1 AND user_id = $2
    `, modelID, userID)

	if err != nil {
		log.Printf("error deleting user configurations: %v", err)
		http.Error(w, "Failed to delete model configurations", http.StatusInternalServerError)
		return
	}

	// Then delete the model itself
	result, err := tx.Exec(`
        DELETE FROM llm_models 
        WHERE id = $1
    `, modelID)

	if err != nil {
		log.Printf("error deleting LLM model: %v", err)
		http.Error(w, "Failed to delete model", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("error getting rows affected: %v", err)
		http.Error(w, "Failed to confirm deletion", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Model not found", http.StatusNotFound)
		return
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		log.Printf("error committing transaction: %v", err)
		http.Error(w, "Failed to complete deletion", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type UpdateLLMConfigurationRequest struct {
	Name            string                 `json:"name"`
	ModelIdentifier string                 `json:"model_identifier"`
	IsDefault       bool                   `json:"is_default"`
	CustomSettings  map[string]interface{} `json:"custom_settings"`
}

func (s *Handler) UpdateLLMConfigurationRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	vars := mux.Vars(r)
	modelID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid configuration ID", http.StatusBadRequest)
		return
	}

	// Parse request body
	var req UpdateLLMConfigurationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Start transaction
	tx, err := s.DB.Begin()
	if err != nil {
		log.Printf("error starting transaction: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	log.Printf("req id %v %v", modelID, req)
	// Verify ownership and get current configuration
	var currentConfig models.UserLLMConfiguration
	err = tx.QueryRow(`
        SELECT id, user_id, model_id, is_default
        FROM user_llm_configurations
        WHERE model_id = $1 AND user_id = $2
    `, modelID, userID).Scan(
		&currentConfig.ID,
		&currentConfig.UserID,
		&currentConfig.ModelID,
		&currentConfig.IsDefault,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Configuration not found", http.StatusNotFound)
		} else {
			log.Printf("error querying configuration: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	// If setting as default, unset other defaults first
	if req.IsDefault {
		_, err = tx.Exec(`
            UPDATE user_llm_configurations
            SET is_default = false, updated_at = NOW()
            WHERE user_id = $1 AND id != $2
        `, userID, currentConfig.ID)
		if err != nil {
			log.Printf("error updating other configurations: %v", err)
			http.Error(w, "Failed to update configuration", http.StatusInternalServerError)
			return
		}
	}

	// Convert custom settings to JSON
	customSettingsJSON, err := json.Marshal(req.CustomSettings)
	if err != nil {
		log.Printf("error marshaling custom settings: %v", err)
		http.Error(w, "Invalid custom settings", http.StatusBadRequest)
		return
	}

	log.Printf("req %v", req)
	// Update the configuration
	_, err = tx.Exec(`
        UPDATE user_llm_configurations
        SET 
            custom_settings = $1,
            is_default = $2,
            updated_at = NOW()
        WHERE id = $3 AND user_id = $4
    `, customSettingsJSON, req.IsDefault, currentConfig.ID, userID)
	if err != nil {
		log.Printf("error updating configuration: %v", err)
		http.Error(w, "Failed to update configuration", http.StatusInternalServerError)
		return
	}

	// If model name or identifier needs updating, update the model
	if req.Name != "" || req.ModelIdentifier != "" {
		query := `
            UPDATE llm_models
            SET
                name = COALESCE(NULLIF($1, ''), name),
                model_identifier = COALESCE(NULLIF($2, ''), model_identifier),
                updated_at = NOW()
            WHERE id = $3
        `
		_, err = tx.Exec(query, req.Name, req.ModelIdentifier, currentConfig.ModelID)
		if err != nil {
			log.Printf("error updating model: %v", err)
			http.Error(w, "Failed to update model", http.StatusInternalServerError)
			return
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		log.Printf("error committing transaction: %v", err)
		http.Error(w, "Failed to save changes", http.StatusInternalServerError)
		return
	}

	// Fetch and return the updated configuration with full details
	query := `
        SELECT 
            uc.id,
            uc.user_id,
            uc.model_id,
            uc.custom_settings,
            uc.is_default,
            uc.created_at,
            uc.updated_at,
            m.id as model_id,
            m.name as model_name,
            m.model_identifier,
            m.description,
            m.is_active,
            p.id as provider_id,
            p.name as provider_name,
            p.base_url,
            p.api_key_required
        FROM user_llm_configurations uc
        JOIN llm_models m ON uc.model_id = m.id
        JOIN llm_providers p ON m.provider_id = p.id
        WHERE uc.id = $1 AND uc.user_id = $2
    `

	var config models.UserLLMConfiguration
	var provider models.LLMProvider
	var model models.LLMModel
	var customSettings []byte

	err = s.DB.QueryRow(query, currentConfig.ID, userID).Scan(
		&config.ID,
		&config.UserID,
		&config.ModelID,
		&customSettings,
		&config.IsDefault,
		&config.CreatedAt,
		&config.UpdatedAt,
		&model.ID,
		&model.Name,
		&model.ModelIdentifier,
		&model.Description,
		&model.IsActive,
		&provider.ID,
		&provider.Name,
		&provider.BaseURL,
		&provider.APIKeyRequired,
	)
	if err != nil {
		log.Printf("error fetching updated configuration: %v", err)
		http.Error(w, "Configuration updated but failed to retrieve details", http.StatusInternalServerError)
		return
	}

	// Parse custom settings JSON
	if err := json.Unmarshal(customSettings, &config.CustomSettings); err != nil {
		config.CustomSettings = make(map[string]interface{})
	}

	model.Provider = &provider
	config.Model = &model

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}
