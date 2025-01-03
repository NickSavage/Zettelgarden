package handlers

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
)

func (s *Handler) AddToMailingListRoute(w http.ResponseWriter, r *http.Request) {
	// Parse the request body
	var request struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	err := s.Server.Mail.HandleAddToMailingList(request.Email)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, "Internal server error: %v", http.StatusInternalServerError)
		return
	}

	// Return success response
	response := struct {
		Email string `json:"email"`
	}{
		Email: request.Email,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// ... existing code ...

type Subscriber struct {
	ID               int    `json:"id"`
	Email            string `json:"email"`
	WelcomeEmailSent bool   `json:"welcome_email_sent"`
}

func (s *Handler) GetAllSubscribers() ([]models.MailingList, error) {
	query := `
        SELECT id, email, welcome_email_sent, created_at, updated_at
        FROM mailing_list 
        ORDER BY id DESC
    `

	rows, err := s.DB.Query(query)
	if err != nil {
		log.Printf("Error querying subscribers: %v", err)
		return nil, fmt.Errorf("error querying subscribers: %v", err)
	}
	defer rows.Close()

	var subscribers []models.MailingList
	for rows.Next() {
		var sub models.MailingList
		if err := rows.Scan(&sub.ID, &sub.Email, &sub.WelcomeEmailSent, &sub.CreatedAt, &sub.UpdatedAt); err != nil {
			log.Printf("Error scanning subscriber row: %v", err)
			return nil, fmt.Errorf("error scanning subscriber row: %v", err)
		}
		subscribers = append(subscribers, sub)
	}

	return subscribers, nil
}
func (s *Handler) GetMailingListSubscribersRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	user, err := s.QueryUser(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusBadRequest)
		return
	}
	if !user.IsAdmin {
		http.Error(w, "Access denied", http.StatusUnauthorized)
		return
	}

	subscribers, err := s.GetAllSubscribers()
	if err != nil {
		log.Printf("Error getting subscribers: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(subscribers)
}
