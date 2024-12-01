package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/pgvector/pgvector-go"
)

type SearchParams struct {
	Tags        []string
	Terms       []string
	NegateTags  []string
	NegateTerms []string
}

func contains[T comparable](collection []T, target T) bool {
	for _, v := range collection {
		if v == target {
			return true
		}
	}
	return false
}
func ParseSearchText(input string) SearchParams {
	var searchParams SearchParams

	// Split the input string by spaces
	parts := strings.Fields(input)

	for _, part := range parts {
		if strings.HasPrefix(part, "#") {
			searchParams.Tags = append(searchParams.Tags, strings.TrimPrefix(part, "#"))
		} else if strings.HasPrefix(part, "!#") {
			searchParams.NegateTags = append(searchParams.NegateTags, strings.TrimPrefix(part, "!#"))

		} else if strings.HasPrefix(part, "!") {

			searchParams.NegateTerms = append(searchParams.NegateTerms, strings.TrimPrefix(part, "!"))
		} else {
			// Add to terms
			searchParams.Terms = append(searchParams.Terms, part)
		}
	}

	return searchParams
}
func BuildPartialCardSqlSearchTermString(searchString string, fullText bool) string {
	searchParams := ParseSearchText(searchString)

	var result string
	var termConditions []string
	var tagConditions []string
	var negateTagsConditions []string
	var excludeTerms []string

	// Add conditions for terms that search both card_id and title
	for _, term := range searchParams.Terms {
		// Use ILIKE for case-insensitive pattern matching
		var termCondition string
		if fullText {
			termCondition = fmt.Sprintf("(card_id ILIKE '%%%s%%' OR title ILIKE '%%%s%%' OR body ILIKE '%%%s%%')", term, term, term)

		} else {
			termCondition = fmt.Sprintf("(card_id ILIKE '%%%s%%' OR title ILIKE '%%%s%%')", term, term)

		}
		termConditions = append(termConditions, termCondition)
	}

	for _, term := range searchParams.NegateTerms {
		var excludeCondition string
		if fullText {
			excludeCondition = fmt.Sprintf("NOT (card_id ILIKE '%%%s%%' OR title ILIKE '%%%s%%' OR body ILIKE '%%%s%%')", term, term, term)
		} else {
			excludeCondition = fmt.Sprintf("NOT (card_id ILIKE '%%%s%%' OR title ILIKE '%%%s%%')", term, term)
		}
		excludeTerms = append(excludeTerms, excludeCondition)
	}

	// Add conditions for tags
	for _, tag := range searchParams.Tags {
		tagCondition := fmt.Sprintf(`EXISTS (
            SELECT 1 FROM card_tags
            JOIN tags ON card_tags.tag_id = tags.id
            WHERE card_tags.card_pk = cards.id AND tags.name = '%s' AND tags.is_deleted = FALSE
        )`, tag)
		tagConditions = append(tagConditions, tagCondition)
	}
	// Build SQL for tags that should NOT exist
	for _, tag := range searchParams.NegateTags {
		tagCondition := fmt.Sprintf(`NOT EXISTS (
            SELECT 1 FROM card_tags
            JOIN tags ON card_tags.tag_id = tags.id
            WHERE card_tags.card_pk = cards.id AND tags.name = '%s' AND tags.is_deleted = FALSE
        )`, tag)
		negateTagsConditions = append(negateTagsConditions, tagCondition)
	}

	if len(tagConditions) > 0 {
		result = " AND (" + strings.Join(tagConditions, " AND ") + ")"
	}

	if len(termConditions) > 0 {
		result += " AND (" + strings.Join(termConditions, " AND ") + ")"
	}
	if len(excludeTerms) > 0 {
		excludeClause := strings.Join(excludeTerms, " AND ")
		result += " AND (" + excludeClause + ")"
	}
	if len(negateTagsConditions) > 0 {
		negateTagClause := strings.Join(negateTagsConditions, " AND ")
		result += " AND (" + negateTagClause + ")"
	}
	return result
}

func (s *Handler) GetRelatedCards(userID int, embedding pgvector.Vector) ([]models.CardChunk, error) {

	query := `
SELECT 
    c.id,
    c.card_id,
    c.user_id,
    c.title,
    cc.chunk_text as chunk,
    c.created_at,
    c.updated_at,
    c.parent_id
FROM 
    card_embeddings ce
    INNER JOIN cards c ON ce.card_pk = c.id
    INNER JOIN card_chunks cc ON ce.card_pk = cc.card_pk AND ce.chunk = cc.chunk_id
WHERE 
    ce.user_id = $1 
    AND c.is_deleted = FALSE
GROUP BY 
    c.id, 
    c.card_id, 
    c.user_id, 
    c.title, 
    cc.chunk_text,
    c.created_at, 
    c.updated_at,
    c.parent_id
ORDER BY 
    AVG(ce.embedding <=> $2)
LIMIT 50;
`
	var rows *sql.Rows
	var err error
	rows, err = s.DB.Query(query, userID, embedding)
	if err != nil {
		log.Printf("err %v", err)
		return []models.CardChunk{}, err
	}

	cards, err := models.ScanCardChunks(rows)
	log.Printf("err %v", err)

	return cards, err

	// var seen = make(map[int]bool)
	// var results []models.CardChunk

	// // for _, card := range cards {
	// // 	if _, exists := seen[card.ID]; !exists {
	// // 		results = append(results, card)
	// // 		seen[card.ID] = true
	// // 	}
	// // }

	// return results, nil

}

func (s *Handler) SemanticSearchCardsRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	searchTerm := r.URL.Query().Get("search_term")

	chunk := models.CardChunk{
		Chunk: searchTerm,
	}

	embeddings, err := llms.GenerateChunkEmbeddings(chunk, true)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(embeddings) == 0 {
		http.Error(w, "search query not entered", http.StatusBadRequest)
		return
	}
	relatedCards, err := s.GetRelatedCards(userID, embeddings[0])
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	scores, err := llms.RerankResults(s.Server.LLMClient.Client, searchTerm, relatedCards)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	for i, score := range scores {
		if i == len(scores)-1 {
			break
		}
		relatedCards[i].Ranking = score
	}
	sort.Slice(relatedCards, func(i, j int) bool {
		return relatedCards[i].Ranking > relatedCards[j].Ranking
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(relatedCards)
}

func (s *Handler) GetRelatedCardsRoute(w http.ResponseWriter, r *http.Request) {
	log.Printf("?")
	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		log.Printf("error %v", err)
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	originalCard, err := s.QueryFullCard(userID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	var embedding pgvector.Vector
	query := "SELECT avg(embedding) FROM card_embeddings WHERE card_pk = $1"
	err = s.DB.QueryRow(query, originalCard.ID).Scan(&embedding)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	relatedChunks, err := s.GetRelatedCards(userID, embedding)

	var results []models.CardChunk

	for _, chunk := range relatedChunks {
		if !s.checkChunkLinkedOrRelated(userID, originalCard, chunk) {
			results = append(results, chunk)
		}
		if len(results) >= 10 {
			break
		}
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}
