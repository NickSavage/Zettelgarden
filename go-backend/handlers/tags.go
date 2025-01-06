package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
)

// written for testing, not used elsewhere
func (s *Handler) getTagByID(userID int, tagID int) (models.Tag, error) {
	var tag models.Tag
	query := `
            select id, name, user_id, color
            from tags
            where user_id = $1 and id = $2
        `
	err := s.DB.QueryRow(query, userID, tagID).Scan(
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

func (s *Handler) GetTagMaybeDeleted(userID int, tagName string) (models.Tag, error) {

	var tag models.Tag
	query := `
            select id, name, user_id, color
            from tags
            where user_id = $1 and name = $2
        `
	err := s.DB.QueryRow(query, userID, tagName).Scan(
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

func (s *Handler) GetTag(userID int, tagName string) (models.Tag, error) {
	var tag models.Tag
	query := `
            select id, name, user_id, color
            from tags
            where is_deleted = FALSE AND user_id = $1 and name = $2
        `
	err := s.DB.QueryRow(query, userID, tagName).Scan(
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

func (s *Handler) GetTags(userID int) ([]models.Tag, error) {
	tags := []models.Tag{}
	query := `
        SELECT 
            t.id, 
            t.name, 
            t.user_id, 
            t.color,
            COUNT(DISTINCT tt.task_pk) AS task_count,
            COUNT(DISTINCT ct.card_pk) AS card_count
        FROM tags t
        LEFT JOIN task_tags tt ON t.id = tt.tag_id
        LEFT JOIN card_tags ct ON t.id = ct.tag_id
        WHERE t.is_deleted = false AND t.user_id = $1
        GROUP BY t.id, t.name, t.user_id, t.color
    `
	var rows *sql.Rows
	var err error

	rows, err = s.DB.Query(query, userID)
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
			&tag.TaskCount,
			&tag.CardCount,
		); err != nil {
			log.Printf("err %v", err)
			return tags, err
		}
		tags = append(tags, tag)
	}
	return tags, nil
}

func (s *Handler) GetTagsRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	tasks, err := s.GetTags(userID)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return

	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)

}

func (s *Handler) CreateTagRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	var tagData models.EditTagParams
	if err := json.NewDecoder(r.Body).Decode(&tagData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if tagData.Name == "" {
		http.Error(w, "Tag name is required", http.StatusBadRequest)
		return
	}

	tag, err := s.CreateTag(userID, tagData)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating tag: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tag)
}

func (s *Handler) CreateTag(userID int, tagData models.EditTagParams) (models.Tag, error) {

	_, err := s.GetTagMaybeDeleted(userID, tagData.Name)
	if err == nil {
		log.Printf("tag exists, going to edit it instead")
		return s.EditTag(userID, tagData.Name, tagData)
	}

	query := `INSERT INTO tags (name, color, user_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())`
	_, err = s.DB.Exec(query, tagData.Name, tagData.Color, userID)
	if err != nil {
		log.Printf("create tag err %v", err)
		return models.Tag{}, nil
	}
	tag, err := s.GetTag(userID, tagData.Name)

	return tag, nil
}
func (s *Handler) EditTag(userID int, tagName string, tagData models.EditTagParams) (models.Tag, error) {

	query := `UPDATE tags SET name = $1, color = $2, is_deleted = FALSE WHERE user_id = $3 AND name = $4`
	_, err := s.DB.Exec(query, tagData.Name, tagData.Color, userID, tagName)
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

func (s *Handler) AddTagToCard(userID int, tagName string, cardPK int) error {
	var count int
	countQuery := `
        SELECT COUNT(*)
        FROM card_tags ct
        JOIN tags t ON ct.tag_id = t.id
        WHERE t.name = $1 AND ct.card_pk = $2 AND t.user_id = $3;
        `
	_ = s.DB.QueryRow(countQuery, tagName, cardPK, userID).Scan(&count)
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
	_, err := s.DB.Exec(query, cardPK, tagName, userID)
	if err != nil {
		log.Printf("add tag err %v", err)
		return err
	}

	return nil
}

func (s *Handler) AddTagToTask(userID int, tagName string, taskPK int) error {

	query := `
        INSERT INTO task_tags (task_pk, tag_id)
        SELECT $1, t.id
        FROM tags t
        WHERE t.name = $2 AND t.user_id = $3
	`
	_, err := s.DB.Exec(query, taskPK, tagName, userID)
	if err != nil {
		log.Printf("add tag err %v", err)
		return err
	}

	return nil
}

func (s *Handler) QueryTagsForCard(userID int, cardPK int) ([]models.Tag, error) {
	tags := []models.Tag{}

	query := `
        SELECT t.id, t.name, t.user_id, t.color
        FROM tags t
        JOIN card_tags ct ON t.id = ct.tag_id
        WHERE ct.card_pk = $1 AND t.user_id = $2;
        `
	var rows *sql.Rows
	var err error

	rows, err = s.DB.Query(query, cardPK, userID)
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

func (s *Handler) ParseTagsFromCardBody(body string) ([]string, error) {
	if body == "" {
		return []string{}, nil
	}

	// Regular expression to match hashtags
	re := regexp.MustCompile(`(?:^|\s)(#[\w-]+)`)
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

func (s *Handler) RemoveAllTagsFromCard(userID, cardPK int) error {
	query := `DELETE FROM card_tags WHERE card_pk = $1`
	_, err := s.DB.Exec(query, cardPK)
	return err
}
func (s *Handler) RemoveAllTagsFromTask(userID, taskPK int) error {
	query := `DELETE FROM task_tags WHERE task_pk = $1`
	_, err := s.DB.Exec(query, taskPK)
	return err
}

func (s *Handler) iterateCreateTagsForCard(userID int, cardPK int, tagNames []string) error {

	for _, tagName := range tagNames {
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

func (s *Handler) AddTagsFromCard(userID, cardPK int) error {
	card, err := s.QueryFullCard(userID, cardPK)
	if err != nil {
		return err
	}
	s.RemoveAllTagsFromCard(userID, cardPK)
	tags, err := s.ParseTagsFromCardBody(card.Body)
	if err != nil {
		return err
	}
	err = s.iterateCreateTagsForCard(userID, cardPK, tags)
	if err != nil {
		return err
	}
	if card.ParentID == card.ID {
		// card is its own parent, no need to go on
		return nil
	}
	parent_tags, err := s.IdentifyParentTags(userID, models.ConvertCardToPartialCard(card))
	for _, tag := range parent_tags {
		if contains(tags, tag.Name) {
			log.Printf("skip")
			continue
		}
		err = s.AddTagToCard(userID, tag.Name, cardPK)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Handler) AddTagsFromTask(userID, taskPK int) error {
	task, err := s.QueryTask(userID, taskPK)
	if err != nil {
		return err
	}
	s.RemoveAllTagsFromTask(userID, taskPK)

	tags, err := s.ParseTagsFromCardBody(task.Title)
	if err != nil {
		return err
	}
	for _, tagName := range tags {
		params := models.EditTagParams{
			Name:  tagName,
			Color: "black",
		}
		_, err := s.CreateTag(userID, params)
		if err != nil {
			return err
		}
		err = s.AddTagToTask(userID, tagName, taskPK)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Handler) QueryTagsForTask(userID int, taskPK int) ([]models.Tag, error) {
	tags := []models.Tag{}

	query := `
        SELECT t.id, t.name, t.user_id, t.color
        FROM tags t
        JOIN task_tags tt ON t.id = tt.tag_id
        WHERE tt.task_pk = $1 AND t.user_id = $2;
        `
	var rows *sql.Rows
	var err error

	rows, err = s.DB.Query(query, taskPK, userID)
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

func (s *Handler) DeleteTag(userID, id int) error {

	_, err := s.DB.Exec(`
UPDATE tags SET is_deleted = TRUE, updated_at = NOW() WHERE id =  $1 AND user_id = $2
`, id, userID)
	return err
}

func (s *Handler) DeleteTagRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}
	var count int
	_ = s.DB.QueryRow("SELECT count(*) FROM card_tags WHERE tag_id = $1", id).Scan(&count)
	if count > 0 {
		http.Error(w, "unable to delete tag, cards exist", http.StatusBadRequest)
		return
	}
	_ = s.DB.QueryRow("SELECT count(*) FROM task_tags WHERE tag_id = $1", id).Scan(&count)
	if count > 0 {
		http.Error(w, "unable to delete tag, tasks exist", http.StatusBadRequest)
		return
	}
	err = s.DeleteTag(userID, id)
	if err != nil {
		http.Error(w, fmt.Sprintf("unable to delete tag: %v", err.Error()), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Handler) IdentifyParentTags(userID int, card models.PartialCard) ([]models.Tag, error) {
	if card.ParentID == card.ID {
		// card is its own parent, no further work needed
		return s.QueryTagsForCard(userID, card.ID)
	}
	parent, err := s.QueryPartialCardByID(userID, card.ParentID)

	parent_tags, err := s.IdentifyParentTags(userID, parent)
	if err != nil {
		return []models.Tag{}, err
	}
	tags, err := s.QueryTagsForCard(userID, card.ID)
	if err != nil {
		return []models.Tag{}, err
	}

	results := parent_tags
	for _, tag := range tags {
		results = append(results, tag)
	}

	return results, nil
}
