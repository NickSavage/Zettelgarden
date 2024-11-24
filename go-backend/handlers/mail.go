package handlers

import (
	"encoding/json"
	"fmt"
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

	query := `
            INSERT INTO mailing_list (email)
            VALUES ($1)
            RETURNING id`

	var id int
	err := s.DB.QueryRow(query, request.Email).Scan(&id)
	if err != nil {
		log.Printf("Error adding email to mailing list: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
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

	go func() {
		subject := "New mailing list registered at Zettelgarden"
		recipient := "nick@nicksavage.ca"
		body := fmt.Sprintf("A new email has registered at for the Zettelgarden mailing list: %v", request.Email)
		s.Server.Mail.SendEmail(subject, recipient, body)
		log.Printf("New mailing list registration %v", request.Email)
	}()
}
