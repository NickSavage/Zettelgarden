package main

import (
	"bytes"
	"encoding/json"
	"go-backend/models"
	"log"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strconv"
	"testing"
)

func makeCardRequestSuccess(t *testing.T, id int) *httptest.ResponseRecorder {

	token, _ := generateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/cards/"+strconv.Itoa(id), nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", strconv.Itoa(id))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.getCard))
	handler.ServeHTTP(rr, req)

	return rr
}

func makeCardsRequestSuccess(t *testing.T, params string) *httptest.ResponseRecorder {

	token, _ := generateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/cards/?"+params, nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.getCards))
	handler.ServeHTTP(rr, req)

	return rr
}

func makeCardDeleteRequestSuccess(t *testing.T, id int) *httptest.ResponseRecorder {
	token, _ := generateTestJWT(1)

	req, err := http.NewRequest("DELETE", "/api/cards/"+strconv.Itoa(id), nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", strconv.Itoa(id))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.DeleteCardRoute))
	handler.ServeHTTP(rr, req)

	return rr

}

func TestGetCardSuccess(t *testing.T) {
	setup()
	defer teardown()

	var logCount int
	_ = s.db.QueryRow("SELECT count(*) FROM card_views").Scan(&logCount)
	if logCount != 0 {
		t.Errorf("wrong log count, got %v want %v", logCount, 0)
	}
	rr := makeCardRequestSuccess(t, 1)

	if status := rr.Code; status != http.StatusOK {
		log.Printf("err %v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	_ = s.db.QueryRow("SELECT count(*) FROM card_views").Scan(&logCount)
	if logCount != 1 {
		t.Errorf("wrong log count, got %v want %v", logCount, 1)
	}
	var card models.Card
	parseJsonResponse(t, rr.Body.Bytes(), &card)
	if card.ID != 1 {
		t.Errorf("handler returned wrong card, got %v want %v", card.ID, 1)
	}
	if card.UserID != 1 {
		t.Errorf("handler returned card for wrong user, got %v want %v", card.UserID, 1)
	}

}

func TestGetCardWrongUser(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(2)

	req, err := http.NewRequest("GET", "/api/cards/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.getCard))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
	if rr.Body.String() != "unable to access card\n" {
		t.Errorf("handler returned wrong body, got %v want %v", rr.Body.String(), "unable to access card\n")
	}
	var logCount int
	_ = s.db.QueryRow("SELECT count(*) FROM card_views").Scan(&logCount)
	if logCount != 0 {
		t.Errorf("wrong log count, got %v want %v", logCount, 0)
	}
}

func TestGetParentCardId(t *testing.T) {
	cardID := "SP170/A.1/A.1/A.1/A.1"
	expected := "SP170/A.1/A.1/A.1/A"
	result := getParentIdAlternating(cardID)
	if result != expected {
		t.Errorf("function returned wrong result, got %v want %v", result, expected)
	}

	cardID = "1"
	expected = "1"
	result = getParentIdAlternating(cardID)
	if result != expected {
		t.Errorf("function returned wrong result, got %v want %v", result, expected)
	}

}

func TestGetCardSuccessParent(t *testing.T) {
	setup()
	defer teardown()

	rr := makeCardRequestSuccess(t, 1)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var card models.Card
	parseJsonResponse(t, rr.Body.Bytes(), &card)
	if card.Parent.CardID != card.CardID {
		t.Errorf("wrong card parent returned. got %v want %v", card.Parent.CardID, card.CardID)
	}

}

func TestExtractBacklinks(t *testing.T) {
	text := "This is a sample text with [link1] and [another link]."
	expected := []string{"link1", "another link"}
	result := extractBacklinks(text)

	if !reflect.DeepEqual(result, expected) {
		t.Errorf("Expected %v, but got %v", expected, result)
	}
}

func TestGetCardSuccessChildren(t *testing.T) {
	setup()
	defer teardown()

	rr := makeCardRequestSuccess(t, 1)
	if status := rr.Code; status != http.StatusOK {
		log.Printf("err %v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var card models.Card
	parseJsonResponse(t, rr.Body.Bytes(), &card)
	if len(card.Children) == 0 {
		t.Errorf("children was empty. got %v want %v", len(card.Children), 1)
	}

	expected := "1/A"

	if len(card.Children) > 0 && card.Children[0].CardID != expected {
		t.Errorf("linked to wrong card, got %v want %v", card.Children[0].CardID, expected)

	}

}

func TestGetCardSuccessFiles(t *testing.T) {
	setup()
	defer teardown()

	rr := makeCardRequestSuccess(t, 1)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var card models.Card
	parseJsonResponse(t, rr.Body.Bytes(), &card)
	if len(card.Files) != 1 {
		t.Errorf("wrong number of files associated with card, got %v want %v", len(card.Files), 1)
	}
	var buffer bytes.Buffer
	writer := multipart.NewWriter(&buffer)
	createTestFile(t, buffer, writer)

	token, _ := generateTestJWT(1)
	req, err := http.NewRequest("POST", "/api/files/upload", &buffer)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	rr = httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.uploadFile))

	handler.ServeHTTP(rr, req)

	rr = makeCardRequestSuccess(t, 1)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	parseJsonResponse(t, rr.Body.Bytes(), &card)
	if len(card.Files) != 2 {
		t.Errorf("wrong number of files associated with card, got %v want %v", len(card.Files), 2)
	}

}

func TestGetCardReferencesSuccess(t *testing.T) {
	setup()
	defer teardown()

	rr := makeCardRequestSuccess(t, 1)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var card models.Card
	parseJsonResponse(t, rr.Body.Bytes(), &card)
	if len(card.References) != 2 {
		t.Errorf("wrong number of references associated with card, got %v want %v", len(card.References), 2)
	}
	if len(card.References) > 0 && card.References[0].CardID != "2/A" {
		t.Errorf("wrong card returned as a reference, got %v want %v", card.References[0].CardID, "2/A")
	}

	if len(card.References) > 1 && card.References[1].CardID != "2" {
		t.Errorf("wrong card returned as a reference, got %v want %v", card.References[1].CardID, "2")
	}
}

func TestGetCardsSuccess(t *testing.T) {
	setup()
	defer teardown()

	rr := makeCardsRequestSuccess(t, "")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var cards []models.Card
	parseJsonResponse(t, rr.Body.Bytes(), &cards)
	if len(cards) != 22 {
		t.Errorf("wrong number of cards returned, got %v want %v", len(cards), 22)
	}
}

func TestGetCardsSuccessSearch(t *testing.T) {
	setup()
	defer teardown()

	rr := makeCardsRequestSuccess(t, "search_term=test")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var cards []models.Card
	parseJsonResponse(t, rr.Body.Bytes(), &cards)
	if len(cards) != 1 {
		t.Errorf("wrong number of cards returned, got %v want %v", len(cards), 1)
	}
}

func TestGetCardsSuccessPartial(t *testing.T) {
	setup()
	//defer teardown()

	rr := makeCardsRequestSuccess(t, "partial=true")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var cards []models.PartialCard
	parseJsonResponse(t, rr.Body.Bytes(), &cards)
	if len(cards) != 22 {
		t.Errorf("wrong number of cards returned, got %v want %v", len(cards), 22)
	}
}
func TestGetCardsSuccessPartialSearch(t *testing.T) {
	setup()
	//defer teardown()

	rr := makeCardsRequestSuccess(t, "partial=true&search_term=test")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var cards []models.PartialCard
	parseJsonResponse(t, rr.Body.Bytes(), &cards)
	if len(cards) != 1 {
		t.Errorf("wrong number of cards returned, got %v want %v", len(cards), 1)
	}
}
func TestGetCardsSuccessInactive(t *testing.T) {
	setup()
	defer teardown()

	rr := makeCardsRequestSuccess(t, "inactive=true")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var cards []models.PartialCard
	parseJsonResponse(t, rr.Body.Bytes(), &cards)
	if len(cards) != 22 {
		t.Errorf("wrong number of cards returned, got %v want %v", len(cards), 22)
	}
}

func TestUpdateCardSuccess(t *testing.T) {
	setup()
	defer teardown()

	rr := makeCardRequestSuccess(t, 1)
	var card models.Card
	parseJsonResponse(t, rr.Body.Bytes(), &card)

	token, _ := generateTestJWT(1)

	expected := "asdfasdf"
	newData := map[string]interface{}{
		"title":   expected,
		"body":    expected,
		"card_id": card.CardID,
		"link":    expected,
	}
	jsonData, err := json.Marshal(newData)
	if err != nil {
		log.Fatalf("Error marshalling JSON: %v", err)
	}
	req, err := http.NewRequest("PUT", "/api/cards/1", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr = httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.UpdateCardRoute))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	rr = makeCardRequestSuccess(t, 1)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	parseJsonResponse(t, rr.Body.Bytes(), &card)
	if card.Title != expected {
		t.Errorf("handler return wrong title, ot %v want %v", card.Title, expected)
	}
}

func TestUpdateCardUnauthorized(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(2)

	expected := "asdfasdf"
	newData := map[string]interface{}{
		"title":   expected,
		"body":    expected,
		"card_id": "1",
		"link":    expected,
	}
	jsonData, err := json.Marshal(newData)
	if err != nil {
		log.Fatalf("Error marshalling JSON: %v", err)
	}
	req, err := http.NewRequest("PUT", "/api/cards/1", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.UpdateCardRoute))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}

}

func TestCreateCardSuccess(t *testing.T) {
	setup()
	defer teardown()

	var card models.Card
	var newCard models.Card
	token, _ := generateTestJWT(1)

	expected := "asdfasdf"
	data := models.EditCardParams{
		Title:  expected,
		Body:   expected,
		CardID: "asd",
		Link:   expected,
	}
	jsonData, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", "/api/cards/", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.createCard))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	parseJsonResponse(t, rr.Body.Bytes(), &card)

	rr = makeCardRequestSuccess(t, card.ID)

	parseJsonResponse(t, rr.Body.Bytes(), &newCard)
	if newCard.Title != expected {
		t.Errorf("handler returned wrong card: got %v want %v", newCard.Title, expected)
	}
}

func TestCreateCardDuplicateCardID(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(1)

	expected := "asdfasdf"
	data := models.EditCardParams{
		Title:  expected,
		CardID: "asdf",
		Link:   expected,
	}
	jsonData, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", "/api/cards/", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.createCard))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	req, err = http.NewRequest("POST", "/api/cards/", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr = httptest.NewRecorder()
	handler = http.HandlerFunc(jwtMiddleware(s.createCard))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
	if rr.Body.String() != "card_id already exists\n" {
		t.Errorf("handler returned wrong error message. got %v want %v", rr.Body.String(), "card_id already exists\n")
	}
}

func TestDeleteCardSuccess(t *testing.T) {
	setup()
	defer teardown()

	id := 3
	rr := makeCardDeleteRequestSuccess(t, id)

	if status := rr.Code; status != http.StatusNoContent {
		log.Printf(rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}

	rr = makeCardRequestSuccess(t, id)
	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
	rr = makeCardDeleteRequestSuccess(t, id)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
}

func TestDeleteCardWrongUser(t *testing.T) {
	setup()
	defer teardown()

	token, _ := generateTestJWT(2)

	req, err := http.NewRequest("DELETE", "/api/cards/"+strconv.Itoa(1), nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(jwtMiddleware(s.DeleteCardRoute))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
}
