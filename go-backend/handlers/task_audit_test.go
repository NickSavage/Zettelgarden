package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"go-backend/models"
	"go-backend/tests"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
)

// Helper function to create a test task
func createTestTask(t *testing.T, h *Handler, userID int) models.Task {
	now := time.Now()
	task := models.Task{
		UserID:        userID,
		Title:         "Test Task",
		ScheduledDate: &now,
		DueDate:       &now,
		IsComplete:    false,
	}
	taskID, err := h.CreateTask(task)
	assert.NoError(t, err)

	createdTask, err := h.QueryTask(userID, taskID)
	assert.NoError(t, err)
	return createdTask
}

func TestTaskAuditEvents(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	t.Run("Create task audit event", func(t *testing.T) {
		task := createTestTask(t, s, 1)

		events, err := getAuditEvents(s, "task", task.ID)
		assert.NoError(t, err)
		assert.Len(t, events, 1)

		event := events[0]
		verifyAuditEvent(t, event, 1, task.ID, "task", "create")
		assert.NotNil(t, event.Details.CustomData["initial_state"])
	})

	t.Run("Update task audit event", func(t *testing.T) {
		task := createTestTask(t, s, 1)

		// Update task
		task.Title = "Updated Task"
		task.IsComplete = true
		err := s.UpdateTask(1, task.ID, task)
		assert.NoError(t, err)

		events, err := getAuditEvents(s, "task", task.ID)
		assert.NoError(t, err)
		assert.Len(t, events, 2) // Create + Update

		updateEvent := events[0] // Most recent event
		verifyAuditEvent(t, updateEvent, 1, task.ID, "task", "update")

		changes := updateEvent.Details.Changes
		assert.Contains(t, changes, "Title")
		assert.Equal(t, "Test Task", changes["Title"].From)
		assert.Equal(t, "Updated Task", changes["Title"].To)

		assert.Contains(t, changes, "IsComplete")
		assert.Equal(t, false, changes["IsComplete"].From)
		assert.Equal(t, true, changes["IsComplete"].To)
	})

	t.Run("Delete task audit event", func(t *testing.T) {
		task := createTestTask(t, s, 1)

		err := s.DeleteTask(1, task.ID)
		assert.NoError(t, err)

		events, err := getAuditEvents(s, "task", task.ID)
		assert.NoError(t, err)
		assert.Len(t, events, 2) // Create + Delete

		deleteEvent := events[0] // Most recent event
		verifyAuditEvent(t, deleteEvent, 1, task.ID, "task", "delete")
		assert.NotNil(t, deleteEvent.Details.CustomData["final_state"])
	})

	t.Run("Full task lifecycle", func(t *testing.T) {
		// Create
		task := createTestTask(t, s, 1)

		// Update
		task.Title = "Updated Task"
		err := s.UpdateTask(1, task.ID, task)
		assert.NoError(t, err)

		// Complete
		task.IsComplete = true
		err = s.UpdateTask(1, task.ID, task)
		assert.NoError(t, err)

		// Delete
		err = s.DeleteTask(1, task.ID)
		assert.NoError(t, err)

		events, err := getAuditEvents(s, "task", task.ID)
		assert.NoError(t, err)
		assert.Len(t, events, 4) // Create + 2 Updates + Delete

		// Verify event order
		assert.Equal(t, "delete", events[0].Action)
		assert.Equal(t, "update", events[1].Action) // Complete
		assert.Equal(t, "update", events[2].Action) // Title update
		assert.Equal(t, "create", events[3].Action)
	})

	t.Run("GetTaskAuditEventsRoute", func(t *testing.T) {
		// Create a task and perform some actions to generate audit events
		task := createTestTask(t, s, 1)

		// Update task
		task.Title = "Updated Task"
		err := s.UpdateTask(1, task.ID, task)
		assert.NoError(t, err)

		// Create a new router and register the route
		r := mux.NewRouter()
		r.HandleFunc("/api/tasks/{id}/audit", s.GetTaskAuditEventsRoute).Methods("GET")

		// Create a mock request
		req, err := http.NewRequest("GET", fmt.Sprintf("/api/tasks/%d/audit", task.ID), nil)
		assert.NoError(t, err)

		// Set the context with user ID
		ctx := context.WithValue(req.Context(), "current_user", 1)
		req = req.WithContext(ctx)

		// Create a response recorder
		rr := httptest.NewRecorder()

		// Call the handler through the router
		r.ServeHTTP(rr, req)

		// Check response status
		assert.Equal(t, http.StatusOK, rr.Code, "Handler returned wrong status code: got %v want %v", rr.Code, http.StatusOK)

		// Parse response body
		var events []models.AuditEvent
		err = json.NewDecoder(rr.Body).Decode(&events)
		assert.NoError(t, err, "Error decoding response body: %v", err)

		// Verify events
		assert.Len(t, events, 2, "Expected 2 events, got %d", len(events)) // Should have create and update events
		if len(events) >= 2 {
			assert.Equal(t, "update", events[0].Action)
			assert.Equal(t, "create", events[1].Action)
		}

		// Verify unauthorized access
		req = req.WithContext(context.WithValue(req.Context(), "current_user", 2)) // Different user
		rr = httptest.NewRecorder()
		r.ServeHTTP(rr, req)
		assert.Equal(t, http.StatusNotFound, rr.Code)
	})
}
