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

const CHUNK_SIZE = 500

func chunkInput(input string) []string {
	var chunks []string
	for i := 0; i < len(input); i += CHUNK_SIZE {
		end := i + CHUNK_SIZE

		// Ensure the end index does not exceed the string length
		if end > len(input) {
			end = len(input)
		}

		chunks = append(chunks, input[i:end])
		log.Printf("chunk")
	}
	return chunks
}

func GenerateEmbeddings(input string) ([]pgvector.Vector, error) {
	chunks := chunkInput(input)
	var results []pgvector.Vector
	url := os.Getenv("ZETTEL_EMBEDDING_API")
	if url == "" {
		return results, errors.New("no embedding url given - set ZETTEL_EMBEDDING_API")
	}
	for _, chunk := range chunks {

		payload := map[string]string{
			"model":  "mxbai-embed-large",
			"prompt": chunk,
		}

		jsonData, err := json.Marshal(payload)
		if err != nil {
			return results, fmt.Errorf("error creating JSON payload: %w", err)
		}

		req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
		if err != nil {
			return results, fmt.Errorf("error creating request: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return results, fmt.Errorf("error communicating with the embedding API: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return results, fmt.Errorf("error generating embeddings: %d - %s", resp.StatusCode, resp.Status)
		}

		var response struct {
			Embedding []float32 `json:"embedding"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
			return results, errors.New("error decoding the embedding API response")
		}

		result := pgvector.NewVector(response.Embedding)

		results = append(results, result)

	}
	return results, nil

}

func GenerateEmbeddingsFromCard(db *sql.DB, chunks []string) ([][]pgvector.Vector, error) {
	results := [][]pgvector.Vector{}
	for _, chunk := range chunks {
		vec, err := GenerateEmbeddings(chunk)
		if err != nil {
			log.Printf("error generating embeddings %v", err)
			return [][]pgvector.Vector{}, err
		}
		results = append(results, vec)
	}
	return results, nil
}

func StoreEmbeddings(db *sql.DB, card models.Card, embeddings [][]pgvector.Vector) error {
	tx, err := db.Begin()
	query := `DELETE FROM card_embeddings WHERE card_pk = $1 AND user_id = $2`
	_, err = tx.Exec(query, card.ID, card.UserID)
	for _, vec := range embeddings {

		if err != nil {
			log.Printf("error %v", err)
			tx.Rollback()
			return fmt.Errorf("error updating card %d: %w", card.ID, err)
		}
		for i, embedding := range vec {
			query = `INSERT INTO card_embeddings (card_pk, user_id, chunk, embedding) VALUES ($1, $2, $3, $4)`

			_, err = tx.Exec(query, card.ID, card.UserID, i, embedding)
			if err != nil {
				log.Printf("error %v", err)
				tx.Rollback()
				return fmt.Errorf("error updating card %d: %w", card.ID, err)
			}

		}
	}
	tx.Commit()
	return nil
}
