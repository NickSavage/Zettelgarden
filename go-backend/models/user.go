package models

import "time"

type User struct {
	ID                          int       `json:"id:`
	Username                    string    `json:"username"`
	Email                       string    `json:"email"`
	Password                    string    `json:"password"`
	CreatedAt                   time.Time `json:"created_at"`
	UpdatedAt                   time.Time `json:"updated_at"`
	IsAdmin                     bool      `json:"is_admin"`
	LastLogin                   time.Time `json:"last_login"`
	EmailValidated              bool      `json:"email_validated"`
	CanUploadFiles              bool      `json:"can_upload_files"`
	MaxFileStorage              int       `json:"max_file_storage"`
	StripeCustomerID            string    `json:"stripe_customer_id"`
	StripeSubscriptionID        string    `json:"stripe_subscription_id"`
	StripeSubscriptionStatus    string    `json:"stripe_subscription_status"`
	StripeSubscriptionFrequency string    `json:"stripe_subscription_frequency"`
	StripeCurrentPlan           string    `json:"stripe_current_plan"`
	IsActive                    bool      `json:"is_active"`
}
