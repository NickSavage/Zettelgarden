package models

import (
	"time"
)

type ChatCompletion struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	ConversationID string    `json:"conversation_id"`
	SequenceNumber int       `json:"sequence_number"`
	Role           string    `json:"role"`
	Content        string    `json:"content"`
	Refusal        *string   `json:"refusal"`
	Model          string    `json:"model"`
	Tokens         int       `json:"tokens"`
	CreatedAt      time.Time `json:"created_at"`
}

type ChatData struct {
	ChatCompletions []ChatCompletion `json:"chat_completions"`
}

const MODEL = "gpt-3.5-turbo"

type ConversationSummary struct {
	ConversationID string    `json:"conversation_id"`
	MessageCount   int       `json:"message_count"`
	CreatedAt      time.Time `json:"created_at"`
	Model          string    `json:"model"`
	Title          string    `json:"title"`
	UserID         int       `json:"user_id"`
}
