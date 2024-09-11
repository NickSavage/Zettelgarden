package main

import (
	"fmt"
	"go-backend/models"
	"log"
	"strings"
)

type SearchParams struct {
	Tags  []string
	Terms []string
}

func ParseSearchText(input string) SearchParams {
	var searchParams SearchParams

	// Split the input string by spaces
	parts := strings.Fields(input)

	for _, part := range parts {
		if strings.HasPrefix(part, "#") {
			// Remove the "#" and add to tags
			searchParams.Tags = append(searchParams.Tags, strings.TrimPrefix(part, "#"))
		} else {
			// Add to terms
			searchParams.Terms = append(searchParams.Terms, part)
		}
	}

	return searchParams
}

func matchCardTerm(card models.PartialCard, searchParams SearchParams) bool {
	// Check if any term matches CardID or Title
	for _, term := range searchParams.Terms {
		if strings.Contains(strings.ToLower(card.CardID), strings.ToLower(term)) ||
			strings.Contains(strings.ToLower(card.Title), strings.ToLower(term)) {
			return true
		}
	}
	return false

}

func matchCardTags(card models.PartialCard, searchParams SearchParams) bool {

	// Check if any tag matches
	for _, tag := range card.Tags {
		for _, searchTag := range searchParams.Tags {
			if searchTag == tag.Name {
				return true
			}
		}
	}

	return false
}
func SearchThroughPartialCards(cards []models.PartialCard, searchString string) []models.PartialCard {
	searchParams := ParseSearchText(searchString)
	var results []models.PartialCard
	for _, card := range cards {
		if matchCardTerm(card, searchParams) {
			results = append(results, card)
			continue
		}
		tags, err := s.QueryTagsForCard(card.UserID, card.ID)
		if err == nil {
			card.Tags = tags
			log.Printf("card tags %v", tags)
		}
		if matchCardTags(card, searchParams) {
			results = append(results, card)
			continue
		}
	}
	return results
}

func BuildPartialCardSqlSearchTermString(searchString string) string {
	searchParams := ParseSearchText(searchString)

	var conditions []string

	// Add conditions for terms that search both card_id and title
	for _, term := range searchParams.Terms {
		// Use ILIKE for case-insensitive pattern matching
		termCondition := fmt.Sprintf("(card_id ILIKE '%%%s%%' OR title ILIKE '%%%s%%')", term, term)
		conditions = append(conditions, termCondition)
	}

	// Add conditions for tags
	for _, tag := range searchParams.Tags {
		tagCondition := fmt.Sprintf(`EXISTS (
            SELECT 1 FROM card_tags
            JOIN tags ON card_tags.tag_id = tags.id
            WHERE card_tags.card_pk = cards.id AND tags.name ILIKE '%%%s%%' AND tags.is_deleted = FALSE
        )`, tag)
		conditions = append(conditions, tagCondition)
	}

	// Join all conditions with OR
	if len(conditions) > 0 {
		return " AND (" + strings.Join(conditions, " OR ") + ")"
	}

	return ""

}
