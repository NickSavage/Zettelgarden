package models

import (
	"database/sql"
	"github.com/pgvector/pgvector-go"
	"log"
	"time"
)

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
	ParentID   int           `json:"parent_id"`
	Parent     PartialCard   `json:"parent"`
	Files      []File        `json:"files"`
	Children   []PartialCard `json:"children"`
	References []PartialCard `json:"references"`
	Keywords   []Keyword     `json:"keywords"`
	Tags       []Tag         `json:"tags"`
	Embedding  pgvector.Vector
}

func ScanCards(rows *sql.Rows) ([]Card, error) {
	var cards []Card

	for rows.Next() {
		var card Card
		if err := rows.Scan(
			&card.ID,
			&card.CardID,
			&card.UserID,
			&card.Title,
			&card.Body,
			&card.Link,
			&card.ParentID,
			&card.CreatedAt,
			&card.UpdatedAt,
		); err != nil {
			log.Printf(" query full err %v", err)
			return cards, err
		}
		cards = append(cards, card)
	}

	return cards, nil
}

func ScanPartialCards(rows *sql.Rows) ([]PartialCard, error) {
	var cards []PartialCard

	for rows.Next() {
		var card PartialCard
		if err := rows.Scan(
			&card.ID,
			&card.CardID,
			&card.UserID,
			&card.Title,
			&card.ParentID,
			&card.CreatedAt,
			&card.UpdatedAt,
		); err != nil {
			log.Printf("err %v", err)
			return cards, err
		}
		cards = append(cards, card)

	}
	return cards, nil

}

type PartialCard struct {
	ID        int       `json:"id"`
	CardID    string    `json:"card_id"`
	UserID    int       `json:"user_id"`
	Title     string    `json:"title"`
	ParentID  int       `json:"parent_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Tags      []Tag     `json:"tags"`
}

type Flashcard struct {
	ID         int        `json:"id"`
	CardID     string     `json:"card_id"`
	UserID     int        `json:"user_id"`
	Title      string     `json:"title"`
	Body       string     `json:"body"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	State      string     `json:"state"`
	Reps       int        `json:"reps"`
	Lapses     int        `json:"lapses"`
	LastReview *time.Time `json:"last_review,omitempty"`
	Due        *time.Time `json:"due,omitempty"`
	Difficulty float64    `json:"difficulty"`
	Stability  float64    `json:"stability"`
}

func ConvertCardToPartialCard(input Card) PartialCard {
	return PartialCard{
		ID:        input.ID,
		CardID:    input.CardID,
		UserID:    input.UserID,
		Title:     input.Title,
		ParentID:  input.ParentID,
		CreatedAt: input.CreatedAt,
		UpdatedAt: input.UpdatedAt,
		Tags:      input.Tags,
	}
}

type EditCardParams struct {
	CardID      string `json:"card_id"`
	Title       string `json:"title"`
	Body        string `json:"body"`
	Link        string `json:"link"`
	IsFlashcard bool   `json:"is_flashcard"`
}

type NextIDParams struct {
	CardType string `json:"card_type"`
}

type NextIDResponse struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
	NextID  string `json:"new_id"`
}

type CardChunk struct {
	ID        int       `json:"id"`
	CardID    string    `json:"card_id"`
	UserID    int       `json:"user_id"`
	Title     string    `json:"title"`
	Chunk     string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	ParentID  int       `json:"parent_id"`
}

func ScanCardChunks(rows *sql.Rows) ([]CardChunk, error) {
	var cards []CardChunk

	for rows.Next() {
		var card CardChunk
		if err := rows.Scan(
			&card.ID,
			&card.ID,
			&card.UserID,
			&card.Chunk,
		); err != nil {
			log.Printf("err %v", err)
			return cards, err
		}
		cards = append(cards, card)

	}
	return cards, nil

}

func ConvertCardToChunk(input Card) CardChunk {
	return CardChunk{
		ID:        input.ID,
		CardID:    input.CardID,
		UserID:    input.UserID,
		Title:     input.Title,
		Chunk:     input.Body,
		ParentID:  input.ParentID,
		CreatedAt: input.CreatedAt,
		UpdatedAt: input.UpdatedAt,
	}
}
