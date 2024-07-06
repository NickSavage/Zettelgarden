package models

import (
	"database/sql"
	"encoding/json"
	"time"
)

type NullTime struct {
	sql.NullTime
}

// UnmarshalJSON custom unmarshals a NullTime from a JSON string
func (nt *NullTime) UnmarshalJSON(b []byte) error {
	// Define the date format used in your JSON
	const layout = "2006-01-02T15:04:05Z"
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}

	if s == "" || s == "null" {
		nt.Valid = false
		return nil
	}

	parsedTime, err := time.Parse(layout, s)
	if err != nil {
		return err
	}

	nt.Time = parsedTime
	nt.Valid = true
	return nil
}

type Task struct {
	ID            int       `json:"id"`
	CardPK        int       `json:"card_pk"`
	UserID        int       `json:"user_id"`
	ScheduledDate NullTime  `json:"scheduled_date"`
	DueDate       NullTime  `json:"due_date"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	CompletedAt   NullTime  `json:"completed_at"`
	Title         string    `json:"title"`
	IsComplete    bool      `json:"is_complete"`
	IsDeleted     bool      `json:"is_deleted"`
}
