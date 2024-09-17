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
