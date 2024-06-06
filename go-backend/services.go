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
	query := `
    SELECT 
		id, card_id, user_id, title, body, link, created_at, updated_at 
    FROM 
        cards
    WHERE
		user_id = $1`

	// Add condition for searchTerm
	var rows *sql.Rows
	var err error
	if searchTerm != "" {
		query += " AND title ILIKE $2 OR body ILIKE $2 "
		rows, err = s.db.Query(query, userID, "%"+searchTerm+"%")
	} else {
		rows, err = s.db.Query(query, userID)
	}
	if err != nil {
		log.Printf("err %v", err)
		return cards, err
	}

	for rows.Next() {
		var card models.Card
		if err := rows.Scan(
			&card.ID,
			&card.CardID,
			&card.UserID,
			&card.Title,
			&card.Body,
			&card.Link,
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

func (s *Server) QueryInactiveCards(userID int) ([]models.PartialCard, error) {

	cards := []models.PartialCard{}
	query := `
	SELECT c.id, c.card_id, c.user_id, c.title, c.created_at, c.updated_at
	FROM cards c
	LEFT JOIN (
		SELECT card_pk, MAX(created_at) AS recent_view
		FROM card_views
		GROUP BY card_pk
	) cv ON c.id = cv.card_pk
	WHERE c.user_id = $1 AND c.is_deleted = FALSE AND
	 c.title != '' AND c.card_id NOT LIKE 'MM%' AND c.card_id NOT LIKE 'READ%'
	ORDER BY cv.recent_view DESC, RANDOM()
	LIMIT 30;
	`

	// Add condition for searchTerm
	var rows *sql.Rows
	var err error

	rows, err = s.db.Query(query, userID)
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

func (s *Server) UpdateCard(userID int, cardPK int, params models.EditCardParams) (models.Card, error) {
	query := `
	UPDATE cards SET title = $1, body = $2, link = $3, updated_at = NOW(), card_id = $4
	WHERE
	id = $5
	`
	_, err := s.db.Exec(query, params.Title, params.Body, params.Link, params.CardID, cardPK)
	if err != nil {
		log.Printf("updatecard err %v", err)
		return models.Card{}, err
	}
	return s.QueryFullCard(userID, cardPK)

}
