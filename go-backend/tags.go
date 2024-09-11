package main

import (
	"database/sql"
	"encoding/json"
	"go-backend/models"
	"log"
	"net/http"
	"regexp"
	"strings"
)

func (s *Server) GetTag(userID int, tagName string) (models.Tag, error) {
	var tag models.Tag
	query := `
            select id, name, user_id, color
            from tags
            where is_deleted = false and user_id = $1 and name = $2
        `
	err := s.db.QueryRow(query, userID, tagName).Scan(
		&tag.ID,
		&tag.Name,
		&tag.UserID,
		&tag.Color,
	)
	if err != nil {
		log.Printf("err %v", err)
		return models.Tag{}, err
	}
	return tag, nil

}

func (s *Server) GetTags(userID int) ([]models.Tag, error) {
	tags := []models.Tag{}

	query := `
            select id, name, user_id, color
            from tags
            where is_deleted = false and user_id = $1
        `
	var rows *sql.Rows
	var err error

	rows, err = s.db.Query(query, userID)
	if err != nil {
		log.Printf("err %v", err)
		return tags, err
	}
	for rows.Next() {
		var tag models.Tag
		if err := rows.Scan(
			&tag.ID,
			&tag.Name,
			&tag.UserID,
			&tag.Color,
		); err != nil {
			log.Printf("err %v", err)
			return tags, err
		}
		tags = append(tags, tag)
	}
	return tags, nil
}

func (s *Server) GetTagsRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	tasks, err := s.GetTags(userID)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return

	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)

}

func (s *Server) CreateTag(userID int, tagData models.EditTagParams) (models.Tag, error) {

	_, err := s.GetTag(userID, tagData.Name)
	if err == nil {
		log.Printf("tag exists, going to edit it instead")
		return s.EditTag(userID, tagData.Name, tagData)
	}

	query := `INSERT INTO tags (name, color, user_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())`
	_, err = s.db.Exec(query, tagData.Name, tagData.Color, userID)
	if err != nil {
		log.Printf("create tag err %v", err)
		return models.Tag{}, nil
	}
	tag, err := s.GetTag(userID, tagData.Name)

	return tag, nil
}
func (s *Server) EditTag(userID int, tagName string, tagData models.EditTagParams) (models.Tag, error) {

	query := `UPDATE tags SET name = $1, color = $2 WHERE user_id = $3 AND name = $4`
	_, err := s.db.Exec(query, tagData.Name, tagData.Color, userID, tagName)
	if err != nil {
		log.Printf("update tag err %v", err)
		return models.Tag{}, nil
	}
	tag, err := s.GetTag(userID, tagData.Name)
	if err != nil {
		log.Printf("update tag get err %v", err)
		return models.Tag{}, nil
	}
	return tag, nil
}

func (s *Server) AddTagToCard(userID int, tagName string, cardPK int) error {
	var count int
	countQuery := `
        SELECT COUNT(*)
        FROM card_tags ct
        JOIN tags t ON ct.tag_id = t.id
        WHERE t.name = $1 AND ct.card_pk = $2 AND t.user_id = $3;
        `
	_ = s.db.QueryRow(countQuery, tagName, cardPK, userID).Scan(&count)
	if count > 0 {
		log.Printf("?")
		return nil
	}
	query := `
        INSERT INTO card_tags (card_pk, tag_id)
        SELECT $1, t.id
        FROM tags t
        WHERE t.name = $2 AND t.user_id = $3
	`
	_, err := s.db.Exec(query, cardPK, tagName, userID)
	if err != nil {
		log.Printf("add tag err %v", err)
		return err
	}

	return nil
}

func (s *Server) QueryTagsForCard(userID int, cardPK int) ([]models.Tag, error) {
	tags := []models.Tag{}

	query := `
        SELECT t.id, t.name, t.user_id, t.color
        FROM tags t
        JOIN card_tags ct ON t.id = ct.tag_id
        WHERE ct.card_pk = $1 AND t.user_id = $2;
        `
	var rows *sql.Rows
	var err error

	rows, err = s.db.Query(query, cardPK, userID)
	if err != nil {
		log.Printf("err %v", err)
		return tags, err
	}
	for rows.Next() {
		var tag models.Tag
		if err := rows.Scan(
			&tag.ID,
			&tag.Name,
			&tag.UserID,
			&tag.Color,
		); err != nil {
			log.Printf("err %v", err)
			return tags, err
		}
		tags = append(tags, tag)
	}
	return tags, nil

}

func (s *Server) ParseTagsFromCardBody(body string) ([]string, error) {
	if body == "" {
		return []string{}, nil
	}

	// Regular expression to match hashtags
	re := regexp.MustCompile(`#\S+`)
	matches := re.FindAllString(body, -1)

	// Process matched tags
	var tags []string
	for _, match := range matches {
		tag := strings.TrimSpace(match)
		if tag != "" {
			tags = append(tags, strings.TrimPrefix(tag, "#"))
		}
	}

	return tags, nil
}

func (s *Server) AddTagsFromCard(userID, cardPK int) error {
	card, err := s.QueryFullCard(userID, cardPK)
	if err != nil {
		return err
	}
	tags, err := s.ParseTagsFromCardBody(card.Body)
	if err != nil {
		return err
	}
	for _, tagName := range tags {
		log.Printf("tag %v", tagName)
		params := models.EditTagParams{
			Name:  tagName,
			Color: "black",
		}
		_, err := s.CreateTag(userID, params)
		if err != nil {
			return err
		}
		err = s.AddTagToCard(userID, tagName, cardPK)
		if err != nil {
			return err
		}
	}
	return nil

}
