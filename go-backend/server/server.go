package server

import (
	"database/sql"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Server struct {
	DB            *sql.DB
	S3            *s3.Client
	Testing       bool
	JwtSecretKey  []byte
	StripeKey     string
	Mail          *MailClient
	TestInspector *TestInspector
	SchemaDir     string
}

type MailClient struct {
	Host     string
	Password string
}

type TestInspector struct {
	EmailsSent    int
	FilesUploaded int
}
