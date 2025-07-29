package llms

import (
	"context"
	"database/sql"
	"go-backend/models"
	"log"
	"net/http"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func NewClientFromModel(db *sql.DB, model models.LLMModel, userID int) *models.LLMClient {
	config := openai.DefaultConfig(model.Provider.APIKey)
	config.BaseURL = model.Provider.BaseURL

	client := NewClient(db, config, userID)
	client.Model = &model
	return client
}

func NewDefaultClient(db *sql.DB, userID int) *models.LLMClient {
	config := openai.DefaultConfig(os.Getenv("ZETTEL_LLM_KEY"))
	config.BaseURL = os.Getenv("ZETTEL_LLM_ENDPOINT")
	client := NewClient(db, config, userID)
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

func NewClient(db *sql.DB, config openai.ClientConfig, userID int) *models.LLMClient {
	config.HTTPClient = &http.Client{
		Transport: headerTransport{http.DefaultTransport},
	}

	return &models.LLMClient{
		Client:  openai.NewClientWithConfig(config),
		Testing: false,
		UserID:  userID,
		DB:      db,
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

	if err == nil {
		logLLMRequest(c, resp)
	}

	return resp, err
}

func logLLMRequest(c *models.LLMClient, resp openai.ChatCompletionResponse) {
	// fire and forget
	go func() {
		_, err := c.DB.Exec(`
		INSERT INTO llm_query_log (user_id, model, prompt_tokens, completion_tokens)
		VALUES ($1, $2, $3, $4)
	`, c.UserID, c.Model.ModelIdentifier, resp.Usage.PromptTokens, resp.Usage.CompletionTokens)
		if err != nil {
			log.Printf("Error logging llm request: %v", err)
		}
	}()
}
