package llms

import (
	"context"
	"fmt"
	"go-backend/models"
	"log"
	"os"
	"strconv"
	"strings"

	cohere "github.com/cohere-ai/cohere-go/v2"
	cohereclient "github.com/cohere-ai/cohere-go/v2/client"
	openai "github.com/sashabaranov/go-openai"
)

func RerankSearchResults(c *models.LLMClient, query string, input []models.SearchResult) ([]models.SearchResult, error) {
	// Convert SearchResults to strings for reranking
	documents := make([]*cohere.RerankRequestDocumentsItem, len(input))
	for i, result := range input {
		documents[i] = &cohere.RerankRequestDocumentsItem{
			String: fmt.Sprintf("%s\n%s", result.Title, result.Preview),
		}
	}
	model := "rerank-english-v3.0"
	topn := len(input)

	request := cohere.RerankRequest{
		Model:     &model,
		Query:     query,
		Documents: documents,
		TopN:      &topn, // or specify a smaller number if you want fewer results
	}

	client := cohereclient.NewClient(cohereclient.WithToken(os.Getenv("ZETTEL_COHERE_API_KEY")))

	response, err := client.Rerank(context.TODO(), &request)
	if err != nil {
		return nil, err
	}

	// Create a new slice to store reranked results
	reranked := make([]models.SearchResult, len(response.Results))
	for i, result := range response.Results {
		log.Printf("result %v", result)
		reranked[i] = input[result.Index]
		reranked[i].Score = result.RelevanceScore
	}

	return reranked, nil
}

func RerankResults(c *models.LLMClient, query string, input []models.CardChunk) ([]float64, error) {
	summaries := make([]string, len(input))
	for i, result := range input {
		// Create a brief summary of each result
		summaries[i] = fmt.Sprintf("%s - %s",
			result.Title,
			result.Chunk)
	}

	prompt := fmt.Sprintf(`Given the search query "%s", rate the relevance of each document on a scale of 0-10. You are being provided with a number of documents in the form of "title - chunk"

Consider how well each document matches the query's intent and content. A "10", or close to it,
should mean that the document matches the query. A "0", or close to it, means it is unrelated.
You should weigh the title most heavily. For example, if the query is "Winston Churchill" and one
of the documents is titled Winston Churchill, that should be the most highly rated card.
Only respond with numbers separated by commas, like: 8.5,7.2,6.8

Documents to rate:
%s`, query, strings.Join(summaries, "\n"))
	resp, err := ExecuteLLMRequest(c, []openai.ChatCompletionMessage{
		{
			Role:    "system",
			Content: "You are a search result scoring assistant. Only respond with comma-separated numbers.",
		},
		{
			Role:    "user",
			Content: prompt,
		},
	})
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
