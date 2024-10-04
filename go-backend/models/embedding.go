package models

import (
	"github.com/pgvector/pgvector-go"
)

type Embedding struct {
	ID        int             `json:"id"`
	CardPK    int             `json:"card_id"`
	UserID    int             `json:"user_id"`
	Chunk     int             `json:"chunk"`
	Embedding pgvector.Vector `json:"embedding"`
}
