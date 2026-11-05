# Lightsail staging

The only deployment target for 糖錄錄: Caddy, the static web app, the FastAPI
backend, and PostgreSQL on one 1 GB Lightsail instance (plus 2 GB swap), run
with Docker Compose. DeepSeek is called as a hosted API; no LLM runs on this host.

This is staging for internal APK testing, not a high-availability setup. The
full runbook (first deploy, each release, rollback, backup/restore, and the
gaps to close before real users) is in [`ai_context/DEPLOYMENT.md`](../../ai_context/DEPLOYMENT.md).

| File | Purpose |
|---|---|
| `compose.yml` | The stack. Backend port 8000 is never published; only Caddy listens on 80/443. |
| `Caddyfile` | HTTPS, `/api/*` to the backend, legacy API paths for older APKs, everything else to web. |
| `.env.example` | Shape of the server-only `.env` (mode 0600, never committed). |
| `bootstrap.sh` | One-time host setup as root: Docker, swap, `/opt/bloodsugar`. |
| `initialize-env.sh DOMAIN` | Generates the database and JWT secrets into `.env` (`ALLOW_DEV_AUTH=false`). |
| `set-deepseek-key.sh` / `set-admin-credentials.sh` | Prompt for the DeepSeek key and admin password without echo; only the hash is stored. |
| `backup.sh` / `restore.sh` | `pg_dump` / `pg_restore` through the db container. Dumps contain health data. |
| `create-budget.ps1` | AWS Budget: USD 10/month with 80% actual and 100% forecast alerts. |

Admin analytics are compact UTC daily aggregates: route/status counts, durations,
model IDs, and token counts. They never include request bodies, prompts,
transcripts, or model responses.
