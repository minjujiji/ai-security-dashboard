-- PostgreSQL schema for the AI Security Dashboard.
-- Inferred from the application queries; compare against your live database
-- (pgAdmin) before relying on it for a fresh install.

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   TEXT NOT NULL,              -- bcrypt hash
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
  id          SERIAL PRIMARY KEY,
  filename    TEXT NOT NULL,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS log_events (
  id              SERIAL PRIMARY KEY,
  log_id          INTEGER NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  event_timestamp TIMESTAMP NOT NULL,
  event_type      VARCHAR(50) NOT NULL,
  ip_address      VARCHAR(45) NOT NULL,  -- fits IPv6
  raw_log         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id         SERIAL PRIMARY KEY,
  log_id     INTEGER NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  severity   VARCHAR(20) NOT NULL,
  message    TEXT NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_user        ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_events_log       ON log_events(log_id);
CREATE INDEX IF NOT EXISTS idx_events_type_ip   ON log_events(event_type, ip_address);
CREATE INDEX IF NOT EXISTS idx_alerts_log       ON alerts(log_id);
