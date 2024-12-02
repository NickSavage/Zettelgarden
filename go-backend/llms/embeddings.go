package llms

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"os"

	"github.com/pgvector/pgvector-go"
	openai "github.com/sashabaranov/go-openai"
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
	}
	return chunks
}

func GenerateChunkEmbeddings(chunk models.CardChunk, useForQuery bool) ([]pgvector.Vector, error) {
	var results []pgvector.Vector
	url := os.Getenv("ZETTEL_EMBEDDING_API")
	if url == "" {
		return results, errors.New("no embedding url given - set ZETTEL_EMBEDDING_API")
	}
	prompt := chunk.Chunk
	if useForQuery {
		prompt = "Represent this sentence for searching relevant passages:" + prompt
	}

	payload := map[string]string{
		"model":  "mxbai-embed-large",
		"prompt": prompt,
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

	return results, nil

}

func GenerateEmbeddingsFromCard(db *sql.DB, chunks []models.CardChunk) ([][]pgvector.Vector, error) {
	results := [][]pgvector.Vector{}
	for _, chunk := range chunks {
		vec, err := GenerateChunkEmbeddings(chunk, false)
		if err != nil {
			log.Printf("error generating embeddings %v", err)
			return [][]pgvector.Vector{}, err
		}
		results = append(results, vec)
	}
	return results, nil
}

func StoreEmbeddings(db *sql.DB, userID, cardPK int, embeddings [][]pgvector.Vector) error {
	tx, err := db.Begin()
	query := `DELETE FROM card_embeddings WHERE card_pk = $1 AND user_id = $2`
	_, err = tx.Exec(query, cardPK, userID)
	for i, vec := range embeddings {

		if err != nil {
			log.Printf("error %v", err)
			tx.Rollback()
			return fmt.Errorf("error updating card %d: %w", cardPK, err)
		}
		for _, embedding := range vec {
			query = `INSERT INTO card_embeddings (card_pk, user_id, chunk, embedding) VALUES ($1, $2, $3, $4)`

			_, err = tx.Exec(query, cardPK, userID, i, embedding)
			if err != nil {
				log.Printf("error %v", err)
				tx.Rollback()
				return fmt.Errorf("error updating card %d: %w", cardPK, err)
			}

		}
	}
	tx.Commit()
	return nil
}
func GenerateSemanticSearchQuery(c *models.LLMClient, userQuery string) ([]pgvector.Vector, error) {
	// First, let's create a system prompt to help generate a better search query
	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: "You are a search query optimizer. Convert the user's query into a clear, focused search query that captures the main concepts and intent. Keep it concise but comprehensive. Only respond with the optimized query, nothing else.",
		},
		{
			Role:    openai.ChatMessageRoleUser,
			Content: userQuery,
		},
	}

	// Generate the optimized search query
	resp, err := c.Client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    openai.GPT3Dot5Turbo,
			Messages: messages,
		},
	)
	if err != nil {
		return []pgvector.Vector{}, fmt.Errorf("failed to generate optimized search query: %w", err)
	}

	if len(resp.Choices) == 0 {
		return []pgvector.Vector{}, fmt.Errorf("no response received from LLM")
	}

	// Get the optimized query
	optimizedQuery := resp.Choices[0].Message.Content

	// Convert the optimized query to embeddings
	chunk := models.CardChunk{
		Chunk: optimizedQuery,
	}

	embeddings, err := GenerateChunkEmbeddings(chunk, true)
	if err != nil {
		return nil, fmt.Errorf("failed to generate embeddings: %w", err)
	}

	return embeddings, nil
}
