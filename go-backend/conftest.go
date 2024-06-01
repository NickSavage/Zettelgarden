package main

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"math/rand"
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

func setup() {
	var err error
	dbConfig := databaseConfig{}
	dbConfig.host = os.Getenv("DB_HOST")
	dbConfig.port = os.Getenv("DB_PORT")
	dbConfig.user = os.Getenv("DB_USER")
	dbConfig.password = os.Getenv("DB_PASS")
	dbConfig.databaseName = "zettelkasten_testing"

	db, err := ConnectToDatabase(dbConfig)
	if err != nil {
		log.Fatalf("Unable to connect to the database: %v\n", err)
	}
	s = &Server{}
	s.db = db
	s.testing = true

	s.s3 = createS3Client()

	s.runMigrations()
	s.importTestData()

}

func teardown() {
	s.resetDatabase()
}

func parseJsonResponse(t *testing.T, body []byte, x interface{}) {
	err := json.Unmarshal(body, &x)
	if err != nil {
		t.Fatalf("could not unmarshal response: %v", err)
	}
}
func (s *Server) importTestData() error {
	data := s.generateData()
	users := data["users"].([]models.User)
	cards := data["cards"].([]models.Card)
	files := data["files"].([]models.File)
	// backlinks := data["backlinks"].([]Backlink)

	var userIDs []int
	for _, user := range users {
		var id int
		err := s.db.QueryRow(
			"INSERT INTO users (username, email, password, created_at, updated_at, can_upload_files) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
			user.Username, user.Email, user.Password, user.CreatedAt, user.UpdatedAt, user.CanUploadFiles,
		).Scan(&id)
		if err != nil {
			return err
		}
		userIDs = append(userIDs, id)
	}

	for _, card := range cards {
		_, err := s.db.Exec(
			"INSERT INTO cards (card_id, user_id, title, body, link, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
			card.CardID, card.UserID, card.Title, card.Body, card.Link, card.CreatedAt, card.UpdatedAt,
		)
		if err != nil {
			return err
		}
	}

	for _, file := range files {
		_, err := s.db.Exec(
			"INSERT INTO files (name, type, path, filename, size, created_by, updated_by, card_pk, is_deleted, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
			file.Name, file.Filetype, file.Path, file.Filename, file.Size, file.CreatedBy, file.UpdatedBy, file.CardPK, file.IsDeleted, file.CreatedAt, file.UpdatedAt,
		)
		if err != nil {
			log.Printf("error %v", err)
			return err
		}
	}

	_, err := s.db.Exec("UPDATE users SET is_admin = TRUE WHERE id = 1")
	if err != nil {
		return err
	}

	// for _, backlink := range backlinks {
	//     _, err := db.Exec("INSERT INTO backlinks (source_id, target_id) VALUES ($1, $2)", backlink.SourceID, backlink.TargetID)
	//     if err != nil {
	//         return err
	//     }
	// }

	return nil
}

func (s *Server) generateData() map[string]interface{} {
	rand.Seed(time.Now().UnixNano())

	users := []models.User{}
	for i := 1; i <= 10; i++ {
		user := models.User{
			ID:             i,
			Username:       randomString(10),
			Email:          randomEmail(),
			Password:       randomString(15),
			CreatedAt:      randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt:      randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
			CanUploadFiles: true,
			LastLogin:      randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		}
		if i == 2 {
			user.CanUploadFiles = false
		}
		users = append(users, user)
	}

	cards := []models.Card{}
	for i := 1; i <= 20; i++ {
		cards = append(cards, models.Card{
			ID:        i,
			CardID:    randomString(20),
			UserID:    1,
			Title:     randomString(20),
			Body:      randomString(100),
			Link:      fmt.Sprintf("https://%s.com", randomString(10)),
			CreatedAt: randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt: randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		})
	}

	backlinks := []models.Backlink{}
	for i := 1; i <= 30; i++ {
		backlinks = append(backlinks, models.Backlink{
			SourceID:  randomString(20),
			TargetID:  randomString(20),
			CreatedAt: randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt: randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		})
	}

	files := []models.File{}
	for i := 1; i <= 20; i++ {
		files = append(files, models.File{
			ID:        i,
			Name:      randomString(20),
			Filetype:  randomString(20),
			Path:      randomString(20),
			Filename:  randomString(20),
			Size:      rand.Intn(1000),
			CreatedBy: rand.Intn(10) + 1,
			UpdatedBy: rand.Intn(10) + 1,
			CardPK:    i,
			IsDeleted: false,
			CreatedAt: randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt: randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		})
	}

	results := map[string]interface{}{
		"users":     users,
		"cards":     cards,
		"backlinks": backlinks,
		"files":     files,
	}
	return results
}

func randomString(length int) string {
	chars := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
	s := make([]rune, length)
	for i := range s {
		s[i] = chars[rand.Intn(len(chars))]
	}
	return string(s)
}

func randomEmail() string {
	return fmt.Sprintf("%s@%s.com", randomString(5), randomString(5))
}

func randomDate(start, end time.Time) time.Time {
	delta := end.Unix() - start.Unix()
	sec := rand.Int63n(delta) + start.Unix()
	return time.Unix(sec, 0)
}

func generateTestJWT(userID int) (string, error) {
	var jwtKey = []byte(os.Getenv("SECRET_KEY"))
	now := time.Now()

	claims := &Claims{
		Sub:   userID,
		Fresh: false, // Assuming 'fresh' is always false for test token
		Type:  "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ID:        uuid.NewString(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func (s *Server) uploadTestFile() {
	testFile, err := os.Open("./testdata/test.txt")
	if err != nil {
		log.Fatal("unable to open test file")
		return
	}
	uuidKey := uuid.New().String()

	uploadObject(s.s3, uuidKey, testFile.Name())

	query := `UPDATE files SET path = $1, filename = $2 WHERE id = 1`
	s.db.QueryRow(query, uuidKey, uuidKey)
}
