package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"net/http"
)

const SIMILARITY_THRESHOLD = 0.15

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

	log.Printf("query %v, %v, %v", query, cardPK, userID)
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
		log.Printf("entity %v", entity)
		entities = append(entities, entity)
	}
	return entities, nil
}
