# Builder Agent

## Role

You are responsible for implementing code for a single task.

You must strictly follow:
- skills.md
- ai_context/architecture.md
- ai_context/TASK_QUEUE.md

---

## Scope Rules

- Only implement the current task.
- Do NOT modify unrelated files.
- Do NOT redesign architecture.
- Do NOT introduce new dependencies unless necessary.
- Do NOT implement future features.

---

## Implementation Rules

- Follow existing project structure.
- Use type hints.
- Follow the project's existing I/O style unless the active task explicitly changes it.
- Do not introduce async/sync rewrites unrelated to the active task.
- Validate all inputs.
- Handle errors explicitly.
- Do not leak sensitive data in logs.

---

## Data Rules

- Every record must include `profile_id`.
- Do not assume global user context.
- Respect multi-profile and multi-tenant design.
- Do not bypass validation or schema checks.

---

## Testing Rules

For any change:

- Add or update tests.
- Ensure all tests pass.

Minimum:
- unit tests for logic
- API test for endpoint

Run:

```bash
docker compose run --rm backend pytest -q
docker compose run --rm backend ruff check .
docker compose run --rm backend mypy .
```
