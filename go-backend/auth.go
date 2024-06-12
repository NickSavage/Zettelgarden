package main

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func generateResetToken(id int) (string, error) {
	expirationTime := time.Now().Add(5 * time.Minute)

	claims := models.Claims{
		Sub:   id,
		Fresh: true,
		Type:  "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Create the token with the claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// Sign the token with the secret key
	tokenString, err := token.SignedString(s.jwt_secret_key)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
func decodeToken(tokenStr string) (*models.Claims, error) {
	claims := &models.Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return s.jwt_secret_key, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

func generateAccessToken(userID int) (string, error) {
	expirationTime := time.Now().Add(15 * 24 * time.Hour)

	claims := &models.Claims{
		Sub:   userID,
		Fresh: true,
		Type:  "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.jwt_secret_key)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (s *Server) ResetPasswordRoute(w http.ResponseWriter, r *http.Request) {

	var params models.ResetPasswordParams

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&params)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	claims, err := decodeToken(params.Token)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	user, err := s.QueryUser(claims.Sub)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	hashedPassword, err := hashPassword(params.NewPassword)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	_, err = s.db.Exec("UPDATE users SET password = $1 WHERE id = $2", hashedPassword, user.ID)
	if err != nil {
		http.Error(w, "Error updating password", http.StatusInternalServerError)
		return
	}

	response := models.ResetPasswordResponse{
		Message: "Your password has been updated",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	w.WriteHeader(http.StatusOK)
}

func (s *Server) LoginRoute(w http.ResponseWriter, r *http.Request) {

	var params models.LoginParams
	var response models.LoginResponse
	w.Header().Set("Content-Type", "application/json")

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&params)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	user, err := s.QueryUserByEmail(params.Email)
	if err != nil {
		log.Printf("err %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if !checkPasswordHash(params.Password, user.Password) {
		response.Message = "Invalid credentials"
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(response)
		return
	}

	accessToken, err := generateAccessToken(user.ID)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	user.Password = "" // Remove password from user data
	response.User = user
	response.AccessToken = accessToken

	json.NewEncoder(w).Encode(response)

	s.LogLastLogin(user)
}
