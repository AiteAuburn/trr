# Zero-downtime release and rollback runbook

This contract applies to backend, web, database migrations, and server compatibility for signed mobile builds. A mobile binary is never assumed to update at the same time as the server.

## Release invariants

- Build backend, migration, web, and proxy artifacts once. Scan them and record immutable digests before promotion.
- The migration job and backend deployment use the exact same backend digest.
- Schema changes use expand/contract: add backward-compatible structures first, deploy compatible code second, and remove old structures only after every supported client and rollback version has expired.
- `/healthz` proves process liveness, `/readyz` gates customer traffic on database readiness, and `/version` identifies the exact release and API contract without exposing PHI.
- Keep the previous known-good digests and signed mobile build available throughout the observation window.

## Promote

1. Record the release ID, full Git SHA, artifact digests, current Alembic head, previous digests, and rollback owner.
2. Verify a restorable database backup, then run the expand-only migration job using the new backend digest.
3. Start one canary backend replica. Require `/readyz` success and confirm `/version` returns the intended release ID, Git SHA, and API contract.
4. Observe at least 15 minutes. Abort on readiness failures or meaningful regression in HTTP 5xx, p95 latency, auth failures, DB pool saturation, job failures, or business-flow smoke checks.
5. Roll out with `maxUnavailable: 0`; wait for every new pod to remain ready for `minReadySeconds` before old pods terminate.
6. Promote web/proxy by immutable digest, repeat smoke checks, and continue enhanced observation.

## Abort or rollback

1. Stop promotion. Remove the canary or point the deployment back to the recorded previous digest.
2. Do not automatically downgrade the database. The previous application must remain compatible with the expanded schema.
3. Confirm old pods pass `/readyz`, `/version` reports the previous release, and customer error/latency/auth metrics recover.
4. Preserve evidence and open a follow-up before retrying. A destructive contract migration is a separate release and cannot be part of rollback.

## Mobile compatibility

- Server responses may add optional fields, but cannot remove or change fields used by supported signed builds during their support window.
- `infra/api-migration-compatibility.json` is the reviewed API support range. A breaking response or behavior change requires a new contract version and an explicit client migration window.
- Native SDK changes require a new signed binary. Feature exposure must be independently controllable so the server can disable a feature without forcing a binary rollback.
- Store rollback means re-promoting a previously signed build or reviewed update channel; therefore backend API compatibility is the primary no-downtime protection.
