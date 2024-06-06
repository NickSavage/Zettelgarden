package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"regexp"
	"sort"
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
	cards := []models.PartialCard{}

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

func getBacklinks(cardID string) ([]models.PartialCard, error) {

	query := `
	SELECT 
	cards.id, backlinks.source_id, cards.user_id, cards.title, cards.created_at, cards.updated_at
	FROM backlinks 
	JOIN cards ON backlinks.source_id = cards.card_id 
	WHERE target_id = $1`

	rows, err := s.db.Query(query, cardID)
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

func getReferences(userID int, card models.Card) ([]models.PartialCard, error) {
	directLinks := getDirectlinks(userID, card)
	backlinks, _ := getBacklinks(card.CardID)
	links := append(directLinks, backlinks...)
	if len(links) == 0 {
		return []models.PartialCard{}, nil
	}
	sort.Slice(links, func(x, y int) bool {
		return links[x].CardID > links[y].CardID
	})
	return links, nil
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

	references, err := getReferences(userID, card)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.References = references

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)
}

func (s *Server) getCards(w http.ResponseWriter, r *http.Request) {

	var cards []models.Card
	var partialCards []models.PartialCard
	var err error

	userID := r.Context().Value("current_user").(int)
	searchTerm := r.URL.Query().Get("search_term")
	partial := r.URL.Query().Get("partial")
	sortMethod := r.URL.Query().Get("sort_method")
	inactive := r.URL.Query().Get("inactive")

	if sortMethod == "" {
		sortMethod = "date"
	}

	if inactive == "true" {
		partialCards, err = s.QueryInactiveCards(userID)
		if err != nil {
			log.Printf("err %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(partialCards)
		return
	}
	if partial == "true" {
		partialCards, err = s.QueryPartialCards(userID, searchTerm)
		if err != nil {
			log.Printf("err %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		if sortMethod == "id" {
			sort.Slice(partialCards, func(x, y int) bool {
				return partialCards[x].CardID > partialCards[y].CardID
			})
		} else if sortMethod == "date" {
			sort.Slice(partialCards, func(x, y int) bool {
				return partialCards[y].CreatedAt.Before(partialCards[x].CreatedAt)
			})
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(partialCards)
		return
	} else {
		cards, err = s.QueryFullCards(userID, searchTerm)
		if err != nil {
			log.Printf("err %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		if sortMethod == "id" {
			sort.Slice(cards, func(x, y int) bool {
				return cards[x].ID > cards[y].ID
			})
		} else if sortMethod == "date" {
			sort.Slice(cards, func(x, y int) bool {
				return cards[y].CreatedAt.Before(cards[x].CreatedAt)
			})
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cards)
		return
	}

}

func (s *Server) updateCard(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}
	_, err = s.QueryFullCard(userID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	var params models.EditCardParams

	decoder := json.NewDecoder(r.Body)
	err = decoder.Decode(&params)
	if err != nil {
		log.Printf("err? %v", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	card, err := s.UpdateCard(userID, id, params)
	if err != nil {
		log.Printf("?")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)
}

func (s *Server) QueryPartialCard(userID int, cardID string) (models.PartialCard, error) {
	var card models.PartialCard

	err := s.db.QueryRow(`
	SELECT
	id, card_id, user_id, title, created_at, updated_at 
	FROM cards 
	WHERE is_deleted = FALSE AND card_id = $1 AND user_id = $2
	`, cardID, userID).Scan(
		&card.ID,
		&card.CardID,
		&card.UserID,
		&card.Title,
		&card.CreatedAt,
		&card.UpdatedAt,
	)
	if err != nil {
		log.Printf("err %v", err)
		return models.PartialCard{}, fmt.Errorf("something went wrong")
	}
	return card, nil

}

func (s *Server) QueryFullCard(userID int, id int) (models.Card, error) {
	var card models.Card

	err := s.db.QueryRow(`
	SELECT 
	id, card_id, user_id, title, body, link, created_at, updated_at 
	FROM 
	cards
	WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
	`, id, userID).Scan(
		&card.ID,
		&card.CardID,
		&card.UserID,
		&card.Title,
		&card.Body,
		&card.Link,
		&card.CreatedAt,
		&card.UpdatedAt,
	)
	if err != nil {
		return models.Card{}, fmt.Errorf("unable to access card")
	}

	s.logCardView(id, userID)
	return card, nil

}

func (s *Server) QueryFullCards(userID int, searchTerm string) ([]models.Card, error) {
	var cards []models.Card
	query := `
    SELECT 
		id, card_id, user_id, title, body, link, created_at, updated_at 
    FROM 
        cards
    WHERE
		user_id = $1`

	// Add condition for searchTerm
	var rows *sql.Rows
	var err error
	if searchTerm != "" {
		query += " AND title ILIKE $2 OR body ILIKE $2 "
		rows, err = s.db.Query(query, userID, "%"+searchTerm+"%")
	} else {
		rows, err = s.db.Query(query, userID)
	}
	if err != nil {
		log.Printf("err %v", err)
		return cards, err
	}

	for rows.Next() {
		var card models.Card
		if err := rows.Scan(
			&card.ID,
			&card.CardID,
			&card.UserID,
			&card.Title,
			&card.Body,
			&card.Link,
			&card.CreatedAt,
			&card.UpdatedAt,
		); err != nil {
			log.Printf("err %v", err)
			return cards, err
		}
		cards = append(cards, card)
	}

	return cards, nil
}

func (s *Server) QueryPartialCards(userID int, searchTerm string) ([]models.PartialCard, error) {
	cards := []models.PartialCard{}
	query := `
    SELECT 
        id, card_id, user_id, title, created_at, updated_at 
    FROM 
        cards
    WHERE
		user_id = $1`

	// Add condition for searchTerm
	var rows *sql.Rows
	var err error
	if searchTerm != "" {
		query += " AND title ILIKE $2 "
		rows, err = s.db.Query(query, userID, "%"+searchTerm+"%")
	} else {
		rows, err = s.db.Query(query, userID)
	}
	if err != nil {
		log.Printf("err %v", err)
		return cards, err
	}

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
		cards = append(cards, card)
	}
	return cards, nil
}

func (s *Server) QueryInactiveCards(userID int) ([]models.PartialCard, error) {

	cards := []models.PartialCard{}
	query := `
	SELECT c.id, c.card_id, c.user_id, c.title, c.created_at, c.updated_at
	FROM cards c
	LEFT JOIN (
		SELECT card_pk, MAX(created_at) AS recent_view
		FROM card_views
		GROUP BY card_pk
	) cv ON c.id = cv.card_pk
	WHERE c.user_id = $1 AND c.is_deleted = FALSE AND
	 c.title != '' AND c.card_id NOT LIKE 'MM%' AND c.card_id NOT LIKE 'READ%'
	ORDER BY cv.recent_view DESC, RANDOM()
	LIMIT 30;
	`

	// Add condition for searchTerm
	var rows *sql.Rows
	var err error

	rows, err = s.db.Query(query, userID)
	if err != nil {
		log.Printf("err %v", err)
		return cards, err
	}

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
		cards = append(cards, card)
	}
	return cards, nil
}

func (s *Server) UpdateCard(userID int, cardPK int, params models.EditCardParams) (models.Card, error) {
	query := `
	UPDATE cards SET title = $1, body = $2, link = $3, updated_at = NOW(), card_id = $4
	WHERE
	id = $5
	`
	_, err := s.db.Exec(query, params.Title, params.Body, params.Link, params.CardID, cardPK)
	if err != nil {
		log.Printf("updatecard err %v", err)
		return models.Card{}, err
	}
	return s.QueryFullCard(userID, cardPK)

}
