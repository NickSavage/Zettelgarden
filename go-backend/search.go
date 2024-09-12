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
func BuildPartialCardSqlSearchTermString(searchString string, fullText bool) string {
	searchParams := ParseSearchText(searchString)

	var result string
	var termConditions []string
	var tagConditions []string

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

	// Add conditions for tags
	for _, tag := range searchParams.Tags {
		tagCondition := fmt.Sprintf(`EXISTS (
            SELECT 1 FROM card_tags
            JOIN tags ON card_tags.tag_id = tags.id
            WHERE card_tags.card_pk = cards.id AND tags.name = '%s' AND tags.is_deleted = FALSE
        )`, tag)
		tagConditions = append(tagConditions, tagCondition)
	}

	if len(tagConditions) > 0 {
		// If tags are present, ensure that one or more tag conditions are met
		result = " AND (" + strings.Join(tagConditions, " AND ") + ")"
	}

	if len(termConditions) > 0 {
		// Add term conditions if they exist
		if result != "" {
			// Combine with term conditions using an AND clause
			result += " AND (" + strings.Join(termConditions, " OR ") + ")"
		} else {
			// If no tag conditions, start with term conditions
			result = " AND (" + strings.Join(termConditions, " OR ") + ")"
		}
	}
	log.Printf("result %v", result)

	return result
}
