import path from "node:path";
import fs from "node:fs";
import sqlite3 from "sqlite3";
import type { Database } from "sqlite3";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default DB path: prefer explicit env var, otherwise use repository-relative database/rosistat.db
// Use process.cwd() so running from project root resolves to <repo>/database/rosistat.db
const DEFAULT_DB_PATH = process.env.DB_FILE || path.resolve(process.cwd(), "database", "rosistat.db");

// Debug info about which DB path is used
if (!process.env.DB_FILE) {
  console.log(`[DB] No DB_FILE env set, using repo-relative default: ${DEFAULT_DB_PATH}`);
} else {
  console.log(`[DB] Using DB_FILE from env: ${process.env.DB_FILE}`);
}

export function createDbConnection(dbFile: string = DEFAULT_DB_PATH) {
  const dir = path.dirname(dbFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Debug: show DB file path actually used
  console.log("[DB] Using database file:", dbFile);

  const db = new sqlite3.Database(dbFile);

  // Pragmas for reliability
  db.serialize(() => {
    db.run("PRAGMA journal_mode=WAL");
    db.run("PRAGMA foreign_keys=ON");
  });

  return db;
}

export async function applyMigrations(db: Database, migrationsDir: string): Promise<void> {
  // Ensure migrations table
  await run(db, `CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, appliedAt TEXT NOT NULL)`);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const name of files) {
    const already = await get<{ name: string }>(db, `SELECT name FROM _migrations WHERE name = ?`, [name]);
    if (already !== undefined) {
      console.log(`Migration already applied: ${name}`);
      continue;
    }
    
    const sql = fs.readFileSync(path.join(migrationsDir, name), "utf8");
    console.log(`Applying migration: ${name}`);
    
    // Split SQL by semicolon and execute each statement separately
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    await run(db, "BEGIN TRANSACTION");
    try {
      for (const statement of statements) {
        if (statement.trim()) {
          await run(db, statement);
        }
      }
      await run(db, `INSERT INTO _migrations (name, appliedAt) VALUES (?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`, [name]);
      await run(db, "COMMIT");
      console.log(`Migration applied successfully: ${name}`);
    } catch (e) {
      await run(db, "ROLLBACK");
      console.error(`Migration failed: ${name}`, e);
      throw e;
    }
  }
}

export type Row = Record<string, unknown>;

export function run(db: Database, sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params as unknown[], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function get<T = Row>(db: Database, sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params as unknown[], function (err, row) {
      if (err) return reject(err);
      resolve(row as T | undefined);
    });
  });
}

export function all<T = Row>(db: Database, sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params as unknown[], function (err, rows) {
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });
}

export async function applySeeds(db: Database, seedsPath: string) {
  const seedFiles = fs
    .readdirSync(seedsPath)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of seedFiles) {
    const seedName = path.basename(file);
    console.log(`Applying seed: ${seedName}`);
    const sql = fs.readFileSync(path.join(seedsPath, file), "utf8");
    // Use exec to execute multi-statement SQL seed files
    await new Promise<void>((resolve, reject) => {
      (db as Database).exec(sql, (err: Error | null) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

