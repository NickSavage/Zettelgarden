package handlers

import (
	"encoding/json"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

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
