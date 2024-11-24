package mail

import (
	"fmt"
	"log"
	// "net/http"
	"database/sql"
)

func (m *MailClient) HandleAddToMailingList(email string) error {
	// First check if email already exists
	checkQuery := `
        SELECT id 
        FROM mailing_list 
        WHERE email = $1
    `

	var existingId int
	err := m.DB.QueryRow(checkQuery, email).Scan(&existingId)

	// If email is found, return error indicating it already exists
	if err == nil {
		return fmt.Errorf("Email %s is already registered", email)
	}

	// If error is anything other than no rows found, return the error
	if err != sql.ErrNoRows {
		log.Printf("Error checking existing email: %v", err)
		return fmt.Errorf("Error checking existing email: %v", err)
	}

	query := `
            INSERT INTO mailing_list (email)
            VALUES ($1)
            RETURNING id`

	var id int
	err = m.DB.QueryRow(query, email).Scan(&id)
	if err != nil {
		log.Printf("Error adding email to mailing list: %v", err)
		return fmt.Errorf("Error adding email to mailing list: %v", err)
	}

	adminEmail := Email{
		Subject:   "New mailing list registered at Zettelgarden",
		Recipient: "nick@nicksavage.ca",
		Body:      fmt.Sprintf("A new email has registered at for the Zettelgarden mailing list: %v", email),
	}

	m.SendEmail(adminEmail.Subject, adminEmail.Recipient, adminEmail.Body)
	return nil
}
