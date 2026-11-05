# Development Workflow

Always read `skills.md` (wins on conflict), `ai_context/TASK_QUEUE.md`, and `ai_context/architecture.md` first.

| Step | Role | Do |
|---|---|---|
| 1. Plan | Planner (`agents/planner.md`) | Pick one task from Next Up and mark it active |
| 2. Architecture check | Builder (small tasks) | Confirm the design fits `ai_context/architecture.md`; note any breaking change explicitly |
| 3. Implement | Builder (`agents/builder.md`) | Change only what the task needs |
| 4. Test | Tester (`agents/tester.md`) | Add tests, run the gates |
| 5. Security review | Any | No PHI in logs, no secrets in code, auth and permission correct, inputs validated (`ai_context/SECURITY_AND_PRIVACY.md`) |
| 6. Close | Any | `make check` passes (plus mobile `npm run quality` for mobile changes); update `TASK_QUEUE.md`; add an `IMPLEMENTATION_LOG.md` entry |
| 7. Deploy | Operator | Only to Lightsail staging, following `ai_context/DEPLOYMENT.md` |

There is no hosted CI. Commit, push, and deploy only when the user asks.
