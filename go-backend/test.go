package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://fortuna:3000")
		log.Printf("hi")
		//		next.ServeHTTP(w, r)
	}
}

func msain() {
	// Create a new ServeMux
	r := mux.NewRouter()

	// Register your handler
	r.HandleFunc("/", middleware(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("{\"hello\": \"world\"}"))
	})).Methods(http.MethodGet, http.MethodOptions)

	// Wrap your ServeMux with the CORS handler
	r.Use(mux.CORSMethodMiddleware(r))

	// Start the server
	http.ListenAndServe(":8080", r)
}
