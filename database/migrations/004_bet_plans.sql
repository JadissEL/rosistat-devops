-- Human-confirmed multi-spot bet plans (extension places only after user confirms)
CREATE TABLE IF NOT EXISTS bet_plans (
  id TEXT PRIMARY KEY,
  tableId TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'placing', 'done', 'cancelled')),
  payload TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_bet_plans_status_created
  ON bet_plans (status, createdAt DESC);
