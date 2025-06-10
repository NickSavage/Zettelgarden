package llms

import (
	"database/sql"
	"fmt"
	"go-backend/models"

	"github.com/sashabaranov/go-openai"
)

func GetUserMemory(db *sql.DB, userID uint) (string, error) {
	var memory string
	err := db.QueryRow("SELECT memory FROM user_memories WHERE user_id = $1", userID).Scan(&memory)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return memory, nil
}

func UpdateUserMemory(db *sql.DB, userID uint, memory string) error {
	_, err := db.Exec(`
		INSERT INTO user_memories (user_id, memory, created_at, updated_at)
		VALUES ($1, $2, NOW(), NOW())
		ON CONFLICT (user_id) DO UPDATE SET memory = $2, updated_at = NOW()
	`, userID, memory)
	return err
}

func GenerateUserMemory(db *sql.DB, client *models.LLMClient, userID uint, cardContent string) (string, error) {
	userMemory, err := GetUserMemory(db, userID)
	if err != nil {
		return "", err
	}

	prompt := fmt.Sprintf(
		`You are an AI assistant that analyzes a user's writing to build a 
high-level understanding of their interests and personality. Based on the 
following text and the existing user memory, update the existing user memory 
with new insights. The memory should not be a summary of the text, but rather 
a meta-analysis of what the text reveals about the user. Simplify as you go as well,
as you learn more older, naive insights should be replaced.

**Existing User Memory:**

%s

**New Text:**

%s

**Updated User Memory:**`,
		userMemory,
		cardContent,
	)

	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleUser,
			Content: prompt,
		},
	}

	response, err := ExecuteLLMRequest(client, messages)
	if err != nil {
		return "", err
	}

	if len(response.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	err = UpdateUserMemory(db, uint(userID), response.Choices[0].Message.Content)
	if err != nil {
		return "", err
	}

	return response.Choices[0].Message.Content, nil
}
