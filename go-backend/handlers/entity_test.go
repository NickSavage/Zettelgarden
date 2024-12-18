package handlers

import (
	"fmt"
	"go-backend/models"
	"go-backend/tests"
	"testing"
	"time"

	"github.com/pgvector/pgvector-go"
)

func setupTestEntities(s *Handler, testName string) error {
	// Create test vector
	vectorData := make([]float32, 1024)
	for i := range vectorData {
		vectorData[i] = float32(i)
	}
	vector := pgvector.NewVector(vectorData)

	// Start transaction
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Create test entities with unique names per test
	entities := []models.Entity{
		{
			UserID:      1,
			Name:        fmt.Sprintf("Test Entity 1 - %s", testName),
			Description: "Original entity",
			Type:        "person",
			Embedding:   vector,
		},
		{
			UserID:      1,
			Name:        fmt.Sprintf("Test Entity 2 - %s", testName),
			Description: "Duplicate entity",
			Type:        "person",
			Embedding:   vector,
		},
		{
			UserID:      2,
			Name:        fmt.Sprintf("Other User Entity - %s", testName),
			Description: "Entity for different user",
			Type:        "person",
			Embedding:   vector,
		},
	}

	for _, entity := range entities {
		var entityID int
		err := tx.QueryRow(`
			INSERT INTO entities (user_id, name, description, type, embedding, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id`,
			entity.UserID, entity.Name, entity.Description, entity.Type, entity.Embedding,
			time.Now(), time.Now(),
		).Scan(&entityID)
		if err != nil {
			return err
		}

		// Add some card relationships for the first two entities
		if entity.UserID == 1 {
			_, err = tx.Exec(`
				INSERT INTO entity_card_junction (user_id, entity_id, card_pk)
				VALUES ($1, $2, $3), ($1, $2, $4)`,
				entity.UserID, entityID, 1, 2)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

func TestMergeEntitiesSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Setup test entities
	err := setupTestEntities(s, "success")
	if err != nil {
		t.Fatalf("Failed to setup test entities: %v", err)
	}

	// Get the IDs of the test entities
	var entity1ID, entity2ID int
	err = s.DB.QueryRow("SELECT id FROM entities WHERE name = $1", "Test Entity 1 - success").Scan(&entity1ID)
	if err != nil {
		t.Fatalf("Failed to get entity1 ID: %v", err)
	}
	err = s.DB.QueryRow("SELECT id FROM entities WHERE name = $1", "Test Entity 2 - success").Scan(&entity2ID)
	if err != nil {
		t.Fatalf("Failed to get entity2 ID: %v", err)
	}

	// Perform merge
	err = s.MergeEntities(1, entity1ID, entity2ID)
	if err != nil {
		t.Errorf("MergeEntities failed: %v", err)
	}

	// Verify entity2 is deleted
	var count int
	err = s.DB.QueryRow("SELECT COUNT(*) FROM entities WHERE id = $1", entity2ID).Scan(&count)
	if err != nil {
		t.Errorf("Failed to check entity2 deletion: %v", err)
	}
	if count != 0 {
		t.Errorf("Entity2 was not deleted")
	}

	// Verify all card relationships were merged
	err = s.DB.QueryRow("SELECT COUNT(*) FROM entity_card_junction WHERE entity_id = $1", entity1ID).Scan(&count)
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

	// Setup test entities
	err := setupTestEntities(s, "wrong-user")
	if err != nil {
		t.Fatalf("Failed to setup test entities: %v", err)
	}

	// Get the IDs of the test entities
	var entity1ID int
	var otherUserEntityID int
	err = s.DB.QueryRow("SELECT id FROM entities WHERE name = $1", "Test Entity 1 - wrong-user").Scan(&entity1ID)
	if err != nil {
		t.Fatalf("Failed to get entity1 ID: %v", err)
	}
	err = s.DB.QueryRow("SELECT id FROM entities WHERE name = $1", "Other User Entity - wrong-user").Scan(&otherUserEntityID)
	if err != nil {
		t.Fatalf("Failed to get other user entity ID: %v", err)
	}

	// Try to merge entities belonging to different users
	err = s.MergeEntities(1, entity1ID, otherUserEntityID)
	if err == nil {
		t.Error("Expected error when merging entities from different users")
	}

	// Verify both entities still exist
	var count int
	err = s.DB.QueryRow("SELECT COUNT(*) FROM entities WHERE id IN ($1, $2)", entity1ID, otherUserEntityID).Scan(&count)
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

	// Setup test entities
	err := setupTestEntities(s, "non-existent")
	if err != nil {
		t.Fatalf("Failed to setup test entities: %v", err)
	}

	var entity1ID int
	err = s.DB.QueryRow("SELECT id FROM entities WHERE name = $1", "Test Entity 1 - non-existent").Scan(&entity1ID)
	if err != nil {
		t.Fatalf("Failed to get entity1 ID: %v", err)
	}

	// Try to merge with non-existent entity
	err = s.MergeEntities(1, entity1ID, 99999)
	if err == nil {
		t.Error("Expected error when merging with non-existent entity")
	}
}
