# ── Education Tutor Makefile ──────────────────────────────────────────────────
.PHONY: help build up down logs shell-backend seed test lint clean reset

help:
	@echo ""
	@echo "  📚 Education Tutor – Available Commands"
	@echo ""
	@echo "  make up           Start all services (detached)"
	@echo "  make down         Stop all services"
	@echo "  make build        Rebuild Docker images"
	@echo "  make logs         Tail all service logs"
	@echo "  make logs-back    Tail backend logs only"
	@echo "  make shell        Shell into backend container"
	@echo "  make seed         Create default admin + sample data"
	@echo "  make atlas-index  Create MongoDB Atlas vector index"
	@echo "  make pull-model   Pull neural-chat model into Ollama"
	@echo "  make health       Check all service health endpoints"
	@echo "  make lint         Run Python linter (flake8)"
	@echo "  make test         Run backend tests"
	@echo "  make clean        Remove containers + volumes"
	@echo "  make reset        Full wipe and restart"
	@echo ""

up:
	docker-compose up -d
	@echo "✅ Services started. Frontend: http://localhost  API: http://localhost:8000/docs"

down:
	docker-compose down

build:
	docker-compose build --no-cache

logs:
	docker-compose logs -f

logs-back:
	docker-compose logs -f backend

shell:
	docker-compose exec backend bash

seed:
	docker-compose exec backend python seed.py

atlas-index:
	docker-compose exec backend python setup_atlas_index.py

pull-model:
	docker-compose exec ollama ollama pull neural-chat

health:
	@echo "── Backend ──────────────────────────────────"
	@curl -sf http://localhost:8000/health | python3 -m json.tool || echo "❌ Backend offline"
	@echo "── Ollama ───────────────────────────────────"
	@curl -sf http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama online" || echo "❌ Ollama offline"
	@echo "── Nginx ────────────────────────────────────"
	@curl -sf http://localhost/ > /dev/null && echo "✅ Nginx online" || echo "❌ Nginx offline"

lint:
	docker-compose exec backend flake8 . --max-line-length=120 --exclude=venv,.venv,__pycache__

test:
	docker-compose exec backend python -m pytest tests/ -v

clean:
	docker-compose down -v --remove-orphans
	@echo "✅ Containers and volumes removed"

reset: clean build up
	@echo "✅ Full reset complete"

dev-backend:
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && python3 -m http.server 3000
