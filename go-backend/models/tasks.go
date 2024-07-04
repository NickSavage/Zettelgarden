package models

import "time"

type Task struct {
	ID            int       `json:"id"`
	CardPK        int       `json:"card_pk"`
	UserID        int       `json:"user_id"`
	ScheduledDate time.Time `json:"scheduled_date"`
	DueDate       time.Time `json:"due_date"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	CompletedAt   time.Time `json:"completed_at"`
	Title         string    `json:"title"`
	IsComplete    bool      `json:"is_complete"`
}
