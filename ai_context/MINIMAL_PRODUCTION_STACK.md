# 糖錄錄 Minimal Production Stack

本文件是最小 self-hosted production 架構。它優先使用 Linux native tooling、Docker Compose、PostgreSQL、Redis、NGINX、FastAPI、Vite static build 與本地量化 LLM。Kubernetes 只在確定需要多節點、自動調度或高流量時再遷移。

## 1. Minimal production architecture

```text
User
  |
  v
Cloudflare / DNS / optional TLS
  |
  v
NGINX unprivileged reverse proxy :80
  |
  +-- /api -> FastAPI backend :8000
  |
  +-- /    -> static web container :8080

Private Docker network
  |
  +-- backend
  +-- web
  +-- PostgreSQL
  +-- Redis
  +-- optional Ollama local LLM profile
```

Default production stance:

- One Linux VM first.
- Docker Compose first.
- Only NGINX exposes a host port.
- Backend is stateless.
- DB and Redis stay on private Docker network.
- Ollama is optional and enabled only with the `llm` profile.
- Optional Ollama service is configured as non-root and stores models under a dedicated volume.
- TLS can terminate at Cloudflare, or replace NGINX with Caddy if direct automatic TLS is needed.

## 2. Folder structure

```text
bloodsugar/
  backend/
    Dockerfile.prod
    app/
    alembic/
  web/
    Dockerfile.prod
    src/
  infra/
    minimal/
      docker-compose.yml
      .env.example
      nginx.conf
      schema.sql
      backup.sh
      restore.sh
  ai_context/
    MINIMAL_PRODUCTION_STACK.md
```

## 3. docker-compose.yml

Canonical file:

```text
infra/minimal/docker-compose.yml
```

Properties:

- NGINX unprivileged proxy.
- Backend, web, db, redis on private network.
- Host exposes only port `80`.
- Containers drop Linux capabilities where practical.
- Backend and web run read-only with tmpfs where needed.
- Resource limits are set for every service.
- Ollama is behind an optional Compose profile.

Run:

```bash
docker compose --env-file infra/minimal/.env -f infra/minimal/docker-compose.yml up -d --build
```

## 4. .env.example

Canonical file:

```text
infra/minimal/.env.example
```

Rules:

- Copy to `infra/minimal/.env`.
- Replace all passwords with long random values.
- Do not commit `.env`.
- Keep model token limits low by default.
- Keep Ollama timeout bounded.

## 5. Minimal backend implementation

Current backend:

- FastAPI.
- Stateless.
- PostgreSQL through SQLAlchemy.
- Existing `/health`.
- Added `/healthz` liveness endpoint.
- Added `/readyz` readiness endpoint with DB `SELECT 1`.

Files:

```text
backend/app/main.py
backend/Dockerfile.prod
backend/tests/test_health.py
```

Required runtime behavior:

- No in-memory sessions.
- No raw PHI logging.
- Parser returns candidates; DB writes require user confirmation.
- Compact JSON responses.
- Paginate list endpoints when data grows.

## 6. Database schema

Canonical minimal schema reference:

```text
infra/minimal/schema.sql
backend/alembic/versions/
```

Core tables:

- `accounts`
- `user_profiles`
- `records`
- `audit_logs`

Record shape:

```text
profile_id
record_type
occurred_at
source
payload_json
metadata_json
created_at
updated_at
```

Production DB policy:

- PostgreSQL is durable state.
- Do not scale DB by duplicating arbitrary DB containers.
- Start with single PostgreSQL volume for self-hosted minimal production.
- Move to managed PostgreSQL when uptime / backup / failover requirements increase.

## 7. Reverse proxy configuration

Canonical file:

```text
infra/minimal/nginx.conf
```

Responsibilities:

- Route `/api/` to backend.
- Route `/` to web.
- Add basic security headers.
- Limit API requests per source IP.
- Limit request body size.
- Log to stdout/stderr.

Only proxy is public:

```text
host:80 -> proxy:8080
```

## 8. Security checklist

- Use Linux VM with automatic security updates.
- Keep only ports `22`, `80`, and optional `443` open.
- Prefer SSH keys; disable password SSH.
- Do not expose DB, Redis, backend, Ollama to host ports.
- Replace `.env` secrets before first boot.
- Never commit real `.env`.
- Run containers as non-root where image supports it.
- Drop Linux capabilities.
- Use `no-new-privileges`.
- Use read-only filesystems where possible.
- Put write paths on tmpfs or named volumes only.
- Keep PHI out of logs.
- Keep prompts, transcripts, and raw model outputs out of logs.
- Sanitize all user input before persistence.
- Validate record payloads by `record_type`.
- Keep AI as proposal-only; no direct tool execution.
- Use Cloudflare/WAF or host firewall for coarse rate limits.
- Review backups for encryption and access control.

## 9. Deployment commands

Initial setup:

```bash
cp infra/minimal/.env.example infra/minimal/.env
chmod 600 infra/minimal/.env
docker compose --env-file infra/minimal/.env -f infra/minimal/docker-compose.yml build
docker compose --env-file infra/minimal/.env -f infra/minimal/docker-compose.yml up -d
docker compose --env-file infra/minimal/.env -f infra/minimal/docker-compose.yml exec backend alembic upgrade head
curl -fsS http://localhost/api/healthz
```

