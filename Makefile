.PHONY: backend web mobile mobile-quality dev test check down build ollama qwen25 gemma3 llama32

backend:
	docker compose up backend

web:
	docker compose up web

mobile:
	cd mobile && npm run start

mobile-quality:
	cd mobile && npm run quality

dev:
	docker compose up db backend web

# Note: runs against the `make dev` database, and the backend suite clears every table.
# Prefer `make check`, which uses its own database.
test:
	docker compose run --rm backend pytest
	docker compose run --rm web npm test -- --run

# Full local quality gate (contract scripts, backend, web, mobile) in an isolated compose project.
check:
	bash scripts/check.sh

build:
	docker compose build

ollama:
	docker compose up -d ollama

qwen25:
	docker compose up -d ollama
	docker compose exec ollama ollama pull qwen2.5:1.5b

gemma3:
	docker compose up -d ollama
	docker compose exec ollama ollama pull gemma3:1b

llama32:
	docker compose up -d ollama
	docker compose exec ollama ollama pull llama3.2:1b

down:
	docker compose down
