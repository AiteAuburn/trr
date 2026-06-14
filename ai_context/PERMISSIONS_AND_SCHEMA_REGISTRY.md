# Permissions And Record Schema Registry

Purpose: document the production-grade seams added for `T037`.

## Permission Service

File:

```text
backend/app/services/permissions.py
```

Current MVP behavior:

- `resolve_profile_permission`
- `resolve_record_permission`
- `assert_can_read_profile`
- `assert_can_write_profile`
- `assert_can_export_profile`
- `assert_can_share_profile`
- `assert_can_read_record`
- `assert_can_write_record`

All currently resolve to account-owned profiles and active owned records because real caregiver/doctor permissions are not implemented yet. Permission resolution returns a small decision object with:

- `allowed`
- `scope`
- `reason`
- resolved `profile` or `record` when allowed

The public API still hides missing and unowned profiles/records behind `404`, so ownership probing does not reveal whether another user's resource exists. The value is the single routing point: future caregiver, doctor, export, and share roles can be added here instead of duplicating ownership checks across routers.

Owned profile listing:

- `GET /profiles`
- Bounded by `limit`, default `100`, maximum `500`.
- Supports `before` cursor pagination using profile `created_at`.
- `before` cursor datetime must include timezone information and is rejected before query work.
- Returns only profiles owned by the current account.
- `ix_user_profiles_account_created` supports owned profile listing by `account_id` and `created_at`.

Persistent grant foundation:

- `backend/app/models/profile_access_grant.py`
- `profile_access_grants` migration: `20260430_0010`
- grant query index migrations: `20260430_0011`, `20260430_0014`, `20260430_0015`

Current grant behavior:

- Account-to-profile grants can allow bounded scopes such as `profile:read` and `profile:export`.
- Grants have `grant_type`, `scopes`, optional `expires_at`, and optional `revoked_at`.
- Revoked or expired grants are ignored.
- Active grant permission checks filter revoked/expired rows in SQL and only select the fields needed for the decision.
- Record read/write permissions map to profile scopes through the permission service.
- Grant metadata must remain non-PHI operational metadata.
- Inactive grant rows can be pruned by retention cutoff with `prune_inactive_profile_access_grants`.

Grant-management API:

- `GET /profiles/shared`
- `DELETE /profiles/shared/{grant_id}`
- `GET /profiles/{profile_id}/grants`
- `POST /profiles/{profile_id}/grants`
- `DELETE /profiles/{profile_id}/grants/{grant_id}`

Current API behavior:

- Shared-profile listing returns only active, non-revoked grants with readable scopes.
- Shared-profile listing applies active/readable filters before `limit`.
- Shared-profile listing does not expose the owner account id.
- Shared-profile listing supports `before` cursor pagination using grant `created_at`; the cursor must include timezone information.
- Shared grant self-revoke allows the grantee to revoke their own received grant.
- Shared grant self-revoke is idempotent and writes one bounded non-PHI audit event.
- Requires `profile:share` permission on the profile.
- Profile grant listing is bounded by `limit`, default `100`, maximum `500`.
- Profile grant listing supports `before` cursor pagination using grant `created_at`; the cursor must include timezone information.
- Owner can create/list/revoke grants.
- A future actor with `profile:share` can manage grants through the same permission service.
- Non-owner grant delegation is least-privilege: delegated actors can only grant scopes they currently hold.
- Create rejects timezone-naive or expired `expires_at` values before share-permission lookup or grant DB work.
- Create validates the grantee account exists.
- Revoke is idempotent for already-revoked grants.
- Create/revoke write audit events with bounded non-PHI metadata only: grant type, scopes, and expiration presence.
- The API does not accept free-form grant metadata yet.

Grant maintenance:

- `prune_inactive_profile_access_grants(older_than=..., db=...)`
- Deletes grants revoked before the cutoff.
- Deletes grants expired before the cutoff.
- Preserves active, unexpired, and recently inactive grants.
- Runs in bounded batches; maintenance jobs should repeat until the helper returns `0`.

Grant query indexes:

- `ix_profile_access_grants_profile_created` supports profile grant history by `profile_id` and `created_at`.
- `ix_profile_access_grants_grantee_revoked_created` supports shared-profile listing by grantee, active status, and cursor order.
- `ix_profile_access_grants_grantee_expires` supports shared-profile expiration filtering.
- `ix_profile_access_grants_revoked_created` supports revoked-grant retention pruning.
- `ix_profile_access_grants_expires_created` supports expired-grant retention pruning.
- `ix_profile_access_grants_scopes_gin` supports JSONB scope containment checks.

Record listing:

- `GET /records`
- Requires readable access to the requested `profile_id` through the permission service.
- Bounded by `limit`, default `100`, maximum `500`.
- Ordered by `occurred_at` descending, then `created_at` descending.
- Supports legacy `before` cursor pagination using record `occurred_at`.
- Supports stable tuple cursor pagination using `before` plus `before_created_at` for multiple records with the same `occurred_at`.
- Cursor datetimes must include timezone information and are rejected before permission/query work.

Record write timestamp guard:

- `POST /records` and `PATCH /records/{record_id}` reject clearly future `occurred_at` values before permission and DB write work.
- `occurred_at` values must include timezone information.

Record JSON bounds:

- `payload_json` and `metadata_json` are bounded by depth, node count, container width, and string length before permission lookup, sanitizer recursion, schema validation, or DB write work.
- Bound errors return only field and reason codes; they do not echo payload or metadata values.
- Core numeric payloads use schema-level ranges before DB write, including glucose values, exercise minutes, blood pressure values, weight, and body-fat percentage.
- Core semantic payload strings and units are bounded before DB write, including glucose units/timing, meal type and food item text, exercise activity, medication/lab names, blood pressure units, body measurement kind/unit, lifestyle kind, and note tags.

## Record Schema Registry

File:

```text
backend/app/services/record_schema_registry.py
```

Current behavior:

- lists supported record types
- exposes backend-owned `record_schema_version`
- attaches schema version `1` into record metadata on create and payload/metadata update
- overwrites client-provided schema version metadata with the registry value
- marks report-eligible record types
- exposes report-eligible record types for report SQL filtering
- delegates payload validation to the existing validator

Future work:

- move each record type into explicit versioned schemas
- add payload migration policy
- expose schema metadata to clients if needed

## Report Date Window

`GET /reports/basic` now supports:

```text
start_at
end_at
limit
```

This prevents unbounded report reads from becoming the default path as users accumulate years of records.

`start_at` and `end_at` must include timezone information and are rejected before export permission/query work when timezone-naive.

Report rows are filtered through the schema registry's report eligibility list so future or extended record types do not silently change basic report counts.

## Request ID Logging

The backend now returns `X-Request-ID` and logs:

```text
request_id
method
path
status
duration_ms
```

It does not log request bodies, query values, headers, transcripts, payloads, or secrets.

Inbound `X-Request-ID` is accepted only when it is short and trace-safe; otherwise the backend generates a new UUID before writing the response header or structured request log.
