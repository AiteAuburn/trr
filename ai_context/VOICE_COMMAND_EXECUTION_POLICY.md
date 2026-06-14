# Voice Command Execution Policy

Purpose: define how non-write voice command proposals are executed.

## Current Behavior

Backend:

- `POST /ai/command-proposal` returns proposals only.
- Backend does not directly mutate records from a command proposal.
- `CREATE_RECORD` still requires user confirmation and save.

Frontend:

- `NAVIGATE` executes only known safe routes.
- `GENERATE_REPORT` opens Basic Analysis and selects the requested range when available.
- `QUERY_DATA` is a placeholder that opens History; no query result card is generated yet.
- Unknown targets show a status message and do not execute.

## Route Mapping

| Command Target | Web View |
| --- | --- |
| `home` | Home |
| `trend` | Basic Analysis |
| `report` | Basic Analysis |
| `history` | History |
| `today` | Today |

## Audit Policy

Current MVP:

- No extra backend audit event is written for client-only navigation.
- Report API calls still write `report.basic_viewed` audit events when the backend report endpoint is used.
- Record creation continues to require explicit confirmation and records `record.created`.

Future:

- Add a PHI-safe `voice_command.executed` event only if product analytics or compliance requires it.
- Audit metadata must include intent/action/target only, never transcript or raw command text.
