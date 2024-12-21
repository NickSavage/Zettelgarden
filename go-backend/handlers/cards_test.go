package handlers

import (
	"bytes"
	"encoding/json"
	"go-backend/models"
	"go-backend/tests"
	"log"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strconv"
	"testing"

	"github.com/gorilla/mux"
)

func makeCardRequestSuccess(s *Handler, t *testing.T, id int) *httptest.ResponseRecorder {

	token, _ := tests.GenerateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/cards/"+strconv.Itoa(id), nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", strconv.Itoa(id))

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/cards/{id}", s.JwtMiddleware(s.GetCardRoute))
	router.ServeHTTP(rr, req)

	return rr
}

func makeCardsRequestSuccess(s *Handler, t *testing.T, params string) *httptest.ResponseRecorder {

	token, _ := tests.GenerateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/cards/?"+params, nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(s.JwtMiddleware(s.GetCardsRoute))
	handler.ServeHTTP(rr, req)

	return rr
}

func makeCardDeleteRequestSuccess(s *Handler, t *testing.T, id int) *httptest.ResponseRecorder {
	token, _ := tests.GenerateTestJWT(1)

	req, err := http.NewRequest("DELETE", "/api/cards/"+strconv.Itoa(id), nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", strconv.Itoa(id))

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/cards/{id}", s.JwtMiddleware(s.DeleteCardRoute))
	router.ServeHTTP(rr, req)

	return rr

}

func TestGetCardSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	var logCount int
	_ = s.DB.QueryRow("SELECT count(*) FROM card_views").Scan(&logCount)
	if logCount != 0 {
		t.Errorf("wrong log count, got %v want %v", logCount, 0)
	}
	rr := makeCardRequestSuccess(s, t, 1)

	if status := rr.Code; status != http.StatusOK {
		log.Printf("err %v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	_ = s.DB.QueryRow("SELECT count(*) FROM card_views").Scan(&logCount)
	if logCount != 1 {
		t.Errorf("wrong log count, got %v want %v", logCount, 1)
	}
	var card models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
	if card.ID != 1 {
		t.Errorf("handler returned wrong card, got %v want %v", card.ID, 1)
	}
	if card.UserID != 1 {
		t.Errorf("handler returned card for wrong user, got %v want %v", card.UserID, 1)
	}

}

func TestGetCardWrongUser(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	token, _ := tests.GenerateTestJWT(2)

	req, err := http.NewRequest("GET", "/api/cards/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/cards/{id}", s.JwtMiddleware(s.GetCardRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
	if rr.Body.String() != "unable to access card\n" {
		t.Errorf("handler returned wrong body, got %v want %v", rr.Body.String(), "unable to access card\n")
	}
	var logCount int
	_ = s.DB.QueryRow("SELECT count(*) FROM card_views").Scan(&logCount)
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
	s := setup()
	defer tests.Teardown()

	rr := makeCardRequestSuccess(s, t, 1)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var card models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
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
	s := setup()
	defer tests.Teardown()

	rr := makeCardRequestSuccess(s, t, 1)
	if status := rr.Code; status != http.StatusOK {
		log.Printf("err %v", rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var card models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
	if len(card.Children) == 0 {
		t.Errorf("children was empty. got %v want %v", len(card.Children), 1)
	}

	expected := "1/A"

	if len(card.Children) > 0 && card.Children[0].CardID != expected {
		t.Errorf("linked to wrong card, got %v want %v", card.Children[0].CardID, expected)

	}

}

func TestGetCardSuccessFiles(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	rr := makeCardRequestSuccess(s, t, 1)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var card models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
	if len(card.Files) != 1 {
		t.Errorf("wrong number of files associated with card, got %v want %v", len(card.Files), 1)
	}
	var buffer bytes.Buffer
	writer := multipart.NewWriter(&buffer)
	createTestFile(t, buffer, writer)

	token, _ := tests.GenerateTestJWT(1)
	req, err := http.NewRequest("POST", "/api/files/upload", &buffer)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	rr = httptest.NewRecorder()
	handler := http.HandlerFunc(s.JwtMiddleware(s.UploadFileRoute))

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}
	if s.Server.TestInspector.FilesUploaded != 1 {
		t.Errorf("test inspector wrong number of files associated with card, got %v want %v", len(card.Files), 2)
	}
	rr = makeCardRequestSuccess(s, t, 1)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
	if len(card.Files) != 2 {
		t.Errorf("wrong number of files associated with card, got %v want %v", len(card.Files), 2)
	}

}

func TestGetCardReferencesSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	rr := makeCardRequestSuccess(s, t, 1)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var card models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
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

func TestGetCardReferencesDuplicateLinks(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	rr := makeCardRequestSuccess(s, t, 4)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var card models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
	if len(card.References) != 1 {
		if len(card.References) == 2 && (card.References[0].CardID == card.References[1].CardID) {
			t.Errorf("returned duplicate references to the same card")
		} else {
			t.Errorf("wrong number of references associated with card, got %v want %v", len(card.References), 2)
		}
	}
}

func TestGetCardsSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	rr := makeCardsRequestSuccess(s, t, "")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var cards []models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &cards)
	if len(cards) != 23 {
		t.Errorf("wrong number of cards returned, got %v want %v", len(cards), 23)
	}
}

func TestGetCardsSuccessSearch(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	rr := makeCardsRequestSuccess(s, t, "search_term=test")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var cards []models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &cards)
	if len(cards) != 2 {
		t.Errorf("wrong number of cards returned, got %v want %v", len(cards), 2)
	}
}

func TestGetCardsOtherUsersBodyNoResults(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	rr := makeCardsRequestSuccess(s, t, "search_term=hello")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var cards []models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &cards)
	if len(cards) != 0 {
		t.Errorf("wrong number of cards returned, got %v want %v", len(cards), 0)
	}
}

func TestGetCardsSuccessPartial(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	rr := makeCardsRequestSuccess(s, t, "partial=true")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var cards []models.PartialCard
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &cards)
	if len(cards) != 23 {
		t.Errorf("wrong number of cards returned, got %v want %v", len(cards), 23)
	}
}
func TestGetCardsSuccessPartialSearch(t *testing.T) {
	s := setup()
	//defer tests.Teardown()

	rr := makeCardsRequestSuccess(s, t, "partial=true&search_term=test")

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	var cards []models.PartialCard
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &cards)
	if len(cards) != 2 {
		t.Errorf("wrong number of cards returned, got %v want %v", len(cards), 2)
	}
}
func TestUpdateCardSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	var linkCount int
	_ = s.DB.QueryRow("SELECT count(*) FROM card_views").Scan(&linkCount)
	log.Printf("count %v", linkCount)
	if linkCount != 0 {
		t.Errorf("wrong log count, got %v want %v", linkCount, 0)
	}

	rr := makeCardRequestSuccess(s, t, 1)
	var card models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)

	token, _ := tests.GenerateTestJWT(1)

	expected := "asdfasdf"
	newData := map[string]interface{}{
		"title":   expected,
		"body":    expected + "[1/A]",
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

	rr = httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/cards/{id}", s.JwtMiddleware(s.UpdateCardRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	rr = makeCardRequestSuccess(s, t, 1)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)
	if card.Title != expected {
		t.Errorf("handler return wrong title, ot %v want %v", card.Title, expected)
	}
	var newLinkCount int
	_ = s.DB.QueryRow("SELECT count(*) FROM card_views").Scan(&newLinkCount)
	log.Printf("new count %v", newLinkCount)
	if newLinkCount == linkCount {
		t.Errorf("wrong log count, got %v want %v", linkCount, 1)
	}
}

