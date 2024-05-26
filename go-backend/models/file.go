package models

import "time"

type File struct {
	id         int
	name       string
	filetype   string
	path       string
	filename   string
	size       int
	created_by int
	updated_by int
	card_pk    int
	is_deleted bool
	created_at time.Time
	updated_at time.Time
}
