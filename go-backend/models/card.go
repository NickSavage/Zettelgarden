package models

import "time"

type Card struct {
	id         int
	card_id    string
	user_id    int
	title      string
	body       string
	link       string
	is_deleted bool
	created_at time.Time
	updated_at time.Time
}
