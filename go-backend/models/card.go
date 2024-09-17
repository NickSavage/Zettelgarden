package models

import "time"

type Card struct {
	ID               int           `json:"id"`
	CardID           string        `json:"card_id"`
	UserID           int           `json:"user_id"`
	Title            string        `json:"title"`
	Body             string        `json:"body"`
	Link             string        `json:"link"`
	IsDeleted        bool          `json:"is_deleted"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
	ParentID         int           `json:"parent_id"`
	Parent           PartialCard   `json:"parent"`
	Files            []File        `json:"files"`
	Children         []PartialCard `json:"children"`
	References       []PartialCard `json:"references"`
	Keywords         []Keyword     `json:"keywords"`
	IsLiteratureCard bool          `json:"is_literature_card"`
	Tags             []Tag         `json:"tags"`
}

type PartialCard struct {
	ID               int       `json:"id"`
	CardID           string    `json:"card_id"`
	UserID           int       `json:"user_id"`
	Title            string    `json:"title"`
	ParentID         int       `json:"parent_id"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	IsLiteratureCard bool      `json:"is_literature_card"`
	Tags             []Tag     `json:"tags"`
}

func ConvertCardToPartialCard(input Card) PartialCard {
	return PartialCard{
		ID:               input.ID,
		CardID:           input.CardID,
		UserID:           input.UserID,
		Title:            input.Title,
		ParentID:         input.ParentID,
		CreatedAt:        input.CreatedAt,
		UpdatedAt:        input.UpdatedAt,
		IsLiteratureCard: input.IsLiteratureCard,
		Tags:             input.Tags,
	}
}

type EditCardParams struct {
	CardID           string `json:"card_id"`
	Title            string `json:"title"`
	Body             string `json:"body"`
	Link             string `json:"link"`
	IsLiteratureCard bool   `json:"is_literature_card"`
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
