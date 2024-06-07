package main

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"
)

func (s *Server) GetUserAdminRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	user, err := s.QueryUser(userID)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	if user.IsAdmin {
		w.WriteHeader(http.StatusNoContent)
	} else {
		w.WriteHeader(http.StatusUnauthorized)
	}

}

// admin protected
func (s *Server) GetUserRoute(w http.ResponseWriter, r *http.Request) {
	log.Printf("aoea")
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}
	user, err := s.QueryUser(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

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
		//	log.Printf("err %v", err)
		return models.User{}, fmt.Errorf("something went wrong")
	}
	return user, nil
}