func TestUpdateCardUnauthorized(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	token, _ := tests.GenerateTestJWT(2)

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
	router := mux.NewRouter()
	router.HandleFunc("/api/cards/{id}", s.JwtMiddleware(s.UpdateCardRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}

}

func TestCreateCardSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	var card models.Card
	var newCard models.Card
	token, _ := tests.GenerateTestJWT(1)

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
	handler := http.HandlerFunc(s.JwtMiddleware(s.CreateCardRoute))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)

	rr = makeCardRequestSuccess(s, t, card.ID)

	tests.ParseJsonResponse(t, rr.Body.Bytes(), &newCard)
	if newCard.Title != expected {
		t.Errorf("handler returned wrong card: got %v want %v", newCard.Title, expected)
	}
}

func TestCreateCardDuplicateCardID(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	token, _ := tests.GenerateTestJWT(1)

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
	handler := http.HandlerFunc(s.JwtMiddleware(s.CreateCardRoute))
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
	handler = http.HandlerFunc(s.JwtMiddleware(s.CreateCardRoute))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
	if rr.Body.String() != "card_id already exists\n" {
		t.Errorf("handler returned wrong error message. got %v want %v", rr.Body.String(), "card_id already exists\n")
	}
}

func TestDeleteCardSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	id := 3
	rr := makeCardDeleteRequestSuccess(s, t, id)

	if status := rr.Code; status != http.StatusNoContent {
		log.Printf(rr.Body.String())
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}

	rr = makeCardRequestSuccess(s, t, id)
	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
	rr = makeCardDeleteRequestSuccess(s, t, id)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
}

