package main

import (
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
