package handlers

import (
	"encoding/json"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

// SummarizeRequest defines the payload for creating a summarization job
type SummarizeRequest struct {
	Text string `json:"text"`
}

// GetSummariesByCardRoute returns all summarizations for a given card_pk
func (h *Handler) GetSummariesByCardRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	cardIDStr := mux.Vars(r)["card_pk"]
	cardID, err := strconv.Atoi(cardIDStr)
	if err != nil {
		http.Error(w, "Invalid card_pk", http.StatusBadRequest)
		return
	}

	rows, err := h.DB.Query(`
		SELECT id, status, COALESCE(result, '')
		FROM summarizations
		WHERE user_id = $1 AND card_pk = $2
		ORDER BY created_at DESC
	`, userID, cardID)
	if err != nil {
		http.Error(w, "Failed to query summarizations", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var summaries []SummarizeJobResponse
	for rows.Next() {
		var job SummarizeJobResponse
		if err := rows.Scan(&job.ID, &job.Status, &job.Result); err != nil {
			http.Error(w, "Error scanning row", http.StatusInternalServerError)
			return
		}
		summaries = append(summaries, job)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summaries)
}

// ListSummarizationsRoute returns all summarization jobs (lightweight view) for the current user
func (h *Handler) ListSummarizationsRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	rows, err := h.DB.Query(`
		SELECT id, status, COALESCE(result, '')
		FROM summarizations
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		http.Error(w, "Failed to query summarizations", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var jobs []SummarizeJobResponse
	for rows.Next() {
		var job SummarizeJobResponse
		if err := rows.Scan(&job.ID, &job.Status, &job.Result); err != nil {
			http.Error(w, "Error scanning row", http.StatusInternalServerError)
			return
		}
		jobs = append(jobs, job)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jobs)
}

type SummarizeJobResponse struct {
	ID     int    `json:"id"`
	Status string `json:"status"`
	Result string `json:"result,omitempty"`
}

func (h *Handler) SummarizeCardIfEligible(userID int, card models.Card) {
	// Skip during testing to avoid external LLM calls
	if h.Server.Testing {
		return
	}

	go func() {
		var id int
		err := h.DB.QueryRow(`
			INSERT INTO summarizations (user_id, card_pk, input_text, status, created_at, updated_at)
			VALUES ($1, $2, $3, 'pending', NOW(), NOW())
			RETURNING id
		`, userID, card.ID, card.Body).Scan(&id)
		if err != nil {
			log.Printf("Failed to create summarization job: %v", err)
			return
		}

		client := llms.NewDefaultClient(h.DB, userID)
		_, _ = h.DB.Exec(`UPDATE summarizations SET status='processing', updated_at=$2 WHERE id=$1`, id, time.Now())

		result, analyses, err := llms.AnalyzeAndSummarizeText(client, card.Body)
		if err != nil {
			_, _ = h.DB.Exec(`UPDATE summarizations SET status='failed', result=$2, updated_at=$3 WHERE id=$1`,
				id, err.Error(), time.Now())
			return
		}

		_, _ = h.DB.Exec(`UPDATE summarizations SET status='complete', result=$2, updated_at=$3 WHERE id=$1`,
			id, result, time.Now())
		// // Save facts from analyses
		// var allFacts []string
		// for _, analysis := range analyses {
		// 	allFacts = append(allFacts, analysis.Facts...)
		// }
		// _ = h.ExtractSaveCardFacts(userID, card, allFacts)

	}()
}

// CreateSummarizationRoute creates a summarization job and runs it asynchronously
func (h *Handler) CreateSummarizationRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	var req SummarizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var id int
	err := h.DB.QueryRow(`
		INSERT INTO summarizations (user_id, input_text, status, created_at, updated_at)
		VALUES ($1, $2, 'pending', NOW(), NOW())
		RETURNING id
	`, userID, req.Text).Scan(&id)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, "Failed to create summarization job", http.StatusInternalServerError)
		return
	}

	// Spin off background summarization
	go func(jobID int, text string, uid int) {
		client := llms.NewDefaultClient(h.DB, uid)
		_, _ = h.DB.Exec(`UPDATE summarizations SET status='processing', updated_at=$2 WHERE id=$1`, jobID, time.Now())

		result, _, err := llms.AnalyzeAndSummarizeText(client, text)
		if err != nil {
			_, _ = h.DB.Exec(`UPDATE summarizations SET status='failed', result=$2, updated_at=$3 WHERE id=$1`, jobID, err.Error(), time.Now())
			return
		}

		_, _ = h.DB.Exec(`UPDATE summarizations SET status='complete', result=$2, updated_at=$3 WHERE id=$1`, jobID, result, time.Now())
	}(id, req.Text, userID)

	resp := SummarizeJobResponse{ID: id, Status: "pending"}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GetSummarizationRoute fetches a summarization job by id
func (h *Handler) GetSummarizationRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	idStr := mux.Vars(r)["id"]
	jobID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var job models.Summarization
	err = h.DB.QueryRow(`
		SELECT id, user_id, input_text, status, COALESCE(result, ''), created_at, updated_at
		FROM summarizations
		WHERE id=$1 AND user_id=$2
	`, jobID, userID).Scan(
		&job.ID,
		&job.UserID,
		&job.InputText,
		&job.Status,
		&job.Result,
		&job.CreatedAt,
		&job.UpdatedAt,
	)
	if err != nil {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	resp := SummarizeJobResponse{
		ID:     job.ID,
		Status: job.Status,
		Result: job.Result,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
