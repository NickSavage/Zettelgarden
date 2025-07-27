# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zettelgarden is a human-centric, open-source personal knowledge management system built on zettelkasten principles. It's a full-stack application with three main services:

- **Frontend**: React/TypeScript with Vite (`zettelkasten-front/`)
- **Backend**: Go API server (`go-backend/`)  
- **Mail Service**: Python Flask SMTP service (`python-mail/`)

## Development Commands

### Frontend (zettelkasten-front/)
```bash
cd zettelkasten-front
npm start          # Start development server (Vite)
npm run build      # Build for production (TypeScript compilation + Vite build)
npm test           # Run tests with Vitest
npm run serve      # Preview production build
```

### Backend (go-backend/)
```bash
cd go-backend
go run main.go     # Start development server
go test ./...      # Run all tests
go build -o main   # Build binary
```

### Full Stack Development
```bash
# Build and deploy all services
./build.sh         # Builds Docker images and deploys via SSH

# Local development with Docker
docker-compose up  # Start all services locally
```

## Architecture

### Backend (Go)
- **Main**: `main.go` - HTTP server setup with JWT middleware, CORS, and route definitions
- **Handlers**: `handlers/` - HTTP route handlers organized by feature (auth, cards, tasks, files, etc.)
- **Models**: `models/` - Database models and business logic
- **Server**: `server/` - Database connections and server configuration
- **Migrations**: `schema/` - SQL migration files for database schema
- **LLMs**: `llms/` - AI/ML integration for embeddings, chat, and entity processing

### Frontend (React/TypeScript)
- **Pages**: `src/pages/` - Main application routes and page components
- **Components**: `src/components/` - Reusable UI components organized by feature
- **Contexts**: `src/contexts/` - React context providers for state management
- **API**: `src/api/` - HTTP client functions for backend communication
- **Models**: `src/models/` - TypeScript type definitions

### Key Features
- **Cards**: Atomic notes with markdown support and backlinking
- **Tasks**: Task management with recurring capability and priorities
- **Files**: File upload/storage with S3 integration
- **Chat**: AI-powered chat with RAG capabilities
- **Entities**: Named entity recognition and management
- **Search**: Vector search with embeddings and traditional text search
- **Templates**: Card templates with variable substitution

### Database
- PostgreSQL with pgvector extension for embeddings
- Migration-based schema management in `go-backend/schema/`
- Models use database/sql with manual query construction

### Authentication & Authorization
- JWT-based authentication with middleware in `main.go`
- Admin-only routes protected by admin middleware
- User context passed through request context

### AI/ML Integration
- OpenAI-compatible LLM client for chat and embeddings
- Configurable LLM providers and models per user
- Vector embeddings stored in PostgreSQL with pgvector
- Entity extraction and processing pipeline

### Testing
- Go: Standard `testing` package with test helpers in `handlers/test_helpers.go`
- Frontend: Vitest with React Testing Library setup
- Test data in `testdata/` directory

## Environment Configuration

The application requires extensive environment configuration for:
- Database connection (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME)
- JWT secret (SECRET_KEY)
- LLM integration (ZETTEL_LLM_KEY, ZETTEL_LLM_ENDPOINT)
- S3/file storage configuration
- Stripe payment integration
- Mail service configuration

## Development Notes

- The frontend uses Vite for fast development builds
- Backend follows RESTful API conventions with consistent error handling
- All routes are logged via `handlers.LogRoute` middleware
- File uploads go through S3-compatible storage
- The application supports both development and production logging configurations