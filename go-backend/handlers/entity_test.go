package handlers

import (
	"go-backend/models"
	"go-backend/tests"
	"strings"
	"testing"
)

func TestMergeEntitiesSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Perform merge using pre-loaded test data
	err := s.MergeEntities(1, 1, 2)
	if err != nil {
		t.Errorf("MergeEntities failed: %v", err)
	}

	// Verify entity2 is deleted
	var count int
	err = s.DB.QueryRow("SELECT COUNT(*) FROM entities WHERE id = $1", 2).Scan(&count)
	if err != nil {
		t.Errorf("Failed to check entity2 deletion: %v", err)
	}
	if count != 0 {
		t.Errorf("Entity2 was not deleted")
	}

	// Verify all card relationships were merged
	err = s.DB.QueryRow("SELECT COUNT(*) FROM entity_card_junction WHERE entity_id = $1", 1).Scan(&count)
	if err != nil {
		t.Errorf("Failed to count relationships: %v", err)
	}
	if count != 2 {
		t.Errorf("Expected 2 card relationships, got %d", count)
	}
}

func TestMergeEntitiesWrongUser(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Try to merge entities belonging to different users
	err := s.MergeEntities(1, 1, 3)
	if err == nil {
		t.Error("Expected error when merging entities from different users")
	}

	// Verify both entities still exist
	var count int
	err = s.DB.QueryRow("SELECT COUNT(*) FROM entities WHERE id IN ($1, $2)", 1, 3).Scan(&count)
	if err != nil {
		t.Errorf("Failed to count entities: %v", err)
	}
	if count != 2 {
		t.Errorf("Expected both entities to still exist, got count %d", count)
	}
}

func TestMergeEntitiesNonExistent(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Try to merge with non-existent entity
	err := s.MergeEntities(1, 1, 99999)
	if err == nil {
		t.Error("Expected error when merging with non-existent entity")
	}
}

func TestDeleteEntitySuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Delete entity using pre-loaded test data
	err := s.DeleteEntity(1, 1)
	if err != nil {
		t.Errorf("DeleteEntity failed: %v", err)
	}

	// Verify entity is deleted
	var count int
	err = s.DB.QueryRow("SELECT COUNT(*) FROM entities WHERE id = $1", 1).Scan(&count)
	if err != nil {
		t.Errorf("Failed to check entity deletion: %v", err)
	}
	if count != 0 {
		t.Errorf("Entity was not deleted")
	}

	// Verify entity-card relationships are deleted
	err = s.DB.QueryRow("SELECT COUNT(*) FROM entity_card_junction WHERE entity_id = $1", 1).Scan(&count)
	if err != nil {
		t.Errorf("Failed to check relationship deletion: %v", err)
	}
	if count != 0 {
		t.Errorf("Entity relationships were not deleted")
	}
}

func TestDeleteEntityWrongUser(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Try to delete entity belonging to different user
	err := s.DeleteEntity(2, 1) // Assuming entity 1 belongs to user 1
	if err == nil {
		t.Error("Expected error when deleting entity belonging to different user")
	}

	// Verify entity still exists
	var count int
	err = s.DB.QueryRow("SELECT COUNT(*) FROM entities WHERE id = $1", 1).Scan(&count)
	if err != nil {
		t.Errorf("Failed to count entities: %v", err)
	}
	if count != 1 {
		t.Errorf("Entity should still exist, got count %d", count)
	}
}

func TestDeleteEntityNonExistent(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Try to delete non-existent entity
	err := s.DeleteEntity(1, 99999)
	if err == nil {
		t.Error("Expected error when deleting non-existent entity")
	}
}

func TestUpdateEntitySuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Update entity using pre-loaded test data
	params := UpdateEntityRequest{
		Name:        "Updated Entity",
		Description: "Updated description",
		Type:        "Updated type",
	}
	err := s.UpdateEntity(1, 1, params)
	if err != nil {
		t.Errorf("UpdateEntity failed: %v", err)
	}

	// Verify entity was updated
	var name, description, entityType string
	err = s.DB.QueryRow("SELECT name, description, type FROM entities WHERE id = $1", 1).Scan(&name, &description, &entityType)
	if err != nil {
		t.Errorf("Failed to check entity update: %v", err)
	}
	if name != params.Name || description != params.Description || entityType != params.Type {
		t.Errorf("Entity was not updated correctly")
	}
}

func TestUpdateEntityDuplicateName(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// First create another entity with a known name, using a high ID to avoid conflicts
	_, err := s.DB.Exec(`
		INSERT INTO entities (id, user_id, name, description, type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
		9999, 1, "Existing Entity", "Test description", "concept")
	if err != nil {
		t.Fatalf("Failed to create test entity: %v", err)
	}

	// Try to update entity with a name that already exists
	params := UpdateEntityRequest{
		Name:        "Existing Entity", // Try to update to the name we just created
		Description: "Updated description",
		Type:        "Updated type",
	}
	err = s.UpdateEntity(1, 1, params)
	if err == nil {
		t.Error("Expected error when updating entity with duplicate name")
	}
	if !strings.Contains(err.Error(), "already exists") {
		t.Errorf("Expected 'already exists' error, got: %v", err)
	}
}

func TestUpdateEntityWrongUser(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Try to update entity belonging to different user
	params := UpdateEntityRequest{
		Name:        "Updated Entity",
		Description: "Updated description",
		Type:        "Updated type",
	}
	err := s.UpdateEntity(2, 1, params) // Assuming entity 1 belongs to user 1
	if err == nil {
		t.Error("Expected error when updating entity belonging to different user")
	}
}

func TestUpdateEntityNonExistent(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Try to update non-existent entity
	params := UpdateEntityRequest{
		Name:        "Updated Entity",
		Description: "Updated description",
		Type:        "Updated type",
	}
	err := s.UpdateEntity(1, 99999, params)
	if err == nil {
		t.Error("Expected error when updating non-existent entity")
	}
}

func TestUpdateEntityWithCardPK(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Create a test card
	var cardID int
	err := s.DB.QueryRow(`
		INSERT INTO cards (user_id, title, body)
		VALUES ($1, 'Test Card', 'Test Content')
		RETURNING id
	`, 1).Scan(&cardID)
	if err != nil {
		t.Fatalf("Failed to create test card: %v", err)
	}

	// Update entity with card_pk
	params := UpdateEntityRequest{
		Name:        "Updated Entity",
		Description: "Updated Description",
		Type:        "person",
		CardPK:      &cardID,
	}

	err = s.UpdateEntity(1, 1, params)
	if err != nil {
		t.Errorf("UpdateEntity failed: %v", err)
	}

	// Verify the update
	var entity models.Entity
	err = s.DB.QueryRow(`
		SELECT id, user_id, name, description, type, card_pk
		FROM entities
		WHERE id = $1
	`, 1).Scan(
		&entity.ID,
		&entity.UserID,
		&entity.Name,
		&entity.Description,
		&entity.Type,
		&entity.CardPK,
	)
	if err != nil {
		t.Errorf("Failed to verify entity update: %v", err)
	}
	if *entity.CardPK != cardID {
		t.Errorf("Expected card_pk to be %d, got %d", cardID, *entity.CardPK)
	}
}

func TestUpdateEntityWithInvalidCardPK(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Try to update with non-existent card
	invalidCardID := 99999
	params := UpdateEntityRequest{
		Name:        "Updated Entity",
		Description: "Updated Description",
		Type:        "person",
		CardPK:      &invalidCardID,
	}

	err := s.UpdateEntity(1, 1, params)
	if err == nil {
		t.Error("Expected error when updating with invalid card_pk")
	}
	if !strings.Contains(err.Error(), "card not found") {
		t.Errorf("Expected 'card not found' error, got: %v", err)
	}
}
