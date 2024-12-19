package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
)

const SIMILARITY_THRESHOLD = 0.15

type UpdateEntityRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Type        string `json:"type"`
}

func (s *Handler) ExtractSaveCardEntities(userID int, card models.Card) error {

	chunks, err := s.GetCardChunks(userID, card.ID)
	if err != nil {
		log.Printf("error in chunking %v", err)
		return err
	}
	for _, chunk := range chunks {
		entities, err := llms.FindEntities(s.Server.LLMClient, chunk)
		if err != nil {
			log.Printf("entity error %v", err)
			return err
		} else {
			err = s.UpsertEntities(userID, card.ID, entities)
			if err != nil {
				log.Printf("error upserting entities: %v", err)
				return err
			}
		}
	}
	return nil

}

func (s *Handler) UpsertEntities(userID int, cardPK int, entities []models.Entity) error {
	for _, entity := range entities {
		similarEntities, err := s.FindPotentialDuplicates(userID, entity)
		if err != nil {
			return err
		}
		entity, err = llms.CheckExistingEntities(s.Server.LLMClient, similarEntities, entity)

		var entityID int
		// First try to find if the entity exists
		err = s.DB.QueryRow(`
            SELECT id 
            FROM entities 
            WHERE user_id = $1 AND name = $2
        `, userID, entity.Name).Scan(&entityID)

		if err == sql.ErrNoRows {
			// Entity doesn't exist, insert it
			err = s.DB.QueryRow(`
                INSERT INTO entities (user_id, name, description, type, embedding)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, userID, entity.Name, entity.Description, entity.Type, entity.Embedding).Scan(&entityID)
			if err != nil {
				log.Printf("error inserting entity: %v", err)
				continue
			}
		} else if err != nil {
			log.Printf("error checking for existing entity: %v", err)
			continue
		} else {
			// Entity exists, update it
			_, err = s.DB.Exec(`
                UPDATE entities 
                SET description = $1, 
                    type = $2,
                    updated_at = NOW()
                WHERE id = $3
            `, entity.Description, entity.Type, entityID)
			if err != nil {
				log.Printf("error updating entity: %v", err)
				continue
			}
		}

		// Create or update the entity-card relationship
		_, err = s.DB.Exec(`
            INSERT INTO entity_card_junction (user_id, entity_id, card_pk)
            VALUES ($1, $2, $3)
            ON CONFLICT (entity_id, card_pk)
            DO UPDATE SET updated_at = NOW()
        `, userID, entityID, cardPK)
		if err != nil {
			log.Printf("error linking entity to card: %v", err)
			continue
		}
	}
	return nil
}

func (s *Handler) FindPotentialDuplicates(userID int, entity models.Entity) ([]models.Entity, error) {
	const query = `
        SELECT id, name, description, type
        FROM entities
        WHERE user_id = $1 AND (embedding <=> $2) < $3
        ORDER BY embedding <=> $2
        LIMIT 5;
    `

	rows, err := s.DB.Query(query, userID, entity.Embedding, SIMILARITY_THRESHOLD)
	if err != nil {
		return nil, fmt.Errorf("error querying similar entities: %w", err)
	}
	defer rows.Close()

	var similarEntities []models.Entity
	for rows.Next() {
		var e models.Entity
		err := rows.Scan(&e.ID, &e.Name, &e.Description, &e.Type)
		if err != nil {
			return nil, fmt.Errorf("error scanning entity: %w", err)
		}
		similarEntities = append(similarEntities, e)
	}

	return similarEntities, nil
}

func (s *Handler) GetEntitiesRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	query := `
        SELECT 
            e.id,
            e.user_id,
            e.name,
            e.description,
            e.type,
            e.created_at,
            e.updated_at,
            COUNT(DISTINCT ecj.card_pk) as card_count
        FROM 
            entities e
            LEFT JOIN entity_card_junction ecj ON e.id = ecj.entity_id
            LEFT JOIN cards c ON ecj.card_pk = c.id AND c.is_deleted = FALSE
        WHERE 
            e.user_id = $1
        GROUP BY 
            e.id, e.user_id, e.name, e.description, e.type, e.created_at, e.updated_at
        ORDER BY 
            e.name ASC
    `

	rows, err := s.DB.Query(query, userID)
	if err != nil {
		log.Printf("error querying entities: %v", err)
		http.Error(w, "Failed to query entities", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var entities []models.Entity
	for rows.Next() {
		var entity models.Entity
		err := rows.Scan(
			&entity.ID,
			&entity.UserID,
			&entity.Name,
			&entity.Description,
			&entity.Type,
			&entity.CreatedAt,
			&entity.UpdatedAt,
			&entity.CardCount,
		)
		if err != nil {
			log.Printf("error scanning entity: %v", err)
			http.Error(w, "Failed to scan entities", http.StatusInternalServerError)
			return
		}
		entities = append(entities, entity)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entities)
}

func (s *Handler) QueryEntitiesForCard(userID int, cardPK int) ([]models.Entity, error) {
	query := `
	SELECT 
		e.id, e.user_id, e.name, e.description, e.type, e.created_at, e.updated_at
	FROM 
		entities e
	JOIN 
		entity_card_junction ecj ON e.id = ecj.entity_id
	WHERE 
		ecj.card_pk = $1 AND e.user_id = $2`

	rows, err := s.DB.Query(query, cardPK, userID)
	if err != nil {
		log.Printf("err %v", err)
		return []models.Entity{}, err
	}

	var entities []models.Entity
	for rows.Next() {
		var entity models.Entity
		if err := rows.Scan(
			&entity.ID,
			&entity.UserID,
			&entity.Name,
			&entity.Description,
			&entity.Type,
			&entity.CreatedAt,
			&entity.UpdatedAt,
		); err != nil {
			log.Printf("err %v", err)
			return entities, err
		}
		entities = append(entities, entity)
	}
	return entities, nil
}

func (s *Handler) MergeEntities(userID int, entity1ID int, entity2ID int) error {
	// Start transaction
	tx, err := s.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback() // Will be ignored if transaction is committed

	// Verify both entities exist and belong to the user
	var entity1, entity2 models.Entity
	err = tx.QueryRow(`
		SELECT id, user_id, name, description, type, embedding
		FROM entities
		WHERE id = $1 AND user_id = $2`,
		entity1ID, userID).Scan(
		&entity1.ID, &entity1.UserID, &entity1.Name,
		&entity1.Description, &entity1.Type, &entity1.Embedding)
	if err != nil {
		return fmt.Errorf("failed to find entity1: %w", err)
	}

	err = tx.QueryRow(`
		SELECT id, user_id, name, description, type, embedding
		FROM entities
		WHERE id = $1 AND user_id = $2`,
		entity2ID, userID).Scan(
		&entity2.ID, &entity2.UserID, &entity2.Name,
		&entity2.Description, &entity2.Type, &entity2.Embedding)
	if err != nil {
		return fmt.Errorf("failed to find entity2: %w", err)
	}

	// Move all card relationships from entity2 to entity1
	_, err = tx.Exec(`
		INSERT INTO entity_card_junction (user_id, entity_id, card_pk)
		SELECT user_id, $1, card_pk
		FROM entity_card_junction
		WHERE entity_id = $2
		ON CONFLICT (entity_id, card_pk) DO NOTHING`,
		entity1.ID, entity2.ID)
	if err != nil {
		return fmt.Errorf("failed to merge card relationships: %w", err)
	}

	// Delete entity2's relationships
	_, err = tx.Exec(`
		DELETE FROM entity_card_junction
		WHERE entity_id = $1`,
		entity2.ID)
	if err != nil {
		return fmt.Errorf("failed to delete entity2 relationships: %w", err)
	}

	// Delete entity2
	_, err = tx.Exec(`
		DELETE FROM entities
		WHERE id = $1 AND user_id = $2`,
		entity2.ID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete entity2: %w", err)
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

type MergeEntitiesRequest struct {
	Entity1ID int `json:"entity1_id"`
	Entity2ID int `json:"entity2_id"`
}

func (s *Handler) MergeEntitiesRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	var req MergeEntitiesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Entity1ID == 0 || req.Entity2ID == 0 {
		http.Error(w, "Both entity IDs are required", http.StatusBadRequest)
		return
	}

	if req.Entity1ID == req.Entity2ID {
		http.Error(w, "Cannot merge an entity with itself", http.StatusBadRequest)
		return
	}

	err := s.MergeEntities(userID, req.Entity1ID, req.Entity2ID)
	if err != nil {
		log.Printf("Error merging entities: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Entities merged successfully",
	})
}

func (s *Handler) DeleteEntity(userID int, entityID int) error {
	// Start transaction
	tx, err := s.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback() // Will be ignored if transaction is committed

	// Verify entity exists and belongs to the user
	var exists bool
	err = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1 
			FROM entities 
			WHERE id = $1 AND user_id = $2
		)`,
		entityID, userID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check entity existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("entity not found or does not belong to user")
	}

	// Delete entity-card relationships first
	_, err = tx.Exec(`
		DELETE FROM entity_card_junction
		WHERE entity_id = $1 AND user_id = $2`,
		entityID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete entity relationships: %w", err)
	}

	// Delete the entity
	_, err = tx.Exec(`
		DELETE FROM entities
		WHERE id = $1 AND user_id = $2`,
		entityID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete entity: %w", err)
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (s *Handler) DeleteEntityRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	// Extract entityID from URL parameters using mux instead of chi
	entityID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid entity ID", http.StatusBadRequest)
		return
	}

	err = s.DeleteEntity(userID, entityID)
	if err != nil {
		log.Printf("Error deleting entity: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Entity deleted successfully",
	})
}

func (s *Handler) UpdateEntity(userID int, entityID int, params UpdateEntityRequest) error {
	// Start transaction
	tx, err := s.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Verify entity exists and belongs to user
	var exists bool
	err = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1 
			FROM entities 
			WHERE id = $1 AND user_id = $2
		)`,
		entityID, userID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check entity existence: %w", err)
	}
	if !exists {
		return fmt.Errorf("entity not found or does not belong to user")
	}

	// Check if name is unique for this user
	var nameExists bool
	err = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1 
			FROM entities 
			WHERE user_id = $1 AND name = $2 AND id != $3
		)`,
		userID, params.Name, entityID).Scan(&nameExists)
	if err != nil {
		return fmt.Errorf("failed to check name uniqueness: %w", err)
	}
	if nameExists {
		return fmt.Errorf("an entity with this name already exists")
	}

	// Generate new embedding
	entity := models.Entity{
		ID:          entityID,
		UserID:      userID,
		Name:        params.Name,
		Description: params.Description,
		Type:        params.Type,
	}

	var updateQuery string
	var queryArgs []interface{}

	if s.Server.Testing {
		// In test mode, don't update the embedding
		updateQuery = `
			UPDATE entities 
			SET name = $1, 
				description = $2,
				type = $3,
				updated_at = NOW()
			WHERE id = $4 AND user_id = $5`
		queryArgs = []interface{}{params.Name, params.Description, params.Type, entityID, userID}
	} else {
		// In normal mode, update with new embedding
		embedding, err := llms.GenerateEntityEmbedding(s.Server.LLMClient, entity)
		if err != nil {
			return fmt.Errorf("failed to generate embedding: %w", err)
		}
		updateQuery = `
			UPDATE entities 
			SET name = $1, 
				description = $2,
				type = $3,
				embedding = $4,
				updated_at = NOW()
			WHERE id = $5 AND user_id = $6`
		queryArgs = []interface{}{params.Name, params.Description, params.Type, embedding, entityID, userID}
	}

	// Update the entity
	_, err = tx.Exec(updateQuery, queryArgs...)
	if err != nil {
		return fmt.Errorf("failed to update entity: %w", err)
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (s *Handler) UpdateEntityRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	// Extract entityID from URL parameters
	entityID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid entity ID", http.StatusBadRequest)
		return
	}

	var params UpdateEntityRequest
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if params.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	err = s.UpdateEntity(userID, entityID, params)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		log.Printf("Error updating entity: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Entity updated successfully",
	})
}
