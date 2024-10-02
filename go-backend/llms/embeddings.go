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

func GenerateEmbeddings(db *sql.DB, card models.Card) ([]float32, error) {
	url := os.Getenv("ZETTEL_EMBEDDING_API")
	if url == "" {
		return nil, errors.New("no embedding url given - set ZETTEL_EMBEDDING_API")
	}
	text := card.Title + " " + card.Body
	payload := map[string]string{
		"model":  "mxbai-embed-large",
		"prompt": text,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("error creating JSON payload: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error communicating with the embedding API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error generating embeddings: %d - %s", resp.StatusCode, resp.Status)
	}

	var response struct {
		Embedding []float32 `json:"embedding"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, errors.New("error decoding the embedding API response")
	}

	//	log.Printf("embedding %v", response.Embedding)
	return response.Embedding, nil
}

func StoreEmbeddings(db *sql.DB, card models.Card, embedding []float32) error {
	log.Printf("?")
	v := pgvector.NewVector(embedding)

	query := `UPDATE cards SET embedding = $1 WHERE id = $2;`

	_, err := db.Exec(query, v, card.ID)
	if err != nil {
		log.Printf("error %v", err)
		return fmt.Errorf("error updating card %d: %w", card.ID, err)
	}
	return nil
}
