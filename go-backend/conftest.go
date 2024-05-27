package main

import (
	"fmt"
	"go-backend/models"
	"log"
	"math/rand"
	"time"
)

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
			"INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
			user.Username, user.Email, user.Password,
		).Scan(&id)
		if err != nil {
			return err
		}
		userIDs = append(userIDs, id)
	}

	for _, card := range cards {
		_, err := s.db.Exec(
			"INSERT INTO cards (card_id, user_id, title, body, link) VALUES ($1, $2, $3, $4, $5)",
			card.CardID, card.UserID, card.Title, card.Body, card.Link,
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
		users = append(users, models.User{
			ID:        i,
			Username:  randomString(10),
			Email:     randomEmail(),
			Password:  randomString(15),
			CreatedAt: randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt: randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		})
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
