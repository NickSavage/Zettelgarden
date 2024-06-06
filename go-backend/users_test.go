package main

import (
	"log"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestUserGetAdmin(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/admin", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.getUserAdmin))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNoContent {
		log.Printf("err %v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}
}
func TestUserGetAdminFailure(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(2)

	req, err := http.NewRequest("GET", "/api/admin", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.getUserAdmin))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusUnauthorized {
		log.Printf("err %v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusUnauthorized)
	}
}
