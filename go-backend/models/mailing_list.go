package models

import (
	"time"
)

type MailingList struct {
	ID               int       `json:"id"`
	Email            string    `json:"email"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	WelcomeEmailSent bool      `json:"welcome_email_sent"`
}
