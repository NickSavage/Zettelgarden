package llms

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"strings"
	"time"

	"github.com/pgvector/pgvector-go"
	openai "github.com/sashabaranov/go-openai"
)

func FindEntities(c *models.LLMClient, title, body string) ([]models.Entity, error) {
	systemPrompt := `You are an AI specialized in analyzing zettelkasten cards and extracting entities.
Follow these rules strictly:

1. Entity Types must be one of: person, concept, theory, book, software, place, organization, event, method

2. Entity Names should be:
   - Concise (1-5 words)
   - Properly capitalized
   - Specific enough to be unique
   - Consistent with academic/professional terminology

3. Descriptions should be:
   - 10-20 words maximum
   - Focus on relevance to the card's context
   - Include key relationships or significance
   - Objective and factual

4. Extract entities that are:
   - Explicitly mentioned in the text
   - Significant to the card's main ideas
   - Could be useful for connecting to other cards
   - Worth tracking as separate concepts

Return only valid JSON matching the specified structure.`
	prompt := `Please analyze this zettelkasten card and extract all meaningful entities:
    Title: %s
    Body: %s
    
    Return only a JSON array of entities matching this structure:
[
    
        {
            "name": "entity name",
            "description": "brief description",
            "type": "entity type"
        }
    ]`

	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: systemPrompt,
		},
		{
			Role:    openai.ChatMessageRoleUser,
			Content: fmt.Sprintf(prompt, title, body),
		},
	}
	var entities []models.Entity
	var jsonErr error
	for range 3 {

		resp, err := ExecuteLLMRequest(c, messages)
		if err != nil {
			log.Printf("error getting completion: %v", err)
			return []models.Entity{}, err
		}
		if len(resp.Choices) == 0 {
			continue
		}
		content := resp.Choices[0].Message.Content
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimSuffix(content, "```")
		content = strings.TrimSpace(content)

		jsonErr = json.Unmarshal([]byte(content), &entities)
		if jsonErr == nil {
			break
		} else {
			time.Sleep(1000 * time.Millisecond)

		}
	}
	var results []models.Entity
	for _, entity := range entities {
		text := fmt.Sprintf("%v - %v - %v", entity.Name, entity.Type, entity.Description)
		embedding, err := GetEmbedding1024(text, false)
		if err != nil {
			continue
		}
		entity.Embedding = embedding
		results = append(results, entity)
	}

	return results, nil

}

func CheckExistingEntities(c *models.LLMClient, similar []models.Entity, entity models.Entity) (models.Entity, error) {
	if len(similar) == 0 {
		return entity, nil
	}

	// System prompt to explain the task
	systemPrompt := `You are an AI specialized in determining if entities refer to the same thing.
Consider names, descriptions, and entity types carefully.
Return a JSON response indicating if they are the same and explaining why.
Be strict - only indicate they are the same if you are highly confident they refer to the exact same entity.`

	// Check each similar entity
	for _, sim := range similar {
		prompt := fmt.Sprintf(`Compare these two entities and determine if they refer to the same thing:

Entity 1:
Name: %s
Type: %s
Description: %s

Entity 2:
Name: %s
Type: %s
Description: %s

Return JSON in this format:
{
    "areSame": boolean,
    "explanation": "brief explanation of decision",
    "preferredEntity": "1" or "2"
}`,
			entity.Name, entity.Type, entity.Description,
			sim.Name, sim.Type, sim.Description)

		messages := []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: systemPrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		}

		type Response struct {
			AreSame         bool   `json:"areSame"`
			Explanation     string `json:"explanation"`
			PreferredEntity string `json:"preferredEntity"`
		}

		// Make the API call

		resp, err := ExecuteLLMRequest(c, messages)
		if err != nil {
			log.Printf("error getting completion: %v", err)
			continue
		}

		var result Response

		content := resp.Choices[0].Message.Content
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimSuffix(content, "```")
		content = strings.TrimSpace(content)
		err = json.Unmarshal([]byte(content), &result)
		if err != nil {
			log.Printf("error parsing response: %v", err)
			continue
		}

		// If the LLM thinks they're the same
		if result.AreSame {
			// log.Printf("Found matching entity: %s and %s. Explanation: %s",
			// 	entity.Name, sim.Name, result.Explanation)
			return sim, nil
		}
	}

	// If no matches found or new entity is always preferred
	return entity, nil
}

func GenerateEntityEmbedding(c *models.LLMClient, entity models.Entity) (pgvector.Vector, error) {
	// Combine entity fields into a single text for embedding
	text := fmt.Sprintf("%s - %s - %s", entity.Name, entity.Type, entity.Description)

	// Generate embedding using existing function
	embedding, err := GetEmbedding1024(text, false)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("failed to generate embedding: %w", err)
	}

	return embedding, nil
}
