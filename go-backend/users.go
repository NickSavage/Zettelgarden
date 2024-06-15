package main

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"os"
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

func (s *Server) GetUsersRoute(w http.ResponseWriter, r *http.Request) {
	users, err := s.QueryUsers()
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)

}

func (s *Server) UpdateUserRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}
	user, _ := s.QueryUser(userID)
	if !user.IsAdmin {
		if user.ID != id {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
	}

	var params models.EditUserParams
	decoder := json.NewDecoder(r.Body)
	err = decoder.Decode(&params)
	if err != nil {
		log.Printf("err? %v", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	user, err = s.UpdateUser(id, params)
	if err != nil {
		log.Printf("?")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)

}

func (s *Server) CreateUserRoute(w http.ResponseWriter, r *http.Request) {
	var params models.CreateUserParams
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&params)
	if err != nil {
		log.Printf("err? %v", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	log.Printf("params %v", params)
	response := models.CreateUserResponse{
		NewID:   0,
		Message: "",
		Error:   false,
	}
	w.Header().Set("Content-Type", "application/json")

	if params.ConfirmPassword != params.Password {
		response.Error = true
		response.Message = "Passwords do not match"
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}
	newID, err := s.CreateUser(params)
	if err != nil {
		response.Error = true
		response.Message = "Passwords do not match"
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}
	user, err := s.QueryUser(newID)
	if err != nil {
		response.Error = true
		response.Message = "Unable to fetch created used"
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return

	}
	response.NewID = newID
	response.Message = "Check your email for a validation email"
	response.User = user

	json.NewEncoder(w).Encode(response)
}

func (s *Server) GetCurrentUserRoute(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value("current_user").(int)

	user, err := s.QueryUser(userID)
	if err != nil {
		log.Printf("user %v", userID)
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (s *Server) GetUserSubscriptionRoute(w http.ResponseWriter, r *http.Request) {

	var userSub models.UserSubscription

	userID := r.Context().Value("current_user").(int)
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	user, err := s.QueryUser(userID)
	if user.ID != id || !user.IsAdmin {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	err = s.db.QueryRow(`
	SELECT 
	id, stripe_customer_id, stripe_subscription_id, 
	stripe_subscription_status,
	stripe_subscription_frequency, stripe_current_plan
	FROM users WHERE id = $1
	`, id).Scan(
		&userSub.ID,
		&userSub.StripeCustomerID,
		&userSub.StripeSubscriptionID,
		&userSub.StripeSubscriptionStatus,
		&userSub.StripeSubscriptionFrequency,
		&userSub.StripeCurrentPlan,
	)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if user.StripeSubscriptionStatus == "active" || user.StripeSubscriptionStatus == "trial" {
		userSub.IsActive = true
	} else {
		userSub.IsActive = false
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userSub)
}

func (s *Server) ResendEmailValidationRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	var response models.GenericResponse
	w.Header().Set("Content-Type", "application/json")
	log.Printf("test")

	user, err := s.QueryUser(userID)
	if err != nil {
		log.Printf("asdas")
		response.Message = err.Error()
		response.Error = true
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}
	if user.EmailValidated {
		log.Printf("here?")
		response.Message = "email already validated"
		response.Error = true
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}
	s.sendEmailValidation(user)

	response.Message = "Email sent, check your inbox."
	response.Error = false
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (s *Server) ValidateEmailRoute(w http.ResponseWriter, r *http.Request) {
	var response models.GenericResponse
	var params models.ValidateEmailParams

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&params)
	if err != nil {
		response.Error = true
		response.Message = err.Error()
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	claims, err := decodeToken(params.Token)
	if err != nil {
		response.Error = true
		response.Message = err.Error()
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}
	user, err := s.QueryUser(claims.Sub)
	if err != nil {
		response.Error = true
		response.Message = "Invalid token"
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	_, err = s.db.Exec(`UPDATE users SET email_validated = TRUE WHERE id = $1`, user.ID)
	if err != nil {
		response.Error = true
		response.Message = err.Error()
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}
	response.Message = "Your email has been validated."
	response.Error = false
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (s *Server) QueryUsers() ([]models.User, error) {

	users := []models.User{}
	rows, err := s.db.Query(`
	SELECT 
	id, username, email, password, created_at, updated_at, 
	is_admin, email_validated, can_upload_files, 
	stripe_subscription_status,max_file_storage 
	FROM users`)
	if err != nil {
		return users, err
	}
	defer rows.Close()
	for rows.Next() {
		var user models.User
		if err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Email,
			&user.Password,
			&user.CreatedAt,
			&user.UpdatedAt,
			&user.IsAdmin,
			&user.EmailValidated,
			&user.CanUploadFiles,
			&user.StripeSubscriptionStatus,
			&user.MaxFileStorage,
		); err != nil {
			return users, err
		}
		if user.StripeSubscriptionStatus == "active" || user.StripeSubscriptionStatus == "trial" {
			user.IsActive = true
		} else {
			user.IsActive = false
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return users, err
	}
	return users, nil
}

func (s *Server) QueryUserByEmail(email string) (models.User, error) {

	var user models.User
	err := s.db.QueryRow(`
	SELECT 
	id, username, email, password, created_at, updated_at, 
	is_admin, email_validated, can_upload_files, 
	stripe_subscription_status,max_file_storage 
	FROM users WHERE email = $1
	`, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Password,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.IsAdmin,
		&user.EmailValidated,
		&user.CanUploadFiles,
		&user.StripeSubscriptionStatus,
		&user.MaxFileStorage,
	)
	if err != nil {
		log.Printf("err %v", err)
		return models.User{}, fmt.Errorf("something went wrong")
	}
	if user.StripeSubscriptionStatus == "active" || user.StripeSubscriptionStatus == "trial" {
		user.IsActive = true
	} else {
		user.IsActive = false
	}
	return user, nil

}
func (s *Server) QueryUser(id int) (models.User, error) {
	var user models.User
	err := s.db.QueryRow(`
	SELECT 
	id, username, email, password, created_at, updated_at, 
	is_admin, email_validated, can_upload_files, 
	stripe_subscription_status,max_file_storage 
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
		&user.StripeSubscriptionStatus,
		&user.MaxFileStorage,
	)
	if err != nil {
		log.Printf("errsd %v", err)
		return models.User{}, fmt.Errorf("something went wrong")
	}
	if user.StripeSubscriptionStatus == "active" || user.StripeSubscriptionStatus == "trial" {
		user.IsActive = true
	} else {
		user.IsActive = false
	}
	return user, nil
}

func (s *Server) UpdateUser(id int, params models.EditUserParams) (models.User, error) {
	user, _ := s.QueryUser(id)
	oldEmail := user.Email

	query := `
	UPDATE users SET username = $1, email = $2, is_admin = $3, updated_at = NOW()
	WHERE
	id = $4
	`
	_, err := s.db.Exec(query, params.Username, params.Email, params.IsAdmin, id)
	if err != nil {
		log.Printf("updateuser err %v", err)
		return models.User{}, err
	}
	user, err = s.QueryUser(id)
	if user.Email != oldEmail {
		_, err := s.db.Exec(`UPDATE users SET email_validated = FALSE WHERE id = $1`, id)
		if err != nil {
			return models.User{}, err
		}
		user, _ := s.QueryUser(id)
		s.sendEmailValidation(user)
	}
	return user, err

}

func (s *Server) CreateUser(params models.CreateUserParams) (int, error) {
	if params.Email == "" {
		return -1, fmt.Errorf("Email is blank.")
	}
	if params.Username == "" {
		return -1, fmt.Errorf("Username is blank.")
	}
	if params.Password == "" {
		return -1, fmt.Errorf("Password is blank.")
	}

	hashedPassword, err := hashPassword(params.Password)
	if err != nil {
		return -1, fmt.Errorf("Unable to hash password")
	}

	_, err = s.QueryUserByEmail(params.Email)
	if err == nil {
		return -1, fmt.Errorf("Email already exists")
	}

	var newID int
	query := `
	INSERT INTO users (username, email, password, created_at, updated_at,
	stripe_customer_id, stripe_subscription_id, stripe_subscription_status, 
	stripe_subscription_frequency, stripe_current_plan
	)
	VALUES ($1, $2, $3, NOW(), NOW(), '', '', '', '', '') RETURNING id
	`

	err = s.db.QueryRow(query, params.Username, params.Email, hashedPassword).Scan(&newID)
	user, _ := s.QueryUser(newID)
	s.sendEmailValidation(user)
	return newID, err
}

func (s *Server) sendEmailValidation(user models.User) error {
	host := os.Getenv("ZETTEL_URL")
	token, err := generateTempToken(user.ID)
	if err != nil {
		return err
	}

	url := host + "/validate?token=" + token
	messageBody := fmt.Sprintf(`
	Welcome to ZettelGarden, %s.

	Please click the following link to confirm your email address: %s.

	Thank you.
	`, user.Username, url)

	s.SendEmail("Please confirm your Zettelgarden email", user.Email, messageBody)
	return nil
}
