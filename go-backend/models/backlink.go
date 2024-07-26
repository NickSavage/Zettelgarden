package models

import "time"

type Backlink struct {
	SourceIDInt int
	TargetIDInt int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