func TestDeleteCardWrongUser(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	token, _ := tests.GenerateTestJWT(2)

	req, err := http.NewRequest("DELETE", "/api/cards/"+strconv.Itoa(1), nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", "1")

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/cards/{id}", s.JwtMiddleware(s.DeleteCardRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
}

func TestCreateCardLinkedParentId(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	rr := makeCardRequestSuccess(s, t, 4)
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
		log.Printf("err %v", rr.Body.String())
	}
	var parentCard models.Card
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &parentCard)
	if parentCard.CardID != "REF001" {
		t.Errorf("handler returned wrong card: got %v want %v", parentCard.CardID, "REF001")
	}

	var card models.Card
	var newCard models.Card
	token, _ := tests.GenerateTestJWT(1)

	data := models.EditCardParams{
		Title:  "asdasd",
		Body:   "asdasd",
		CardID: "REF001/A",
		Link:   "asdasd",
	}
	jsonData, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", "/api/cards/", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr = httptest.NewRecorder()
	handler := http.HandlerFunc(s.JwtMiddleware(s.CreateCardRoute))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &card)

	rr = makeCardRequestSuccess(s, t, card.ID)
	log.Printf("%v", rr.Body.String())
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &newCard)
	if newCard.ParentID != parentCard.ID {
		t.Errorf("handler returned wrong parent: got %v want %v", newCard.ParentID, parentCard.ID)
	}
}

func TestGetRelatedCardsSuccess(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	cardID := 1
	token, _ := tests.GenerateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/cards/"+strconv.Itoa(cardID)+"/related", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.SetPathValue("id", strconv.Itoa(cardID))

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/cards/{id}/related", s.JwtMiddleware(s.GetRelatedCardsRoute))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var cards []models.PartialCard
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &cards)

}

func TestGetNextRootCardID(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	// Test when no cards exist
	nextID := s.getNextRootCardID(1)
	if nextID != "21" {
		t.Errorf("Expected first ID to be 21 (after test data), got %v", nextID)
	}

	// Create a card with numeric ID
	data := models.EditCardParams{
		Title:  "Test Card",
		Body:   "Test Body",
		CardID: "5", // Using 5 to test non-sequential numbers
		Link:   "",
	}
	var err error
	_, err = s.CreateCard(1, data)
	if err != nil {
		t.Fatalf("Failed to create test card: %v", err)
	}

	// Test getting next ID after card exists (should still be 22 since 5 is lower)
	nextID = s.getNextRootCardID(1)
	if nextID != "21" {
		t.Errorf("Expected next ID to still be 21 (5 is lower), got %v", nextID)
	}

	// Test that non-numeric IDs are ignored
	data.CardID = "ABC123"
	_, err = s.CreateCard(1, data)
	if err != nil {
		t.Fatalf("Failed to create test card: %v", err)
	}

	nextID = s.getNextRootCardID(1)
	if nextID != "21" {
		t.Errorf("Expected next ID to still be 21 (ignoring non-numeric ID), got %v", nextID)
	}
}

func TestGetNextRootCardIDRoute(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	token, _ := tests.GenerateTestJWT(1)

	req, err := http.NewRequest("GET", "/api/cards/next-root-id", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(s.JwtMiddleware(s.GetNextRootCardIDRoute))
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response models.NextIDResponse
	tests.ParseJsonResponse(t, rr.Body.Bytes(), &response)
	if response.Error {
		t.Errorf("Handler returned error response")
	}
	if response.NextID != "21" {
		t.Errorf("Expected first ID to be 21 (after test data), got %v", response.NextID)
	}

	// Test unauthorized access
	req, _ = http.NewRequest("GET", "/api/cards/next-root-id", nil)
	rr = httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("Handler allowed unauthorized access: got %v want %v", status, http.StatusUnauthorized)
	}
}

func TestCheckCardLinkedOrRelated(t *testing.T) {
	s := setup()
	defer tests.Teardown()

	userID := 1
	var mainCard models.Card
	var testCard models.Card

	cards, err := s.QueryFullCards(userID, "")

	mainCard, err = getCardById(cards, 1)
	if err != nil {
		t.Errorf("getting card returned error: %v", err)
	}
	testCard, err = getCardById(cards, 21)
	if err != nil {
		t.Errorf("getting card returned error: %v", err)
	}
	result := s.checkChunkLinkedOrRelated(1, mainCard, models.ConvertCardToChunk(testCard))
	if !result {
		t.Errorf("expected card to be linked, returned false")
	}

	testCard, err = getCardById(cards, 22)
	if err != nil {
		t.Errorf("getting chunk returned error: %v", err)
	}
	result = s.checkChunkLinkedOrRelated(1, mainCard, models.ConvertCardToChunk(testCard))
	if !result {
		t.Errorf("expected card to be linked, returned false")
	}

	testCard, err = getCardById(cards, 4)
	if err != nil {
		t.Errorf("getting card returned error: %v", err)
	}
	result = s.checkChunkLinkedOrRelated(1, mainCard, models.ConvertCardToChunk(testCard))
	if result {
		t.Errorf("expected card to not be linked, returned true")
	}
}
