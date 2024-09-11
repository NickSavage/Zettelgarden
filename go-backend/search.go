package main

import (
	"fmt"
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
		result := " OR (" + strings.Join(conditions, " OR ") + ")"
		log.Printf("query %v", result)
		return result
	}

	return ""

}
