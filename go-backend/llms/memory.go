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
		Analyze the following user text to uncover high-level insights into their interests and personality. You will update an existing user memory with these new insights, prioritizing synthesis over summarization.

Focus on identifying:
* **Core Interests:** Recurring topics, themes, or domains of knowledge the user seems interested in. Look for patterns, enthusiasm, or specific concepts that appear frequently.
* **Personality Traits & Perspectives:** How the user expresses themselves, their emotional tone, their level of detail, their opinions, their intellectual style, and any revealed values or worldviews.
* **Salient Ideas/Concepts:** Beyond direct interests, identify significant ideas, concepts, or figures that the user engages with, regardless of whether they invented them or are quoting.

When analyzing the text, keep the following in mind:
* **Emphasis on Meta-Analysis:** Your goal is to describe what the text *reveals* about the user, not to simply restate the text's content.
* **Zettelkasten Consideration for Quotes:** Lines starting with '>' or within quotation marks likely represent quotes from other sources. Analyze the *user's choice* to include or engage with these quotes for insights into their interests, values, or intellectual pursuits. Do not attribute the quoted ideas as the user's own, but rather analyze the user's interaction with them.
* **Simplification and Refinement:** As you integrate new insights, refine or simplify existing entries in the user memory. Replace naive or less specific observations with clearer, more developed understandings. The goal is a concise and insightful memory.
* **Avoid Summarization:** Do not produce a summary of the input text.

**Existing User Memory (in a structured format, if possible):**
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
