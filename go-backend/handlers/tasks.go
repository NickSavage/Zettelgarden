package handlers

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

func (s *Handler) QueryTask(userID int, id int) (models.Task, error) {
	var task models.Task

	err := s.DB.QueryRow(`
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
		card, err := s.QueryPartialCardByID(userID, task.CardPK)
		if err != nil {
			task.Card = card
		}
	}
	return task, nil
}

func (s *Handler) QueryTasks(userID int) ([]models.Task, error) {
	var tasks []models.Task
	query := `
	SELECT id, card_pk, user_id, scheduled_date, due_date,
	created_at, updated_at, completed_at, title, is_complete
	FROM
	tasks
	WHERE user_id = $1 AND is_deleted = FALSE
	`

	rows, err := s.DB.Query(query, userID)
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
			card, err := s.QueryPartialCardByID(userID, task.CardPK)
			if err == nil {
				task.Card = card
			}
		}
		tags, err := s.QueryTagsForTask(userID, task.ID)
		if err == nil {
			task.Tags = tags
		}
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func (s *Handler) GetTaskRoute(w http.ResponseWriter, r *http.Request) {

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

func (s *Handler) GetTasksRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	tasks, err := s.QueryTasks(userID)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return

	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)

}

func (s *Handler) UpdateTask(userID int, id int, task models.Task) error {
	oldTask, err := s.QueryTask(userID, id)
	if err != nil {
		return fmt.Errorf("unable to query task: %v", err)
	}

	var completedAt *time.Time
	if task.IsComplete && !oldTask.IsComplete {
		now := time.Now()
		completedAt = &now
		err = s.checkRecurringTasks(task)
		if err != nil {
			log.Printf("err %v", err)
		}
	} else if oldTask.IsComplete {
		completedAt = oldTask.CompletedAt
	} else {
		completedAt = nil
	}

	log.Printf("completed_at: %v", completedAt)
	_, err = s.DB.Exec(`
		UPDATE tasks SET
			card_pk = $1,
			scheduled_date = $2,
			updated_at = NOW(),
			completed_at = $3,
			title = $4,
			is_complete = $5
		WHERE id = $6 AND user_id = $7 AND is_deleted = FALSE
	`, task.CardPK, task.ScheduledDate, completedAt, task.Title, task.IsComplete, id, userID)

	if err != nil {
		log.Printf("error: %v", err)
		return fmt.Errorf("unable to update task")
	}

	s.AddTagsFromTask(userID, id)
	return nil
}

func (s *Handler) UpdateTaskRoute(w http.ResponseWriter, r *http.Request) {
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

func (s *Handler) CreateTask(task models.Task) (int, error) {
	var taskID int

	log.Printf("user %v", task.UserID)
	err := s.DB.QueryRow(`
	INSERT INTO tasks (card_pk, user_id, scheduled_date, due_date, created_at, updated_at, completed_at, title, is_complete, is_deleted)
	VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, FALSE)
	RETURNING id
	`, task.CardPK, task.UserID, task.ScheduledDate, task.DueDate, task.CompletedAt, task.Title, task.IsComplete).Scan(&taskID)

	if err != nil {
		log.Printf("err %v", err)
		return 0, fmt.Errorf("unable to create task")
	}
	s.AddTagsFromTask(task.UserID, taskID)
	return taskID, nil
}

func (s *Handler) CreateTaskRoute(w http.ResponseWriter, r *http.Request) {
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

func (s *Handler) DeleteTask(userID int, id int) error {
	_, err := s.DB.Exec(`
	UPDATE tasks SET is_deleted = TRUE
	WHERE id = $1 AND user_id = $2
	`, id, userID)

	if err != nil {
		log.Printf("err %v", err)
		return fmt.Errorf("unable to delete task")
	}
	return nil
}

func (s *Handler) DeleteTaskRoute(w http.ResponseWriter, r *http.Request) {
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

func parseRecurringTasks(title string) (models.RecurringTask, bool) {
	patterns := []struct {
		regex       *regexp.Regexp
		frequency   string
		getInterval func([]string) int
	}{
		{
			regex:       regexp.MustCompile(`(?i)every day|daily`),
			frequency:   "daily",
			getInterval: func([]string) int { return 1 },
		},
		{
			regex:     regexp.MustCompile(`(?i)every (\d+) days?`),
			frequency: "daily",
			getInterval: func(matches []string) int {
				interval, _ := strconv.Atoi(matches[1])
				return interval
			},
		},
		// Weekly patterns
		{
			regex:       regexp.MustCompile(`(?i)every week|weekly`),
			frequency:   "weekly",
			getInterval: func([]string) int { return 7 },
		},
		{
			regex:     regexp.MustCompile(`(?i)every (\d+) weeks?`),
			frequency: "weekly",
			getInterval: func(matches []string) int {
				interval, _ := strconv.Atoi(matches[1])
				return interval
			},
		},
		// Monthly patterns
		{
			regex:       regexp.MustCompile(`(?i)every month|monthly`),
			frequency:   "monthly",
			getInterval: func([]string) int { return 30 },
		},
		{
			regex:     regexp.MustCompile(`(?i)every (\d+) months?`),
			frequency: "monthly",
			getInterval: func(matches []string) int {
				interval, _ := strconv.Atoi(matches[1])
				return interval
			},
		},
	}

	lowercaseTitle := strings.ToLower(title)

	for _, pattern := range patterns {
		matches := pattern.regex.FindStringSubmatch(lowercaseTitle)
		if matches != nil {
			return models.RecurringTask{
				Frequency: pattern.frequency,
				Interval:  pattern.getInterval(matches),
			}, true
		}
	}

	return models.RecurringTask{}, false
}
func (s *Handler) checkRecurringTasks(task models.Task) error {
	recurringTask, found := parseRecurringTasks(task.Title)
	if !found {
		return nil
	}
	var scheduledDate time.Time
	now := time.Now()
	scheduledDate = now.AddDate(0, 0, recurringTask.Interval)

	newTask := models.Task{
		CardPK:        task.CardPK,
		UserID:        task.UserID,
		ScheduledDate: &scheduledDate,
		DueDate:       &scheduledDate,
		CompletedAt:   nil,
		Title:         task.Title,
		IsComplete:    false,
	}
	log.Printf("creating recurring task - %v", newTask)
	_, err := s.CreateTask(newTask)
	if err != nil {
		return err
	}
	return nil

}
