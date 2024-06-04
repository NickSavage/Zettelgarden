package main

import (
	"encoding/json"
	"go-backend/models"
	"log"
	"net/http"
	"regexp"
	"strconv"
)

func getParentIdAlternating(cardID string) string {
	parts := []string{}
	currentPart := ""

	for _, char := range cardID {
		if char == '/' || char == '.' {
			parts = append(parts, currentPart)
			currentPart = ""
		} else {
			currentPart += string(char)
		}
	}

	if currentPart != "" {
		parts = append(parts, currentPart)
	}

	if len(parts) == 1 {
		return cardID
	}

	parentID := ""
	for i := 0; i < len(parts)-1; i++ {
		parentID += parts[i]
		if i < len(parts)-2 {
			if i%2 == 0 {
				parentID += "/"
			} else {
				parentID += "."
			}
		}
	}

	return parentID
}

func extractBacklinks(text string) []string {
	re := regexp.MustCompile(`\[([^\]]+)\]`)

	// Find all matches
	matches := re.FindAllStringSubmatch(text, -1)

	// Extract the first capturing group from each match
	var backlinks []string
	for _, match := range matches {
		if len(match) > 1 {
			backlinks = append(backlinks, match[1])
		}
	}

	return backlinks
}

func getDirectlinks(userID int, card models.Card) []models.PartialCard {
	backlinks := extractBacklinks(card.Body)
	var directLinks []models.PartialCard

	for _, value := range backlinks {
		card, err := s.QueryPartialCard(userID, value)
		if err == nil {
			directLinks = append(directLinks, card)
		}

	}

	return directLinks
}

func getChildren(userID int, cardID string) ([]models.PartialCard, error) {

	query := `
	SELECT
	id, card_id, user_id, title, created_at, updated_at 
	FROM cards 
	WHERE is_deleted = FALSE AND user_id = $1 and (card_id like $2 or card_id like $3)
	`
	rows, err := s.db.Query(query, userID, cardID+".%", cardID+"/%")
	if err != nil {
		log.Printf("err %v", err)
	}
	var cards []models.PartialCard

	for rows.Next() {
		var card models.PartialCard
		if err := rows.Scan(
			&card.ID,
			&card.CardID,
			&card.UserID,
			&card.Title,
			&card.CreatedAt,
			&card.UpdatedAt,
		); err != nil {
			log.Printf("err %v", err)
			return cards, err
		}

		if card.CardID != cardID {
			cards = append(cards, card)
		}
	}
	return cards, nil
}

func (s *Server) getCard(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	card, err := s.QueryFullCard(userID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	parent, err := s.QueryPartialCard(userID, getParentIdAlternating(card.CardID))
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.Parent = parent
	//card.DirectLinks = getDirectlinks(userID, card)
	files, err := getFilesFromCardPK(userID, card.ID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.Files = files

	children, err := getChildren(userID, card.CardID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.Children = children

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)
}
