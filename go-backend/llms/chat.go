package llms

import (
	"fmt"
	"go-backend/models"
	"log"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

func ChatCompletion(c *models.LLMClient, pastMessages []models.ChatCompletion) (models.ChatCompletion, error) {
	if c.Testing {
		// Return mock response
		return models.ChatCompletion{
			Role:    "assistant",
			Content: "This is a mock response for testing",
			Model:   models.MODEL,
			Tokens:  100,
		}, nil
	}
	var messages []openai.ChatCompletionMessage

	for _, message := range pastMessages {
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    message.Role,
			Content: message.Content,
		})
	}
	log.Printf("messages %v", messages)

	// Create the OpenAI request

	resp, err := ExecuteLLMRequest(c, messages)
	if err != nil {
		log.Printf("error getting completion: %v", err)
		return models.ChatCompletion{}, fmt.Errorf("failed to get AI response")
	}

	if len(resp.Choices) == 0 {
		return models.ChatCompletion{}, fmt.Errorf("no response from AI")
	}

	completion := models.ChatCompletion{
		Role:    resp.Choices[0].Message.Role,
		Content: resp.Choices[0].Message.Content,
		Model:   models.MODEL,
		Tokens:  resp.Usage.TotalTokens,
	}
	return completion, err

}

func CreateConversationSummary(c *models.LLMClient, message models.ChatCompletion) (models.ConversationSummary, error) {
	// Check if in testing mode
	if c.Testing {
		// Return mock summary
		return models.ConversationSummary{
			ID:        message.ConversationID,
			Title:     "🤖 Mock Summary Title",
			CreatedAt: message.CreatedAt,
			Model:     models.MODEL,
		}, nil
	}

	content := message.Role + ": " + message.Content + "\n"
	id := message.ConversationID
	created := message.CreatedAt

	new := []openai.ChatCompletionMessage{
		{
			Role:    "user",
			Content: fmt.Sprintf("Please generate a few words a title that summarizes the following quesiton and answer. Please start with an emoji that you think covers the topic as well. Respond only in the format: Emoji Title, nothing else. Please no quotation marks. Content: %v", content),
		},
	}
	resp, err := ExecuteLLMRequest(c, new)
	if err != nil {
		log.Printf("error getting completion: %v", err)
		return models.ConversationSummary{}, fmt.Errorf("failed to get AI response")
	}
	result := models.ConversationSummary{
		ID:        id,
		Title:     resp.Choices[0].Message.Content,
		CreatedAt: created,
		Model:     models.MODEL,
	}
	return result, nil
}

func AnswerUserInfoQuestion(c *models.LLMClient, userData models.User, lastMessage string) (models.ChatCompletion, error) {

	prompt := `
You are a helpful assistant. Your job is to take a go struct of user data and use it to answer the user's question. If you don't have the information you need, say you can't answer the question. Be brief. Never give out the user's password':

type User struct {
	ID                          int        
	Username                    string    
	Email                       string   
	Password                    string    
	CreatedAt                   time.Time 
	UpdatedAt                   time.Time
	IsAdmin                     bool    
	LastLogin                   *time.Time
	EmailValidated              bool     
	CanUploadFiles              bool    
	MaxFileStorage              int    
	StripeCustomerID            string
	StripeSubscriptionID        string    
	StripeSubscriptionStatus    string   
	StripeSubscriptionFrequency string  
	StripeCurrentPlan           string 
	IsActive                    bool  
	DashboardCardPK             int  
}
The user data is this: %v'
`
	messages := []openai.ChatCompletionMessage{
		{
			Role:    "system",
			Content: fmt.Sprint(prompt, userData),
		},
		{
			Role:    "user",
			Content: lastMessage,
		},
	}

	resp, err := ExecuteLLMRequest(c, messages)
	if err != nil {
		log.Printf("error getting completion: %v", err)
		return models.ChatCompletion{}, fmt.Errorf("failed to get AI response: %w", err)
	}

	if len(resp.Choices) == 0 {
		return models.ChatCompletion{}, fmt.Errorf("no response from AI")
	}

	completion := models.ChatCompletion{
		Role:    resp.Choices[0].Message.Role,
		Content: resp.Choices[0].Message.Content,
		Model:   models.MODEL,
		Tokens:  resp.Usage.TotalTokens,
	}
	return completion, err

}
func CardSearchChatCompletion(c *models.LLMClient, messages []models.ChatCompletion, relatedCards []models.CardChunk) (models.ChatCompletion, error) {
	// Create a string representation of the cards for the context
	var cardContext strings.Builder
	cardContext.WriteString("Here are the relevant cards from the knowledge base:\n\n")
	for i, card := range relatedCards {
		cardContext.WriteString(fmt.Sprintf("Card %d:\nTitle: %s\nContent: %s\n\n",
			i+1, card.Title, card.Chunk))
	}

	// Create system prompt
	systemPrompt := `
You are a helpful assistant with access to a Zettelkasten (note card) system. 
Your job is to answer the user's question based on the provided card contents.
Rules:
1. Only use information from the provided cards
2. If the cards don't contain relevant information, say so
3. Cite which card(s) you're using in your response
4. Be concise but thorough
5. If multiple cards have conflicting information, point this out

Context: %s`

	// Convert the conversation history to OpenAI format
	openAIMessages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: fmt.Sprintf(systemPrompt, cardContext.String()),
		},
	}

	// Add the conversation history
	for _, msg := range messages {
		openAIMessages = append(openAIMessages, openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	// Get completion from OpenAI

	resp, err := ExecuteLLMRequest(c, openAIMessages)
	if err != nil {
		log.Printf("error getting completion: %v", err)
		return models.ChatCompletion{}, fmt.Errorf("failed to get AI response: %w", err)
	}

	if len(resp.Choices) == 0 {
		return models.ChatCompletion{}, fmt.Errorf("no response from AI")
	}

	// Create the completion response
	completion := models.ChatCompletion{
		Role:    resp.Choices[0].Message.Role,
		Content: resp.Choices[0].Message.Content,
		Model:   models.MODEL,
		Tokens:  resp.Usage.TotalTokens,
	}

	// Create a slice of card IDs that were used
	cardIDs := make([]int, len(relatedCards))
	for i, card := range relatedCards {
		cardIDs[i] = card.ID
	}
	completion.ReferencedCardPKs = cardIDs

	return completion, nil
}
