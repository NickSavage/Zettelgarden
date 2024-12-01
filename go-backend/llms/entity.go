package llms

import (
	"context"
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"

	openai "github.com/sashabaranov/go-openai"
)

func FindEntities(c *models.LLMClient, card models.Card) ([]models.Entity, error) {
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
			Content: fmt.Sprintf(prompt, card.Title, card.Body),
		},
	}

	resp, err := c.Client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    models.MODEL,
			Messages: messages,
		},
	)
	if err != nil {
		log.Printf("error getting completion: %v", err)
		return []models.Entity{}, err
	}
	log.Printf("resp %v", resp.Choices[0].Message.Content)
	var entities []models.Entity
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &entities); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %v", err)
	}

	log.Printf("entitites %v", entities)
	return entities, nil

}
