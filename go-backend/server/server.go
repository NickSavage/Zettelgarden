package server

import (
	"database/sql"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"go-backend/mail"
	"go-backend/models"
)

type Server struct {
	DB            *sql.DB
	S3            *s3.Client
	Testing       bool
	JwtSecretKey  []byte
	StripeKey     string
	Mail          *mail.MailClient
	TestInspector *TestInspector
	SchemaDir     string
	LLMClient     *models.LLMClient
}

type TestInspector struct {
	FilesUploaded int
}
