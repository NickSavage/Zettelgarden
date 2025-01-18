package mail

import (
	"database/sql"
	"sync"
)

type MailClient struct {
	Host              string
	Password          string
	Testing           bool
	TestingEmailsSent int
	Queue             *EmailQueue
	mu                sync.Mutex
	isProcessing      bool
	DB                *sql.DB
}

type Email struct {
	Subject   string `json:"subject"`
	Recipient string `json:"recipient"`
	Body      string `json:"body"`
	IsHTML    bool   `json:"is_html"`
	Retries   int
}

type EmailQueue struct {
	queue []Email
	mu    sync.Mutex
}
