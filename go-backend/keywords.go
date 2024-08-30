package main

import (
	//	"database/sql"
	"encoding/json"
	//	"fmt"
	"go-backend/llms"
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
	card, err := s.QueryFullCard(userID, id)
	if err != nil {
		http.Error(w, "unable to find card: "+err.Error(), http.StatusNotFound)
	}
	err = s.replaceCardKeywords(userID, card, params.Keywords)

	if err != nil {
		log.Fatal(err)
	}
}

func (s *Server) UpdateCardKeywords(userID int, card models.Card) error {
	keywords, err := llms.ComputeCardKeywords(s.db, userID, card)
	if err != nil {
		log.Printf("err %v", err)
		return err
	}
	err = s.replaceCardKeywords(userID, card, keywords.Keywords)
	return err
}

func (s *Server) replaceCardKeywords(userID int, card models.Card, keywords []string) error {
	log.Printf("replacing keywords")
	tx, err := s.db.Begin()
	_, err = tx.Exec("DELETE FROM keywords WHERE card_pk = $1 AND user_id = $2", card.ID, userID)
	if err != nil {
		log.Printf("err2 %v", err)
		return nil
	}
	for _, keyword := range keywords {
		_, err = tx.Exec("INSERT INTO keywords (user_id, card_pk, keyword) VALUES ($1, $2, $3)", userID, card.ID, keyword)
		if err != nil {
			log.Printf("error %v", err)
			return err
		}
	}
	err = tx.Commit()
	if err != nil {
		log.Fatal(err)
	}
	return nil

}
