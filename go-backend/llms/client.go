package llms

import (
	"context"
	"database/sql"
	"go-backend/models"
	"net/http"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func NewDefaultClient(db *sql.DB) *models.LLMClient {
	config := openai.DefaultConfig(os.Getenv("ZETTEL_LLM_KEY"))
	config.BaseURL = os.Getenv("ZETTEL_LLM_ENDPOINT")
	return NewClient(db, config)
}

func NewClient(db *sql.DB, config openai.ClientConfig) *models.LLMClient {
	config.HTTPClient = &http.Client{
		Transport: headerTransport{http.DefaultTransport},
	}

	return &models.LLMClient{
		Client:         openai.NewClientWithConfig(config),
		Testing:        false,
		EmbeddingQueue: models.NewEmbeddingQueue(db),
	}
}

type headerTransport struct {
	http.RoundTripper
}

func (t headerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("HTTP-Referer", "http://zettelgarden.com")
	req.Header.Set("X-Title", "Zettelgarden")

	return t.RoundTripper.RoundTrip(req)
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
