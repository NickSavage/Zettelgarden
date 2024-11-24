package mail

import (
	"fmt"
	"log"
	// "net/http"
)

func (m *MailClient) HandleAddToMailingList(email string) error {
	query := `
            INSERT INTO mailing_list (email)
            VALUES ($1)
            RETURNING id`

	var id int
	err := m.DB.QueryRow(query, email).Scan(&id)
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
