package handlers

import (
	"go-backend/tests"
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
