import type { Database } from "sqlite3";
import { all, get, run } from "./db.js";

export interface SimulationInsert {
  userId?: string | null;
  strategy: string;
  startingInvestment: number;
  finalEarnings: number;
  finalPortfolio: number;
  totalSpins: number;
  settings: Record<string, unknown>;
}

export async function createSimulation(db: Database, data: SimulationInsert): Promise<number> {
  await run(
    db,
    `INSERT INTO simulations (userId, strategy, startingInvestment, finalEarnings, finalPortfolio, totalSpins, settings, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, json(?), strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
    [data.userId || null, data.strategy, data.startingInvestment, data.finalEarnings, data.finalPortfolio, data.totalSpins, JSON.stringify(data.settings || {})]
  );
  const row = await get<{ id: number }>(db, "SELECT last_insert_rowid() as id");
  return row?.id ?? 0;
}

export async function listSimulations(db: Database, userId?: string) {
  return userId
    ? await all(db, "SELECT * FROM simulations WHERE userId = ? ORDER BY timestamp DESC", [userId])
    : await all(db, "SELECT * FROM simulations ORDER BY timestamp DESC");
}

export interface SpinInsert {
  simulationId: number;
  spinNumber: number;
  drawnNumber: number;
  spinNetResult: number;
  cumulativeEarnings: number;
  raw: Record<string, unknown>;
}

export async function insertSpins(db: Database, spins: SpinInsert[]): Promise<void> {
  if (!spins.length) return;
  await run(db, "BEGIN TRANSACTION");
  try {
    for (const s of spins) {
      await run(
        db,
        `INSERT INTO simulation_spins (simulationId, spinNumber, drawnNumber, spinNetResult, cumulativeEarnings, raw)
         VALUES (?, ?, ?, ?, ?, json(?))`,
        [s.simulationId, s.spinNumber, s.drawnNumber, s.spinNetResult, s.cumulativeEarnings, JSON.stringify(s.raw || {})]
      );
    }
    await run(db, "COMMIT");
  } catch (e) {
    await run(db, "ROLLBACK");
    throw e;
  }
}

export async function getSimulationWithSpins(db: Database, id: number) {
  const sim = await get(db, "SELECT * FROM simulations WHERE id = ?", [id]);
  if (!sim) return null;
  const spins = await all(db, "SELECT * FROM simulation_spins WHERE simulationId = ? ORDER BY spinNumber ASC", [id]);
  return { simulation: sim, spins };
}

export async function listSpins(db: Database, simulationId: number, limit?: number, offset?: number) {
  const sql = `SELECT * FROM simulation_spins WHERE simulationId = ? ORDER BY spinNumber ASC${limit ? ` LIMIT ${limit}${offset ? ` OFFSET ${offset}` : ""}` : ""}`;
  return await all(db, sql, [simulationId]);
}

export async function getSpinsStats(db: Database, simulationId: number) {
  const stats = await get(db, `
    SELECT 
      COUNT(*) as totalSpins,
      MIN(spinNumber) as firstSpin,
      MAX(spinNumber) as lastSpin,
      MIN(cumulativeEarnings) as minEarnings,
      MAX(cumulativeEarnings) as maxEarnings,
      AVG(spinNetResult) as avgNetResult
    FROM simulation_spins 
    WHERE simulationId = ?
  `, [simulationId]);
  return stats;
}