Enable optional local LLM service:

```bash
docker compose --env-file infra/minimal/.env -f infra/minimal/docker-compose.yml --profile llm up -d ollama
```

Update:

```bash
git pull
docker compose --env-file infra/minimal/.env -f infra/minimal/docker-compose.yml build
docker compose --env-file infra/minimal/.env -f infra/minimal/docker-compose.yml up -d
docker compose --env-file infra/minimal/.env -f infra/minimal/docker-compose.yml exec backend alembic upgrade head
```

Stop:

```bash
docker compose -f infra/minimal/docker-compose.yml down
```

## 10. Monitoring/logging setup

Minimal:

- Docker JSON logs.
- `docker compose logs -f proxy backend`.
- `/healthz` for process health.
- `/readyz` for DB readiness.
- Minimal production backend container healthcheck uses `/readyz`, so the proxy waits for DB-backed backend readiness.
- `docker stats` for CPU/RAM.
- Host disk alert with `df -h`.

Recommended lightweight additions:

- `journald` retention limits.
- Uptime monitor hitting `/api/healthz`.
- Daily backup success check.
- Logrotate if exporting logs.

Avoid early:

- Full ELK.
- Multi-service tracing stack.
- Prometheus/Grafana unless operational need is proven.

## 11. Token optimization strategy

- Keep parser prompt short and fixed.
- Use compact IR, not verbose natural language.
- Cap `LOCAL_LLM_MAX_TOKENS` aggressively; minimal default is `900`.
- Use low temperature.
- Segment input and cap segment batch size.
- Strip irrelevant transcript text before LLM.
- Use deterministic validation and repair after LLM.
- Cache repeated model metadata and static instructions.
- Do not append full conversation history.
- Do not recursively feed model output back into prompts.
- Return compact JSON to UI.

## 12. Prompt injection defense strategy

- Treat user transcript as untrusted data.
- System prompt states parser-only role.
- LLM output is never executed.
- LLM cannot call tools.
- LLM cannot write DB.
- Only schema-valid candidate records proceed.
- User confirmation is required before save.
- Drop unsupported record fields.
- Reject prompt text that asks to ignore rules as ordinary user text.
- Do not include secrets, env vars, system prompts, or tool outputs in LLM context.
- Bound timeouts and retries.
- Log only non-PHI operational metadata.

## 13. Backup and restore strategy

Backup:

```bash
cp infra/minimal/.env.example infra/minimal/.env
sh infra/minimal/backup.sh
```

Restore:

```bash
MINIMAL_ENV_FILE=infra/minimal/.env \
sh infra/minimal/restore.sh backups/bloodsugar-YYYYMMDDTHHMMSSZ.dump
```

Policy:

- Run backup daily from cron.
- Store at least 14 days locally.
- Backup writes to a temporary dump file first, then renames only after `pg_dump` succeeds.
- Backup and restore scripts require `MINIMAL_ENV_FILE` or `infra/minimal/.env` so they do not silently run with missing Compose secrets.
- Copy encrypted backups off-host.
- Test restore monthly.
- Before migrations, run a fresh backup.
- Redis is cache/queue only in this minimal stack; DB is durable source of truth.

## 14. Future Kubernetes migration path

Migrate only when Compose no longer satisfies uptime or scaling needs.

Path:

```text
Compose services
-> production Docker images
-> Helm chart
-> managed PostgreSQL
-> managed Redis
-> Ingress Controller
-> HPA for stateless backend
-> worker autoscaling if queue pressure requires it
```

Keep:

- Same env names.
- Same `/healthz` and `/readyz`.
- Same migration command.
- Same stateless backend contract.

Reference:

```text
ai_context/PRODUCTION_DEPLOYMENT_ARCHITECTURE.md
```

## 15. Resource optimization recommendations

- Keep only proxy public.
- Use Alpine/slim images where practical.
- Use non-root production images.
- Avoid dev dependencies in production images.
- Disable backend access logs unless needed.
- Keep Redis memory capped.
- Keep Ollama off unless actively using local parser.
- Prefer small quantized models.
- Keep model keep-alive short on small machines.
- Use DB indexes for profile/date queries.
- Paginate record lists.
- Avoid exporting large JSON payloads.
- Keep file uploads off until product requires them.
- Use static frontend hosting if Kubernetes/SSR is not needed.

## 16. Scaling recommendations only if absolutely necessary

Scale in this order:

1. Add RAM/CPU to the VM.
2. Tune DB indexes and slow queries.
3. Add PgBouncer if DB connections become the bottleneck.
4. Move PostgreSQL to managed DB.
5. Split Ollama to a separate host if local LLM saturates CPU/RAM.
6. Add a second backend replica only after backend CPU is the bottleneck.
7. Move to Kubernetes only after single-host Compose operations become unreliable.

Do not scale:

- Database by cloning independent PostgreSQL containers.
- Backend before DB/query pressure is understood.
- Redis into a cluster before memory and latency require it.
