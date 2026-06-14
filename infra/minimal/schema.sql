CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL UNIQUE,
  display_name varchar(120) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  display_name varchar(120) NOT NULL,
  relationship varchar(80) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_user_profiles_account_id ON user_profiles(account_id);

CREATE TABLE IF NOT EXISTS records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  record_type varchar(80) NOT NULL,
  occurred_at timestamptz NOT NULL,
  source varchar(80) NOT NULL,
  payload_json jsonb NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS ix_records_profile_id ON records(profile_id);
CREATE INDEX IF NOT EXISTS ix_records_record_type ON records(record_type);
CREATE INDEX IF NOT EXISTS ix_records_profile_occurred_active
  ON records(profile_id, occurred_at DESC, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(80) NOT NULL UNIQUE,
  display_name varchar(120) NOT NULL,
  billing_interval varchar(40) NOT NULL,
  price_cents integer NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'TWD',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  entitlement_key varchar(120) NOT NULL,
  value_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_plan_entitlement_key UNIQUE (plan_id, entitlement_key)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status varchar(40) NOT NULL,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_started_at timestamptz,
  current_period_ends_at timestamptz,
  cancelled_at timestamptz,
  referral_code varchar(80),
  preserves_intro_price boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_subscriptions_account_id ON subscriptions(account_id);

CREATE TABLE IF NOT EXISTS usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  counter_key varchar(120) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  used_units integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_usage_counter_account_key_period UNIQUE (account_id, counter_key, period_start)
);

CREATE INDEX IF NOT EXISTS ix_usage_counters_account_id ON usage_counters(account_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  profile_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  action varchar(120) NOT NULL,
  resource_type varchar(120) NOT NULL,
  resource_id uuid,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_audit_logs_actor_account_id ON audit_logs(actor_account_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_profile_id ON audit_logs(profile_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs(created_at DESC);
