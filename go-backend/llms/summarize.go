package llms

import (
	"encoding/json"
	"errors"
	"fmt"
	"go-backend/models"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

type Argument struct {
	Argument   string `json:"argument"`
	Importance int    `json:"importance"`
}

type ThesisAnalysis struct {
	Thesis    string     `json:"thesis"`
	Facts     []string   `json:"facts"`
	Arguments []Argument `json:"arguments"`
}

// SummarizeText: the simple version (unchanged)
func SummarizeText(c *models.LLMClient, input string) (string, error) {
	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: "You are an assistant that summarizes text clearly and concisely.",
		},
		{
			Role:    openai.ChatMessageRoleUser,
			Content: input,
		},
	}

	resp, err := ExecuteLLMRequest(c, messages)
	if err != nil {
		return "", err
	}

	if len(resp.Choices) == 0 {
		return "", errors.New("no summary returned")
	}

	return resp.Choices[0].Message.Content, nil
}

// AnalyzeAndSummarizeText: the advanced pipeline
func AnalyzeAndSummarizeText(c *models.LLMClient, input string) (string, error) {
	chunks := chunkText(input, 10000)

	var allAnalyses []ThesisAnalysis
	collectedTheses := []string{}

	for _, chunk := range chunks {
		contextIntro := ""
		if len(collectedTheses) > 0 {
			contextIntro = "Previously extracted theses:\n- " + strings.Join(collectedTheses, "\n- ") + "\n\n"
		}
		userContent := contextIntro + "Now analyze the following text:\n" + chunk

		messages := []openai.ChatCompletionMessage{
			{
				Role: openai.ChatMessageRoleSystem,
				Content: `You are an assistant that extracts theses, facts, and arguments from text.
Respond ONLY in JSON with the following format:
{
  "thesis": "...",
  "facts": ["...", "..."],
  "arguments": [
    {"argument": "...", "importance": 8},
    {"argument": "...", "importance": 5}
  ]
}`,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: userContent,
			},
		}

		resp, err := ExecuteLLMRequest(c, messages)
		if err != nil {
			return "", err
		}
		if len(resp.Choices) == 0 {
			continue
		}

		// Clean response content by removing possible markdown code fences
		content := resp.Choices[0].Message.Content
		content = strings.TrimSpace(content)
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimPrefix(content, "```")
		content = strings.TrimSuffix(content, "```")

		var analysis ThesisAnalysis
		if err := json.Unmarshal([]byte(content), &analysis); err != nil {
			// skip invalid responses
			continue
		}
		allAnalyses = append(allAnalyses, analysis)
		if analysis.Thesis != "" {
			collectedTheses = append(collectedTheses, analysis.Thesis)
		}
	}

	if len(allAnalyses) == 0 {
		return "", errors.New("no valid analyses returned")
	}

	// Aggregate all results into one string
	theses := []string{}
	facts := []string{}
	args := []string{}
	totalPromptTokens := 0
	totalCompletionTokens := 0

	for _, a := range allAnalyses {
		if a.Thesis != "" {
			theses = append(theses, a.Thesis)
		}
		facts = append(facts, a.Facts...)
		for _, arg := range a.Arguments {
			if arg.Importance >= 7 {
				args = append(args, arg.Argument)
			}
		}
	}

	aggregation := "Theses: " + strings.Join(theses, "; ") +
		"\nFacts: " + strings.Join(facts, "; ") +
		"\nImportant Arguments: " + strings.Join(args, "; ")

	// Final summarization
	finalMessages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: "You are an assistant that summarizes text clearly and concisely.",
		},
		{
			Role: openai.ChatMessageRoleUser,
			Content: `Summarize the following aggregated analysis into a concise summary. Please only output as markdown. 
			Include a clearly labelled summary of main theses and arguments, as well as relevant facts used to support the arguments.\n\n  <analysis>\n\n` + aggregation,
		},
	}

	finalResp, err := ExecuteLLMRequest(c, finalMessages)
	if err != nil {
		return "", err
	}
	if len(finalResp.Choices) == 0 {
		return "", errors.New("no summary returned")
	}
	totalPromptTokens += finalResp.Usage.PromptTokens
	totalCompletionTokens += finalResp.Usage.CompletionTokens

	summary := finalResp.Choices[0].Message.Content
	summary += "\n\nTokens used: " +
		fmt.Sprintf("%d (Prompt: %d, Completion: %d)",
			totalPromptTokens+totalCompletionTokens,
			totalPromptTokens, totalCompletionTokens)

	return summary, nil
}

// chunkText splits input into segments of maxLength, breaking at sentence boundaries.
func chunkText(input string, maxLength int) []string {
	sentences := strings.Split(input, ".")
	var chunks []string
	var current string
	for _, sentence := range sentences {
		s := strings.TrimSpace(sentence)
		if s == "" {
			continue
		}
		if len(current)+len(s)+1 > maxLength {
			chunks = append(chunks, strings.TrimSpace(current))
			current = s + "."
		} else {
			if current == "" {
				current = s + "."
			} else {
				current += " " + s + "."
			}
		}
	}
	if strings.TrimSpace(current) != "" {
		chunks = append(chunks, strings.TrimSpace(current))
	}
	return chunks
}
