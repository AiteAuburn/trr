# Production AI Instructions

This file is intentionally short. The canonical AI / engineering execution rules live in:

- `skills.md`

Use this file only when an AI tool expects a production instruction filename.

## Required Reading Order

1. `skills.md`
2. `ai_context/TASK_QUEUE.md`
3. `ai_context/MASTER_ROADMAP.md`
4. `ai_context/IMPLEMENTATION_PLAN.md`
5. `ai_context/security_compliance.md`
6. `ai_context/local_model_playbook.md`

## Non-Negotiable Summary

- Local-first AI for v1.
- No cloud AI fallback in v1.
- No raw audio persistence by default.
- No PHI in logs, prompts, error reports, analytics, or non-compliant third-party services.
- No secrets in the repo.
- Docker-first local development.
- CI/CD must include lint, typecheck, tests, Docker build, dependency scan, secret scan, container scan, SAST, auth tests, and permission tests.
- Staging and production must use separate databases, storage, keys, credentials, logging levels, and deployment approvals.
- Production deployment must support health checks and rollback.

If this file conflicts with `skills.md`, follow `skills.md`.
