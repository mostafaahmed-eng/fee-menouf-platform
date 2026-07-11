.PHONY: setup dev build test lint seed clean backup docs help

PROJECT_ROOT := $(shell pwd)
BACKEND_DIR := $(PROJECT_ROOT)/backend
FRONTEND_DIR := $(PROJECT_ROOT)/frontend
AI_ENGINE_DIR := $(PROJECT_ROOT)/ai-engine
DOCKER_DIR := $(PROJECT_ROOT)/docker

# Compose file selection (override with COMPOSE_FILE=docker-compose.yml for production)
COMPOSE_FILE ?= docker-compose.local.yml

# Colors
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
CYAN := \033[0;36m
NC := \033[0m

help:
	@echo "$(CYAN)FEE-MENOUF Smart University Platform - Makefile$(NC)"
	@echo ""
	@echo "$(YELLOW)Usage:$(NC)"
	@echo "  make setup        Full project setup (deps + Docker + seed)"
	@echo "  make dev          Start all services in development mode"
	@echo "  make build        Build all services for production"
	@echo "  make test         Run all tests"
	@echo "  make lint         Lint all code"
	@echo "  make seed         Seed the database"
	@echo "  make clean        Clean all artifacts"
	@echo "  make backup       Backup database"
	@echo "  make docs         Generate API documentation"
	@echo ""

setup: check-deps install-deps docker-up seed
	@echo "$(GREEN)Setup completed successfully!$(NC)"

check-deps:
	@echo "$(CYAN)Checking prerequisites...$(NC)"
	@command -v node >/dev/null 2>&1 || (echo "$(RED)Node.js is required$(NC)" && exit 1)
	@command -v npm >/dev/null 2>&1 || (echo "$(RED)npm is required$(NC)" && exit 1)
	@command -v docker >/dev/null 2>&1 || (echo "$(RED)Docker is required$(NC)" && exit 1)
	@command -v python3 >/dev/null 2>&1 || (echo "$(RED)Python 3 is required$(NC)" && exit 1)
	@echo "$(GREEN)All prerequisites satisfied.$(NC)"

install-deps:
	@echo "$(CYAN)Installing dependencies...$(NC)"
	@if [ -f "$(BACKEND_DIR)/package.json" ]; then \
		echo "  -> Backend (npm ci)"; \
		cd $(BACKEND_DIR) && npm ci; \
	fi
	@if [ -f "$(FRONTEND_DIR)/package.json" ]; then \
		echo "  -> Frontend (npm ci)"; \
		cd $(FRONTEND_DIR) && npm ci; \
	fi
	@if [ -f "$(AI_ENGINE_DIR)/requirements.txt" ]; then \
		echo "  -> AI Engine (pip)"; \
		cd $(AI_ENGINE_DIR) && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt; \
	fi
	@echo "$(GREEN)Dependencies installed.$(NC)"

dev:
	@echo "$(CYAN)Starting development environment...$(NC)"
	@cd $(PROJECT_ROOT) && docker compose -f $(COMPOSE_FILE) up -d postgres redis minio
	@echo "$(YELLOW)Starting backend in watch mode...$(NC)"
	@cd $(BACKEND_DIR) && npm run start:dev &
	@echo "$(YELLOW)Starting frontend in dev mode...$(NC)"
	@cd $(FRONTEND_DIR) && npm run dev &
	@echo "$(YELLOW)Starting AI Engine...$(NC)"
	@cd $(AI_ENGINE_DIR) && . .venv/bin/activate && uvicorn app.main:app --reload --port 8000 &
	@echo "$(GREEN)All services started.$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:4000"
	@echo "  AI:       http://localhost:8000"
	@wait

build:
	@echo "$(CYAN)Building all services...$(NC)"
	@cd $(PROJECT_ROOT) && docker compose -f $(COMPOSE_FILE) build
	@cd $(BACKEND_DIR) && npm run build
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)Build completed.$(NC)"

test:
	@echo "$(CYAN)Running tests...$(NC)"
	@if [ -f "$(BACKEND_DIR)/package.json" ]; then \
		echo "  -> Backend tests"; \
		cd $(BACKEND_DIR) && npm run test; \
	fi
	@if [ -f "$(FRONTEND_DIR)/package.json" ]; then \
		echo "  -> Frontend build check"; \
		cd $(FRONTEND_DIR) && npm run build; \
	fi
	@echo "$(GREEN)All tests passed.$(NC)"

lint:
	@echo "$(CYAN)Linting all code...$(NC)"
	@if [ -f "$(BACKEND_DIR)/package.json" ]; then \
		echo "  -> Backend ESLint"; \
		cd $(BACKEND_DIR) && npm run lint; \
	fi
	@if [ -f "$(FRONTEND_DIR)/package.json" ]; then \
		echo "  -> Frontend ESLint"; \
		cd $(FRONTEND_DIR) && npm run lint; \
	fi
	@if [ -d "$(AI_ENGINE_DIR)" ]; then \
		echo "  -> AI Engine flake8"; \
		cd $(AI_ENGINE_DIR) && flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics; \
	fi
	@echo "$(GREEN)Linting completed.$(NC)"

seed:
	@echo "$(CYAN)Seeding database...$(NC)"
	@cd $(PROJECT_ROOT) && bash scripts/seed.sh
	@echo "$(GREEN)Database seeded.$(NC)"

clean:
	@echo "$(CYAN)Cleaning artifacts...$(NC)"
	@rm -rf $(BACKEND_DIR)/dist $(BACKEND_DIR)/coverage $(BACKEND_DIR)/node_modules
	@rm -rf $(FRONTEND_DIR)/.next $(FRONTEND_DIR)/out $(FRONTEND_DIR)/node_modules
	@rm -rf $(AI_ENGINE_DIR)/.venv $(AI_ENGINE_DIR)/__pycache__
	@rm -rf $(PROJECT_ROOT)/coverage $(PROJECT_ROOT)/dist
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "*.pyc" -delete
	@echo "$(GREEN)Cleaned.$(NC)"

backup:
	@echo "$(CYAN)Backing up database...$(NC)"
	@mkdir -p $(PROJECT_ROOT)/backups
	@TIMESTAMP=$$(date +%Y%m%d-%H%M%S); \
	cd $(PROJECT_ROOT) && docker compose -f $(COMPOSE_FILE) exec -T postgres \
		pg_dump -U $${DB_USER:-fee_menouf_user} $${DB_NAME:-fee_menouf_platform} \
		> $(PROJECT_ROOT)/backups/fee-menouf-backup-$$TIMESTAMP.sql
	@echo "$(GREEN)Backup saved to backups/.$(NC)"

docker-up:
	@echo "$(CYAN)Starting Docker services...$(NC)"
	@cd $(PROJECT_ROOT) && docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)Docker services started.$(NC)"

docker-down:
	@cd $(PROJECT_ROOT) && docker compose -f $(COMPOSE_FILE) down

docker-logs:
	@cd $(PROJECT_ROOT) && docker compose -f $(COMPOSE_FILE) logs -f

docs:
	@echo "$(CYAN)Generating API documentation...$(NC)"
	@cd $(BACKEND_DIR) && npx @nestjs/cli swagger
	@echo "$(GREEN)Docs generated at docs/.$(NC)"
