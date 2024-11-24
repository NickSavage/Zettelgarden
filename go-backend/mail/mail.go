package mail

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

func NewEmailQueue() *EmailQueue {
	return &EmailQueue{
		queue: make([]Email, 0),
	}
}

// Push adds an email to the queue
func (eq *EmailQueue) Push(email Email) {
	eq.mu.Lock()
	defer eq.mu.Unlock()
	eq.queue = append(eq.queue, email)
}

// Pop removes and returns the first email from the queue
// Returns false if queue is empty
func (eq *EmailQueue) Pop() (Email, bool) {
	eq.mu.Lock()
	defer eq.mu.Unlock()

	if len(eq.queue) == 0 {
		return Email{}, false
	}

	// Get the first email
	email := eq.queue[0]
	// Remove it from the queue
	eq.queue = eq.queue[1:]

	return email, true
}

// Length returns the current size of the queue
func (eq *EmailQueue) Length() int {
	eq.mu.Lock()
	defer eq.mu.Unlock()
	return len(eq.queue)
}

func (m *MailClient) sendMailImpl(email Email) error {
	emailJSON, err := json.Marshal(email)
	if err != nil {
		return err
	}
	// Create a new request
	req, err := http.NewRequest("POST", m.Host+"/api/send", bytes.NewBuffer(emailJSON))
	if err != nil {
		return err
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", m.Password)

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("error with email client: %s", err)
		return err
	}
	defer resp.Body.Close()

	// Check the response status code
	if resp.StatusCode != http.StatusOK {
		log.Printf("failed to send email: %s", resp.Status)
		return fmt.Errorf("failed to send email: %s", resp.Status)
	}
	return nil
}

func (m *MailClient) SendEmail(subject, recipient, body string) error {
	if m.Testing {
		m.TestingEmailsSent += 1
		return nil
	}
	email := Email{
		Subject:   subject,
		Recipient: recipient,
		Body:      body,
	}
	m.Queue.Push(email)
	m.startProcessing()
	log.Printf("?")

	return nil
}

func (m *MailClient) startProcessing() {
	log.Printf("start processing")
	m.mu.Lock()
	if m.isProcessing {
		m.mu.Unlock()
		return
	}
	m.isProcessing = true
	m.mu.Unlock()

	go m.processQueue()
}

func (m *MailClient) processQueue() {
	for {
		// Get next email from queue
		email, ok := m.Queue.Pop()
		if !ok {
			// Queue is empty, stop processing
			m.mu.Lock()
			m.isProcessing = false
			m.mu.Unlock()
			return
		}

		// Send the email
		err := m.sendMailImpl(email)
		if err != nil {
			// Handle error - maybe log it or requeue the email
			log.Printf("Failed to send email: %v", err)
			// Optional: requeue the failed email
			m.Queue.Push(email)
		}

		// Optional: add a small delay between sends
		time.Sleep(100 * time.Millisecond)
	}
}
