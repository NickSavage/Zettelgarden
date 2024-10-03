package llms

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"os"

	"github.com/pgvector/pgvector-go"
)

func GenerateEmbeddings(input string) (pgvector.Vector, error) {
	url := os.Getenv("ZETTEL_EMBEDDING_API")
	if url == "" {
		return pgvector.Vector{}, errors.New("no embedding url given - set ZETTEL_EMBEDDING_API")
	}
	payload := map[string]string{
		"model":  "mxbai-embed-large",
		"prompt": input,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("error creating JSON payload: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("error creating request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("error communicating with the embedding API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return pgvector.Vector{}, fmt.Errorf("error generating embeddings: %d - %s", resp.StatusCode, resp.Status)
	}

	var response struct {
		Embedding []float32 `json:"embedding"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return pgvector.Vector{}, errors.New("error decoding the embedding API response")
	}

	//	log.Printf("embedding %v", response.Embedding)
	result := pgvector.NewVector(response.Embedding)
	return result, nil

}

func GenerateEmbeddingsFromCard(db *sql.DB, card models.Card) (pgvector.Vector, error) {
	text := card.Title + " " + card.Body
	return GenerateEmbeddings(text)
}

func StoreEmbeddings(db *sql.DB, card models.Card, embedding pgvector.Vector) error {
	query := `UPDATE cards SET embedding = $1 WHERE id = $2;`

	_, err := db.Exec(query, embedding, card.ID)
	if err != nil {
		log.Printf("error %v", err)
		return fmt.Errorf("error updating card %d: %w", card.ID, err)
	}
	return nil
}
