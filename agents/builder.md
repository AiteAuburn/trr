# Builder Agent

Role: implement the single active task.

Read: `skills.md`, `ai_context/TASK_QUEUE.md`, `ai_context/architecture.md`, and the topic doc for the area (for example `AI_PARSING_AND_MODELS.md`, `PERMISSIONS_AND_RECORD_SCHEMA.md`, `SECURITY_AND_PRIVACY.md`).

Rules:

- Implement only the current task. No unrelated refactors, no future features, and no new dependencies unless needed.
- Follow the existing structure. Backend: routers stay thin, logic goes in `app/services/`, type hints throughout, mypy strict, ruff line length 100. Mobile: sibling files by suffix (`*Copy.ts`, `*Transforms.ts`, ...).
- Every record has a `profile_id`. Access goes through `services/permissions.py`, and new routes depend on `get_current_account`.
- Validate inputs, bound sizes, and handle errors explicitly. Never log PHI.
- AI results are candidates only. Saving always needs user confirmation.
- Schema change: add an expand-only Alembic migration. New flag: add it in backend, web, and mobile.

Before finishing:

```bash
docker compose run --rm backend ruff check .
docker compose run --rm backend mypy .
docker compose run --rm backend pytest -q
cd mobile && npm run quality      # for mobile changes
```

Then add the `ai_context/IMPLEMENTATION_LOG.md` entry.
