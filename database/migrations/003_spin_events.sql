-- Live / captured Novibet-Evolution strike feed (paper-trade only)
CREATE TABLE IF NOT EXISTS spin_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tableId TEXT NOT NULL,
  roundId TEXT,
  number INTEGER NOT NULL CHECK (number >= 0 AND number <= 36),
  ts TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('devtools', 'csv', 'manual')),
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_spin_events_round
  ON spin_events (tableId, roundId)
  WHERE roundId IS NOT NULL AND roundId != '';

CREATE INDEX IF NOT EXISTS idx_spin_events_table_ts
  ON spin_events (tableId, ts DESC);

CREATE INDEX IF NOT EXISTS idx_spin_events_created
  ON spin_events (createdAt DESC);
