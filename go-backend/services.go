package main

import (
	"database/sql"
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
	log.Printf("cardID %v", cardID)

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

func (s *Server) QueryFullCards(userID int, searchTerm string) ([]models.Card, error) {
	var cards []models.Card

	return cards, nil
}

func (s *Server) QueryPartialCards(userID int, searchTerm string) ([]models.PartialCard, error) {
	cards := []models.PartialCard{}
	query := `
    SELECT 
        id, card_id, user_id, title, created_at, updated_at 
    FROM 
        cards
    WHERE
		user_id = $1`

	// Add condition for searchTerm
	var rows *sql.Rows
	var err error
	log.Printf("user %v", userID)
	if searchTerm != "" {
		query += " AND title ILIKE $2 "
		rows, err = s.db.Query(query, userID, "%"+searchTerm+"%")
	} else {
		rows, err = s.db.Query(query, userID)
	}
	if err != nil {
		log.Printf("err %v", err)
		return cards, err
	}

	for rows.Next() {
		var card models.PartialCard
		if err := rows.Scan(
			&card.ID,
			&card.CardID,
			&card.UserID,
			&card.Title,
			&card.CreatedAt,
			&card.UpdatedAt,
		); err != nil {
			log.Printf("err %v", err)
			return cards, err
		}
		cards = append(cards, card)
	}
	return cards, nil
}
