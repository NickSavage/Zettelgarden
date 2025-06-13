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

		You are an AI Memory Scribe for a zettelkasten application. Your task is to analyze a new piece of user text and add granular, raw observations to the "Recent Observations" section of the user's memory file.
		 
		In particular, you should be interested only in observations about the *user*, not about the text itself. Think about what the text says about the user, and what it means that the user has added this text to their zettelkasten. You should only be interested with meta observations about the user, not the actual details of what has been recorded (that is what the zettelkasten itself is for!).

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

func CompressUserMemory(db *sql.DB, client *models.LLMClient, userID uint) (string, error) {
	userMemory, err := GetUserMemory(db, userID)
	if err != nil {
		return "", err
	}
	// skip if the user hasn't changed a card
	if userMemory == "" {
		return "", err
	}

	prompt := fmt.Sprintf(

		`

		You are an expert AI knowledge architect. Your purpose is to perform a daily consolidation of the user's memory file. You will analyze the "Recent Observations" and integrate the meaningful patterns into the "Long-Term Memory".

Your task is to produce a new, superior version of the entire memory block.

**Your Process:**

1.  **Analyze Both Sections:** Read and understand the existing '## Long-Term Memory' and all the raw data in '## Recent Observations'.
2.  **Synthesize and Refactor LTM:** Integrate the significant insights and themes from the "Recent Observations" into the "Long-Term Memory."
    *   Strengthen existing points with new evidence.
    *   Create new high-level abstractions that cover multiple observations.
    *   Add new domains or traits if a strong new pattern has emerged.
    *   Restructure and refine the LTM for maximum clarity and density.
3.  **Empty the Recent Observations:** After synthesis, the "Recent Observations" section has served its purpose. **You must clear it out**, leaving it empty for the next cycle of observations.
4.  **Output the Full Document:** Your final output is the complete, updated memory block, containing the newly refactored Long-Term Memory and the empty Recent Observations section.

**Full Memory Block to be Refactored:**
%s
`,
		userMemory,
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
