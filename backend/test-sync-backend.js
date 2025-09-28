// Test the backend in sync mode
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

// Test the exact same logic as our backend but in sync mode
async function testSyncBackend() {
  try {
    console.log('Starting sync backend test...');
    
    // Create migrations table
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, appliedAt TEXT NOT NULL)`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('Migrations table created');

    const migrationsPath = path.resolve(__dirname, "../database/migrations");
    const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql')).sort();
    console.log('Migration files:', files);

    for (const name of files) {
      console.log(`\nProcessing migration: ${name}`);
      
      // Check if already applied
      const already = await new Promise((resolve, reject) => {
        db.get(`SELECT name FROM _migrations WHERE name = ?`, [name], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      console.log(`Already applied check result:`, already);
      console.log(`Already applied check: already !== undefined =`, already !== undefined);
      
      if (already !== undefined) {
        console.log(`Migration already applied: ${name}`);
        continue;
      }
      
      // Apply migration
      const sql = fs.readFileSync(path.join(migrationsPath, name), 'utf8');
      console.log(`Applying migration: ${name}`);
      
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`Statements to execute:`, statements.length);
      
      await new Promise((resolve, reject) => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      try {
        for (const statement of statements) {
          if (statement.trim()) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
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
        
        console.log(`Migration applied successfully: ${name}`);
      } catch (e) {
        await new Promise((resolve, reject) => {
          db.run("ROLLBACK", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.error(`Migration failed: ${name}`, e);
        throw e;
      }
    }
    
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
    console.error('Sync backend test failed:', e);
    db.close();
  }
}

testSyncBackend();
