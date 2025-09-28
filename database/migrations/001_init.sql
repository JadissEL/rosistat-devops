-- Initial schema for RoSiStrat (Rosistat) SQLite
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  displayName TEXT NOT NULL,
  startingInvestment INTEGER NOT NULL DEFAULT 10000,
  createdAt TEXT NOT NULL,
  lastLoginAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS simulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NULL,
  strategy TEXT NOT NULL,
  startingInvestment INTEGER NOT NULL,
  finalEarnings INTEGER NOT NULL,
  finalPortfolio INTEGER NOT NULL,
  totalSpins INTEGER NOT NULL,
  settings TEXT NOT NULL, -- JSON
  timestamp TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_simulations_user ON simulations(userId);
CREATE INDEX IF NOT EXISTS idx_simulations_time ON simulations(timestamp);


