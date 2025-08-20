package handlers

import (
	"encoding/json"
	"go-backend/llms"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

// SummarizeRequest defines the payload for creating a summarization job
type SummarizeRequest struct {
	Text  string `json:"text"`
	Model string `json:"model,omitempty"`
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
	ID               int     `json:"id"`
	Status           string  `json:"status"`
	Result           string  `json:"result,omitempty"`
	PromptTokens     int     `json:"prompt_tokens,omitempty"`
	CompletionTokens int     `json:"completion_tokens,omitempty"`
	TotalTokens      int     `json:"total_tokens,omitempty"`
	Cost             float64 `json:"cost,omitempty"`
	Model            string  `json:"model,omitempty"`
}

func (h *Handler) SummarizeCardIfEligible(userID int, card models.Card) {
	// Skip during testing to avoid external LLM calls
	if h.Server.Testing {
		return
	}

	wordCount := len(strings.Fields(card.Body))
	if wordCount < 100 {
		return
	}

	_, err := h.runSummarizationJob(userID, card.Body, &card.ID)
	if err != nil {
		log.Printf("Failed to create summarization job: %v", err)
	}
}

// CreateSummarizationRoute creates a summarization job and runs it asynchronously
func (h *Handler) CreateSummarizationRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	var req SummarizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	id, err := h.runSummarizationJob(userID, req.Text, nil)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, "Failed to create summarization job", http.StatusInternalServerError)
		return
	}

	resp := SummarizeJobResponse{ID: id, Status: "pending"}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// runSummarizationJob inserts a summarization job and runs it asynchronously.
func (h *Handler) runSummarizationJob(userID int, text string, cardPK *int) (int, error) {
	var id int
	var err error

	if cardPK != nil {
		err = h.DB.QueryRow(`
			INSERT INTO summarizations (user_id, card_pk, input_text, status, created_at, updated_at)
			VALUES ($1, $2, $3, 'pending', NOW(), NOW())
			RETURNING id
		`, userID, *cardPK, text).Scan(&id)
	} else {
		err = h.DB.QueryRow(`
			INSERT INTO summarizations (user_id, input_text, status, created_at, updated_at)
			VALUES ($1, $2, 'pending', NOW(), NOW())
			RETURNING id
		`, userID, text).Scan(&id)
	}
	if err != nil {
		return 0, err
	}

	// Background job
	go func(jobID int, t string, uid int) {
		client := llms.NewDefaultClient(h.DB, uid)
		_, _ = h.DB.Exec(`UPDATE summarizations SET status='processing', updated_at=$2 WHERE id=$1`, jobID, time.Now())

		result, analyses, usage, err := llms.AnalyzeAndSummarizeText(client, t)
		if err != nil {
			_, _ = h.DB.Exec(`UPDATE summarizations SET status='failed', result=$2, updated_at=$3 WHERE id=$1`,
				jobID, err.Error(), time.Now())
			return
		}

		modelName := client.Model.ModelIdentifier

		_, _ = h.DB.Exec(`UPDATE summarizations 
			SET status='complete', result=$2, prompt_tokens=$3, completion_tokens=$4, total_tokens=$5, cost=$6, model=$7, updated_at=$8 
			WHERE id=$1`,
			jobID, result, usage.PromptTokens, usage.CompletionTokens, usage.TotalTokens, usage.TotalCost, modelName, time.Now())

		if cardPK != nil {
			var allFacts []string

			for _, analysis := range analyses {
				allFacts = append(allFacts, analysis.Facts...)
			}
			_ = h.ExtractSaveCardFacts(userID, *cardPK, allFacts)

		}
	}(id, text, userID)

	return id, nil
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
		SELECT id, user_id, input_text, status, COALESCE(result, ''), 
		       prompt_tokens, completion_tokens, total_tokens, cost,
		       created_at, updated_at
		FROM summarizations
		WHERE id=$1 AND user_id=$2
	`, jobID, userID).Scan(
		&job.ID,
		&job.UserID,
		&job.InputText,
		&job.Status,
		&job.Result,
		&job.PromptTokens,
		&job.CompletionTokens,
		&job.TotalTokens,
		&job.Cost,
		&job.Model,
		&job.CreatedAt,
		&job.UpdatedAt,
	)
	if err != nil {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	resp := SummarizeJobResponse{
		ID:               job.ID,
		Status:           job.Status,
		Result:           job.Result,
		PromptTokens:     job.PromptTokens,
		CompletionTokens: job.CompletionTokens,
		TotalTokens:      job.TotalTokens,
		Cost:             job.Cost,
		Model:            job.Model,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
