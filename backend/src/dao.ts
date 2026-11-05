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

/** Live Novibet / Evolution strike feed (paper-trade) */
export interface SpinEventInsert {
  tableId: string;
  roundId?: string | null;
  number: number;
  ts: string;
  source: "devtools" | "csv" | "manual";
}

export interface SpinEventRow extends SpinEventInsert {
  id: number;
  createdAt: string;
}

export async function insertSpinEvent(
  db: Database,
  data: SpinEventInsert,
): Promise<{ id: number; inserted: boolean }> {
  const roundId = data.roundId || null;
  try {
    await run(
      db,
      `INSERT INTO spin_events (tableId, roundId, number, ts, source)
       VALUES (?, ?, ?, ?, ?)`,
      [data.tableId, roundId, data.number, data.ts, data.source],
    );
    const row = await get<{ id: number }>(db, "SELECT last_insert_rowid() as id");
    return { id: row?.id ?? 0, inserted: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Unique roundId collision → treat as idempotent success
    if (msg.includes("UNIQUE") && roundId) {
      const existing = await get<{ id: number }>(
        db,
        `SELECT id FROM spin_events WHERE tableId = ? AND roundId = ?`,
        [data.tableId, roundId],
      );
      return { id: existing?.id ?? 0, inserted: false };
    }
    throw e;
  }
}

export async function insertSpinEventsBulk(
  db: Database,
  events: SpinEventInsert[],
): Promise<{ inserted: number; ids: number[] }> {
  let inserted = 0;
  const ids: number[] = [];
  for (const ev of events) {
    const r = await insertSpinEvent(db, ev);
    if (r.inserted) inserted += 1;
    ids.push(r.id);
  }
  return { inserted, ids };
}

export async function listSpinEvents(
  db: Database,
  opts: { tableId?: string; limit?: number; afterId?: number } = {},
): Promise<SpinEventRow[]> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 1000);
  const params: unknown[] = [];
  const where: string[] = [];
  if (opts.tableId) {
    where.push("tableId = ?");
    params.push(opts.tableId);
  }
  if (typeof opts.afterId === "number" && opts.afterId > 0) {
    where.push("id > ?");
    params.push(opts.afterId);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  params.push(limit);
  return (await all(
    db,
    `SELECT id, tableId, roundId, number, ts, source, createdAt
     FROM spin_events
     ${whereSql}
     ORDER BY id ASC
     LIMIT ?`,
    params,
  )) as SpinEventRow[];
}

/** Human-confirmed bet plans for the Chrome placer extension */
export interface BetPlanRow {
  id: string;
  tableId: string;
  status: "pending" | "placing" | "done" | "cancelled";
  payload: string;
  createdAt: string;
  updatedAt: string;
}

export async function upsertBetPlan(
  db: Database,
  plan: {
    id: string;
    tableId: string;
    status: BetPlanRow["status"];
    payload: unknown;
  },
): Promise<void> {
  await run(
    db,
    `INSERT INTO bet_plans (id, tableId, status, payload, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     ON CONFLICT(id) DO UPDATE SET
       status = excluded.status,
       payload = excluded.payload,
       updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    [plan.id, plan.tableId, plan.status, JSON.stringify(plan.payload)],
  );
}

export async function getPendingBetPlan(
  db: Database,
  tableId?: string,
): Promise<BetPlanRow | undefined> {
  if (tableId) {
    return await get<BetPlanRow>(
      db,
      `SELECT * FROM bet_plans
       WHERE status = 'pending' AND tableId = ?
       ORDER BY createdAt ASC LIMIT 1`,
      [tableId],
    );
  }
  return await get<BetPlanRow>(
    db,
    `SELECT * FROM bet_plans WHERE status = 'pending' ORDER BY createdAt ASC LIMIT 1`,
  );
}

export async function updateBetPlanStatus(
  db: Database,
  id: string,
  status: BetPlanRow["status"],
): Promise<void> {
  await run(
    db,
    `UPDATE bet_plans SET status = ?, updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
    [status, id],
  );
}


