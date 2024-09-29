#!/bin/bash

source /home/nick/code/projects/zettelkasten/.env-prod
source /home/nick/.bash_profile
cd /home/nick/code/projects/zettelkasten/go-backend
go run /home/nick/code/projects/zettelkasten/go-backend/scripts/refresh_inactive_cards.go
