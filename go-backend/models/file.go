package models

import "time"

type File struct {
	ID        int         `json:"id"`
	Name      string      `json:"name"`
	Filetype  string      `json:"filetype"`
	Path      string      `json:"path"`
	Filename  string      `json:"filename"`
	Size      int         `json:"size"`
	CreatedBy int         `json:"created_by"`
	UpdatedBy int         `json:"updated_by"`
	CardPK    int         `json:"card_pk"`
	IsDeleted bool        `json:"is_deleted"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
	Card      PartialCard `json:"card"`
}

type EditFileMetadataParams struct {
	Name string `json:"name"`
}

type UploadFileResponse struct {
	Message string `json:"message"`
	File    File   `json:"file"`
}
