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

		`

		You are an AI Memory Scribe. Your task is to analyze a new piece of user text and add granular, raw observations to the "Recent Observations" section of the user's memory file.

You must follow this process precisely:
1.  **Preserve the Long-Term Memory:** The entire section under the '## Long-Term Memory' heading must be copied into the output exactly as it is, without any changes. If it does not exist, create it
2.  **Analyze the New Text:** Read the "New User Text" provided below and extract atomic, specific observations about the user's interests, activities, or personality.
3.  **Append New Observations:** Add your new findings as bullet points to the end of the existing content under the '## Recent Observations' heading.
4.  **Output the Full Document:** Your final output must be the complete, updated memory block, including both the untouched Long-Term Memory and the newly appended-to Recent Observations.

**CRITICAL RULES:**
*   **DO NOT MODIFY THE LONG-TERM MEMORY SECTION.**
*   Do not synthesize or abstract. Capture raw data points.
*   Your output must be the ENTIRE updated text block in valid Markdown.
*   Keep in mind that the texts are from zettelkasten cards, there is a chance they are quotes and are not actual facts about the user.

**Existing Memory Block:**
%s

**New Text:**
%s

**Updated User Memory (present the updated memory in a similar structured format, e.g., using bullet points or sections for "Core Interests," "Personality Insights," etc.):**`,
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
