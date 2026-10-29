-- Rate limiting table shared across function instances
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);
