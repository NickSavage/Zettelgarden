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
	if task.CardPK > 0 {
		card, err := s.QueryPartialCard(userID, strconv.Itoa(task.CardPK))
		if err != nil {
			task.Card = card
		}
	}
	return task, nil
}

func (s *Server) QueryTasks(userID int) ([]models.Task, error) {
	var tasks []models.Task
	query := `
	SELECT id, card_pk, user_id, scheduled_date, due_date,
	created_at, updated_at, completed_at, title, is_complete
	FROM
	tasks
	WHERE user_id = $1 AND is_deleted = FALSE
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		log.Printf("err %v", err)
		return []models.Task{}, err
	}
	for rows.Next() {
		var task models.Task
		if err := rows.Scan(
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
		); err != nil {
			log.Printf("err %v", err)
			return []models.Task{}, fmt.Errorf("unable to access task")
		}
		if task.CardPK > 0 {
			card, err := s.QueryPartialCardByID(userID, task.ID)
			if err == nil {
				task.Card = card
			}
		}
		tasks = append(tasks, task)
	}
	return tasks, nil
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

func (s *Server) GetTasksRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	tasks, err := s.QueryTasks(userID)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return

	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)

}

func (s *Server) UpdateTask(userID int, id int, task models.Task) error {
	_, err := s.db.Exec(`
	UPDATE tasks SET
		card_pk = $1,
		scheduled_date = $2,
		due_date = $3,
		updated_at = NOW(),
		completed_at = $4,
		title = $5,
		is_complete = $6
	WHERE id = $7 AND user_id = $8 AND is_deleted = FALSE
	`, task.CardPK, task.ScheduledDate, task.DueDate, task.CompletedAt, task.Title, task.IsComplete, id, userID)

	if err != nil {
		log.Printf("err %v", err)
		return fmt.Errorf("unable to update task")
	}
	return nil
}

func (s *Server) UpdateTaskRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		log.Printf("error %v", err)
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var task models.Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		log.Printf("error %v", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err = s.UpdateTask(userID, id, task)
	if err != nil {
		log.Printf("error %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")

	response := models.GenericResponse{
		Message: "success",
		Error:   false,
	}

	json.NewEncoder(w).Encode(response)
}

func (s *Server) CreateTask(task models.Task) (int, error) {
	var taskID int

	log.Printf("user %v", task.UserID)
	err := s.db.QueryRow(`
	INSERT INTO tasks (card_pk, user_id, scheduled_date, due_date, created_at, updated_at, completed_at, title, is_complete, is_deleted)
	VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, FALSE)
	RETURNING id
	`, task.CardPK, task.UserID, task.ScheduledDate, task.DueDate, task.CompletedAt, task.Title, task.IsComplete).Scan(&taskID)

	if err != nil {
		log.Printf("err %v", err)
		return 0, fmt.Errorf("unable to create task")
	}
	return taskID, nil
}

func (s *Server) CreateTaskRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	var task models.Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		log.Printf("error %v", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Ensure the user ID is set correctly
	task.UserID = userID

	taskID, err := s.CreateTask(task)
	if err != nil {
		log.Printf("error %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"id": taskID})
}

func (s *Server) DeleteTask(userID int, id int) error {
	_, err := s.db.Exec(`
	UPDATE tasks SET is_deleted = TRUE
	WHERE id = $1 AND user_id = $2
	`, id, userID)

	if err != nil {
		log.Printf("err %v", err)
		return fmt.Errorf("unable to delete task")
	}
	return nil
}

func (s *Server) DeleteTaskRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		log.Printf("error %v", err)
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	err = s.DeleteTask(userID, id)
	if err != nil {
		log.Printf("error %v", err)
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
