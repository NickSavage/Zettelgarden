package handlers

import (
	"go-backend/models"
	"go-backend/tests"
	"testing"
	"time"

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
}
