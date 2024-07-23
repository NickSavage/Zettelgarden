package models

import "time"

type StripePlan struct {
	ID              int       `json:"id"`
	StripeProductID string    `json:"stripe_product_id"`
	StripePriceID   string    `json:"stripe_price_id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	Active          bool      `json:"active"`
	UnitAmount      int       `json:"unit_amount"`
	Currency        string    `json:"currency"`
	Interval        string    `json:"interval"`
	IntervalCount   int       `json:"interval_count"`
	TrialDays       int       `json:"trial_days"`
	Metadata        string    `json:"metadata"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
