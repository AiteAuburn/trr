# 糖錄錄 Docker Development Plan

## 1. Goal

Developer should be able to run backend and web with one command each.

Required:

```bash
docker compose up backend
docker compose up web
```

Convenience:

```bash
make backend
make web
make dev
```

## 2. Services

```yaml
services:
  db:
    image: postgres
  backend:
    build: ./backend
    depends_on:
      - db
  web:
    build: ./web
    depends_on:
      - backend
```

## 3. Ports

```text
backend: 8000
web: 5173
db: 5432
```

## 4. Backend Container

Backend starts with:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Required endpoints:

```text
GET /health
GET /version
```

Health response:

```json
{
  "status": "ok",
  "service": "backend",
  "env": "local"
}
```

## 5. Web Container

Web starts with:

```bash
npm run dev -- --host 0.0.0.0
```

Initial page:

- app title
- backend health status
- active profile mock
- text input placeholder

## 6. Environment Variables

Use `.env.example`.

Never commit real `.env`.

Required local env examples:

```text
APP_ENV=local
DATABASE_URL=postgresql+psycopg://app:app@db:5432/bloodsugar
BACKEND_CORS_ORIGINS=http://localhost:5173
VITE_API_BASE_URL=http://localhost:8000
LOG_LEVEL=debug
```

## 7. Makefile Targets

```makefile
backend:
	docker compose up backend

web:
	docker compose up web

dev:
	docker compose up db backend web

test:
	docker compose run --rm backend pytest
	docker compose run --rm web npm test

down:
	docker compose down
```

## 8. Local Data Policy

Local development:

- fake data only
- no production data
- no real PHI
- no real OpenAI key
- no real payment key

## 9. Future Production Path

Docker-first local development should map cleanly to deployment:

```text
local Docker Compose
-> staging Docker image
-> production Docker image
-> ECS Fargate / managed container runtime
```

Production deployment, rollback, and avoid-early infrastructure rules are defined in root `skills.md`.
