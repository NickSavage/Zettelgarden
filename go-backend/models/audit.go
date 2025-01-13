package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type AuditEvent struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	EntityID   int       `json:"entity_id"`
	EntityType string    `json:"entity_type"` // 'card', 'task', etc.
	Action     string    `json:"action"`      // 'create', 'update', 'delete'
	Details    Details   `json:"details"`
	CreatedAt  time.Time `json:"created_at"`
}

type Details struct {
	ChangeType string                 `json:"change_type"`
	Changes    map[string]FieldChange `json:"changes"`
	CustomData map[string]interface{} `json:"custom_data,omitempty"`
}

type FieldChange struct {
	From interface{} `json:"from"`
	To   interface{} `json:"to"`
}

// Value implements the driver.Valuer interface for Details
func (d Details) Value() (driver.Value, error) {
	return json.Marshal(d)
}

// Scan implements the sql.Scanner interface for Details
func (d *Details) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return json.Unmarshal([]byte(value.(string)), &d)
	}
	return json.Unmarshal(bytes, &d)
}
