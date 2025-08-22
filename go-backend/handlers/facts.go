package handlers

import (
	"encoding/json"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

// ExtractSaveCardFacts deletes and re-inserts facts for a given card.
func (s *Handler) ExtractSaveCardFacts(userID int, cardPK int, facts []string) error {
	tx, _ := s.DB.Begin()
	_, err := tx.Exec("DELETE FROM facts WHERE card_pk = $1 AND user_id = $2", cardPK, userID)
	if err != nil {
		log.Printf("error deleting old facts: %v", err)
		tx.Rollback()
		return err
	}

	for _, fact := range facts {
		if fact == "" {
			continue
		}
		embedding, err := llms.GetEmbedding1024(fact, false)
		if err != nil {
			log.Printf("error generating embedding for fact: %v", err)
			tx.Rollback()
			return err
		}
		_, err = tx.Exec(`
			INSERT INTO facts (card_pk, user_id, fact, embedding_1024, created_at, updated_at)
			VALUES ($1, $2, $3, $4, NOW(), NOW())
		`, cardPK, userID, fact, embedding)
		if err != nil {
			log.Printf("error inserting fact: %v", err)
			tx.Rollback()
			return err
		}
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	// // Fetch the saved facts back, now with IDs, so we can run entity extraction
	// rows, err := s.DB.Query(`SELECT id, user_id, card_pk, fact, created_at, updated_at
	// 	FROM facts WHERE card_pk=$1 AND user_id=$2`, cardPK, userID)
	// if err != nil {
	// 	return err
	// }
	// defer rows.Close()

	// var dbFacts []models.Fact
	// for rows.Next() {
	// 	var f models.Fact
	// 	if err := rows.Scan(&f.ID, &f.UserID, &f.CardPK, &f.Fact, &f.CreatedAt, &f.UpdatedAt); err != nil {
	// 		return err
	// 	}
	// 	dbFacts = append(dbFacts, f)
	// }

	// Call entity extraction on the saved facts
	// if err := s.ExtractSaveFactEntities(userID, card, dbFacts); err != nil {
	// 	log.Printf("error extracting entities from facts: %v", err)
	// 	return err
	// }

	return nil
}

// GetEntityFacts returns all facts for a given entity, including PartialCard information
func (s *Handler) GetEntityFacts(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	vars := mux.Vars(r)

	entityIDStr := vars["id"]
	entityID, err := strconv.Atoi(entityIDStr)
	if err != nil {
		log.Printf("err 1 %v", err)
		http.Error(w, "Invalid entity id", http.StatusBadRequest)
		return
	}
	log.Printf("entity id %v", entityID)

	rows, err := s.DB.Query(`
		SELECT f.id, f.fact, f.created_at, f.updated_at,
		       c.id, c.card_id, c.user_id, c.title, c.parent_id,
		       c.created_at, c.updated_at
		FROM facts f
		JOIN entity_fact_junction efj ON f.id = efj.fact_id
		JOIN cards c ON f.card_pk = c.id
		WHERE efj.entity_id = $1 AND efj.user_id = $2
		ORDER BY f.created_at DESC
	`, entityID, userID)
	if err != nil {
		log.Printf("err 2 %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	log.Printf("rows %v", rows)

	type FactWithCard struct {
		ID        int                `json:"id"`
		Fact      string             `json:"fact"`
		CreatedAt time.Time          `json:"created_at"`
		UpdatedAt time.Time          `json:"updated_at"`
		Card      models.PartialCard `json:"card"`
	}

	var facts []FactWithCard

	for rows.Next() {
		var fact FactWithCard
		err := rows.Scan(
			&fact.ID,
			&fact.Fact,
			&fact.CreatedAt,
			&fact.UpdatedAt,
			&fact.Card.ID,
			&fact.Card.CardID,
			&fact.Card.UserID,
			&fact.Card.Title,
			&fact.Card.ParentID,
			&fact.Card.CreatedAt,
			&fact.Card.UpdatedAt,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		facts = append(facts, fact)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(facts); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// GetCardFacts returns all facts for a given card
func (s *Handler) GetCardFacts(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	vars := mux.Vars(r)

	cardIDStr := vars["id"]
	cardID, err := strconv.Atoi(cardIDStr)
	if err != nil {
		http.Error(w, "Invalid card id", http.StatusBadRequest)
		return
	}

	rows, err := s.DB.Query(`
		SELECT id, fact, created_at, updated_at
		FROM facts
		WHERE card_pk = $1 AND user_id = $2
		ORDER BY created_at DESC
	`, cardID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var facts []models.Fact
	for rows.Next() {
		var f models.Fact
		if err := rows.Scan(&f.ID, &f.Fact, &f.CreatedAt, &f.UpdatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		facts = append(facts, f)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(facts); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// GetFactEntities returns all entities linked to a given fact
func (s *Handler) GetFactEntities(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	vars := mux.Vars(r)

	factIDStr := vars["id"]
	factID, err := strconv.Atoi(factIDStr)
	if err != nil {
		http.Error(w, "Invalid fact id", http.StatusBadRequest)
		return
	}

	rows, err := s.DB.Query(`
		SELECT e.id, e.name, e.description, e.type, e.created_at, e.updated_at
		FROM entities e
		JOIN entity_fact_junction efj ON efj.entity_id = e.id
		WHERE efj.fact_id = $1 AND efj.user_id = $2
	`, factID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var entities []models.Entity
	for rows.Next() {
		var e models.Entity
		if err := rows.Scan(&e.ID, &e.Name, &e.Description, &e.Type, &e.CreatedAt, &e.UpdatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		entities = append(entities, e)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(entities); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// GetAllFacts returns all facts for the current user
func (s *Handler) GetAllFacts(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	rows, err := s.DB.Query(`
		SELECT id, user_id, card_pk, fact, created_at, updated_at
		FROM facts
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var facts []models.Fact
	for rows.Next() {
		var f models.Fact
		if err := rows.Scan(&f.ID, &f.UserID, &f.CardPK, &f.Fact, &f.CreatedAt, &f.UpdatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		facts = append(facts, f)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(facts); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// ExtractSaveFactEntities runs entity extraction on facts and links them in entity_fact_junction
func (s *Handler) ExtractSaveFactEntities(userID int, card models.Card, factObjs []models.Fact) error {
	log.Printf("fact %v", factObjs)
	client := llms.NewDefaultClient(s.DB, userID)

	for _, fact := range factObjs {
		if fact.Fact == "" {
			continue
		}
		log.Printf("fact %v", fact)
		// Wrap fact into a CardChunk surrogate (Chunk field holds the fact text)
		chunk := models.CardChunk{
			ID:     fact.ID,
			CardID: card.CardID,
			UserID: userID,
			Title:  card.Title,
			Chunk:  fact.Fact,
		}
		entities, err := llms.FindEntities(client, chunk)
		if err != nil {
			log.Printf("entity extraction error for fact %d: %v", fact.ID, err)
			return err
		}
		for _, entity := range entities {
			similarEntities, err := s.FindPotentialDuplicates(userID, entity)
			if err != nil {
				return err
			}
			entity, err = llms.CheckExistingEntities(client, similarEntities, entity)
			if err != nil {
				log.Printf("error checking existing entities: %v", err)
				return err
			}
			log.Printf("entity %v", entity.Name)

			var entityID int
			err = s.DB.QueryRow(`
				SELECT id FROM entities WHERE user_id = $1 AND name = $2
			`, userID, entity.Name).Scan(&entityID)

			if err != nil {
				// no entity found, insert
				err = s.DB.QueryRow(`
					INSERT INTO entities (user_id, name, description, type, embedding_1024, card_pk)
					VALUES ($1, $2, $3, $4, $5, $6)
					RETURNING id
				`, userID, entity.Name, entity.Description, entity.Type, entity.Embedding, entity.CardPK).Scan(&entityID)
				if err != nil {
					log.Printf("error inserting entity (from fact): %v", err)
					continue
				}
			} else {
				// entity exists, update
				_, err = s.DB.Exec(`
					UPDATE entities SET description=$1, type=$2, updated_at=NOW() WHERE id=$3
				`, entity.Description, entity.Type, entityID)
				if err != nil {
					log.Printf("error updating entity (from fact): %v", err)
					continue
				}
			}

			// link entity to fact
			_, err = s.DB.Exec(`
				INSERT INTO entity_fact_junction (user_id, entity_id, fact_id, created_at, updated_at)
				VALUES ($1, $2, $3, NOW(), NOW())
				ON CONFLICT (entity_id, fact_id) DO UPDATE SET updated_at = NOW()
			`, userID, entityID, fact.ID)
			if err != nil {
				log.Printf("error linking entity to fact: %v", err)
				continue
			}
		}
	}
	return nil
}
