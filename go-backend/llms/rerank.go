package llms

import (
	"context"
	"fmt"
	"go-backend/models"
	"log"
	"strconv"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

func RerankResults(c *openai.Client, query string, input []models.CardChunk) ([]float64, error) {
	log.Printf("start")
	summaries := make([]string, len(input))
	for i, result := range input {
		// Create a brief summary of each result
		summaries[i] = fmt.Sprintf("%d - %s - %s",
			i+1,
			result.Title,
			result.Chunk)
	}

	prompt := fmt.Sprintf(`Given the search query "%s", rate the relevance of each document on a scale of 0-10.
Consider how well each document matches the query's intent and content.
Only respond with numbers separated by commas, like: 8.5,7.2,6.8

Documents to rate:
%s`, query, strings.Join(summaries, "\n"))
	resp, err := c.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "meta-llama/llama-3.2-3b-instruct:free",
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    "system",
					Content: "You are a search result scoring assistant. Only respond with comma-separated numbers.",
				},
				{
					Role:    "user",
					Content: prompt,
				},
			},
		},
	)
	log.Printf("resp %v", resp)
	scores := parseScores(resp.Choices[0].Message.Content)
	if err != nil {
		return []float64{}, err
	}
	return scores, nil

}
func parseScores(response string) []float64 {
	// Split the response and convert to float64
	parts := strings.Split(strings.TrimSpace(response), ",")
	scores := make([]float64, len(parts))
	for i, part := range parts {
		score, err := strconv.ParseFloat(strings.TrimSpace(part), 64)
		if err != nil {
			scores[i] = 0
			continue
		}
		scores[i] = score
	}
	return scores
}
