package tests

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"go-backend/mail"
	"go-backend/models"
	"go-backend/server"
	"log"
	"math/rand"
	"os"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/pgvector/pgvector-go"
)

var S *server.Server

var setupOnce sync.Once
var db *sql.DB

func Setup() *server.Server {
	var err error
	setupOnce.Do(func() {
		dbConfig := models.DatabaseConfig{}
		dbConfig.Host = os.Getenv("DB_HOST")
		dbConfig.Port = os.Getenv("DB_PORT")
		dbConfig.User = os.Getenv("DB_USER")
		dbConfig.Password = os.Getenv("DB_PASS")
		dbConfig.DatabaseName = "zettelkasten_testing"

		db, err = server.ConnectToDatabase(dbConfig)
	})

	if err != nil {
		log.Fatalf("Unable to connect to the database: %v\n", err)
	}
	S = &server.Server{}
	S.DB = db
	S.Testing = true
	S.SchemaDir = "../schema"

	S.Mail = &mail.MailClient{
		Testing:           true,
		TestingEmailsSent: 0,
	}
	S.TestInspector = &server.TestInspector{}
	S.LLMClient = &models.LLMClient{Testing: true}

	server.RunMigrations(S)
	err = importTestData(S)
	if err != nil {
		log.Fatal(err)
	}
	return S
}

func Teardown() {
	server.ResetDatabase(S)
}

