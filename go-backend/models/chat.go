package models

import (
	"time"

	openai "github.com/sashabaranov/go-openai"
)

type LLMClient struct {
	Client  *openai.Client
	Testing bool
}

type ChatCompletion struct {
	ID              int       `json:"id"`
	UserID          int       `json:"user_id"`
	ConversationID  string    `json:"conversation_id"`
	SequenceNumber  int       `json:"sequence_number"`
	Role            string    `json:"role"`
	Content         string    `json:"content"`
	Refusal         *string   `json:"refusal"`
	Model           string    `json:"model"`
	Tokens          int       `json:"tokens"`
	CreatedAt       time.Time `json:"created_at"`
	ReferencedCards []int     `json:"card_pks"`
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

type TechnologyType = string

const (
	PlantSpace     TechnologyType = "PlantSpace"
	Seed           TechnologyType = "Seed"
	Field          TechnologyType = "Field"
	BuildingSpace  TechnologyType = "BuildingSpace"
	CellTowerSpace TechnologyType = "CellTowerSpace"
)
