// Test the exact backend logic
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
    const already = await get(db, `SELECT name FROM _migrations WHERE name = ?`, [name]);
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

async function applySeeds(db, seedsPath) {
  console.log('Applying seeds...');
  
  const seedFiles = fs
    .readdirSync(seedsPath)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of seedFiles) {
    const seedName = path.basename(file);
    console.log(`Applying seed: ${seedName}`);
    const sql = fs.readFileSync(path.join(seedsPath, file), "utf8");
    await run(db, sql);
  }
}

// Test the exact backend logic
async function testBackendLogic() {
  try {
    console.log('Starting backend logic test...');
    
    const migrationsPath = path.resolve(__dirname, "../database/migrations");
    const seedsPath = path.resolve(__dirname, "../database/seed");
    
    console.log('Applying migrations...');
    await applyMigrations(db, migrationsPath);
    console.log('Migrations completed successfully');
    
    console.log('Applying seeds...');
    await applySeeds(db, seedsPath);
    console.log('Seeds completed successfully');
    
    // List final tables
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('\nFinal tables:');
    tables.forEach(row => console.log('  -', row.name));
    
    // Test a simple query
    const users = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM users", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('\nUsers in database:', users.length);
    
    db.close();
  } catch (e) {
    console.error('Backend logic test failed:', e);
    db.close();
  }
}

testBackendLogic();
