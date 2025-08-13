package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
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

func (s *Handler) checkIsCardIDUnique(userID int, cardID string) bool {
	if cardID == "" {
		return true
	}
	var count int
	err := s.DB.QueryRow(`SELECT count(*) FROM cards 
		WHERE user_id = $1 AND card_id = $2 AND is_deleted = FALSE`, userID, cardID).Scan(&count)
	if err != nil {
		log.Printf("err %v", err)
		return false
	}
	if count > 0 {
		return false
	} else {
		return true
	}
}

func extractBacklinks(text string) []string {
	// Match all text within square brackets
	re := regexp.MustCompile(`\[([^\]]+)\]`)

	// Find all matches
	matches := re.FindAllStringSubmatch(text, -1)

	// Extract the first capturing group from each match
	var backlinks []string
	for _, match := range matches {
		if len(match) > 1 {
			// Check if the match is not followed by a parenthesis
			if !isMarkdownLink(text, match[0]) {
				backlinks = append(backlinks, match[1])
			}
		}
	}

	return backlinks
}

// Helper function to check if a match is part of a markdown link
func isMarkdownLink(text, match string) bool {
	// Find the position of the match in the text
	pos := strings.Index(text, match)
	if pos == -1 {
		return false
	}
	// Check if the match is followed by an opening parenthesis
	if pos+len(match) < len(text) && text[pos+len(match)] == '(' {
		return true
	}
	return false
}

func (s *Handler) updateBacklinks(cardPK int, backlinks []string) error {
	tx, _ := s.DB.Begin()
	_, err := tx.Exec("DELETE FROM backlinks WHERE source_id_int = $1", cardPK)
	if err != nil {
		log.Fatal(err.Error())
		tx.Rollback()
		return err
	}
	for _, targetID := range backlinks {
		_, err = tx.Exec(`
	WITH target_id AS (
    SELECT id 
    FROM cards 
    WHERE card_id = $2
)
INSERT INTO backlinks (source_id_int, target_id_int, created_at, updated_at)
SELECT $1, target_id.id, NOW(), NOW()
FROM target_id;	
		`,
			cardPK, targetID,
		)
		if err != nil {
			tx.Rollback()
			return err
		}
	}
	if err := tx.Commit(); err != nil {
		return err
	}

	return nil

}

func (s *Handler) getDirectlinks(userID int, card models.Card) []models.PartialCard {
	backlinks := extractBacklinks(card.Body)
	var directLinks []models.PartialCard

	for _, value := range backlinks {
		log.Printf("value %v", value)
		card, err := s.QueryPartialCard(userID, value)
		if err == nil {
			directLinks = append(directLinks, card)
		}

	}

	return directLinks
}

func (s *Handler) getChildren(userID int, cardID string) ([]models.PartialCard, error) {

	query := `
	SELECT
	id, card_id, user_id, title, parent_id, created_at, updated_at 
	FROM cards 
	WHERE is_deleted = FALSE AND user_id = $1 and (card_id like $2 or card_id like $3)
	`
	rows, err := s.DB.Query(query, userID, cardID+".%", cardID+"/%")
	if err != nil {
		log.Printf("err %v", err)
		return []models.PartialCard{}, err
	}

	cards, err := models.ScanPartialCards(rows)
	if err != nil {
		log.Printf("err %v", err)
		return []models.PartialCard{}, err
	}

	var results []models.PartialCard
	for _, card := range cards {
		log.Printf("card %v", card)
		if card.CardID != cardID {
			results = append(results, card)
		}
	}

	return results, nil
}

