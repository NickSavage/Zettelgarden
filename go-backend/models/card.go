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
