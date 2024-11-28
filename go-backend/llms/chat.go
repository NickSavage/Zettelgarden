package llms

import (
	"context"
	"fmt"
	"go-backend/models"
	"log"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

func NewClient(config openai.ClientConfig) *models.LLMClient {
	return &models.LLMClient{
		Client:  openai.NewClientWithConfig(config),
		Testing: false,
	}
}

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
	resp, err := c.Client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    models.MODEL,
			Messages: messages,
		},
	)
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
	resp, err := c.Client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    models.MODEL,
			Messages: new,
		},
	)
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

func ChooseOptions(c *models.LLMClient, userInput string) (models.ChatOption, error) {
	prompt := `
You are a command router. Your only job is to analyze user input and return exactly one of these values:
- "UserInfo" - if the user is asking about themselves, their information, their account, their settings, or their preferences
- "Chat" - for all other queries
Respond with only one of these exact strings, nothing else.
`
	messages := []openai.ChatCompletionMessage{
		{
			Role:    "system",
			Content: prompt,
		},
		{
			Role:    "user",
			Content: userInput,
		},
	}

	resp, err := c.Client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:       models.MODEL,
			Messages:    messages,
			Temperature: 0, // Keep it deterministic
		},
	)
	if err != nil {
		log.Printf("error getting completion: %v", err)
		return "", fmt.Errorf("failed to get AI response: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	// Clean up the response
	result := strings.TrimSpace(resp.Choices[0].Message.Content)

	// Validate the response
	switch result {
	case string(models.Chat), string(models.UserInfo):
		return models.ChatOption(result), nil
	default:
		log.Printf("unexpected routing response: %s, defaulting to Chat", result)
		return models.Chat, nil
	}
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

	resp, err := c.Client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:       models.MODEL,
			Messages:    messages,
			Temperature: 0, // Keep it deterministic
		},
	)
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
