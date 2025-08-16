package models

import "time"

type Summarization struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	InputText string    `json:"input_text"`
	Status    string    `json:"status"`
	Result    string    `json:"result,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