func ParseJsonResponse(t *testing.T, body []byte, x interface{}) {
	err := json.Unmarshal(body, &x)
	if err != nil {
		t.Fatalf("could not unmarshal response: %v", err)
	}
}
func importTestData(s *server.Server) error {
	data := generateData()
	users := data["users"].([]models.User)
	cards := data["cards"].([]models.Card)
	files := data["files"].([]models.File)
	backlinks := data["backlinks"].([]models.Backlink)
	tasks := data["tasks"].([]models.Task)
	keywords := data["keywords"].([]models.Keyword)
	tags := data["tags"].([]models.Tag)
	card_tags := data["card_tags"].([]models.CardTag)
	embeddings := data["embeddings"].([]models.Embedding)

	tx, _ := s.DB.Begin()
	var userIDs []int
	for _, user := range users {
		var id int
		err := tx.QueryRow(`
			INSERT INTO users 
			(username, email, password, created_at, updated_at, can_upload_files, 
			stripe_subscription_status, stripe_customer_id, stripe_current_plan, stripe_subscription_frequency, stripe_subscription_id,
			email_validated, dashboard_card_pk) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0) 
			RETURNING id`,
			user.Username, user.Email, user.Password, user.CreatedAt,
			user.UpdatedAt, user.CanUploadFiles, user.StripeSubscriptionStatus,
			user.StripeCustomerID, user.StripeCurrentPlan, user.StripeSubscriptionFrequency,
			user.StripeSubscriptionID, user.EmailValidated,
		).Scan(&id)
		if err != nil {
			log.Printf("err %v", err)
			return err
		}
		userIDs = append(userIDs, id)
	}

	for _, card := range cards {
		_, err := tx.Exec(
			"INSERT INTO cards (card_id, user_id, title, body, link, created_at, updated_at, parent_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
			card.CardID, card.UserID, card.Title, card.Body, card.Link, card.CreatedAt, card.UpdatedAt, card.ParentID,
		)
		if err != nil {
			log.Printf("something went wrong inserting rows: %v", err)
			return err
		}
	}

	for _, file := range files {
		_, err := tx.Exec(
			"INSERT INTO files (name, user_id, type, path, filename, size, created_by, updated_by, card_pk, is_deleted, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
			file.Name, file.UserID, file.Filetype, file.Path, file.Filename, file.Size, file.CreatedBy, file.UpdatedBy, file.CardPK, file.IsDeleted, file.CreatedAt, file.UpdatedAt,
		)
		if err != nil {
			log.Printf("error %v", err)
			return err
		}
	}

	_, err := tx.Exec("UPDATE users SET is_admin = TRUE WHERE id = 1")
	if err != nil {
		return err
	}

	for _, backlink := range backlinks {
		_, err := tx.Exec("INSERT INTO backlinks (source_id_int, target_id_int, created_at, updated_at) VALUES ($1, $2, $3, $4)", backlink.SourceIDInt, backlink.TargetIDInt, backlink.CreatedAt, backlink.UpdatedAt)
		if err != nil {
			log.Printf("err %v", err)
			return err
		}
	}

	for _, task := range tasks {
		_, err := tx.Exec(
			"INSERT INTO tasks (card_pk, user_id, created_at, updated_at, due_date, scheduled_date, title, is_complete) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
			task.CardPK,
			task.UserID,
			task.CreatedAt,
			task.UpdatedAt,
			task.DueDate,
			task.ScheduledDate,
			task.Title,
			task.IsComplete,
		)
		if err != nil {
			log.Printf("err %v", err)
			return err
		}
	}

	for _, keyword := range keywords {
		_, err := tx.Exec(
			"INSERT INTO keywords (card_pk, user_id, keyword) VALUES ($1, $2, $3)",
			keyword.CardPK,
			keyword.UserID,
			keyword.Keyword,
		)
		if err != nil {
			log.Printf("err %v", err)
			return err
		}
	}

	for _, tag := range tags {
		_, err := tx.Exec(
			"INSERT INTO tags (name, color, user_id) VALUES ($1, $2, $3)",
			tag.Name,
			tag.Color,
			tag.UserID,
		)
		if err != nil {
			log.Printf("err %v", err)
			return err
		}
	}

	for _, card_tag := range card_tags {
		_, err := tx.Exec(
			"INSERT INTO card_tags (card_pk, tag_id) VALUES ($1, $2)",
			card_tag.CardPK,
			card_tag.TagID,
		)
		if err != nil {
			log.Printf("err %v", err)
			return err
		}
	}

	for _, embedding := range embeddings {
		_, err := tx.Exec(

			"INSERT INTO card_embeddings (user_id, card_pk, embedding, chunk) VALUES ($1, $2, $3, $4)",
			embedding.UserID,
			embedding.CardPK,
			embedding.Embedding,
			embedding.Chunk,
		)
		if err != nil {
			log.Printf("err %v", err)
			return err
		}
	}

	for _, entity := range data["entities"].([]models.Entity) {
		_, err := tx.Exec(`
			INSERT INTO entities 
			(id, user_id, name, description, type, embedding, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			entity.ID, entity.UserID, entity.Name, entity.Description, entity.Type,
			entity.Embedding, entity.CreatedAt, entity.UpdatedAt,
		)
		if err != nil {
			log.Printf("error inserting entity: %v", err)
			return err
		}
	}

	for _, junction := range data["entity_cards"].([]models.EntityCardJunction) {
		_, err := tx.Exec(`
			INSERT INTO entity_card_junction 
			(user_id, entity_id, card_pk)
			VALUES ($1, $2, $3)`,
			junction.UserID, junction.EntityID, junction.CardPK,
		)
		if err != nil {
			log.Printf("error inserting entity_card_junction: %v", err)
			return err
		}
	}

	if err := loadChatData(tx); err != nil {
		return err
	}
	if err := loadChatConversationsData(tx); err != nil {
		return err
	}

	tx.Commit()
	return nil
}

func generateData() map[string]interface{} {
	rand.Seed(time.Now().UnixNano())

	keywords := []models.Keyword{}
	idCount := 0
	for i := 1; i <= 20; i++ {
		for x := 1; x < 10; x++ {
			idCount += 1
			keyword := models.Keyword{
				ID:      idCount,
				CardPK:  i,
				UserID:  1,
				Keyword: randomString(10),
			}
			keywords = append(keywords, keyword)
		}
	}

	tags := []models.Tag{}
	for i := 1; i <= 3; i++ {
		tag := models.Tag{
			Name:   randomString(10),
			Color:  randomString(10),
			UserID: 1,
		}
		if i == 1 {
			tag.Name = "test"
		}
		tags = append(tags, tag)

	}

	card_tags := []models.CardTag{}
	card_tag := models.CardTag{
		CardPK: 2,
		TagID:  1,
	}
	card_tags = append(card_tags, card_tag)

	users := []models.User{}
	for i := 1; i <= 10; i++ {
		user := models.User{
			ID:                          i,
			Username:                    randomString(10),
			Email:                       randomEmail(),
			Password:                    randomString(15),
			CreatedAt:                   randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt:                   randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
			CanUploadFiles:              true,
			StripeSubscriptionStatus:    "",
			StripeCustomerID:            "",
			StripeCurrentPlan:           "",
			StripeSubscriptionFrequency: "",
			StripeSubscriptionID:        "",
			EmailValidated:              true,
		}
		if i == 2 {
			user.CanUploadFiles = false
			user.Email = "test@test.com"
		}
		users = append(users, user)
	}

	cards := []models.Card{}
	for i := 1; i <= 20; i++ {
		card := models.Card{
			ID:        i,
			CardID:    strconv.Itoa(i),
			UserID:    1,
			Title:     randomString(20),
			Body:      randomString(100),
			Link:      fmt.Sprintf("https://%s.com", randomString(10)),
			CreatedAt: randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt: randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
			ParentID:  i,
		}
		if i == 1 {
			card.Body = card.Body + "\n[" + strconv.Itoa(i+1) + "]"
		}
		if i == 4 {
			card.CardID = "REF001"
			card.Body = card.Body + "\n[3]"
		}
		if i == 5 {
			card.CardID = "MM001"
		}
		cards = append(cards, card)
	}
	cards = append(cards, models.Card{
		ID:        21,
		CardID:    "1/A",
		UserID:    1,
		Title:     randomString(20),
		Body:      randomString(20),
		Link:      fmt.Sprintf("https://%s.com", randomString(10)),
		CreatedAt: randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
		UpdatedAt: randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		ParentID:  1,
	})
	cards = append(cards, models.Card{
		ID:        22,
		CardID:    "2/A",
		UserID:    1,
		Title:     "test card",
		Body:      randomString(20) + "[1]",
		Link:      fmt.Sprintf("https://%s.com", randomString(10)),
		CreatedAt: randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
		UpdatedAt: randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		ParentID:  2,
	})
	cards = append(cards, models.Card{
		ID:        23,
		CardID:    "1",
		UserID:    2,
		Title:     "test card",
		Body:      "hello world #to-read",
		Link:      fmt.Sprintf("https://%s.com", randomString(10)),
		CreatedAt: randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
		UpdatedAt: randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		ParentID:  23,
	})
	cards = append(cards, models.Card{
		ID:        24,
		CardID:    "2/A.1",
		UserID:    1,
		Title:     "another test card",
		Body:      randomString(20) + "[1]",
		Link:      fmt.Sprintf("https://%s.com", randomString(10)),
		CreatedAt: randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
		UpdatedAt: randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		ParentID:  22,
	})

	backlinks := []models.Backlink{}
	for i := 1; i <= 30; i++ {
		backlinks = append(backlinks, models.Backlink{
			SourceIDInt: i,
			TargetIDInt: i,
			CreatedAt:   randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt:   randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		})
	}
	backlinks = append(backlinks, models.Backlink{
		SourceIDInt: 22,
		TargetIDInt: 1,
		CreatedAt:   randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
		UpdatedAt:   randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
	})
	backlinks = append(backlinks, models.Backlink{
		SourceIDInt: 3,
		TargetIDInt: 4,
		CreatedAt:   randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
		UpdatedAt:   randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
	})

	files := []models.File{}
	for i := 1; i <= 20; i++ {
		files = append(files, models.File{
			ID:        i,
			UserID:    1,
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

	tasks := []models.Task{}
	for i := 1; i <= 20; i++ {
		task := models.Task{
			ID:            i,
			CardPK:        i,
			UserID:        1,
			CreatedAt:     randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt:     randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
			DueDate:       nil,
			ScheduledDate: randomMaybeNullDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
			Title:         randomString(20),
			IsComplete:    false,
			CompletedAt:   nil,
		}
		if i == 2 {
			task.IsComplete = true
			task.CompletedAt = randomMaybeNullDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC))
		}

		if i == 3 {
			task.Title = "hello world #to-read"
		}
		tasks = append(tasks, task)
	}

	vectorData := make([]float32, 1024)
	for i := range vectorData {
		vectorData[i] = float32(i + 1) // or any other logic to fill the vector
	}
	vector := pgvector.NewVector(vectorData)
	embeddings := []models.Embedding{}
	for i, card := range cards {
		embedding := models.Embedding{
			ID:        i,
			CardPK:    card.ID,
			UserID:    card.UserID,
			Chunk:     1,
			Embedding: vector,
		}
		embeddings = append(embeddings, embedding)
	}

	vectorData = make([]float32, 1024)
	for i := range vectorData {
		vectorData[i] = float32(i)
	}
	vector = pgvector.NewVector(vectorData)

	entities := []models.Entity{
		{
			ID:          1,
			UserID:      1,
			Name:        "Test Entity 1",
			Description: "Original entity",
			Type:        "person",
			Embedding:   vector,
			CreatedAt:   randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt:   randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		},
		{
			ID:          2,
			UserID:      1,
			Name:        "Test Entity 2",
			Description: "Duplicate entity",
			Type:        "person",
			Embedding:   vector,
			CreatedAt:   randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt:   randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		},
		{
			ID:          3,
			UserID:      2,
			Name:        "Other User Entity",
			Description: "Entity for different user",
			Type:        "person",
			Embedding:   vector,
			CreatedAt:   randomDate(time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
			UpdatedAt:   randomDate(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)),
		},
	}

	entity_cards := []models.EntityCardJunction{
		{
			UserID:   1,
			EntityID: 1,
			CardPK:   1,
		},
		{
			UserID:   1,
			EntityID: 1,
			CardPK:   2,
		},
		{
			UserID:   1,
			EntityID: 2,
			CardPK:   1,
		},
		{
			UserID:   1,
			EntityID: 2,
			CardPK:   2,
		},
	}

	results := map[string]interface{}{
		"users":        users,
		"cards":        cards,
		"backlinks":    backlinks,
		"files":        files,
		"tasks":        tasks,
		"keywords":     keywords,
		"tags":         tags,
		"card_tags":    card_tags,
		"embeddings":   embeddings,
		"entities":     entities,
		"entity_cards": entity_cards,
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
func randomMaybeNullDate(start, end time.Time) *time.Time {
	date := randomDate(start, end)
	return &date
}

func GenerateTestJWT(userID int) (string, error) {
	var jwtKey = []byte(os.Getenv("SECRET_KEY"))
	now := time.Now()

	claims := &models.Claims{
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
func loadChatData(tx *sql.Tx) error {
	// Read the JSON file
	jsonData, err := os.ReadFile("../testdata/chat.json")
	if err != nil {
		return fmt.Errorf("failed to read chat JSON file: %w", err)
	}

	var chatData models.ChatData
	if err := json.Unmarshal(jsonData, &chatData); err != nil {
		return fmt.Errorf("failed to unmarshal chat data: %w", err)
	}

	// Insert each chat completion
	for _, chat := range chatData.ChatCompletions {
		_, err := tx.Exec(`
            INSERT INTO chat_completions 
            (user_id, conversation_id, sequence_number, role, content, refusal, model, tokens, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			chat.UserID,
			chat.ConversationID,
			chat.SequenceNumber,
			chat.Role,
			chat.Content,
			chat.Refusal,
			chat.Model,
			chat.Tokens,
			chat.CreatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert chat completion: %w", err)
		}
	}

	return nil
}
func loadChatConversationsData(tx *sql.Tx) error {
	// Read the JSON file
	jsonData, err := os.ReadFile("../testdata/chat_conversations.json")
	if err != nil {
		return fmt.Errorf("failed to read chat conversations JSON file: %w", err)
	}

	var conversationsData []models.ConversationSummary
	if err := json.Unmarshal(jsonData, &conversationsData); err != nil {
		return fmt.Errorf("failed to unmarshal chat conversations data: %w", err)
	}

	// Insert each chat conversation
	for _, conversation := range conversationsData {
		_, err := tx.Exec(`
            INSERT INTO chat_conversations
            (id, title, user_id, model, message_count, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)`,
			conversation.ID,
			conversation.Title,
			conversation.UserID,
			conversation.Model,
			conversation.MessageCount,
			conversation.CreatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert chat conversation: %w", err)
		}
	}

	return nil
}
