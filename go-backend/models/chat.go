package models

import (
	"database/sql"
	"sync"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

type LLMRequest struct {
	UserID  int
	Text    string
	CardPK  int
	Chunk   CardChunk
	Retries int
}

type LLMRequestQueue struct {
	Queue        []LLMRequest
	Mu           sync.Mutex
	IsProcessing bool
	DB           *sql.DB
}

type LLMClient struct {
	Client         *openai.Client
	Testing        bool
	EmbeddingQueue *LLMRequestQueue
}

func NewEmbeddingQueue(db *sql.DB) *LLMRequestQueue {
	return &LLMRequestQueue{
		Queue: make([]LLMRequest, 0),
		DB:    db,
	}
}

// Push adds an email to the queue
func (q *LLMRequestQueue) Push(request LLMRequest) {
	q.Mu.Lock()
	defer q.Mu.Unlock()
	q.Queue = append(q.Queue, request)
}

// Pop removes and returns the first email from the queue
// Returns false if queue is empty
func (q *LLMRequestQueue) Pop() (LLMRequest, bool) {
	q.Mu.Lock()
	defer q.Mu.Unlock()

	if len(q.Queue) == 0 {
		return LLMRequest{}, false
	}

	// Get the first email
	request := q.Queue[0]
	// Remove it from the queue
	q.Queue = q.Queue[1:]

	return request, true
}

// Length returns the current size of the queue
func (eq *LLMRequestQueue) Length() int {
	eq.Mu.Lock()
	defer eq.Mu.Unlock()
	return len(eq.Queue)
}

type ChatCompletion struct {
	ID                int           `json:"id"`
	UserID            int           `json:"user_id"`
	ConversationID    string        `json:"conversation_id"`
	SequenceNumber    int           `json:"sequence_number"`
	Role              string        `json:"role"`
	Content           string        `json:"content"`
	Refusal           *string       `json:"refusal"`
	Model             string        `json:"model"`
	Tokens            int           `json:"tokens"`
	CreatedAt         time.Time     `json:"created_at"`
	ReferencedCardPKs []int         `json:"card_pks"`
	ReferencedCards   []PartialCard `json:"cards"`
}

type ChatData struct {
	ChatCompletions []ChatCompletion `json:"chat_completions"`
}

const MODEL = "gpt-3.5-turbo"

type ConversationSummary struct {
	ID           string    `json:"id"`
	MessageCount int       `json:"message_count"`
	CreatedAt    time.Time `json:"created_at"`
	Model        string    `json:"model"`
	Title        string    `json:"title"`
	UserID       int       `json:"user_id"`
}

type ChatOption = string

const (
	Chat     ChatOption = "Chat"
	Cards    ChatOption = "Cards"
	UserInfo ChatOption = "UserInfo"
)
