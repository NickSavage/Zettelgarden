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

func ProcessEmbeddings(db *sql.DB, userID, cardPK int, chunks []models.CardChunk) {
	var allEmbeddings [][]pgvector.Vector
	var allEmbeddings1024 [][]pgvector.Vector

	for _, chunk := range chunks {
		embeddings, err := GenerateChunkEmbeddings(chunk, false)
		if err != nil {
			log.Printf("failed to generate embeddings for card %v chunk %v: %v", cardPK, chunk.ID, err)
			return
		}
		embeddings1024, err := GenerateChunkEmbeddings1024(chunk, false)
		if err != nil {
			log.Printf("failed to generate embeddings1024 for card %v chunk %v: %v", cardPK, chunk.ID, err)
			return
		}
		allEmbeddings = append(allEmbeddings, embeddings)
		allEmbeddings1024 = append(allEmbeddings1024, embeddings1024)
	}

	if err := StoreBothEmbeddings(
		db,
		userID,
		cardPK,
		allEmbeddings,
		allEmbeddings1024,
	); err != nil {
		log.Printf("failed to store embeddings for %v: %v", cardPK, err)
		return
	}
}

// GetEmbedding generates an embedding vector for a given text string
func GetEmbedding1024(text string, useForQuery bool) (pgvector.Vector, error) {
	url := os.Getenv("ZETTEL_EMBEDDING_1024_API")
	if url == "" {
		return pgvector.Vector{}, errors.New("no embedding url given - set ZETTEL_EMBEDDING_1024_API")
	}

	prompt := text
	if useForQuery {
		prompt = "Represent this sentence for searching relevant passages:" + prompt
	}

	log.Printf("prompt %v", prompt)
	payload := map[string]string{
		"inputs": prompt,
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

	var embeddings [][]float32
	if err := json.NewDecoder(resp.Body).Decode(&embeddings); err != nil {
		return pgvector.Vector{}, fmt.Errorf("error decoding embedding API response: %w", err)
	}

	if len(embeddings) == 0 {
		return pgvector.Vector{}, errors.New("no embeddings returned")
	}

	// use the first embedding
	return pgvector.NewVector(embeddings[0]), nil
}

// GetEmbedding generates an embedding vector for a given text string
func GetEmbedding(text string, useForQuery bool) (pgvector.Vector, error) {
	url := os.Getenv("ZETTEL_EMBEDDING_API")
	if url == "" {
		return pgvector.Vector{}, errors.New("no embedding url given - set ZETTEL_EMBEDDING_API")
	}

	prompt := text
	if useForQuery {
		prompt = "Represent this sentence for searching relevant passages:" + prompt
	}

	payload := map[string]string{
		"model":  "nomic-embed-text",
		"prompt": prompt,
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

	return pgvector.NewVector(response.Embedding), nil
}

func GenerateChunkEmbeddings1024(chunk models.CardChunk, useForQuery bool) ([]pgvector.Vector, error) {
	embedding, err := GetEmbedding1024(chunk.Chunk, useForQuery)
	if err != nil {
		return nil, err
	}
	return []pgvector.Vector{embedding}, nil
}
func GenerateChunkEmbeddings(chunk models.CardChunk, useForQuery bool) ([]pgvector.Vector, error) {
	embedding, err := GetEmbedding(chunk.Chunk, useForQuery)
	if err != nil {
		return nil, err
	}
	return []pgvector.Vector{embedding}, nil
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

func StoreBothEmbeddings(db *sql.DB, userID, cardPK int, embeddings [][]pgvector.Vector, embeddings1024 [][]pgvector.Vector) error {
	if len(embeddings) != len(embeddings1024) {
		return fmt.Errorf("embedding lengths do not match: %d vs %d", len(embeddings), len(embeddings1024))
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	query := `DELETE FROM card_embeddings WHERE card_pk = $1 AND user_id = $2`
	if _, err := tx.Exec(query, cardPK, userID); err != nil {
		tx.Rollback()
		return fmt.Errorf("error clearing existing card embeddings: %w", err)
	}

	for i := range embeddings {
		if len(embeddings[i]) != len(embeddings1024[i]) {
			tx.Rollback()
			return fmt.Errorf("embedding chunk %d length mismatch: %d vs %d", i, len(embeddings[i]), len(embeddings1024[i]))
		}
		for j := range embeddings[i] {
			query = `INSERT INTO card_embeddings (card_pk, user_id, chunk, embedding_nomic, embedding_1024) VALUES ($1, $2, $3, $4, $5)`
			if _, err := tx.Exec(query, cardPK, userID, i, embeddings[i][j], embeddings1024[i][j]); err != nil {
				tx.Rollback()
				return fmt.Errorf("error inserting embeddings for card %d: %w", cardPK, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit error: %w", err)
	}
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

	resp, err := ExecuteLLMRequest(c, messages)
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
