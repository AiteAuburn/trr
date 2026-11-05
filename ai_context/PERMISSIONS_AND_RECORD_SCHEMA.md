# Permissions and Record Schema

Purpose: the central permission service, profile access grants, the generic record model, and the record schema registry. This merges the old PERMISSIONS_AND_SCHEMA_REGISTRY and generic_health_record_abstraction docs. Rules in `skills.md` win.

## 1. Permission service

File: `backend/app/services/permissions.py`. Every profile and record access goes through it.

| Function | Use |
|---|---|
| `resolve_profile_permission`, `resolve_record_permission` | Return a decision (`allowed`, `scope`, `reason`, resolved profile or record) |
| `assert_can_read_profile`, `assert_can_write_profile`, `assert_can_export_profile`, `assert_can_share_profile` | Profile checks |
| `assert_can_read_record`, `assert_can_write_record` | Record checks (map to `profile:read` / `profile:write`) |
| `get_effective_profile_scopes`, `get_profile_for_account` | Helpers |
| `prune_inactive_profile_access_grants` | Batched cleanup of revoked or expired grants; nothing schedules it yet |

Rules:

- The owner account has full access to its profiles.
- Other accounts need an active `ProfileAccessGrant`. Revoked or expired grants are ignored, filtered in SQL.
- Missing and unauthorized resources both return 404, so nobody can probe whether a resource exists.
- Reason codes are bounded and contain no PHI.

## 2. Profile access grants

Table `profile_access_grants`: `grant_type` (caregiver | doctor | share), `scopes` (JSONB, at most 4), optional `expires_at` (must be timezone-aware and in the future), `revoked_at`, `metadata_json` (non-PHI only).

Scopes: `profile:read`, `profile:write`, `profile:export`, `profile:share`.

| Endpoint | Behavior |
|---|---|
| `GET /profiles/{id}/grants` | Needs `profile:share`. `limit` defaults to 100, max 500. `before` cursor must be timezone-aware |
| `POST /profiles/{id}/grants` | Needs `profile:share`. The grantee account must exist. A delegated actor can only grant scopes it holds |
| `DELETE /profiles/{id}/grants/{grant_id}` | Idempotent revoke |
| `GET /profiles/shared` | The caller's active, readable received grants. Never exposes the owner account id |
| `DELETE /profiles/shared/{grant_id}` | Grantee self-revoke, idempotent |

Create and revoke write audit events (`profile_access_grant.created` / `.revoked` / `.self_revoked`). Metadata is limited to grant type, scopes, and whether an expiry is set.

No client UI exists yet for inviting a caregiver or doctor (Phase 4 in `PRODUCT_ROADMAP.md`).

## 3. Generic record model

All health events go into one `records` table. There are no per-type tables.

```text
records: id, profile_id, record_type, occurred_at, source, payload_json, metadata_json,
         created_at, updated_at, deleted_at
```

- `occurred_at` is when the event happened and must be timezone-aware. Writes reject clearly future values.
- `payload_json` holds structured health fields only. Never store transcript, evidence, source_text, or other raw text there.
- `metadata_json` holds provenance and operational metadata, such as `record_schema_version` and client save batch ids.
- Deletes are soft (`deleted_at`).
- Parsers never write. They return candidates, and only the user's confirm action saves (`POST /daily-records/save` for AI results, `POST /records` for manual entry).
- Add dedicated read tables only when a hot path needs one, and derive them from `records`.

## 4. Record types and payloads

Validated in `backend/app/services/record_validation.py` (`ALLOWED_RECORD_TYPES`).

| Type | Required payload | Ranges / notes | Report eligible |
|---|---|---|---|
| `glucose` | `value`, `unit` | 20–600; unit `mg/dL` or `mmol/L`; optional `meal_timing` | yes |
| `meal` | `food_items` (list) | optional `meal_type` | yes |
| `exercise` | `activity` | optional `minutes` 0–1440 | yes |
| `medication` | `name` | | yes |
| `vital` | `kind` | `blood_pressure` needs `systolic` 40–300, `diastolic` 20–200, unit `mmHg` | no |
| `body_measurement` | `kind`, `value`, `unit` | `weight` 1–500 kg; `body_fat` 0–100 % | no |
| `lab_result` | `name` | optional `unit` | no |
| `lifestyle` | `kind` | | yes |
| `note` | `kind` or `tags` | bounded tag list | yes |

`payload_json` and `metadata_json` are bounded by depth, node count, container width, and string length (`record_json_bounds.py`). This runs before sanitizing (`record_sanitization.py`), permission lookup, or any DB write. Errors return field and reason codes only, never values.

## 5. Schema registry

File: `backend/app/services/record_schema_registry.py`.

- Lists supported types. Every type is currently `schema_version` 1.
- Writes `record_schema_version` into metadata on create and update, overwriting any client value.
- Exposes the report-eligible types used to filter `GET /reports/basic`.
- Delegates payload validation to `record_validation.py`.

Adding a record type means touching the validator, the registry, and the clients' display code, plus tests.

Not done: explicit per-version schemas and a payload migration policy.

## 6. Listing and report bounds

- `GET /profiles`, `GET /records`: `limit` defaults to 100, max 500. Records come ordered by `occurred_at` then `created_at` descending, with a tuple cursor (`before`, `before_created_at`). Cursors must be timezone-aware.
- `GET /reports/basic`: `start_at`, `end_at`, `limit`, all timezone-aware. Only report-eligible types are counted.
