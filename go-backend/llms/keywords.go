package llms

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/sashabaranov/go-openai"
	"go-backend/models"
	"log"
	"os"
	"strings"
)

var systemPrompt string
var userPrompt string

type KeywordsResponse struct {
	Keywords []string `json:"keywords"`
}

func definePrompts() {
	systemPrompt = `
You are a helpful research assistant designed to help categorize pieces of information for
a zettelkasten.
Your job is to take input 'cards' and decide what keywords might relate to that card.
The keywords should be returned in the following json format: {"keywords": [...]} where
each keyword is a string. Do not include any backticks surrounding it or the word json. You must include quotes around each string.

You will be provided with the following pieces of information:
card_id, title, and a snippet of the body

If you think the given card relates to metadata about a book, one keyword must be book.
A quote from a book is not metadata about a book, it is a separate fact.
It is the same way for news articles (return 'article'), podcasts (return 'podcast'), and so on.

keywords must not have spaces. If you feel like there should be spaces, use dashes instead ('-')
please only use lowercase, no capitals

Please try to keep keywords regularized. Here are some example existing keywords:
book, article, podcast, canada, technology, %s
`

	userPrompt = `
Please find the keywords for the following card: %s
}

`

}

func getRandomKeywords(db *sql.DB, userID int, n int) ([]models.Keyword, error) {

	// TODO: this might be slow, we should do something else here
	query := `
    SELECT keyword 
    FROM (
        SELECT DISTINCT keyword 
        FROM keywords 
        WHERE user_id = $1
    ) AS subquery
    ORDER BY RANDOM()
    LIMIT 10;
`

	rows, err := db.Query(query, userID)
	var keywords []models.Keyword
	if err != nil {
		log.Printf("err5 %v", err)
		return keywords, err
	}
	for rows.Next() {
		keyword := models.Keyword{}
		if err := rows.Scan(
			&keyword.Keyword,
		); err != nil {
			log.Printf("err6 %v", err)
			return keywords, err
		}
		keywords = append(keywords, keyword)
	}
	return keywords, nil
}

func getKeywordsFromLLM(db *sql.DB, userID int, input string) (KeywordsResponse, error) {
	definePrompts()
	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))
	randomExistingKeywords, _ := getRandomKeywords(db, userID, 10)
	req := openai.ChatCompletionRequest{
		Model: openai.GPT4o,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: fmt.Sprintf(systemPrompt, randomExistingKeywords),
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: fmt.Sprintf(userPrompt, input),
			},
		},
	}
	resp, err := client.CreateChatCompletion(context.Background(), req)
	jsonOutput := resp.Choices[0].Message.Content
	jsonOutput = strings.Replace(jsonOutput, "json```", "", -1)
	jsonOutput = strings.Replace(jsonOutput, "```", "", -1)
	log.Printf("%s", jsonOutput)

	// Unmarshal JSON into struct
	var keywordsResponse KeywordsResponse
	err = json.Unmarshal([]byte(jsonOutput), &keywordsResponse)
	if err != nil {
		return keywordsResponse, err
	}
	return keywordsResponse, nil
}

func ComputeCardKeywords(db *sql.DB, userID int, card models.Card) error {

	var body string
	if len(card.Body) < 100 {
		body = card.Body

	} else {
		body = card.Body[:100]
	}

	input := fmt.Sprintf("card id: %v title: %s, body: %s", card.ID, card.Title, body)
	keywords, err := getKeywordsFromLLM(db, userID, input)
	if err != nil {
		log.Printf("err1 %v", err)
		return nil
	}

	tx, err := db.Begin()
	_, err = tx.Exec("DELETE FROM keywords WHERE card_pk = $1 AND user_id = $2", card.ID, userID)
	if err != nil {
		log.Printf("err2 %v", err)
		return nil
	}
	for _, keyword := range keywords.Keywords {
		_, err = tx.Exec("INSERT INTO keywords (user_id, card_pk, keyword) VALUES ($1, $2, $3)", userID, card.ID, keyword)
		if err != nil {
			log.Printf("error %v", err)
			return err
		}
	}
	err = tx.Commit()
	if err != nil {
		log.Fatal(err)
	}
	return nil
}
