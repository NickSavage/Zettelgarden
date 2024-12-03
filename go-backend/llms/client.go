package llms

import (
	"context"
	"database/sql"
	"go-backend/models"

	openai "github.com/sashabaranov/go-openai"
)

func NewClient(db *sql.DB, config openai.ClientConfig) *models.LLMClient {
	return &models.LLMClient{
		Client:         openai.NewClientWithConfig(config),
		Testing:        false,
		EmbeddingQueue: models.NewEmbeddingQueue(db),
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
