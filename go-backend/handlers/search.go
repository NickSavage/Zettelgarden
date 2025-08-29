package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/pgvector/pgvector-go"
	"github.com/typesense/typesense-go/typesense/api"
)

type SearchParams struct {
	Tags           []string
	Terms          []string
	NegateTags     []string
	NegateTerms    []string
	Entities       []string
	NegateEntities []string
}

func (s *Handler) InitSearchCollection() {
	collectionName := os.Getenv("TYPESENSE_COLLECTION")

	rows, err := s.DB.Query(`
	SELECT

    c.id,
    c.card_id,
    c.user_id,
    c.title,
	c.body,
    c.created_at,
    c.updated_at,
	c.parent_id
FROM cards c 
	`)
	if err != nil {
		log.Printf("error querying cards: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var createdAtTime, updatedAtTime time.Time
			var cardPK int
			var cardID string
			var userID int
			var parentID int
			var title, body string
			err := rows.Scan(
				&cardPK,
				&cardID,
				&userID,
				&title,
				&body,
				&createdAtTime,
				&updatedAtTime,
				&parentID,
			)
			if err != nil {
				log.Printf("error scanning fact: %v", err)
				continue
			}
			doc := map[string]interface{}{
				"fact_pk":               -1,
				"card_id":               cardID,
				"card_pk":               cardPK,
				"entity_pk":             -1,
				"user_id":               userID,
				"type":                  "card",
				"title":                 title,
				"preview":               body,
				"parent_id":             parentID,
				"created_at":            createdAtTime.Unix(),
				"updated_at":            updatedAtTime.Unix(),
				"linked_card_id":        "",
				"linked_card_pk":        -1,
				"linked_card_title":     "",
				"linked_card_parent_id": -1,
			}

			// Upsert (insert or overwrite if exists)
			_, err = s.Server.TypesenseClient.Collection(collectionName).
				Documents().
				Upsert(context.Background(), doc)

			// if err != nil {
			// 	log.Printf("failed to upsert card ID %d: %v", cardPK, err)
			// } else {
			// 	log.Printf("indexed card ID %d successfully", cardPK)
			// }
		}
	}
	// Index all facts
	rows, err = s.DB.Query(`
		SELECT f.id, f.fact, f.created_at, f.updated_at, f.user_id,
		       c.id, c.card_id, c.user_id, c.title, c.parent_id,
		       c.created_at, c.updated_at
		FROM facts f
		JOIN cards c ON f.card_pk = c.id
	`)
	if err != nil {
		log.Printf("error querying facts: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var factID int
			var factText string
			var createdAtTime, updatedAtTime time.Time
			var cardPK int
			var cardCardID string
			var userID, parentID int
			var cardTitle string
			var cardCreatedAt, cardUpdatedAt time.Time
			err := rows.Scan(
				&factID, &factText, &createdAtTime, &updatedAtTime, &userID,
				&cardPK, &cardCardID, &userID, &cardTitle, &parentID, &cardCreatedAt, &cardUpdatedAt,
			)
			if err != nil {
				log.Printf("error scanning fact: %v", err)
				continue
			}
			doc := map[string]interface{}{
				"fact_pk":               factID,
				"card_id":               "",
				"card_pk":               -1,
				"entity_pk":             -1,
				"user_id":               userID,
				"type":                  "fact",
				"title":                 factText,
				"preview":               cardTitle,
				"score":                 0.0,
				"parent_id":             -1,
				"created_at":            createdAtTime.Unix(),
				"updated_at":            updatedAtTime.Unix(),
				"linked_card_id":        cardCardID,
				"linked_card_pk":        cardPK,
				"linked_card_title":     cardTitle,
				"linked_card_parent_id": parentID,
			}
			_, err = s.Server.TypesenseClient.Collection(collectionName).Documents().Upsert(context.Background(), doc)
			// if err != nil {
			// 	log.Printf("failed to upsert fact ID %d: %v", factID, err)
			// } else {
			// 	log.Printf("indexed fact ID %d successfully", factID)
			// }
		}
	}

	// // Index all entities
	rows2, err := s.DB.Query(`
		SELECT e.id, e.name, e.description, e.type, e.created_at, e.updated_at, e.user_id,
		c.id, c.card_id, c.title, c.parent_id
		FROM entities e
		LEFT JOIN cards c ON e.card_pk = c.id
	`) // assuming user_id=1 here
	if err != nil {
		log.Printf("error querying entities: %v", err)
	} else {
		defer rows2.Close()
		for rows2.Next() {
			var entityID int
			var name, description, etype string
			var createdAtTime, updatedAtTime time.Time
			var userID int
			var parentID int
			var cardPK sql.NullInt64
			var cardCardID, cardTitle sql.NullString
			var cardParentID sql.NullInt64

			err := rows2.Scan(
				&entityID, &name, &description, &etype, &createdAtTime,
				&updatedAtTime, &userID, &cardPK, &cardCardID, &cardTitle, &cardParentID,
			)
			if err != nil {
				log.Printf("error scanning entity: %v", err)
				continue
			}
			doc := map[string]interface{}{
				"entity_pk":             entityID,
				"card_id":               "",
				"card_pk":               -1,
				"fact_pk":               -1,
				"type":                  "entity",
				"user_id":               userID,
				"title":                 name,
				"parent_id":             -1,
				"preview":               description,
				"score":                 0.0,
				"created_at":            createdAtTime.Unix(),
				"updated_at":            updatedAtTime.Unix(),
				"linked_card_id":        cardCardID,
				"linked_card_pk":        cardPK,
				"linked_card_title":     cardTitle,
				"linked_card_parent_id": parentID,
			}
			_, err = s.Server.TypesenseClient.Collection(collectionName).Documents().Upsert(context.Background(), doc)
			// if err != nil {
			// 	log.Printf("failed to upsert entity ID %d: %v", entityID, err)
			// } else {
			// 	log.Printf("indexed entity ID %d successfully", entityID)
			// }
		}
	}
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
            WHERE card_tags.card_pk = c.id AND tags.name = '%s' AND tags.is_deleted = FALSE
        )`, tag)
		tagConditions = append(tagConditions, tagCondition)
	}
	// Build SQL for tags that should NOT exist
	for _, tag := range searchParams.NegateTags {
		tagCondition := fmt.Sprintf(`NOT EXISTS (
            SELECT 1 FROM card_tags
            JOIN tags ON card_tags.tag_id = tags.id
            WHERE card_tags.card_pk = c.id AND tags.name = '%s' AND tags.is_deleted = FALSE
        )`, tag)
		negateTagsConditions = append(negateTagsConditions, tagCondition)
	}

	// Add conditions for entities
	for _, entity := range searchParams.Entities {
		entityCondition := fmt.Sprintf(`EXISTS (
            SELECT 1 FROM entity_card_junction ecj
            JOIN entities e ON ecj.entity_id = e.id
            WHERE ecj.card_pk = c.id AND e.name = '%s'
        )`, entity)
		entityConditions = append(entityConditions, entityCondition)
	}

	// Add conditions for negated entities
	for _, entity := range searchParams.NegateEntities {
		entityCondition := fmt.Sprintf(`NOT EXISTS (
            SELECT 1 FROM entity_card_junction ecj
            JOIN entities e ON ecj.entity_id = e.id
            WHERE ecj.card_pk = c.id AND e.name = '%s'
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

func BuildPartialEntitySqlSearchTermString(searchString string) string {
	searchParams := ParseSearchText(searchString)

	var result string
	var termConditions []string
	var tagConditions []string
	var negateTagsConditions []string
	var excludeTerms []string

	// Add conditions for terms that search both name and description
	for _, term := range searchParams.Terms {
		termCondition := fmt.Sprintf("(name ILIKE '%%%s%%' OR description ILIKE '%%%s%%' OR type ILIKE '%%%s%%')", term, term, term)
		termConditions = append(termConditions, termCondition)
	}

	// Add conditions for negated terms
	for _, term := range searchParams.NegateTerms {
		excludeCondition := fmt.Sprintf("NOT (name ILIKE '%%%s%%' OR description ILIKE '%%%s%%' OR type ILIKE '%%%s%%')", term, term, term)
		excludeTerms = append(excludeTerms, excludeCondition)
	}

	// Add conditions for tags
	for _, tag := range searchParams.Tags {
		tagCondition := fmt.Sprintf("EXISTS (SELECT 1 FROM card_tags JOIN tags ON card_tags.tag_id = tags.id WHERE card_tags.card_pk = ecj.card_pk AND tags.name = '%s' AND tags.is_deleted = FALSE)", tag)
		tagConditions = append(tagConditions, tagCondition)
	}

	// Build SQL for tags that should NOT exist
	for _, tag := range searchParams.NegateTags {
		tagCondition := fmt.Sprintf("NOT EXISTS (SELECT 1 FROM card_tags JOIN tags ON card_tags.tag_id = tags.id WHERE card_tags.card_pk = ecj.card_pk AND tags.name = '%s' AND tags.is_deleted = FALSE)", tag)
		negateTagsConditions = append(negateTagsConditions, tagCondition)
	}

	// Add each tag condition separately
	for _, tagCondition := range tagConditions {
		result += fmt.Sprintf(" AND (%s)", tagCondition)
	}

	if len(termConditions) > 0 {
		result += " AND (" + strings.Join(termConditions, " OR ") + ")"
	}

	if len(excludeTerms) > 0 {
		for _, excludeTerm := range excludeTerms {
			result += " AND (" + excludeTerm + ")"
		}
	}

	// Add each negate tag condition separately
	for _, negateTagCondition := range negateTagsConditions {
		result += fmt.Sprintf(" AND (%s)", negateTagCondition)
	}

	return result
}

func (s *Handler) ClassicEntitySearch(userID int, params SearchRequestParams) ([]models.Entity, error) {
	searchString := BuildPartialEntitySqlSearchTermString(params.SearchTerm)

	if params.SearchTerm == "" {
		return nil, nil
	}

	log.Printf("search term params.SearchTerm %v", params.SearchTerm)
	// Generate query embedding for semantic ordering

	var embedding pgvector.Vector
	var err error

	if s.Server.Testing {
		// Use a dummy embedding vector for testing
		dummy := make([]float32, 1024)
		for i := range dummy {
			dummy[i] = 0.0 // all zeros
		}
		embedding = pgvector.NewVector(dummy)
	} else {
		embedding, err = llms.GetEmbedding1024(params.SearchTerm, false)
		if err != nil {
			return nil, err
		}
	}

	query := `
		SELECT 
			e.id, e.user_id, e.name, e.description, e.type, e.created_at, e.updated_at,
			e.card_pk,
			COUNT(ecj.id) as card_count,
			c.id as linked_card_id,
			c.card_id as linked_card_card_id,
			c.title as linked_card_title,
			c.user_id as linked_card_user_id,
			c.parent_id as linked_card_parent_id,
			c.created_at as linked_card_created_at,
			c.updated_at as linked_card_updated_at,
			(1 - (e.embedding_1024 <=> $2)) as score
		FROM entities e
		LEFT JOIN entity_card_junction ecj ON e.id = ecj.entity_id
		LEFT JOIN cards c ON e.card_pk = c.id AND c.is_deleted = FALSE
		WHERE e.user_id = $1` + searchString + `
		GROUP BY e.id, e.user_id, e.name, e.description, e.type, e.created_at, e.updated_at, e.card_pk,
				c.id, c.card_id, c.title, c.user_id, c.parent_id, c.created_at, c.updated_at, score
		HAVING (1 - (e.embedding_1024 <=> $2)) > 0.7
		ORDER BY score DESC
		LIMIT 500`

	rows, err := s.DB.Query(query, userID, embedding)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entities []models.Entity
	for rows.Next() {
		var entity models.Entity
		var cardID sql.NullInt64
		var cardCardID, cardTitle sql.NullString
		var cardUserID, cardParentID sql.NullInt64
		var cardCreatedAt, cardUpdatedAt sql.NullTime

		var score float64
		err := rows.Scan(
			&entity.ID,
			&entity.UserID,
			&entity.Name,
			&entity.Description,
			&entity.Type,
			&entity.CreatedAt,
			&entity.UpdatedAt,
			&entity.CardPK,
			&entity.CardCount,
			&cardID,
			&cardCardID,
			&cardTitle,
			&cardUserID,
			&cardParentID,
			&cardCreatedAt,
			&cardUpdatedAt,
			&score,
		)
		if err != nil {
			return nil, err
		}

		// Set the linked card if it exists
		if cardID.Valid {
			entity.Card = &models.PartialCard{
				ID:        int(cardID.Int64),
				CardID:    cardCardID.String,
				Title:     cardTitle.String,
				UserID:    int(cardUserID.Int64),
				ParentID:  int(cardParentID.Int64),
				CreatedAt: cardCreatedAt.Time,
				UpdatedAt: cardUpdatedAt.Time,
			}
		}

		entities = append(entities, entity)
	}

	return entities, nil
}

func (s *Handler) ClassicCardSearch(userID int, params SearchRequestParams) ([]models.Card, error) {
	searchString := BuildPartialCardSqlSearchTermString(params.SearchTerm, params.FullText)
	query := `
	SELECT
    c.id,
    c.card_id,
    c.user_id,
    c.title,
    c.body,
    c.link,
    c.parent_id,
    c.created_at,
    c.updated_at,
    COUNT(ct.tag_id) AS tag_count
FROM cards c
LEFT JOIN card_tags ct ON c.id = ct.card_pk -- Use LEFT JOIN to include cards with no tags
WHERE c.user_id = $1 AND c.is_deleted = FALSE
` + searchString + `
GROUP BY
    c.id,
    c.card_id,
    c.user_id,
    c.title,
    c.body,
    c.link,
    c.parent_id,
    c.created_at,
    c.updated_at
ORDER BY c.created_at DESC
	`

	rows, err := s.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return models.ScanCards(rows)
}

type SearchRequestParams struct {
	SearchTerm   string `json:"search_term"`
	SearchType   string `json:"type"` // "classic" or "semantic"
	FullText     bool   `json:"full_text"`
	ShowEntities bool   `json:"show_entities"`
	ShowFacts    bool   `json:"show_facts"`
	SortBy       string `json:"sort"`
}

func (s *Handler) TypesenseSearch(searchParams SearchRequestParams, userID int) ([]models.SearchResult, error) {
	perPage := 250
	var sortBy string
	if searchParams.SearchTerm == "" {
		sortBy = "created_at:desc"
	} else {
		switch searchParams.SortBy {
		case "sortByRanking":
			sortBy = "_text_match:desc"
		case "sortCreatedNewOld":
			sortBy = "created_at:desc"
		case "sortCreatedOldNew":
			sortBy = "created_at:asc"
		case "sortNewOld":
			sortBy = "updated_at:desc"
		case "sortOldNew":
			sortBy = "updated_at:asc"
		case "sortBigSmall":
			sortBy = "title:asc"
		case "sortSmallBig":
			sortBy = "title:desc"
		default:
			sortBy = "_text_match:desc"
		}
	}
	filter := "user_id:=" + strconv.Itoa(userID)

	var results []models.SearchResult
	searchTerm := searchParams.SearchTerm
	if searchTerm == "" {
		searchTerm = "*"
	}

	typesenseParams := &api.SearchCollectionParams{
		Q:        searchTerm,
		QueryBy:  "title, embedding",
		FilterBy: &filter,
		SortBy:   &sortBy,
		PerPage:  &perPage,
	}
	log.Printf("%v", typesenseParams)
	collectionName := os.Getenv("TYPESENSE_COLLECTION")
	typesenseResults, err := s.Server.TypesenseClient.Collection(collectionName).Documents().Search(context.Background(), typesenseParams)

	if err != nil {
		log.Printf("Search error: %v", err)
		return results, err
	}

	fmt.Printf("Found %d docs\n", *typesenseResults.Found)
	for i, hit := range *typesenseResults.Hits {
		if hit.Document != nil {
			doc := *hit.Document
			item := models.SearchResult{
				Title:     doc["title"].(string),
				Type:      doc["type"].(string),
				Preview:   doc["preview"].(string),
				Score:     0.0,
				CreatedAt: time.Unix(int64(doc["created_at"].(float64)), 0),
				UpdatedAt: time.Unix(int64(doc["updated_at"].(float64)), 0),
			}
			resultType := doc["type"]
			if resultType == "card" {

				item.ID = strconv.FormatInt(int64(doc["card_pk"].(float64)), 10)
				cardID := doc["card_id"].(string)
				metadata := map[string]interface{}{
					"id":        item.ID,
					"card_id":   cardID,
					"parent_id": "",
				}
				item.Metadata = metadata

			} else if resultType == "entity" {
				item.ID = strconv.FormatInt(int64(doc["entity_pk"].(float64)), 10)
				metadata := map[string]interface{}{
					"id": item.ID,
				}
				item.Metadata = metadata
				// entity_pk

			} else if resultType == "fact" {
				item.ID = strconv.FormatInt(int64(doc["fact_pk"].(float64)), 10)
				metadata := map[string]interface{}{
					"id": item.ID,
				}
				item.Metadata = metadata
				// fact_pk

			}
			log.Printf("item %v", item.ID)
			results = append(results, item)
		} else {
			log.Printf("[%d] unexpected document format: %v", i, hit.Document)
		}
	}
	return results, nil
}

func (s *Handler) ClassicSearch(searchParams SearchRequestParams, userID int) ([]models.SearchResult, error) {

	var searchResults []models.SearchResult

	// Get card results
	cards, err := s.ClassicCardSearch(userID, searchParams)
	if err != nil {
		return nil, err
	}
	log.Printf("cards %v", len(cards))

	// Convert cards to SearchResults
	for _, card := range cards {
		var tags []models.Tag
		if card.TagCount > 0 {
			tags, _ = s.QueryTagsForCard(userID, card.ID)
		}
		searchResults = append(searchResults, models.SearchResult{
			ID:        strconv.Itoa(card.ID),
			Type:      "card",
			Title:     card.Title,
			Preview:   card.Body,
			Score:     1.0, // Classic search doesn't have scoring
			CreatedAt: card.CreatedAt,
			UpdatedAt: card.UpdatedAt,
			Tags:      tags,
			Metadata: map[string]interface{}{
				"id":        card.ID,
				"card_id":   card.CardID,
				"parent_id": card.ParentID,
			},
		})
	}

	//Get entity results
	var entities []models.Entity

	// I want to check if the search term has any entities in it
	// if it does, we don't wan tto populate with more entities
	params := ParseSearchText(searchParams.SearchTerm)
	if len(params.Entities) == 0 && searchParams.ShowEntities {
		entities, err = s.ClassicEntitySearch(userID, searchParams)
		if err != nil {
			return nil, err
		}
	}

	//Convert entities to SearchResults and append them
	for _, entity := range entities {
		metadata := map[string]interface{}{
			"id":         entity.ID,
			"type":       entity.Type,
			"card_count": entity.CardCount,
		}

		// Include linked card information if it exists
		if entity.Card != nil {
			metadata["linked_card"] = map[string]interface{}{
				"id":        entity.Card.ID,
				"card_id":   entity.Card.CardID,
				"title":     entity.Card.Title,
				"parent_id": entity.Card.ParentID,
			}
		}

		searchResults = append(searchResults, models.SearchResult{
			ID:        strconv.Itoa(entity.ID),
			Type:      "entity",
			Title:     entity.Name,
			Preview:   entity.Description,
			Score:     1.0,
			CreatedAt: entity.CreatedAt,
			UpdatedAt: entity.UpdatedAt,
			Metadata:  metadata,
		})
	}

	// Include fact results if requested
	if searchParams.ShowFacts {
		facts, err := s.ClassicFactSearch(userID, searchParams)

		log.Printf("facts %v", len(facts))
		if err != nil {
			return nil, err
		}
		for _, fact := range facts {
			metadata := map[string]interface{}{
				"card": map[string]interface{}{
					"id":        fact.Card.ID,
					"card_id":   fact.Card.CardID,
					"title":     fact.Card.Title,
					"parent_id": fact.Card.ParentID,
				},
			}
			searchResults = append(searchResults, models.SearchResult{
				ID:        strconv.Itoa(fact.ID),
				Type:      "fact",
				Title:     fact.Title,
				Preview:   fact.Preview,
				Score:     fact.Score,
				CreatedAt: fact.CreatedAt.Time,
				UpdatedAt: fact.UpdatedAt.Time,
				Metadata:  metadata,
			})
		}
	}

	var reranked []models.SearchResult
	if s.Server.Testing {
		reranked = searchResults
	} else {
		if len(searchResults) > 0 {
			client := llms.NewDefaultClient(s.DB, userID)
			reranked, err = llms.RerankSearchResults(client, searchParams.SearchTerm, searchResults)
			if err != nil {
				return nil, err
			}
		}
	}
	return reranked, nil
}

// ClassicFactSearch performs embedding-based semantic search on facts
func (s *Handler) ClassicFactSearch(userID int, params SearchRequestParams) ([]struct {
	ID        int
	Fact      string
	Title     string
	Preview   string
	Score     float64
	CreatedAt sql.NullTime
	UpdatedAt sql.NullTime
	Card      models.PartialCard
}, error) {
	var results []struct {
		ID        int
		Fact      string
		Title     string
		Preview   string
		Score     float64
		CreatedAt sql.NullTime
		UpdatedAt sql.NullTime
		Card      models.PartialCard
	}

	if params.SearchTerm == "" {
		return results, nil
	}
	// Generate query embedding
	embedding, err := llms.GetEmbedding1024(params.SearchTerm, false)
	if err != nil {
		return nil, err
	}

	rows, err := s.DB.Query(`
		SELECT f.id, f.fact, f.created_at, f.updated_at,
		       c.id, c.card_id, c.user_id, c.title, c.parent_id, c.created_at, c.updated_at,
		       (1 - (f.embedding_1024 <=> $2)) as score
		FROM facts f
		JOIN cards c ON f.card_pk = c.id
		WHERE f.user_id = $1
		ORDER BY f.embedding_1024 <=> $2
		LIMIT 25
	`, userID, embedding)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var r struct {
			ID        int
			Fact      string
			Title     string
			Preview   string
			Score     float64
			CreatedAt sql.NullTime
			UpdatedAt sql.NullTime
			Card      models.PartialCard
		}
		err := rows.Scan(
			&r.ID,
			&r.Fact,
			&r.CreatedAt,
			&r.UpdatedAt,
			&r.Card.ID,
			&r.Card.CardID,
			&r.Card.UserID,
			&r.Card.Title,
			&r.Card.ParentID,
			&r.Card.CreatedAt,
			&r.Card.UpdatedAt,
			&r.Score,
		)
		if err != nil {
			return nil, err
		}

		r.Title = r.Fact
		r.Preview = r.Fact

		results = append(results, r)
	}

	return results, nil
}

func (s *Handler) SearchRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	var searchParams SearchRequestParams
	err := json.NewDecoder(r.Body).Decode(&searchParams)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var searchResults []models.SearchResult

	if searchParams.SearchType == "typesense" {
		searchResults, err = s.TypesenseSearch(searchParams, userID)
	} else {
		searchResults, err = s.ClassicSearch(searchParams, userID)
	}

	if err != nil {
		log.Printf("search err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(searchResults)
	return
}
