// Test the exact backend execution
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/rosistrat.db');
console.log('Database path:', dbPath);

// Remove existing DB
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Removed existing database');
}

const db = new sqlite3.Database(dbPath);

// Copy the exact functions from our backend
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function applyMigrations(db, migrationsDir) {
  console.log('Applying migrations...');
  
  // Ensure migrations table
  await run(db, `CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, appliedAt TEXT NOT NULL)`);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const name of files) {
    console.log(`\nProcessing migration: ${name}`);
    const already = await get(db, `SELECT name FROM _migrations WHERE name = ?`, [name]);
    console.log(`Already applied check result:`, already);
    console.log(`Already applied check: already !== undefined =`, already !== undefined);
    
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
    
    console.log(`Statements to execute:`, statements.length);
    
    await run(db, "BEGIN TRANSACTION");
    try {
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
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

// Test the exact backend execution
async function testExactBackend() {
  try {
    console.log('Starting exact backend test...');
    
    const migrationsPath = path.resolve(__dirname, "../database/migrations");
    
    console.log('Applying migrations...');
    await applyMigrations(db, migrationsPath);
    console.log('Migrations completed successfully');
    
    // Verify tables were created
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log("Tables created:", tables.map(t => t.name));
    
    db.close();
  } catch (e) {
    console.error('Exact backend test failed:', e);
    db.close();
  }
}

testExactBackend();
