package main

import (
	"testing"
)

func TestLoadDatabase(t *testing.T) {
	setup()
	defer teardown()

	var err error

	if err = s.db.Ping(); err != nil {
		t.Errorf("Cannot reach database")
	}
	var count int
	err = s.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to query users table: %v", err)
	}

	if count != 10 {
		t.Errorf("Expected 10 records in users table, but got %d", count)
	}
}
