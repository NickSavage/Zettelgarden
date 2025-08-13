package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"github.com/sashabaranov/go-openai"
)

type Server struct {
	DB        *sql.DB
	Testing   bool
	SchemaDir string
}

type LLMClient struct {
	Client  *openai.Client
	Testing bool
	Model   string
	UserID  int
	DB      *sql.DB
}

type headerTransport struct {
	http.RoundTripper
}

func (t headerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("HTTP-Referer", "http://nicksavage.ca")
	req.Header.Set("X-Title", "Zettelgarden Memory Dev")

	return t.RoundTripper.RoundTrip(req)
}

func NewClient(db *sql.DB, config openai.ClientConfig, userID int) *LLMClient {
	config.HTTPClient = &http.Client{
		Transport: headerTransport{http.DefaultTransport},
	}

	return &LLMClient{
		Client:  openai.NewClientWithConfig(config),
		Testing: false,
		UserID:  userID,
		DB:      db,
	}
}

func ExecuteLLMRequest(c *LLMClient, messages []openai.ChatCompletionMessage) (openai.ChatCompletionResponse, error) {
	resp, err := c.Client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    c.Model,
			Messages: messages,
		},
	)

	if err == nil {
		logLLMRequest(c, resp)
	}

	return resp, err
}

func logLLMRequest(c *LLMClient, resp openai.ChatCompletionResponse) {
	// fire and forget
	go func() {
		_, err := c.DB.Exec(`
		INSERT INTO llm_query_log (user_id, model, prompt_tokens, completion_tokens)
		VALUES ($1, $2, $3, $4)
	`, c.UserID, c.Model, resp.Usage.PromptTokens, resp.Usage.CompletionTokens)
		if err != nil {
			log.Printf("Error logging llm request: %v", err)
		}
	}()
}

func main() {
	dbConfig := DatabaseConfig{}
	dbConfig.Host = os.Getenv("MEMORY_DB_HOST")
	dbConfig.Port = os.Getenv("MEMORY_DB_PORT")
	dbConfig.User = os.Getenv("MEMORY_DB_USER")
	dbConfig.Password = os.Getenv("MEMORY_DB_PASS")
	dbConfig.DatabaseName = os.Getenv("MEMORY_DB_NAME")

	db, _ := ConnectToDatabase(dbConfig)

	config := openai.DefaultConfig(os.Getenv("MEMORY_LLM_KEY"))
	config.BaseURL = os.Getenv("MEMORY_LLM_ENDPOINT")

	s := Server{
		DB:        db,
		SchemaDir: "./schema",
	}
	log.Printf("%v", s)

	authPassword := os.Getenv("AUTH_PASSWORD")
	if authPassword == "" {
		log.Fatal("AUTH_PASSWORD environment variable is not set")
	}

	r := mux.NewRouter()

	// Authentication middleware
	authMiddleware := func(expectedPassword string) mux.MiddlewareFunc {
		return func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				authHeader := r.Header.Get("Authorization")
				if authHeader != expectedPassword {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
				next.ServeHTTP(w, r)
			})
		}
	}

	// Apply middleware globally
	r.Use(authMiddleware(authPassword))

	// Hello World route (requires authentication)
	r.Handle("/hello", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello, World!"))
	}))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{os.Getenv("ZETTEL_URL")},
		AllowCredentials: true,
		AllowedHeaders:   []string{"authorization", "content-type"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		// Enable Debugging for testing, consider disabling in production
		//Debug: true,
	})

	handler := c.Handler(r)

	// Test LLM query before starting server
	llm := NewClient(db, config, 0)
	llm.Model = os.Getenv("MEMORY_LLM_MODEL")
	if llm.Model == "" {
		llm.Model = "gpt-5-chat"
	}

	messages := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleUser, Content: "Hello from Go test query"},
	}

	respLLM, err := ExecuteLLMRequest(llm, messages)
	if err != nil {
		log.Printf("Test LLM query failed: %v", err)
	} else if len(respLLM.Choices) > 0 {
		log.Printf("Test LLM query response: %s", respLLM.Choices[0].Message.Content)
	}

	http.ListenAndServe(":8078", handler)
}
