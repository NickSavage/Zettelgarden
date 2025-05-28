package llms

import (
	"context"
	"database/sql"
	"go-backend/models"
	"net/http"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func NewClientFromModel(db *sql.DB, model models.LLMModel) *models.LLMClient {
	config := openai.DefaultConfig(model.Provider.APIKey)
	config.BaseURL = model.Provider.BaseURL

	client := NewClient(db, config)
	client.Model = &model
	return client
}

func NewDefaultClient(db *sql.DB) *models.LLMClient {
	config := openai.DefaultConfig(os.Getenv("ZETTEL_LLM_KEY"))
	config.BaseURL = os.Getenv("ZETTEL_LLM_ENDPOINT")
	client := NewClient(db, config)
	provider := models.LLMProvider{
		APIKey:  os.Getenv("ZETTEL_LLM_KEY"),
		BaseURL: os.Getenv("ZETTEL_LLM_ENDPOINT"),
	}
	client.Model = &models.LLMModel{
		ModelIdentifier: os.Getenv("ZETTEL_LLM_DEFAULT_MODEL"),
		Provider:        &provider,
	}
	return client
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
			Model:    c.Model.ModelIdentifier,
			Messages: messages,
		},
	)
	return resp, err
}
