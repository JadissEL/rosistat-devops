// Test SQL execution
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/rosistrat.db');
console.log('Database path:', dbPath);

// Remove existing DB
import fs from 'node:fs';
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Removed existing database');
}

const db = new sqlite3.Database(dbPath);

// Test simple execution
async function testExecution() {
  // Create migrations table
  await new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, appliedAt TEXT NOT NULL)`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log('Migrations table created');

  // Test the exact same logic as our migration function
  const name = '001_init.sql';
  const migrationsPath = path.resolve(__dirname, '../database/migrations');
  const sql = fs.readFileSync(path.join(migrationsPath, name), 'utf8');
  
  console.log('Raw SQL:');
  console.log(sql);
  
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`\nSplit into ${statements.length} statements:`);
  statements.forEach((stmt, i) => {
    console.log(`${i + 1}. ${stmt.substring(0, 50)}...`);
  });
  
  // Execute each statement
  await new Promise((resolve, reject) => {
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  try {
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`\nExecuting: ${statement.substring(0, 50)}...`);
        await new Promise((resolve, reject) => {
          db.run(statement, (err) => {
            if (err) {
              console.error(`Error executing statement: ${err.message}`);
              reject(err);
            } else {
              console.log('Statement executed successfully');
              resolve();
            }
          });
        });
      }
    }
    
    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO _migrations (name, appliedAt) VALUES (?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`, [name], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run("COMMIT", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('Migration applied successfully');
  } catch (e) {
    await new Promise((resolve, reject) => {
      db.run("ROLLBACK", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.error('Migration failed:', e);
    throw e;
  }
  
  // List final tables
  const tables = await new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log('\nFinal tables:');
  tables.forEach(row => console.log('  -', row.name));
  
  db.close();
}

testExecution().catch(console.error);
