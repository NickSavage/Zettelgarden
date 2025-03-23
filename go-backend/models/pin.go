package models

import (
	"time"
)

// PinnedCard represents a card that has been pinned by a user
type PinnedCard struct {
	ID        int       `json:"id"`
	CardPK    int       `json:"card_pk"`
	UserID    int       `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Card      Card      `json:"card,omitempty"` // Optional embedded card for API responses
}

// PinnedCardResponse is used for API responses that include the full card data
type PinnedCardResponse struct {
	ID        int       `json:"id"`
	CardPK    int       `json:"card_pk"`
	UserID    int       `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Card      Card      `json:"card"`
}