func (s *Handler) getBacklinks(userID int, cardID string) ([]models.PartialCard, error) {

	query := `
	SELECT
    cards.id, 
	cards.card_id,
    cards.user_id, 
    cards.title, 
    cards.created_at, 
    cards.updated_at
FROM backlinks
JOIN cards ON backlinks.source_id_int = cards.id
JOIN cards target_card ON backlinks.target_id_int = target_card.id
WHERE target_card.card_id = $1 AND cards.user_id = $2 AND cards.is_deleted = FALSE;`

	rows, err := s.DB.Query(query, cardID, userID)
	if err != nil {
		log.Printf("cardid %v", cardID)
		log.Printf("err %v", err)
	}
	var cards []models.PartialCard

	for rows.Next() {
		card := models.PartialCard{}
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

func Ints(input []int) []int {
	u := make([]int, 0, len(input))
	m := make(map[int]bool)

	for _, val := range input {
		if _, ok := m[val]; !ok {
			m[val] = true
			u = append(u, val)
		}
	}

	return u
}

func getUniqueCards(input []models.PartialCard) []models.PartialCard {
	u := make([]models.PartialCard, 0, len(input))
	m := make(map[string]bool)

	for _, card := range input {
		if _, ok := m[card.CardID]; !ok {
			m[card.CardID] = true
			u = append(u, card)
		}
	}
	return u
}

func (s *Handler) getReferences(userID int, card models.Card) ([]models.PartialCard, error) {
	directLinks := s.getDirectlinks(userID, card)
	backlinks, _ := s.getBacklinks(userID, card.CardID)
	links := append(directLinks, backlinks...)
	if len(links) == 0 {
		return []models.PartialCard{}, nil
	}
	sort.Slice(links, func(x, y int) bool {
		return links[x].CardID > links[y].CardID
	})
	links = getUniqueCards(links)
	return links, nil
}

func getCardById(cards []models.Card, id int) (models.Card, error) {
	for _, card := range cards {
		if card.ID == id {
			return card, nil
		}
	}
	return models.Card{}, fmt.Errorf("unable to find card")

}

func (s *Handler) checkChunkLinkedOrRelated(
	userID int,
	mainCard models.Card,
	relatedCard models.CardChunk,
) bool {
	if relatedCard.ParentID == mainCard.ID {
		return true
	}
	references, err := s.getReferences(userID, mainCard)
	if err != nil {
		return true
	}
	for _, ref := range references {
		if ref.ID == relatedCard.ID {
			return true
		}
	}
	return false
}

func (s *Handler) GetCardRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		log.Printf("error %v", err)
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	card, err := s.QueryFullCard(userID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	// Check if the card is pinned by the current user
	isPinned, err := s.IsCardPinned(userID, id)
	if err != nil {
		log.Printf("Error checking if card is pinned: %v", err)
		// Continue even if we can't determine pin status
	} else {
		card.IsPinned = isPinned
	}
	parent, err := s.QueryPartialCardByID(userID, card.ParentID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.Parent = parent
	//card.DirectLinks = getDirectlinks(userID, card)
	files, err := s.getFilesFromCardPK(userID, card.ID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.Files = files

	children, err := s.getChildren(userID, card.CardID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.Children = children

	references, err := s.getReferences(userID, card)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.References = references

	tags, err := s.QueryTagsForCard(userID, card.ID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	card.Tags = tags

	tasks, err := s.QueryTasksByCard(userID, card.ID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.Tasks = tasks

	entities, err := s.QueryEntitiesForCard(userID, card.ID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.Entities = entities

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)
}

func (s *Handler) GetCardsRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	searchTerm := r.URL.Query().Get("search_term")
	partial := r.URL.Query().Get("partial")
	sortMethod := r.URL.Query().Get("sort_method")

	if sortMethod == "" {
		sortMethod = "date"
	}

	searchParams := SearchRequestParams{
		SearchTerm: searchTerm,
	}
	cards, err := s.ClassicCardSearch(userID, searchParams)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Sort the results
	if sortMethod == "id" {
		sort.Slice(cards, func(x, y int) bool {
			return cards[x].ID > cards[y].ID
		})
	} else if sortMethod == "date" {
		sort.Slice(cards, func(x, y int) bool {
			return cards[y].CreatedAt.Before(cards[x].CreatedAt)
		})
	}

	// Convert to partial cards if requested
	if partial == "true" {
		partialCards := make([]models.PartialCard, len(cards))
		for i, card := range cards {
			partialCards[i] = models.PartialCard{
				ID:        card.ID,
				CardID:    card.CardID,
				UserID:    card.UserID,
				Title:     card.Title,
				ParentID:  card.ParentID,
				CreatedAt: card.CreatedAt,
				UpdatedAt: card.UpdatedAt,
			}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(partialCards)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cards)
}

func (s *Handler) UpdateCardRoute(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		log.Printf("asdsa id %v %v", id, err)
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

func (s *Handler) CreateCardRoute(w http.ResponseWriter, r *http.Request) {
	var params models.EditCardParams
	var err error
	userID := r.Context().Value("current_user").(int)

	decoder := json.NewDecoder(r.Body)
	err = decoder.Decode(&params)
	if err != nil {
		log.Printf("err? %v", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	if !s.checkIsCardIDUnique(userID, params.CardID) {
		http.Error(w, "card_id already exists", http.StatusBadRequest)
		return
	}

	card, err := s.CreateCard(userID, params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)
}

func (s *Handler) DeleteCardRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	err = s.DeleteCard(userID, id)
	if err != nil {
		if err.Error() == "card not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		if err.Error() == "card has backlinks, cannot be deleted" || err.Error() == "card has children, cannot be deleted" {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Handler) GetNextRootCardIDRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	nextID := s.getNextRootCardID(userID)

	response := models.NextIDResponse{
		NextID: nextID,
		Error:  false,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Handler) getNextRootCardID(userID int) string {
	var result string

	// Query to get the highest numeric card_id
	query := `
        SELECT card_id 
        FROM cards 
        WHERE user_id = $1 
        AND is_deleted = FALSE 
        AND card_id ~ '^[0-9]+$'  -- Only match pure numeric card_ids
        ORDER BY CAST(card_id AS INTEGER) DESC
        LIMIT 1
    `

	err := s.DB.QueryRow(query, userID).Scan(&result)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error finding next root card ID: %v", err)
		return "1" // Default to 1 if there's an error
	}

	if result == "" {
		return "1" // If no cards exist, start with 1
	}

	// Convert the highest card_id to int and increment
	highestNumber, err := strconv.Atoi(result)
	if err != nil {
		log.Printf("Error converting card_id to number: %v", err)
		return "1"
	}

	nextNumber := highestNumber + 1
	return strconv.Itoa(nextNumber)
}

func (s *Handler) QueryPartialCardByID(userID, id int) (models.PartialCard, error) {
	var card models.PartialCard

	err := s.DB.QueryRow(`
	SELECT
	id, card_id, user_id, title, parent_id, created_at, updated_at
	FROM cards 
	WHERE is_deleted = FALSE AND id = $1 AND user_id = $2
	`, id, userID).Scan(
		&card.ID,
		&card.CardID,
		&card.UserID,
		&card.Title,
		&card.ParentID,
		&card.CreatedAt,
		&card.UpdatedAt,
	)
	if err != nil {
		log.Printf("query partial by id err %v", err)
		return models.PartialCard{}, fmt.Errorf("something went wrong")
	}
	return card, nil

}

func (s *Handler) QueryPartialCard(userID int, cardID string) (models.PartialCard, error) {
	var card models.PartialCard

	err := s.DB.QueryRow(`
	SELECT
	id, card_id, user_id, title, parent_id, created_at, updated_at
	FROM cards 
	WHERE is_deleted = FALSE AND card_id = $1 AND user_id = $2
	`, cardID, userID).Scan(
		&card.ID,
		&card.CardID,
		&card.UserID,
		&card.Title,
		&card.ParentID,
		&card.CreatedAt,
		&card.UpdatedAt,
	)
	if err != nil {
		log.Printf("query partial err %v", err)
		return models.PartialCard{}, fmt.Errorf("something went wrong")
	}
	return card, nil

}

func (s *Handler) QueryFullCard(userID int, id int) (models.Card, error) {
	var card models.Card

	err := s.DB.QueryRow(`
	SELECT 
	id, card_id, user_id, title, body, link, parent_id,
        created_at, updated_at
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
		&card.ParentID,
		&card.CreatedAt,
		&card.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.Card{}, fmt.Errorf("card not found")
		}
		log.Printf("query error: %v", err)
		return models.Card{}, fmt.Errorf("unable to access card")
	}

	s.logCardView(id, userID)
	return card, nil
}

func (s *Handler) UpdateCard(userID int, cardPK int, params models.EditCardParams) (models.Card, error) {
	// Get the old state first
	oldCard, err := s.QueryFullCard(userID, cardPK)
	if err != nil {
		return models.Card{}, err
	}

	var parent_id int
	parent, _ := s.QueryPartialCard(userID, getParentIdAlternating(params.CardID))

	// set parent id to id if there's no parent
	if parent.ID == 0 || params.CardID == "" {
		parent_id = cardPK
	} else {
		parent_id = parent.ID
	}

	query := `
	UPDATE cards SET title = $1, body = $2, link = $3, parent_id = $4, updated_at = NOW(), card_id = $5
	WHERE
	id = $6
	`
	_, err = s.DB.Exec(query, params.Title, params.Body, params.Link, parent_id, params.CardID, cardPK)
	if err != nil {
		log.Printf("updatecard err %v", err)
		return models.Card{}, err
	}

	// Get the new state
	newCard, err := s.QueryFullCard(userID, cardPK)
	if err != nil {
		return models.Card{}, err
	}

	// Create audit event
	err = s.CreateAuditEvent(userID, cardPK, "card", "update", oldCard, newCard)
	if err != nil {
		log.Printf("Error creating audit event: %v", err)
		// Don't return here, as the update was successful
	}

	backlinks := extractBacklinks(newCard.Body)
	s.updateBacklinks(newCard.ID, backlinks)

	s.ChunkCard(newCard)

	if !s.Server.Testing {
		go func() {
			s.ExtractSaveCardEntities(userID, newCard)
		}()
		go func() {
			s.ChunkEmbedCard(userID, newCard.ID)
		}()
		go func() {
			s.GenerateMemory(uint(userID), newCard.Body)
		}()
	}

	s.AddTagsFromCard(userID, cardPK)
	_, err = s.DB.Exec("UPDATE users SET memory_has_changed = true WHERE id = $1", userID)
	if err != nil {
		log.Printf("failed to update memory_has_changed flag for user %d: %v", userID, err)
	}
	return s.QueryFullCard(userID, cardPK)
}

func (s *Handler) CreateCard(userID int, params models.EditCardParams) (models.Card, error) {
	// Strip all whitespace from card_id before proceeding
	params.CardID = strings.ReplaceAll(params.CardID, " ", "")
	params.CardID = regexp.MustCompile(`\s+`).ReplaceAllString(params.CardID, "")

	parent, err := s.QueryPartialCard(userID, getParentIdAlternating(params.CardID))
	query := `
	INSERT INTO cards 
	(title, body, link, user_id, card_id, parent_id, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
	RETURNING id;
	`
	var id int
	err = s.DB.QueryRow(query, params.Title, params.Body, params.Link, userID, params.CardID, parent.ID).Scan(&id)
	if err != nil {
		log.Printf("updatecard err %v", err)
		return models.Card{}, err
	}

	// Get the created card
	newCard, err := s.QueryFullCard(userID, id)
	if err != nil {
		return models.Card{}, err
	}

	// Create audit event for creation
	err = s.CreateAuditEvent(userID, id, "card", "create", nil, newCard)
	if err != nil {
		log.Printf("Error creating audit event: %v", err)
		// Don't return here, as the creation was successful
	}

	// set parent id to id if there's no parent
	if parent.ID == 0 || params.CardID == "" {
		_, err = s.DB.Exec("UPDATE cards SET parent_id = $1 WHERE id = $1", id)
		if err != nil {
			return models.Card{}, err
		}
	}

	backlinks := extractBacklinks(newCard.Body)
	s.updateBacklinks(newCard.ID, backlinks)
	s.ChunkCard(newCard)

	if !s.Server.Testing {
		go func() {
			s.ExtractSaveCardEntities(userID, newCard)
		}()
		go func() {
			s.ChunkEmbedCard(userID, newCard.ID)
		}()
		go func() {
			s.GenerateMemory(uint(userID), newCard.Body)
		}()
	}
	s.AddTagsFromCard(userID, id)
	_, err = s.DB.Exec("UPDATE users SET memory_has_changed = true WHERE id = $1", userID)
	if err != nil {
		log.Printf("failed to update memory_has_changed flag for user %d: %v", userID, err)
	}
	return s.QueryFullCard(userID, id)
}

func (s *Handler) ChunkEmbedCard(userID, cardPK int) error {
	chunks, err := s.GetCardChunks(userID, cardPK)
	if err != nil {
		log.Printf("error in chunking %v", err)
		return err
	}

	log.Printf("process chunks for card %v user %v", cardPK, userID)
	llms.ProcessEmbeddings(s.DB, userID, cardPK, chunks)
	return nil
}

func (s *Handler) ChunkCard(card models.Card) error {
	db := s.DB

	tx, err := db.Begin()
	textToChunk := "Title: " + card.Title + " - " + card.Body
	chunks := llms.GenerateChunks(textToChunk)
	query := `DELETE FROM card_chunks WHERE card_pk = $1 AND user_id = $2`
	_, err = tx.Exec(query, card.ID, card.UserID)
	if err != nil {
		log.Printf("error %v", err)
		tx.Rollback()
		return fmt.Errorf("error updating card %d: %w", card.ID, err)
	}
	query = `INSERT INTO card_chunks (card_pk, user_id, chunk_text, chunk_id) VALUES ($1, $2, $3, $4)`
	for i, chunk := range chunks {
		_, err = tx.Exec(query, card.ID, card.UserID, chunk, i)
		if err != nil {
			log.Printf("error %v", err)

			tx.Rollback()
			return fmt.Errorf("error updating card %d: %w", card.ID, err)
		}
	}

	tx.Commit()
	return nil

}
func (s *Handler) GetCardChunks(userID, cardPK int) ([]models.CardChunk, error) {
	query := `SELECT
 id, card_pk, user_id, chunk_text
FROM card_chunks
WHERE card_pk = $1 AND user_id = $2
`
	rows, err := s.DB.Query(query, cardPK, userID)
	if err != nil {
		log.Printf("err %v", err)
		return []models.CardChunk{}, err
	}

	var chunks []models.CardChunk

	for rows.Next() {
		var chunk models.CardChunk
		if err := rows.Scan(
			&chunk.ID,
			&chunk.ID,
			&chunk.UserID,
			&chunk.Chunk,
		); err != nil {
			log.Printf("err %v", err)
			return chunks, err
		}
		chunks = append(chunks, chunk)

	}
	if err != nil {
		log.Printf("err %v", err)
		return []models.CardChunk{}, err
	}

	return chunks, nil

}

func (s *Handler) GetPartialCardsFromChunks(userID int, cardPKs []int) ([]models.PartialCard, error) {

	cards := []models.PartialCard{}
	for _, cardPK := range cardPKs {
		card, _ := s.QueryPartialCardByID(userID, cardPK)
		cards = append(cards, card)
	}
	return cards, nil
}

func (s *Handler) DeleteCard(userID int, id int) error {
	// Get the card before deletion for audit
	card, err := s.QueryFullCard(userID, id)
	if err != nil {
		return err
	}

	backlinks, _ := s.getBacklinks(userID, card.CardID)
	if len(backlinks) > 0 {
		return fmt.Errorf("card has backlinks, cannot be deleted")
	}
	children, _ := s.getChildren(userID, card.CardID)
	if len(children) > 0 {
		return fmt.Errorf("card has children, cannot be deleted")
	}

	_, err = s.DB.Exec(`
	UPDATE cards SET is_deleted = TRUE, updated_at = NOW()
	WHERE
	id = $1 AND user_id = $2
	`, id, userID)

	if err != nil {
		return err
	}

	// Create audit event for deletion
	err = s.CreateAuditEvent(userID, id, "card", "delete", card, nil)
	if err != nil {
		log.Printf("Error creating audit event: %v", err)
		// Don't return here as deletion was successful
	}

	return nil
}

func (s *Handler) GetCardAuditEventsRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	cardID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid card ID", http.StatusBadRequest)
		return
	}

	// Verify the user owns this card
	_, err = s.QueryFullCard(userID, cardID)
	if err != nil {
		http.Error(w, "Card not found", http.StatusNotFound)
		return
	}

	events, err := s.GetAuditEvents("card", cardID)
	if err != nil {
		log.Printf("Error getting audit events: %v", err)
		http.Error(w, "Error retrieving audit events", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}
