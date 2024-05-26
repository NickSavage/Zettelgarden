package models

import "time"

type Backlink struct {
	SourceID  string
	TargetID  string
	CreatedAt time.Time
	UpdatedAt time.Time
}
