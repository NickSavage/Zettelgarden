package main

import (
	"log"
	"time"

	"go-backend/bootstrap"
)

func main() {
	s := bootstrap.InitServer()
	log.Println("Worker service started")

	// Example background loop
	for {
		// Example background work - replace with your actual tasks
		log.Println("Worker tick - DB is ready to use:", s.DB != nil)
		time.Sleep(1 * time.Minute)
	}
}
