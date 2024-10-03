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
	log.Printf("count %v", count)
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

func (s *Handler) updateBacklinks(cardPK int, backlinks []string) error {
	tx, _ := s.DB.Begin()
	_, err := tx.Exec("DELETE FROM backlinks WHERE source_id = $1", cardPK)
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
	}
	cards := []models.PartialCard{}

	for rows.Next() {
		var card models.PartialCard
		if err := rows.Scan(
			&card.ID,
			&card.CardID,
			&card.UserID,
			&card.Title,
			&card.ParentID,
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

func (s *Handler) getCardKeywords(userID int, cardPK int) ([]models.Keyword, error) {

	query := "SELECT id, user_id, card_pk, keyword FROM keywords WHERE user_id = $1 AND card_pk = $2"

	rows, err := s.DB.Query(query, userID, cardPK)
	var keywords []models.Keyword
	if err != nil {
		log.Printf("err4 %v", err)
		return keywords, err
	}
	for rows.Next() {
		keyword := models.Keyword{}
		if err := rows.Scan(
			&keyword.ID,
			&keyword.UserID,
			&keyword.CardPK,
			&keyword.Keyword,
		); err != nil {
			log.Printf("err3 %v", err)
			return keywords, err
		}
		keywords = append(keywords, keyword)
	}
	return keywords, nil
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

func (s *Handler) checkCardLinkedOrRelated(
	userID int,
	mainCard models.Card,
	relatedCard models.PartialCard,
) bool {
	if relatedCard.ParentID == mainCard.ID {
		log.Printf("reject card, is child")
		return true
	}
	references, err := s.getReferences(userID, mainCard)
	if err != nil {
		log.Printf("check card linked err %v", err)
		return true
	}
	for _, ref := range references {
		if ref.ID == relatedCard.ID {
			log.Printf("reject card, is a reference")
			return true
		}
	}
	return false
}

func (s *Handler) GetRelatedCards(userID int, originalCard models.Card) ([]models.PartialCard, error) {

	cards := []models.PartialCard{}
	query := `
    SELECT 
        id, card_id, user_id, title, parent_id, created_at, updated_at, is_literature_card
    FROM 
        cards
    WHERE
		user_id = $1 AND is_deleted = FALSE AND id != $2
ORDER BY embedding <=> (SELECT embedding FROM cards WHERE id = $2) LIMIT 50

`

	var rows *sql.Rows
	var err error
	rows, err = s.DB.Query(query, userID, originalCard.ID)
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
			&card.ParentID,
			&card.CreatedAt,
			&card.UpdatedAt,
			&card.IsLiteratureCard,
		); err != nil {
			log.Printf("query partial cards err %v", err)
			return cards, err
		}
		if !s.checkCardLinkedOrRelated(userID, originalCard, card) {
			cards = append(cards, card)
		}
		if len(cards) >= 10 {
			break
		}
	}
	return cards, nil

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

	card, err := s.QueryFullCard(userID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	results, err := s.GetRelatedCards(userID, card)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
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

	keywords, err := s.getCardKeywords(userID, card.ID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	card.Keywords = keywords

	tags, err := s.QueryTagsForCard(userID, card.ID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	card.Tags = tags

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(card)
}

func (s *Handler) GetCardsRoute(w http.ResponseWriter, r *http.Request) {

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
		log.Printf("?")
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
	card, err := s.QueryFullCard(userID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	backlinks, _ := s.getBacklinks(userID, card.CardID)
	if len(backlinks) > 0 {
		http.Error(w, "card has backlinks, cannot be deleted", http.StatusBadRequest)
		return
	}
	children, _ := s.getChildren(userID, card.CardID)
	if len(children) > 0 {
		http.Error(w, "card has children, cannot be deleted", http.StatusBadRequest)
		return
	}

	_, err = s.DB.Exec(`
	UPDATE cards SET is_deleted = TRUE, updated_at = NOW()
	WHERE
	id = $1 AND user_id = $2
	`, id, userID)

	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Handler) getNextIDReference(userID int) string {
	var result string

	query := `
        SELECT card_id FROM cards 
		WHERE card_id LIKE 'REF%' AND is_deleted = FALSE AND user_id = $1

        ORDER BY CAST(SUBSTRING(card_id FROM 'REF(.*)$') AS INTEGER) DESC
        LIMIT 1
	`
	err := s.DB.QueryRow(query, userID).Scan(&result)
	if err != nil && err != sql.ErrNoRows {
		log.Fatal(err)
		return ""
	}

	var newCardID string
	if result != "" {
		re := regexp.MustCompile(`REF(\d+)`)
		matches := re.FindStringSubmatch(result)
		if len(matches) > 1 {
			highestNumber, _ := strconv.Atoi(matches[1])
			nextNumber := highestNumber + 1
			newCardID = fmt.Sprintf("REF%03d", nextNumber)
		}
	} else {
		newCardID = "REF001"
	}
	return newCardID
}

func (s *Handler) getNextIDMeeting(userID int) string {
	var result string
	query := `
        SELECT card_id FROM cards WHERE card_id LIKE 'MM%' AND is_deleted = FALSE
        ORDER BY CAST(SUBSTRING(card_id FROM 'MM(.*)$') AS INTEGER) DESC
        LIMIT 1`

	err := s.DB.QueryRow(query).Scan(&result)
	if err != nil && err != sql.ErrNoRows {
		log.Fatal(err)
	}

	var newCardID string
	if result != "" {
		re := regexp.MustCompile(`MM(\d+)`)
		matches := re.FindStringSubmatch(result)
		if len(matches) > 1 {
			highestNumber, _ := strconv.Atoi(matches[1])
			nextNumber := highestNumber + 1
			newCardID = fmt.Sprintf("MM%03d", nextNumber)
		}
	} else {
		newCardID = "MM001"
	}
	return newCardID
}

func (s *Handler) NextIDRoute(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var response models.NextIDResponse
	var params models.NextIDParams

	userID := r.Context().Value("current_user").(int)

	log.Printf("body %v", r.Body)
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&params)
	if err != nil {
		log.Printf("err? %v", err)
		response.Error = true
		json.NewEncoder(w).Encode(response)
		response.Message = err.Error()
		return
	}

	if params.CardType == "reference" {
		response.NextID = s.getNextIDReference(userID)
		w.WriteHeader(http.StatusOK)
	} else if params.CardType == "meeting" {
		response.NextID = s.getNextIDMeeting(userID)
		w.WriteHeader(http.StatusOK)
	} else {
		response.Error = true
		response.Message = "Unknown or unsupported card type. Supported card types are 'reference' and 'meeting', was provided: " + params.CardType
		w.WriteHeader(http.StatusBadRequest)
	}
	json.NewEncoder(w).Encode(response)

}

func (s *Handler) QueryPartialCardByID(userID, id int) (models.PartialCard, error) {
	var card models.PartialCard

	err := s.DB.QueryRow(`
	SELECT
	id, card_id, user_id, title, parent_id, created_at, updated_at,
        is_literature_card
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
		&card.IsLiteratureCard,
	)
	if err != nil {
		log.Printf("query partial err %v", err)
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
        created_at, updated_at, is_literature_card
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
		&card.IsLiteratureCard,
	)
	if err != nil {
		log.Printf("asdas err %v", err)
		return models.Card{}, fmt.Errorf("unable to access card")
	}

	s.logCardView(id, userID)
	return card, nil

}

func (s *Handler) QueryFullCards(userID int, searchTerm string) ([]models.Card, error) {
	var cards []models.Card
	query := `
    SELECT 
		id, card_id, user_id, title, body, link, parent_id, created_at, updated_at,
                is_literature_card
    FROM 
        cards
    WHERE
		user_id = $1 AND is_deleted = FALSE`

	var rows *sql.Rows
	var err error

	query = query + BuildPartialCardSqlSearchTermString(searchTerm, true)
	rows, err = s.DB.Query(query, userID)
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
			&card.ParentID,
			&card.CreatedAt,
			&card.UpdatedAt,
			&card.IsLiteratureCard,
		); err != nil {
			log.Printf(" query full err %v", err)
			return cards, err
		}
		cards = append(cards, card)
	}

	return cards, nil
}

func (s *Handler) QueryPartialCards(userID int, searchTerm string) ([]models.PartialCard, error) {
	cards := []models.PartialCard{}
	query := `
    SELECT 
        id, card_id, user_id, title, parent_id, created_at, updated_at, is_literature_card
    FROM 
        cards
    WHERE
		user_id = $1 AND is_deleted = FALSE`

	query = query + BuildPartialCardSqlSearchTermString(searchTerm, false)
	var rows *sql.Rows
	var err error
	rows, err = s.DB.Query(query, userID)
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
			&card.ParentID,
			&card.CreatedAt,
			&card.UpdatedAt,
			&card.IsLiteratureCard,
		); err != nil {
			log.Printf("query partial cards err %v", err)
			return cards, err
		}
		cards = append(cards, card)
	}
	return cards, nil
}

func (s *Handler) QueryInactiveCards(userID int) ([]models.PartialCard, error) {

	var count int
	_ = s.DB.QueryRow("SELECT count(*) FROM inactive_cards WHERE user_id = $1", userID).Scan(&count)
	if count == 0 {
		log.Printf("derp")
		s.GenerateInactiveCards(userID)
	}
	cards := []models.PartialCard{}
	query := `
	SELECT c.id, c.card_id, c.user_id, c.title, c.parent_id, c.created_at, c.updated_at, c.is_literature_card
	FROM inactive_cards i
	JOIN cards c on c.id = i.card_pk
	WHERE i.user_id = $1 AND c.is_deleted = FALSE
	`

	// Add condition for searchTerm
	var rows *sql.Rows
	var err error

	rows, err = s.DB.Query(query, userID)
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
			&card.ParentID,
			&card.CreatedAt,
			&card.UpdatedAt,
			&card.IsLiteratureCard,
		); err != nil {
			log.Printf("inactive err %v", err)
			return cards, err
		}
		cards = append(cards, card)
	}
	return cards, nil
}

func (s *Handler) UpdateCard(userID int, cardPK int, params models.EditCardParams) (models.Card, error) {
	var parent_id int
	parent, err := s.QueryPartialCard(userID, getParentIdAlternating(params.CardID))

	// set parent id to id if there's no parent
	if parent.ID == 0 || params.CardID == "" {
		parent_id = cardPK
	} else {
		parent_id = parent.ID
	}
	log.Printf("setting parent id %v", parent_id)

	//	originalCard, err := s.QueryPartialCardByID(userID, cardPK)
	if err != nil {
		return models.Card{}, fmt.Errorf("unable to load original card %v", err)
	}

	query := `
	UPDATE cards SET title = $1, body = $2, link = $3, parent_id = $4, is_literature_card = $5, updated_at = NOW(), card_id = $6
	WHERE
	id = $7
	`
	_, err = s.DB.Exec(query, params.Title, params.Body, params.Link, parent_id, params.IsLiteratureCard, params.CardID, cardPK)
	if err != nil {
		log.Printf("updatecard err %v", err)
		return models.Card{}, err
	}

	card, err := s.QueryFullCard(userID, cardPK)
	backlinks := extractBacklinks(card.Body)
	s.updateBacklinks(card.ID, backlinks)

	if !s.Server.Testing {
		go func() {
			embedding, err := llms.GenerateEmbeddings(s.DB, card)
			if err != nil {
				log.Printf("error generating embeddings: %v", err)
			}
			llms.StoreEmbeddings(s.DB, card, embedding)

		}()
	}

	s.AddTagsFromCard(userID, cardPK)
	return s.QueryFullCard(userID, cardPK)
}

func (s *Handler) CreateCard(userID int, params models.EditCardParams) (models.Card, error) {
	parent, err := s.QueryPartialCard(userID, getParentIdAlternating(params.CardID))
	query := `
	INSERT INTO cards 
	(title, body, link, user_id, card_id, parent_id, is_literature_card, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
	RETURNING id;
	`
	var id int
	err = s.DB.QueryRow(query, params.Title, params.Body, params.Link, userID, params.CardID, parent.ID, params.IsLiteratureCard).Scan(&id)
	if err != nil {
		log.Printf("updatecard err %v", err)
		return models.Card{}, err
	}
	card, err := s.QueryFullCard(userID, id)

	// set parent id to id if there's no parent
	if parent.ID == 0 || params.CardID == "" {
		_, err = s.DB.Exec("UPDATE cards SET parent_id = $1 WHERE id = $1", id)
		if err != nil {
			return models.Card{}, err
		}
	}
	backlinks := extractBacklinks(card.Body)
	s.updateBacklinks(card.ID, backlinks)
	if !s.Server.Testing {
		go func() {
			embedding, err := llms.GenerateEmbeddings(s.DB, card)
			if err != nil {
				log.Printf("error generating embeddings: %v", err)
			}
			llms.StoreEmbeddings(s.DB, card, embedding)

		}()
	}
	s.AddTagsFromCard(userID, id)
	return s.QueryFullCard(userID, id)
}

func (s *Handler) GenerateInactiveCards(userID int) error {
	tx, _ := s.DB.Begin()
	_, err := tx.Exec("DELETE FROM inactive_cards WHERE user_id = $1", userID)
	if err != nil {
		log.Fatal(err.Error())
		tx.Rollback()
		return err
	}
	query := `
	INSERT INTO inactive_cards (card_pk, user_id, card_updated_at)
SELECT c.id, c.user_id, c.updated_at
FROM cards c
LEFT JOIN (
    SELECT card_pk, MAX(created_at) AS recent_view
    FROM card_views
    GROUP BY card_pk
) cv ON c.id = cv.card_pk
WHERE c.user_id = $1 AND c.is_deleted = FALSE AND
 c.title != '' AND c.card_id NOT LIKE 'MM%' AND c.card_id NOT LIKE 'READ%'
ORDER BY c.created_at ASC, RANDOM()
LIMIT 20;
	`
	_, err = tx.Exec(query, userID)
	if err != nil {
		log.Printf("err %v", err)
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	return nil
}
