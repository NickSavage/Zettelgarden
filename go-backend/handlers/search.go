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
	"time"

	"github.com/gorilla/mux"
	"github.com/pgvector/pgvector-go"
)

type SearchParams struct {
	Tags           []string
	Terms          []string
	NegateTags     []string
	NegateTerms    []string
	Entities       []string
	NegateEntities []string
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
	var currentEntity strings.Builder
	inEntity := false

	// Split the input string by spaces, but preserve spaces within @[...]
	parts := strings.Fields(input)

	for i := 0; i < len(parts); i++ {
		part := parts[i]

		// Handle entity start
		if strings.HasPrefix(part, "@[") {
			inEntity = true
			// Remove @[ prefix
			currentEntity.WriteString(strings.TrimPrefix(part, "@["))

			// If the entity name ends in this part
			if strings.HasSuffix(part, "]") {
				entityName := currentEntity.String()
				entityName = strings.TrimSuffix(entityName, "]")
				searchParams.Entities = append(searchParams.Entities, entityName)
				currentEntity.Reset()
				inEntity = false
				continue
			}
			continue
		}

		// Handle entity start with negation
		if strings.HasPrefix(part, "!@[") {
			inEntity = true
			// Remove !@[ prefix
			currentEntity.WriteString(strings.TrimPrefix(part, "!@["))

			// If the entity name ends in this part
			if strings.HasSuffix(part, "]") {
				entityName := currentEntity.String()
				entityName = strings.TrimSuffix(entityName, "]")
				searchParams.NegateEntities = append(searchParams.NegateEntities, entityName)
				currentEntity.Reset()
				inEntity = false
				continue
			}
			continue
		}

		// Handle middle or end of entity name
		if inEntity {
			if strings.HasSuffix(part, "]") {
				currentEntity.WriteString(" ")
				currentEntity.WriteString(strings.TrimSuffix(part, "]"))
				entityName := currentEntity.String()
				if strings.HasPrefix(parts[i-1], "!") {
					searchParams.NegateEntities = append(searchParams.NegateEntities, entityName)
				} else {
					searchParams.Entities = append(searchParams.Entities, entityName)
				}
				currentEntity.Reset()
				inEntity = false
				continue
			}
			currentEntity.WriteString(" ")
			currentEntity.WriteString(part)
			continue
		}

		// Handle existing conditions
		if strings.HasPrefix(part, "#") {
			searchParams.Tags = append(searchParams.Tags, strings.TrimPrefix(part, "#"))
		} else if strings.HasPrefix(part, "!#") {
			searchParams.NegateTags = append(searchParams.NegateTags, strings.TrimPrefix(part, "!#"))
		} else if strings.HasPrefix(part, "!") {
			searchParams.NegateTerms = append(searchParams.NegateTerms, strings.TrimPrefix(part, "!"))
		} else {
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
	var entityConditions []string
	var negateEntityConditions []string

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

	log.Printf("searchParams %v", searchParams.Entities)
	// Add conditions for entities
	for _, entity := range searchParams.Entities {
		entityCondition := fmt.Sprintf(`EXISTS (
            SELECT 1 FROM entity_card_junction ecj
            JOIN entities e ON ecj.entity_id = e.id
            WHERE ecj.card_pk = cards.id AND e.name = '%s'
        )`, entity)
		entityConditions = append(entityConditions, entityCondition)
	}

	// Add conditions for negated entities
	for _, entity := range searchParams.NegateEntities {
		entityCondition := fmt.Sprintf(`NOT EXISTS (
            SELECT 1 FROM entity_card_junction ecj
            JOIN entities e ON ecj.entity_id = e.id
            WHERE ecj.card_pk = cards.id AND e.name = '%s'
        )`, entity)
		negateEntityConditions = append(negateEntityConditions, entityCondition)
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
	if len(entityConditions) > 0 {
		result += " AND (" + strings.Join(entityConditions, " AND ") + ")"
	}
	if len(negateEntityConditions) > 0 {
		result += " AND (" + strings.Join(negateEntityConditions, " AND ") + ")"
	}
	return result
}

func (s *Handler) GetRelatedChunksFromEntity(userID int, embedding pgvector.Vector) ([]models.CardChunk, error) {

	query := `
SELECT
    c.id,
    c.card_id,
    c.user_id,
    c.title,
    c.body,
    c.created_at,
    c.updated_at,
    c.parent_id
FROM
    entities e
    INNER JOIN entity_card_junction ecj ON e.id = ecj.entity_id
    INNER JOIN cards c ON ecj.card_pk = c.id
WHERE
    e.user_id = $1
    AND c.is_deleted = FALSE
GROUP BY
    c.id,
    c.card_id,
    c.user_id,
    c.title,
    c.created_at,
    c.updated_at,
    c.parent_id
ORDER BY
    AVG(e.embedding <=> $2)
LIMIT 50;
`
	var rows *sql.Rows
	var err error
	rows, err = s.DB.Query(query, userID, embedding)
	if err != nil {
		log.Printf("err related chunks %v", err)
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

func (s *Handler) GetRelatedCards(userID int, embedding pgvector.Vector) ([]models.CardChunk, error) {
	// Combine results from both semantic and entity-based searches
	query := `
	WITH semantic_scores AS (
		SELECT 
			c.id,
			c.card_id,
			c.user_id,
			c.title,
			cc.chunk_text as chunk,
			c.created_at,
			c.updated_at,
			c.parent_id,
			AVG(ce.embedding <=> $2) as semantic_score
		FROM 
			card_embeddings ce
			INNER JOIN cards c ON ce.card_pk = c.id
			INNER JOIN card_chunks cc ON ce.card_pk = cc.card_pk AND ce.chunk = cc.chunk_id
		WHERE 
			ce.user_id = $1 
			AND c.is_deleted = FALSE
		GROUP BY 
			c.id, c.card_id, c.user_id, c.title, cc.chunk_text, c.created_at, c.updated_at, c.parent_id
	),
	entity_scores AS (
		SELECT 
			c.id,
			COUNT(DISTINCT e.id) as shared_entities,
			AVG(e.embedding <=> $2) as entity_similarity
		FROM 
			cards c
			INNER JOIN entity_card_junction ecj ON c.id = ecj.card_pk
			INNER JOIN entities e ON ecj.entity_id = e.id
		WHERE 
			c.user_id = $1 
			AND c.is_deleted = FALSE
		GROUP BY 
			c.id
	)
	SELECT 
		s.*,
		COALESCE(es.shared_entities, 0) as shared_entities,
		COALESCE(es.entity_similarity, 1) as entity_similarity,
		(
			0.4 * (1 - LEAST(s.semantic_score, 1)) + 
			0.4 * (1 - LEAST(COALESCE(es.entity_similarity, 1), 1)) +
			0.2 * (LEAST(COALESCE(es.shared_entities, 0) / 5.0, 1))
		) as combined_score
	FROM 
		semantic_scores s
		LEFT JOIN entity_scores es ON s.id = es.id
	ORDER BY 
		combined_score DESC
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
}

func (s *Handler) SemanticSearchCardsRoute(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	userID := r.Context().Value("current_user").(int)
	searchTerm := r.URL.Query().Get("search_term")

	chunk := models.CardChunk{
		Chunk: searchTerm,
	}

	embeddings, err := llms.GenerateChunkEmbeddings(chunk, true)
	elapsed := time.Since(start)
	start = time.Now()
	fmt.Printf("embedding took %.2f seconds\n", elapsed.Seconds())

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
	elapsed = time.Since(start)
	fmt.Printf("related cards took %.2f seconds\n", elapsed.Seconds())

	start = time.Now()

	scores, err := llms.RerankResults(s.Server.LLMClient, searchTerm, relatedCards)
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
	elapsed = time.Since(start)
	fmt.Printf("reranking cards took %.2f seconds\n", elapsed.Seconds())

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
