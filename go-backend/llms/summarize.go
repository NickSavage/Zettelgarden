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
	c.Model.ModelIdentifier = "openai/gpt-5-chat"

	totalPromptTokens := 0
	totalCompletionTokens := 0

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
		totalPromptTokens += resp.Usage.PromptTokens
		totalCompletionTokens += resp.Usage.CompletionTokens
	}

	if len(allAnalyses) == 0 {
		return "", errors.New("no valid analyses returned")
	}

	// Aggregate all results into one string
	theses := []string{}
	facts := []string{}
	args := []string{}

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

	// Deduplicate and rank with another LLM call
	dedupInput := "Theses: " + strings.Join(theses, "; ") +
		"\nFacts: " + strings.Join(facts, "; ") +
		"\nImportant Arguments: " + strings.Join(args, "; ")

	dedupMessages := []openai.ChatCompletionMessage{
		{
			Role: openai.ChatMessageRoleSystem,
			Content: `You are an assistant that deduplicates and ranks extracted information.
Respond ONLY in JSON with the following format:
{
  "theses": [{"thesis": "...", "rank": 1}, {"thesis": "...", "rank": 2}],
  "facts": ["...", "..."],
  "arguments": [{"argument": "...", "rank": 1}, {"argument": "...", "rank": 2}]
}`,
		},
		{
			Role:    openai.ChatMessageRoleUser,
			Content: dedupInput,
		},
	}
	dedupResp, err := ExecuteLLMRequest(c, dedupMessages)
	if err != nil {
		return "", err
	}
	if len(dedupResp.Choices) == 0 {
		return "", errors.New("no deduplicated results returned")
	}
	dedupContent := strings.TrimSpace(dedupResp.Choices[0].Message.Content)
	dedupContent = strings.TrimPrefix(dedupContent, "```json")
	dedupContent = strings.TrimPrefix(dedupContent, "```")
	dedupContent = strings.TrimSuffix(dedupContent, "```")
	aggregation := dedupContent
	totalPromptTokens += dedupResp.Usage.PromptTokens
	totalCompletionTokens += dedupResp.Usage.CompletionTokens

	// Final summarization
	finalMessages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: "You are an assistant that summarizes text clearly and concisely.",
		},
		{
			Role: openai.ChatMessageRoleUser,
			Content: `
Summarize the following aggregated analysis into a two-part markdown summary. 
The output should be **structured, concise, and tailored to distinct audiences**.

### Instructions:
1. **Format:** Use headings, subheadings, and bullets for clarity.

2. **Section 1: High-Level Digest (Executive Summary)**  
   - Audience: Senior management, decision-makers, or non-specialist readers.  
   - Style: Concise, strategic, and outcome-focused.  
   - Length: ~4–6 bullet points.  
   - Emphasize:  
     - Main conclusions or big-picture trends.  
     - Strategic implications.  
     - Key trade-offs or future outlook.  
   - Avoid: Technical jargon, long lists, or granular details.

3. **Section 2: Academic / Reference Summary**  
   - Audience: Researchers, analysts, technical leads, or specialists.  
   - Style: Well-structured, factual, and precise.  
   - Include:  
     - **Main Theses** (core claims or insights).  
     - **Supporting Arguments** (reasoning behind these theses).  
     - **Key Evidence or Facts** (5–8 of the most decisive data points, milestones, or examples).  
   - Present information in a hierarchy (for each theses, show its supporting arguments → facts).  
   - Exclude secondary/tangential details.

4. **General Guidelines:**  
   - Focus only on what is **strategically or academically important** to understand the subject.  
   - Omit extraneous digressions, trivia, or minor historical detail.  
   - Keep each section readable on its own.  
   - Tone:  
     - Section 1 → plain, polished, and accessible ("boardroom-ready").  
     - Section 2 → objective, precise, and reference-style ("briefing document").  

Input:
<analysis>\n` + aggregation,
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
