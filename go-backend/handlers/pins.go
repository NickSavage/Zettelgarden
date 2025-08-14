package handlers

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// PinCardRoute handles the request to pin a card
func (s *Handler) PinCardRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	cardID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid card ID", http.StatusBadRequest)
		return
	}

	// Verify the card exists and belongs to the user
	_, err = s.QueryFullCard(userID, cardID)
	if err != nil {
		http.Error(w, "Card not found", http.StatusNotFound)
		return
	}

	// Pin the card
	_, err = s.DB.Exec(
		"INSERT INTO pinned_cards (card_pk, user_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (card_pk, user_id) DO NOTHING",
		cardID, userID,
	)
	if err != nil {
		log.Printf("Error pinning card: %v", err)
		http.Error(w, "Failed to pin card", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// UnpinCardRoute handles the request to unpin a card
func (s *Handler) UnpinCardRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	cardID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid card ID", http.StatusBadRequest)
		return
	}

	// Delete the pin
	result, err := s.DB.Exec(
		"DELETE FROM pinned_cards WHERE card_pk = $1 AND user_id = $2",
		cardID, userID,
	)
	if err != nil {
		log.Printf("Error unpinning card: %v", err)
		http.Error(w, "Failed to unpin card", http.StatusInternalServerError)
		return
	}

	// Check if any row was affected
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		http.Error(w, "Failed to unpin card", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Card was not pinned", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetPinnedCardsRoute handles the request to get all pinned cards for a user
func (s *Handler) GetPinnedCardsRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	// Query for pinned cards with full card data
	rows, err := s.DB.Query(`
		SELECT 
			pc.id, pc.card_pk, pc.user_id, pc.created_at,
			c.id, c.card_id, c.user_id, c.title, c.body, c.link, c.parent_id, c.created_at, c.updated_at
		FROM pinned_cards pc
		JOIN cards c ON pc.card_pk = c.id
		WHERE pc.user_id = $1 AND c.is_deleted = FALSE
		ORDER BY pc.created_at DESC
	`, userID)
	if err != nil {
		log.Printf("Error querying pinned cards: %v", err)
		http.Error(w, "Failed to retrieve pinned cards", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var pinnedCards []models.PinnedCardResponse
	for rows.Next() {
		var pinnedCard models.PinnedCardResponse
		var card models.Card

		err := rows.Scan(
			&pinnedCard.ID, &pinnedCard.CardPK, &pinnedCard.UserID, &pinnedCard.CreatedAt,
			&card.ID, &card.CardID, &card.UserID, &card.Title, &card.Body, &card.Link,
			&card.ParentID, &card.CreatedAt, &card.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning pinned card: %v", err)
			http.Error(w, "Failed to process pinned cards", http.StatusInternalServerError)
			return
		}

		// Get parent card
		parent, err := s.QueryPartialCardByID(userID, card.ParentID)
		if err != nil {
			log.Printf("Error getting parent card: %v", err)
			// Continue even if parent can't be found
		}
		card.Parent = parent

		// Get tags for the card
		tags, err := s.QueryTagsForCard(userID, card.ID)
		if err != nil {
			log.Printf("Error getting tags: %v", err)
			// Continue even if tags can't be found
		}
		card.Tags = tags

		pinnedCard.Card = card
		pinnedCards = append(pinnedCards, pinnedCard)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Error iterating pinned cards: %v", err)
		http.Error(w, "Failed to process pinned cards", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pinnedCards)
}

// IsCardPinned checks if a card is pinned by the current user
func (s *Handler) IsCardPinned(userID, cardID int) (bool, error) {
	var count int
	err := s.DB.QueryRow(
		"SELECT COUNT(*) FROM pinned_cards WHERE card_pk = $1 AND user_id = $2",
		cardID, userID,
	).Scan(&count)

	if err != nil {
		return false, fmt.Errorf("error checking if card is pinned: %w", err)
	}

	return count > 0, nil
}

// PinSearchRoute handles the request to pin a search
func (s *Handler) PinSearchRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	// Parse the request body
	var req models.PinnedSearchRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate the request
	if req.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	// Insert the pinned search
	var id int
	err = s.DB.QueryRow(
		"INSERT INTO pinned_searches (user_id, title, search_term, search_config, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id",
		userID, req.Title, req.SearchTerm, req.SearchConfig,
	).Scan(&id)
	if err != nil {
		log.Printf("Error pinning search: %v", err)
		http.Error(w, "Failed to pin search", http.StatusInternalServerError)
		return
	}

	// Return the ID of the newly created pinned search
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

// UnpinSearchRoute handles the request to unpin a search
func (s *Handler) UnpinSearchRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	searchID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid search ID", http.StatusBadRequest)
		return
	}

	// Delete the pin
	result, err := s.DB.Exec(
		"DELETE FROM pinned_searches WHERE id = $1 AND user_id = $2",
		searchID, userID,
	)
	if err != nil {
		log.Printf("Error unpinning search: %v", err)
		http.Error(w, "Failed to unpin search", http.StatusInternalServerError)
		return
	}

	// Check if any row was affected
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		http.Error(w, "Failed to unpin search", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Search was not pinned", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetPinnedSearchesRoute handles the request to get all pinned searches for a user
func (s *Handler) GetPinnedSearchesRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	// Query for pinned searches
	rows, err := s.DB.Query(`
		SELECT id, user_id, title, search_term, search_config, created_at
		FROM pinned_searches
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		log.Printf("Error querying pinned searches: %v", err)
		http.Error(w, "Failed to retrieve pinned searches", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var pinnedSearches []models.PinnedSearch
	for rows.Next() {
		var pinnedSearch models.PinnedSearch
		err := rows.Scan(
			&pinnedSearch.ID,
			&pinnedSearch.UserID,
			&pinnedSearch.Title,
			&pinnedSearch.SearchTerm,
			&pinnedSearch.SearchConfig,
			&pinnedSearch.CreatedAt,
		)
		if err != nil {
			log.Printf("Error scanning pinned search: %v", err)
			http.Error(w, "Failed to process pinned searches", http.StatusInternalServerError)
			return
		}

		pinnedSearches = append(pinnedSearches, pinnedSearch)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Error iterating pinned searches: %v", err)
		http.Error(w, "Failed to process pinned searches", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pinnedSearches)
}
