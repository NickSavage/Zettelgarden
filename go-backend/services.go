package main

import (
	"fmt"
	"go-backend/models"
	"log"
)

func (s *Server) QueryUser(id int) (models.User, error) {
	var user models.User
	err := s.db.QueryRow(`
	SELECT 
	id, username, email, password, created_at, updated_at, 
	is_admin, email_validated, can_upload_files, 
	max_file_storage 
	FROM users WHERE id = $1
	`, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Password,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.IsAdmin,
		&user.EmailValidated,
		&user.CanUploadFiles,
		&user.MaxFileStorage,
	)
	if err != nil {
		log.Printf("err %v", err)
		return models.User{}, fmt.Errorf("something went wrong")
	}
	return user, nil
}
