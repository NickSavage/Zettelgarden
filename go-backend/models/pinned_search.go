package models

import (
	"encoding/json"
	"time"
)

// PinnedSearch represents a search that has been pinned by a user
type PinnedSearch struct {
	ID           int             `json:"id"`
	UserID       int             `json:"user_id"`
	Title        string          `json:"title"`
	SearchTerm   string          `json:"searchTerm"`
	SearchConfig json.RawMessage `json:"searchConfig"`
	CreatedAt    time.Time       `json:"created_at"`
}

// PinnedSearchRequest is used for API requests to create a pinned search
type PinnedSearchRequest struct {
	Title        string          `json:"title"`
	SearchTerm   string          `json:"search_term"`
	SearchConfig json.RawMessage `json:"search_config"`
}
