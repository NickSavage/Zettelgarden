package models

import "time"

type UserMemory struct {
	ID        uint      `json:"id" gorm:"primary_key"`
	UserID    uint      `json:"user_id"`
	Memory    string    `json:"memory"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
