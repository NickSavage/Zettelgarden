package handlers

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"
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

func (s *Handler) GetAllSubscribers() ([]models.MailingList, error) {
	query := `
        SELECT id, email, welcome_email_sent, created_at, updated_at, subscribed
        FROM mailing_list 
        WHERE subscribed = true
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
		if err := rows.Scan(&sub.ID, &sub.Email, &sub.WelcomeEmailSent, &sub.CreatedAt, &sub.UpdatedAt, &sub.Subscribed); err != nil {
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

type SendMailingListRequest struct {
	Subject       string   `json:"subject"`
	Body          string   `json:"body"`
	ToRecipients  []string `json:"to_recipients"`
	BccRecipients []string `json:"bcc_recipients"`
}

func (s *Handler) SendMailingListMessageRoute(w http.ResponseWriter, r *http.Request) {
	// Admin check
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

	// Parse request
	var req SendMailingListRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.Subject == "" || req.Body == "" {
		http.Error(w, "Subject and body are required", http.StatusBadRequest)
		return
	}
	if len(req.ToRecipients) == 0 && len(req.BccRecipients) == 0 {
		http.Error(w, "At least one recipient is required", http.StatusBadRequest)
		return
	}

	// Send the message
	err = s.Server.Mail.SendMailingListMessage(req.Subject, req.Body, req.ToRecipients, req.BccRecipients)
	if err != nil {
		log.Printf("Error sending mailing list message: %v", err)
		http.Error(w, "Error sending message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Mailing list message sent successfully",
	})
}

func (s *Handler) GetMailingListMessagesRoute(w http.ResponseWriter, r *http.Request) {
	// Admin check
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

	// Parse pagination parameters
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 {
		limit = 10 // default limit
	}

	messages, err := s.Server.Mail.GetMailingListMessages(limit, offset)
	if err != nil {
		log.Printf("Error getting mailing list messages: %v", err)
		http.Error(w, "Error retrieving messages", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func (s *Handler) GetMessageRecipientsRoute(w http.ResponseWriter, r *http.Request) {
	// Admin check
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

	// Get message ID from URL parameters
	messageID, err := strconv.Atoi(r.URL.Query().Get("message_id"))
	if err != nil {
		http.Error(w, "Invalid message ID", http.StatusBadRequest)
		return
	}

	recipients, err := s.Server.Mail.GetMessageRecipients(messageID)
	if err != nil {
		log.Printf("Error getting message recipients: %v", err)
		http.Error(w, "Error retrieving recipients", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recipients)
}
