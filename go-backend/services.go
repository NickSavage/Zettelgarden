package main

import (
	"fmt"
	"go-backend/models"
	"log"
)

func (s *Server) QueryUser(id int) (models.User, error) {
	var user models.User
	err := s.db.QueryRow(`
	SELECT 
	id, username, email, password, created_at, updated_at, 
	is_admin, email_validated, can_upload_files, 
	max_file_storage 
	FROM users WHERE id = $1
	`, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Password,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.IsAdmin,
		&user.EmailValidated,
		&user.CanUploadFiles,
		&user.MaxFileStorage,
	)
	if err != nil {
		log.Printf("err %v", err)
		return models.User{}, fmt.Errorf("something went wrong")
	}
	return user, nil
}

func (s *Server) QueryPartialCard(userID int, cardID string) (models.PartialCard, error) {
	var card models.PartialCard

	err := s.db.QueryRow(`
	SELECT
	id, card_id, user_id, title, created_at, updated_at 
	FROM cards 
	WHERE is_deleted = FALSE AND card_id = $1 AND user_id = $2
	`, cardID, userID).Scan(
		&card.ID,
		&card.CardID,
		&card.UserID,
		&card.Title,
		&card.CreatedAt,
		&card.UpdatedAt,
	)
	if err != nil {
		log.Printf("err %v", err)
		return models.PartialCard{}, fmt.Errorf("something went wrong")
	}
	return card, nil

}

func (s *Server) QueryFullCard(userID int, id int) (models.Card, error) {
	var card models.Card

	err := s.db.QueryRow(`
	SELECT 
	id, card_id, user_id, title, body, link, created_at, updated_at 
	FROM 
	cards
	WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
	`, id, userID).Scan(
		&card.ID,
		&card.CardID,
		&card.UserID,
		&card.Title,
		&card.Body,
		&card.Link,
		&card.CreatedAt,
		&card.UpdatedAt,
	)
	if err != nil {
		return models.Card{}, fmt.Errorf("unable to access card")
	}

	s.logCardView(id, userID)
	return card, nil

}
