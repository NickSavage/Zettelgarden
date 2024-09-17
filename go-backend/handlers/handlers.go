package handlers

import (
	"database/sql"
	"go-backend/server"
)

type Handler struct {
	DB     *sql.DB
	Server *server.Server
}
