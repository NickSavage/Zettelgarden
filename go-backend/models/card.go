package models

import "time"

type Card struct {
	ID        int
	CardID    string
	UserID    int
	Title     string
	Body      string
	Link      string
	IsDeleted bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

type PartialCard struct {
	ID        int       `json:"id"`
	CardID    string    `json:"card_id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}