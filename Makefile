# Muchhad Quiz — Makefile
# Common development commands

.PHONY: help install dev test lint typecheck build clean docker-up docker-down docker-logs migrate seed

# Default target
help:
	@echo "Muchhad Quiz — Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install        Install all dependencies"
	@echo "  make docker-up      Start PostgreSQL + Redis"
	@echo "  make docker-down    Stop infrastructure"
	@echo ""
	@echo "Development:"
	@echo "  make dev            Start frontend + backend (requires docker-up)"
	@echo "  make dev-backend    Start backend only"
	@echo "  make dev-frontend   Start frontend only"
	@echo ""
	@echo "Database:"
	@echo "  make migrate        Run SQL migrations"
	@echo "  make seed           Seed development data"
	@echo ""
	@echo "Quality:"
	@echo "  make lint           Run ESLint + Prettier"
	@echo "  make typecheck      Run TypeScript compiler check"
	@echo "  make test           Run all tests"
	@echo "  make test-unit      Run unit tests only"
	@echo "  make test-integration Run integration tests"
	@echo "  make test-e2e       Run E2E tests"
	@echo "  make test-load      Run k6 load test (requires running session)"
	@echo ""
	@echo "Build:"
	@echo "  make build          Build frontend + backend for production"
	@echo "  make build-docker   Build Docker images"
	@echo ""
	@echo "Deploy:"
	@echo "  make deploy-render  Deploy to Render (requires CLI)"
	@echo "  make deploy-northflank Deploy to Northflank"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean          Remove build artifacts + node_modules"
	@echo "  make fresh          Clean + reinstall everything"

# ═══════════════════════════════════════════════════════════════════

# Setup
install:
	npm ci
	cd backend && npm ci
	cd frontend && npm ci

docker-up:
	docker compose up -d postgres redis

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f postgres redis

# Development
dev: docker-up
	@echo "Starting backend on :4000 and frontend on :5173..."
	@trap 'kill %1 %2' INT; \
	cd backend && npm run dev & \
	cd frontend && npm run dev & \
	wait

dev-backend: docker-up
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

# Database
migrate:
	cd backend && npm run migrate

seed:
	cd backend && npm run seed

# Quality
lint:
	cd backend && npm run lint
	cd frontend && npm run lint

typecheck:
	cd backend && npm run typecheck
	cd frontend && npm run typecheck

test: test-unit test-integration

test-unit:
	cd backend && npm run test:unit
	cd frontend && npm run test:unit

test-integration:
	cd backend && npm run test:integration

test-e2e:
	cd frontend && npm run test:e2e

test-load:
	@echo "Start a game first, then run: k6 run -e PIN=<your-pin> k6/load-test.js"
	k6 run -e PIN=${PIN} k6/load-test.js

# Build
build:
	cd backend && npm run build
	cd frontend && npm run build

build-docker:
	docker compose build

# Deploy
deploy-render:
	@echo "Deploying to Render..."
	render deploy --service muchhad-quiz

deploy-northflank:
	@echo "Deploying to Northflank..."
	northflank deploy --project muchhad-quiz

# Maintenance
clean:
	rm -rf node_modules
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/dist
	rm -rf coverage
	docker compose down -v

fresh: clean install docker-up migrate
	@echo "Fresh install complete! Run 'make dev' to start."

# ═══════════════════════════════════════════════════════════════════