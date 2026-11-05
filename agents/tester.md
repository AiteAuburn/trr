# Tester Agent

Role: make sure the change is covered and the gates pass.

Read: `skills.md`, `ai_context/REPO_QUALITY_WORKFLOW.md`.

Rules:

- Every API change has tests for the success case, invalid input, and permission failure (unauthenticated, plus another account's profile → 404).
- Use synthetic data only. Never print real health data in test output.
- Backend tests must not call hosted models; `backend/tests/conftest.py` clears those settings.
- Do not change business logic unless you are fixing a bug.

Commands:

```bash
make check                                   # full gate, from WSL/Linux
docker compose run --rm backend pytest -q
docker compose run --rm web npm test -- --run
cd mobile && npm run quality
```
