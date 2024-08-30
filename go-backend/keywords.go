package main

import (
	//	"database/sql"
	"encoding/json"
	//	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func (s *Server) PutCardKeywordsRoute(w http.ResponseWriter, r *http.Request) {

	var params models.PutCardKeywordsParams
	userID := r.Context().Value("current_user").(int)
	id, err := strconv.Atoi(mux.Vars(r)["id"])

	log.Printf("card %v", id)
	decoder := json.NewDecoder(r.Body)
	err = decoder.Decode(&params)

	if err != nil {
		log.Printf("err? %v", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)

		return
	}

	tx, err := s.db.Begin()
	_, err = tx.Exec("DELETE FROM keywords WHERE card_pk = $1 AND user_id = $2", id, userID)
	if err != nil {
		log.Printf("err2 %v", err)

		http.Error(w, "unable to delete keywords: "+err.Error(), http.StatusBadRequest)
		return
	}
	for _, keyword := range params.Keywords {
		_, err = tx.Exec("INSERT INTO keywords (user_id, card_pk, keyword) VALUES ($1, $2, $3)", userID, id, keyword)
		if err != nil {
			log.Printf("error %v", err)
			http.Error(w, "unable to create keywords: "+err.Error(), http.StatusBadRequest)
			return
		}
	}
	err = tx.Commit()
	if err != nil {
		log.Fatal(err)
	}
}
