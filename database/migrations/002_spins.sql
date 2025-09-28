-- Add simulation_spins table to store per-spin results (normalized)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS simulation_spins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  simulationId INTEGER NOT NULL,
  spinNumber INTEGER NOT NULL,
  drawnNumber INTEGER NOT NULL,
  spinNetResult INTEGER NOT NULL,
  cumulativeEarnings INTEGER NOT NULL,
  raw JSON NOT NULL,
  FOREIGN KEY (simulationId) REFERENCES simulations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_spins_simulation ON simulation_spins(simulationId);
CREATE INDEX IF NOT EXISTS idx_spins_number ON simulation_spins(spinNumber);
CREATE INDEX IF NOT EXISTS idx_simulations_userId ON simulations(userId);
CREATE INDEX IF NOT EXISTS idx_simulations_timestamp ON simulations(timestamp);


