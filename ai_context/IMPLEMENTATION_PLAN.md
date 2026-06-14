# 糖錄錄 Implementation Plan

文件定位：本文件描述工程落地順序。AI / engineering 執行規範以根目錄 `skills.md` 為準。

## 1. Implementation Strategy

先做可跑起來的開發骨架，再做產品功能。

順序：

```text
repo scaffold
-> docker local dev
-> backend health / config
-> web mock frontend
-> schema / API contracts
-> record flow
-> report flow
-> sync / auth / subscription
-> local AI integration
-> mobile app
```

第一階段不要做：

- Kubernetes
- microservices
- multi-region
- cloud AI fallback
- 完整 mobile native AI
- 完整醫院 portal

最小 self-hosted production 優先使用 Docker Compose，見 `ai_context/MINIMAL_PRODUCTION_STACK.md`。Production Kubernetes、自動擴展、managed database、Redis、CI/CD 與 observability 的完整目標架構見 `ai_context/PRODUCTION_DEPLOYMENT_ARCHITECTURE.md`。Kubernetes 是後續擴展路徑，不改變第一階段先穩住 Docker-first local development 的順序。

## 2. Proposed Monorepo Layout

```text
bloodsugar/
  backend/
    app/
      api/
      core/
      db/
      models/
      schemas/
      services/
      tests/
    Dockerfile
    pyproject.toml
    alembic.ini
  web/
    src/
      app/
      components/
      features/
      lib/
      tests/
    Dockerfile
    package.json
  mobile/
    app/
    package.json
  infra/
    docker/
    aws/
  scripts/
  references/
  assets/
  ai_context/
  docker-compose.yml
  Makefile
  .env.example
```

## 3. Backend Stack

Recommended first backend:

- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- PostgreSQL
- pytest
- ruff
- mypy

Why:

- simple
- testable
- Docker friendly
- good API docs
- easy migration path to AWS containers / Lambda style deployment

Initial backend endpoints:

```text
GET /health
GET /version
POST /auth/dev-login
GET /profiles
POST /profiles
POST /records/parse-preview
POST /records
GET /records
GET /reports/basic
POST /sync/push
GET /sync/pull
```

Notes:

- `parse-preview` starts as a deterministic placeholder.
- Later it calls local model service or device local pipeline.
- No PHI in logs.
- All records include `profile_id`.

## 4. Web Stack

Recommended first web simulator:

- Vite
- React
- TypeScript
- React Query or simple fetch layer
- Vitest
- Playwright later for critical flows

Purpose:

- simulate app UX quickly
- test backend contracts
- iterate report and profile switching
- avoid mobile native complexity during backend/schema design

Initial screens:

- dev login
- active profile switcher
- home record input
- parse confirmation
- saved records
- basic trend
- basic report
- settings placeholder

## 5. Docker Local Development

Target commands:

```bash
docker compose up backend
docker compose up web
docker compose up db
```

Convenience commands:

```bash
make backend
make web
make dev
make test
```

Services:

```text
db: PostgreSQL
backend: FastAPI
web: Vite React
```

Ports:

```text
backend: http://localhost:8000
web: http://localhost:5173
db: localhost:5432
```

## 6. Environment Design

Local:

- `.env.example`
- fake keys only
- local postgres
- debug logging with redaction

Staging:

- separate database
- separate storage bucket
- separate API keys
- separate LLM keys if enabled later
- lower logging level
- no production data

Production:

- separate database
- separate storage bucket
- separate keys
- strict logging
- backups
- audit logs
- manual approval deploy

## 7. Data Model First Cut

Core tables:

```text
accounts
user_profiles
profile_memberships
records
record_events
reports
report_templates
sync_jobs
audit_logs
plans
subscriptions
entitlements
households
household_memberships
care_permissions
```

Record strategy:

- start with generic `records`
- each record has `record_type`
- each record has `payload_json`
- each record has `profile_id`
- later split high-volume types into dedicated tables if needed

Reason:

- fast MVP
- future extensibility
- blood pressure / weight / lab / CGM can be added without immediate schema rewrite

## 8. MVP Record Types

MVP supported:

- glucose
- meal
- exercise
- medication
- lifestyle
- note

Reserved:

- blood_pressure
- weight
- lab_result
- cgm_reading
- sleep
- symptom
- device_sync

## 9. Report Engine First Cut

Modules:

```text
report_data_providers
metrics_calculators
report_templates
report_renderers
export_policies
```

MVP:

- basic in-app/web report
- no PDF persistence
- PDF generation interface only
- report data generated on demand

Rules:

- no report PHI in logs
- report access requires profile permission
- report generation creates audit event when shared/exported

## 10. CI/CD First Cut

CI/CD 的完整規範以根目錄 `skills.md` 為準。

本 implementation plan 只補充落地順序：

- 先建立 GitHub Actions PR checks。
- 再加入 Docker image build。
- 再加入 secret / dependency / container / SAST scan。
- 最後建立 staging deploy、manual approval、production deploy、rollback。

## 11. Security First Cut

安全底線以根目錄 `skills.md` 為準，細節以 `ai_context/security_compliance.md` 為準。

本 implementation plan 只列第一批工程工作：

- `.env.example` and secret loading pattern
- log redaction helper
- audit log table
- auth / permission test skeleton
- environment config separation
- no-PHI logging convention

## 12. First 10 Implementation Steps

1. Create monorepo skeleton.
2. Add Docker Compose with db, backend, web.
3. Add backend FastAPI health endpoint.
4. Add web Vite app with health check display.
5. Add Makefile one-line commands.
6. Add backend lint/type/test setup.
7. Add web lint/type/test setup.
8. Add initial data model and Alembic.
9. Add profile switching and generic records API.
10. Add web record flow and basic report.

## 13. Definition Of Done For Phase 0

Phase 0 is done when:

- `docker compose up backend` starts backend.
- `docker compose up web` starts web.
- backend health check works.
- web can call backend health check.
- tests run locally.
- lint/typecheck run locally.
- no secrets are committed.
- `.env.example` exists.
- README or dev instructions include one-line commands.
