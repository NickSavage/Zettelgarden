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

// GetTemplatesRoute returns all templates for the current user
func (s *Handler) GetTemplatesRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	templates, err := s.QueryTemplates(userID)
	if err != nil {
		log.Printf("Error querying templates: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(templates)
}

// GetTemplateRoute returns a specific template by ID
func (s *Handler) GetTemplateRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid template ID", http.StatusBadRequest)
		return
	}

	template, err := s.QueryTemplate(userID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

// CreateTemplateRoute creates a new template
func (s *Handler) CreateTemplateRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	var params models.CreateTemplateParams
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&params)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	template, err := s.CreateTemplate(userID, params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

// UpdateTemplateRoute updates an existing template
func (s *Handler) UpdateTemplateRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid template ID", http.StatusBadRequest)
		return
	}

	var params models.UpdateTemplateParams
	decoder := json.NewDecoder(r.Body)
	err = decoder.Decode(&params)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	template, err := s.UpdateTemplate(userID, id, params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

// DeleteTemplateRoute deletes a template
func (s *Handler) DeleteTemplateRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid template ID", http.StatusBadRequest)
		return
	}

	err = s.DeleteTemplate(userID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// QueryTemplates returns all templates for a user
func (s *Handler) QueryTemplates(userID int) ([]models.CardTemplate, error) {
	query := `
	SELECT id, user_id, title, body, created_at, updated_at
	FROM card_templates
	WHERE user_id = $1
	ORDER BY updated_at DESC
	`

	rows, err := s.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []models.CardTemplate
	for rows.Next() {
		var template models.CardTemplate
		if err := rows.Scan(
			&template.ID,
			&template.UserID,
			&template.Title,
			&template.Body,
			&template.CreatedAt,
			&template.UpdatedAt,
		); err != nil {
			return nil, err
		}
		templates = append(templates, template)
	}

	return templates, nil
}

// QueryTemplate returns a specific template by ID
func (s *Handler) QueryTemplate(userID, id int) (models.CardTemplate, error) {
	var template models.CardTemplate

	query := `
	SELECT id, user_id, title, body, created_at, updated_at
	FROM card_templates
	WHERE id = $1 AND user_id = $2
	`

	err := s.DB.QueryRow(query, id, userID).Scan(
		&template.ID,
		&template.UserID,
		&template.Title,
		&template.Body,
		&template.CreatedAt,
		&template.UpdatedAt,
	)
	if err != nil {
		return models.CardTemplate{}, fmt.Errorf("template not found")
	}

	return template, nil
}

// CreateTemplate creates a new template
func (s *Handler) CreateTemplate(userID int, params models.CreateTemplateParams) (models.CardTemplate, error) {
	var template models.CardTemplate

	query := `
	INSERT INTO card_templates (user_id, title, body, created_at, updated_at)
	VALUES ($1, $2, $3, NOW(), NOW())
	RETURNING id, user_id, title, body, created_at, updated_at
	`

	err := s.DB.QueryRow(query, userID, params.Title, params.Body).Scan(
		&template.ID,
		&template.UserID,
		&template.Title,
		&template.Body,
		&template.CreatedAt,
		&template.UpdatedAt,
	)
	if err != nil {
		return models.CardTemplate{}, err
	}

	return template, nil
}

// UpdateTemplate updates an existing template
func (s *Handler) UpdateTemplate(userID, id int, params models.UpdateTemplateParams) (models.CardTemplate, error) {
	var template models.CardTemplate

	query := `
	UPDATE card_templates
	SET title = $1, body = $2, updated_at = NOW()
	WHERE id = $3 AND user_id = $4
	RETURNING id, user_id, title, body, created_at, updated_at
	`

	err := s.DB.QueryRow(query, params.Title, params.Body, id, userID).Scan(
		&template.ID,
		&template.UserID,
		&template.Title,
		&template.Body,
		&template.CreatedAt,
		&template.UpdatedAt,
	)
	if err != nil {
		return models.CardTemplate{}, fmt.Errorf("failed to update template: %v", err)
	}

	return template, nil
}

// DeleteTemplate deletes a template
func (s *Handler) DeleteTemplate(userID, id int) error {
	query := `
	DELETE FROM card_templates
	WHERE id = $1 AND user_id = $2
	`

	result, err := s.DB.Exec(query, id, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("template not found")
	}

	return nil
}
