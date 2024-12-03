package llms

import (
	"context"
	"go-backend/models"

	openai "github.com/sashabaranov/go-openai"
)

func NewClient(config openai.ClientConfig) *models.LLMClient {
	return &models.LLMClient{
		Client:  openai.NewClientWithConfig(config),
		Testing: false,
	}
}

func ExecuteLLMRequest(c *models.LLMClient, messages []openai.ChatCompletionMessage) (openai.ChatCompletionResponse, error) {

	resp, err := c.Client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    models.MODEL,
			Messages: messages,
		},
	)
	return resp, err
}
