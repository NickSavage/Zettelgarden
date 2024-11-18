package handlers

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
)

type Email struct {
	Subject   string `json:"subject"`
	Recipient string `json:"recipient"`
	Body      string `json:"body"`
}

func (s *Handler) SendEmail(subject, recipient, body string) error {
	if s.Server.Testing {
		s.Server.TestInspector.EmailsSent += 1
		return nil
	}
	email := Email{
		Subject:   subject,
		Recipient: recipient,
		Body:      body,
	}

	// Convert email struct to JSON

	emailJSON, err := json.Marshal(email)
	if err != nil {
		return err
	}
	go func() {

		// Create a new request
		req, err := http.NewRequest("POST", s.Server.Mail.Host+"/api/send", bytes.NewBuffer(emailJSON))
		if err != nil {
			return
		}

		// Set headers
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", s.Server.Mail.Password)

		// Send the request
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("error with email client: %s", err)
			return
		}
		defer resp.Body.Close()

		// Check the response status code
		if resp.StatusCode != http.StatusOK {
			log.Printf("failed to send email: %s", resp.Status)
			return
		}
	}()
	return nil
}

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
}
