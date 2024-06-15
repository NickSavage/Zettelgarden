package main

import (
	"bytes"
	"encoding/json"
	"go-backend/models"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAuthDecodeToken(t *testing.T) {
	setup()
	defer teardown()

	password := "testest"
	token, err := generateResetToken(2)

	data := models.ResetPasswordParams{
		Token:       token + "asdas",
		NewPassword: password,
	}
	jsonData, _ := json.Marshal(data)

	req, err := http.NewRequest("GET", "/api/reset-password", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.ResetPasswordRoute))
	handler.ServeHTTP(rr, req)
	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}

}
func TestAuthResetPasswordAndLoginSuccess(t *testing.T) {
	setup()
	defer teardown()

	password := "testest"
	token, err := generateResetToken(2)

	data := models.ResetPasswordParams{
		Token:       token,
		NewPassword: password,
	}
	jsonData, _ := json.Marshal(data)

	req, _ := http.NewRequest("GET", "/api/reset-password", bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.ResetPasswordRoute))
	handler.ServeHTTP(rr, req)

	loginData := models.LoginParams{
		Email:    "test@test.com",
		Password: password,
	}
	jsonData, _ = json.Marshal(loginData)
	req, err = http.NewRequest("GET", "/api/login", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}

	rr = httptest.NewRecorder()
	handler = http.HandlerFunc(s.LoginRoute)
	handler.ServeHTTP(rr, req)

	var response models.LoginResponse
	parseJsonResponse(t, rr.Body.Bytes(), &response)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	if response.User.ID != 2 {
		t.Errorf("handler returned wrong user: got %v want %v", response.User, 2)
	}
}

func TestAuthLoginFailure(t *testing.T) {
	setup()
	defer teardown()

	loginData := models.LoginParams{
		Email:    "test@test.com",
		Password: "asdfasdfadf",
	}
	jsonData, _ := json.Marshal(loginData)
	req, err := http.NewRequest("GET", "/api/login", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(s.LoginRoute)
	handler.ServeHTTP(rr, req)

	var response models.LoginResponse
	parseJsonResponse(t, rr.Body.Bytes(), &response)

	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusUnauthorized)
	}
	if response.User.ID != 0 {
		t.Errorf("handler returned a user on a failed login, got user %v", response.User)
	}
	if response.AccessToken != "" {
		t.Errorf("handler returned a token on a failed login, got %v", response.AccessToken)
	}
	if response.Message != "Invalid credentials" {
		t.Errorf("handler returned wrong message, got %v want %v", response.Message, "Invalid credentials")
	}

}

func TestAuthSuccess(t *testing.T) {
	setup()
	defer teardown()
	token, _ := generateResetToken(1)

	req, _ := http.NewRequest("GET", "/api/reset-password", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.CheckTokenRoute))
	handler.ServeHTTP(rr, req)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

}

func TestRequestPasswordResetSuccess(t *testing.T) {
	setup()
	defer teardown()

	sent := s.TestInspector.EmailsSent
	params := models.RequestPasswordResetParams{
		Email: "test@test.com",
	}

	jsonData, _ := json.Marshal(params)
	req, err := http.NewRequest("GET", "/api/request-reset", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(s.RequestPasswordResetRoute)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	if s.TestInspector.EmailsSent == sent {
		t.Errorf("no email was sent when one email should have been sent")
	}
	if s.TestInspector.EmailsSent > sent+1 {
		t.Errorf("more than one email was sent when one email should have been sent")
	}
}

func TestRequestPasswordResetWrongEmail(t *testing.T) {
	setup()
	defer teardown()

	sent := s.TestInspector.EmailsSent
	params := models.RequestPasswordResetParams{
		Email: "wrongemail@test.com",
	}

	jsonData, _ := json.Marshal(params)
	req, err := http.NewRequest("GET", "/api/request-reset", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(s.RequestPasswordResetRoute)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	if s.TestInspector.EmailsSent != sent {
		t.Errorf("email sent when no email should have been sent")
	}
}
