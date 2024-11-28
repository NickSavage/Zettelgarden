package llms

import (
	"context"
	"fmt"
	"go-backend/models"
	"log"

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
