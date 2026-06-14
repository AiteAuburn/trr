# Subscription Entitlement Schema

Purpose: define the MVP subscription and voice-usage contract implemented for `T034`.

## Tables

| Table | Responsibility |
| --- | --- |
| `plans` | Commercial plan definitions such as trial and annual plans. |
| `plan_entitlements` | Plan capabilities and limits keyed by entitlement name. |
| `subscriptions` | Account-level subscription state, trial period, cancellation state, referral code, and intro-price preservation. |
| `usage_counters` | Account-level usage counters by key and period. |

## Query Indexes

- `ix_subscriptions_account_status_created` supports active subscription lookup by account, status, and latest creation time.
- `uq_usage_counter_account_key_period` supports atomic usage counter upsert by account, key, and UTC usage date.

## MVP Entitlement

```text
voice.daily_seconds
```

Default seeded values:

- `trial`: 300 seconds per day
- `annual`: 600 seconds per day

The limit is stored in `plan_entitlements.value_json.seconds`. Runtime quota checks read this entitlement instead of branching on plan names.

## Voice Usage Counter

```text
counter_key = voice.seconds
period_start = current UTC date
period_end = next UTC date
used_units = seconds consumed
```

## Backend API

```text
GET /subscriptions/voice-quota
```

Returns:

- plan code
- subscription status
- trial start/end
- referral code
- intro-price preservation flag
- daily voice limit
- used seconds today
- remaining seconds today

## Enforcement

`POST /ai/parse-preview`, `POST /ai/parse-preview/progress-stream`, debug stream, and command proposal accept `voice_seconds`.

- `voice_seconds = 0`: text input or already-accounted usage; no voice consumption.
- `voice_seconds > 0`: backend checks `usage_counters` against the active subscription entitlement.
- Voice usage consumption uses atomic upsert and only increments when the daily limit would not be exceeded.
- over-limit requests return `429` with `voice_quota_exceeded`.

## Future Work

- Replace automatic trial creation with payment-provider-backed subscription provisioning.
- Add idempotency keys for voice usage increments.
- Add timezone-aware daily usage windows per account.
- Add paid plan upgrade/downgrade workflow.
- Add subscription management UI and provider webhooks.
