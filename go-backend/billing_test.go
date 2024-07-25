package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
)

func TestCreateCheckoutSession(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/billing/create_checkout_session", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	//router.HandleFunc("/api/cards/{id}", jwtMiddleware(s.CreateCheckoutSessionRoute))
	router.ServeHTTP(rr, req)

}
