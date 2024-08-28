package models

import "time"

type Card struct {
	ID         int           `json:"id"`
	CardID     string        `json:"card_id"`
	UserID     int           `json:"user_id"`
	Title      string        `json:"title"`
	Body       string        `json:"body"`
	Link       string        `json:"link"`
	IsDeleted  bool          `json:"is_deleted"`
	CreatedAt  time.Time     `json:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at"`
	Parent     PartialCard   `json:"parent"`
	Files      []File        `json:"files"`
	Children   []PartialCard `json:"children"`
	References []PartialCard `json:"references"`
	Keywords   []Keyword     `json:"keywords"`
}

type PartialCard struct {
	ID        int       `json:"id"`
	CardID    string    `json:"card_id"`
	UserID    int       `json:"user_id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type EditCardParams struct {
	CardID string `json:"card_id"`
	Title  string `json:"title"`
	Body   string `json:"body"`
	Link   string `json:"link"`
}

type NextIDParams struct {
	CardType string `json:"card_type"`
}

type NextIDResponse struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
	NextID  string `json:"new_id"`
}

type InactiveCard struct {
	ID            int       `json:"id"`
	CardPK        int       `json:"card_pk"`
	UserID        int       `json:"user_id"`
	CardUpdatedAt time.Time `json:"card_updated_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
