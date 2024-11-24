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
        SELECT id, welcome_email_sent 
        FROM mailing_list 
        WHERE email = $1
    `

	var existingId int
	var sent bool
	err := m.DB.QueryRow(checkQuery, email).Scan(&existingId, &sent)

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
	if !sent {
		m.SendWelcomeEmail(email)
	}
	return nil
}
func (m *MailClient) SendWelcomeEmail(email string) error {
	welcomeEmail := Email{
		Subject:   "Welcome to Zettelgarden! 🌱",
		Recipient: email,
		Body: `
Hi there! 👋

Thank you for signing up for updates about Zettelgarden! We're excited to have you join our community of knowledge gardeners.

Zettelgarden is an open-source project aimed at helping people organize and grow their ideas. If you're interested in checking out the code or contributing, you can find our GitHub repository here: https://github.com/NickSavage/Zettelgarden  

We'll keep you updated on new features, improvements, and tips for getting the most out of Zettelgarden. Feel free to reply to this email if you have any questions or suggestions.

Happy gardening! 🌳

Best regards,
Nick
Zettelgarden Team

P.S. Want to have a say in Zettelgarden's development? Star us on GitHub ⭐ and join the conversation! 💬`,
	}

	// Send the welcome email
	err := m.SendEmail(welcomeEmail.Subject, welcomeEmail.Recipient, welcomeEmail.Body)
	if err != nil {
		log.Printf("Error sending welcome email to %s: %v", email, err)
		return err
	}

	// Update the database to mark welcome email as sent
	updateQuery := `
        UPDATE mailing_list 
        SET welcome_email_sent = true 
        WHERE email = $1
    `

	_, err = m.DB.Exec(updateQuery, email)
	if err != nil {
		log.Printf("Error updating welcome_email_sent status: %v", err)
		return fmt.Errorf("Error updating welcome email status: %v", err)
	}

	return nil
}
