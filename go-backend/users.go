package main

import (
	"log"
	"net/http"
)

func (s *Server) getUserAdmin(w http.ResponseWriter, r *http.Request) {
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
