package main

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func (s *Server) QueryTask(userID int, id int) (models.Task, error) {
	var task models.Task

	err := s.db.QueryRow(`
	SELECT id, card_pk, user_id, scheduled_date, due_date,
	created_at, updated_at, completed_at, title, is_complete
	FROM
	tasks
	WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
	`, id, userID).Scan(
		&task.ID,
		&task.CardPK,
		&task.UserID,
		&task.ScheduledDate,
		&task.DueDate,
		&task.CreatedAt,
		&task.UpdatedAt,
		&task.CompletedAt,
		&task.Title,
		&task.IsComplete,
	)
	if err != nil {
		log.Printf("err %v", err)
		return models.Task{}, fmt.Errorf("unable to access task")
	}
	log.Printf("task %v", task)
	return task, nil
}

func (s *Server) GetTaskRoute(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		log.Printf("error %v", err)
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	task, err := s.QueryTask(userID, id)
	if err != nil {
		log.Printf("asdas")
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}
