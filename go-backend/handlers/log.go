package handlers

import (
	"go-backend/models"
	"log"
	"net/http"
	"os"
	"reflect"
)

func OpenLogFile(path string) (*os.File, error) {
	logFile, err := os.OpenFile(path, os.O_WRONLY|os.O_APPEND|os.O_CREATE, 0644)
	if err != nil {
		return nil, err
	}
	return logFile, nil
}

func LogRoute(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value("current_user").(int)
		if !ok {
			log.Printf("- %s %s", r.Method, r.URL.Path)
		} else {
			log.Printf("- %s %s - user %v", r.Method, r.URL.Path, userID)
		}
		next.ServeHTTP(w, r)

	}
}

func (s *Handler) logCardView(cardPK int, userID int) {
	_, err := s.DB.Exec(`
   INSERT INTO 
   card_views 
   (card_pk, user_id, created_at) 
   VALUES ($1, $2, CURRENT_TIMESTAMP);`, cardPK, userID)

	if err != nil {
		// Log the error
		log.Printf("Error logging card view for cardPK %d and userID %d: %v", cardPK, userID, err)
	}
}

func (s *Handler) LogLastLogin(user models.User) {
	log.Printf("Successfully logged in for userID %v, username %v", user.ID, user.Username)
	_, err := s.DB.Exec(`UPDATE users SET last_login = NOW() WHERE id = $1`, user.ID)
	if err != nil {
		// Log the error
		log.Printf("Error logging card view for userID %v: %v", user.ID, err)
	}

}

func (s *Handler) CreateAuditEvent(userID int, entityID int, entityType string, action string, oldState interface{}, newState interface{}) error {
	changes := make(map[string]models.FieldChange)

	// If we have both states, compute the differences
	if oldState != nil && newState != nil {
		oldVal := reflect.ValueOf(oldState)
		newVal := reflect.ValueOf(newState)

		// Handle pointer types
		if oldVal.Kind() == reflect.Ptr {
			oldVal = oldVal.Elem()
		}
		if newVal.Kind() == reflect.Ptr {
			newVal = newVal.Elem()
		}

		// Only process if both are structs
		if oldVal.Kind() == reflect.Struct && newVal.Kind() == reflect.Struct {
			for i := 0; i < oldVal.NumField(); i++ {
				field := oldVal.Type().Field(i)
				oldField := oldVal.Field(i)
				newField := newVal.Field(i)

				// Skip certain fields
				if field.Name == "CreatedAt" || field.Name == "UpdatedAt" {
					continue
				}

				// Convert interface values to comparable types
				oldValue := oldField.Interface()
				newValue := newField.Interface()

				// Only record if values are different
				if !reflect.DeepEqual(oldValue, newValue) {
					changes[field.Name] = models.FieldChange{
						From: oldValue,
						To:   newValue,
					}
				}
			}
		}
	}

	details := models.Details{
		ChangeType: action,
		Changes:    changes,
	}

	// For create/delete actions, store the full state
	if action == "create" && newState != nil {
		details.CustomData = map[string]interface{}{
			"initial_state": newState,
		}
	} else if action == "delete" && oldState != nil {
		details.CustomData = map[string]interface{}{
			"final_state": oldState,
		}
	}

	_, err := s.DB.Exec(`
		INSERT INTO audit_events (user_id, entity_id, entity_type, action, details)
		VALUES ($1, $2, $3, $4, $5)
	`, userID, entityID, entityType, action, details)

	if err != nil {
		log.Printf("Error creating audit event: %v", err)
		return err
	}

	return nil
}

func (s *Handler) GetAuditEvents(entityType string, entityID int) ([]models.AuditEvent, error) {
	rows, err := s.DB.Query(`
		SELECT id, user_id, entity_id, entity_type, action, details, created_at
		FROM audit_events
		WHERE entity_type = $1 AND entity_id = $2
		ORDER BY created_at DESC
	`, entityType, entityID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.AuditEvent
	for rows.Next() {
		var event models.AuditEvent
		err := rows.Scan(
			&event.ID,
			&event.UserID,
			&event.EntityID,
			&event.EntityType,
			&event.Action,
			&event.Details,
			&event.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		events = append(events, event)
	}

	return events, nil
}
