-- ============================================================
-- 001_initial.sql  — Is It Just Me? full schema
-- Requires: TimescaleDB extension
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ─── services ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('telecom','payments','food','banking','govt','streaming')),
  logo_url     TEXT,
  is_featured  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services (category);
CREATE INDEX IF NOT EXISTS idx_services_featured  ON services (is_featured) WHERE is_featured = true;

-- ─── votes ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS votes (
  id           UUID            NOT NULL DEFAULT gen_random_uuid(),
  service_id   UUID            NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  ip_hash      TEXT            NOT NULL,
  state_code   TEXT,
  city         TEXT,
  is_down      BOOLEAN         NOT NULL,
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Convert to TimescaleDB hypertable (partition by time)
SELECT create_hypertable('votes', 'created_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_votes_service_time  ON votes (service_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_state          ON votes (state_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_ip_hash        ON votes (ip_hash, created_at DESC);

-- ─── outage_events ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outage_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id       UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL,
  resolved_at      TIMESTAMPTZ,
  peak_reports     INTEGER,
  affected_states  TEXT[],
  severity         TEXT NOT NULL CHECK (severity IN ('minor','major','critical')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outage_service     ON outage_events (service_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_outage_active      ON outage_events (resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_outage_started     ON outage_events (started_at DESC);

-- ─── service_suggestions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS service_suggestions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  category     TEXT NOT NULL,
  description  TEXT,
  ip_hash      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Continuous aggregate: 1-minute vote bucketing ───────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS votes_per_minute
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 minute', created_at) AS bucket,
  service_id,
  COUNT(*) FILTER (WHERE is_down = true)  AS down_count,
  COUNT(*) FILTER (WHERE is_down = false) AS ok_count,
  COUNT(*)                                AS total_count
FROM votes
GROUP BY bucket, service_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('votes_per_minute',
  start_offset => INTERVAL '1 day',
  end_offset   => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute',
  if_not_exists => TRUE
);

-- Retention: keep raw votes for 90 days
SELECT add_retention_policy('votes', INTERVAL '90 days', if_not_exists => TRUE);

-- ─── Seed: services ──────────────────────────────────────────────────────────

INSERT INTO services (slug, name, category, is_featured) VALUES
  ('jio',        'Jio',            'telecom',   true),
  ('airtel',     'Airtel',         'telecom',   true),
  ('vi',         'Vi (Vodafone)',  'telecom',   true),
  ('bsnl',       'BSNL',           'telecom',   false),
  ('upi',        'UPI',            'payments',  true),
  ('paytm',      'Paytm',          'payments',  true),
  ('phonepe',    'PhonePe',        'payments',  true),
  ('gpay',       'Google Pay',     'payments',  true),
  ('swiggy',     'Swiggy',         'food',      true),
  ('zomato',     'Zomato',         'food',      true),
  ('blinkit',    'Blinkit',        'food',      true),
  ('sbi',        'SBI Net Banking','banking',   true),
  ('hdfc',       'HDFC Bank',      'banking',   false),
  ('icici',      'ICICI Bank',     'banking',   false),
  ('irctc',      'IRCTC',          'govt',      true),
  ('digilocker', 'DigiLocker',     'govt',      false),
  ('cowin',      'CoWIN',          'govt',      false),
  ('hotstar',    'Hotstar',        'streaming', true),
  ('netflix',    'Netflix',        'streaming', false),
  ('jiocinema',  'JioCinema',      'streaming', true)
ON CONFLICT (slug) DO NOTHING;
