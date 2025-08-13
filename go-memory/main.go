package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

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

	// if err == nil {
	// 	logLLMRequest(c, resp)
	// }

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
	RunMigrations(&s)

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

	// Facts route
	r.Handle("/facts", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		type reqBody struct {
			Input string `json:"input"`
		}
		var body reqBody
		rawBody, _ := io.ReadAll(r.Body)
		if err := json.Unmarshal(rawBody, &body); err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}
		if body.Input == "" {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}

		llm := NewClient(s.DB, config, 1)
		llm.Model = os.Getenv("MEMORY_LLM_MODEL")
		if llm.Model == "" {
			llm.Model = "gpt-5-chat"
		}

		prompt := "From the following input, extract all discrete factual statements as a JSON array of strings. Return only valid JSON. Input: " + body.Input
		messages := []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleUser, Content: prompt},
		}

		respLLM, err := ExecuteLLMRequest(llm, messages)
		if err != nil || len(respLLM.Choices) == 0 {
			http.Error(w, "LLM request failed", http.StatusInternalServerError)
			return
		}

		log.Printf("%v", respLLM.Choices[0].Message.Content)
		// Clean LLM output in case it's wrapped in markdown code fences
		rawOutput := respLLM.Choices[0].Message.Content
		log.Printf("DEBUG: Raw LLM output: %s", rawOutput)
		cleanOutput := rawOutput
		if strings.HasPrefix(strings.TrimSpace(cleanOutput), "```") {
			lines := strings.Split(cleanOutput, "\n")
			var filtered []string
			for _, line := range lines {
				if strings.HasPrefix(line, "```") {
					continue
				}
				filtered = append(filtered, line)
			}
			cleanOutput = strings.Join(filtered, "\n")
			log.Printf("DEBUG: Stripped code fences from LLM output")
		}

		var facts []string
		if err := json.Unmarshal([]byte(cleanOutput), &facts); err != nil {
			log.Printf("DEBUG: JSON unmarshal error: %v", err)
			http.Error(w, "Failed to parse LLM output", http.StatusInternalServerError)
			return
		}

		for _, f := range facts {
			if _, err := s.DB.Exec(`INSERT INTO facts (user_id, fact) VALUES ($1, $2)`, llm.UserID, f); err != nil {
				http.Error(w, "Database insert failed", http.StatusInternalServerError)
				return
			}
		}

		w.WriteHeader(http.StatusOK)
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
