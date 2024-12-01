package handlers

import (
	"database/sql"
	"go-backend/models"
	"log"
)

func (s *Handler) UpsertEntities(userID int, cardPK int, entities []models.Entity) error {
	for _, entity := range entities {
		var entityID int
		// First try to find if the entity exists
		err := s.DB.QueryRow(`
            SELECT id 
            FROM entities 
            WHERE user_id = $1 AND name = $2
        `, userID, entity.Name).Scan(&entityID)

		if err == sql.ErrNoRows {
			// Entity doesn't exist, insert it
			err = s.DB.QueryRow(`
                INSERT INTO entities (user_id, name, description, type)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `, userID, entity.Name, entity.Description, entity.Type).Scan(&entityID)
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
