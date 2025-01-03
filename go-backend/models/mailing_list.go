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
	Subscribed       bool      `json:"subscribed"`
}

type MailingListMessage struct {
	ID              int       `json:"id"`
	Subject         string    `json:"subject"`
	Body            string    `json:"body"`
	SentAt          time.Time `json:"sent_at"`
	TotalRecipients int       `json:"total_recipients"`
}

type MailingListRecipient struct {
	ID             int       `json:"id"`
	MessageID      int       `json:"message_id"`
	RecipientEmail string    `json:"recipient_email"`
	RecipientType  string    `json:"recipient_type"` // 'to' or 'bcc'
	SentAt         time.Time `json:"sent_at"`
}
