// Debug the migration check logic
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/rosistrat.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

// Test the exact migration check logic
async function testMigrationCheck() {
  // Create migrations table
  await new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, appliedAt TEXT NOT NULL)`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log('Migrations table created');

  // Test the exact same query as our backend
  const name = '001_init.sql';
  const result = await new Promise((resolve, reject) => {
    db.get(`SELECT name FROM _migrations WHERE name = ?`, [name], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  console.log('Query result:', result);
  console.log('Result type:', typeof result);
  console.log('Result === undefined:', result === undefined);
  console.log('Result !== undefined:', result !== undefined);
  
  // List all migrations
  const allMigrations = await new Promise((resolve, reject) => {
    db.all(`SELECT * FROM _migrations`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log('All migrations in table:', allMigrations);
  
  // Test with a different name
  const result2 = await new Promise((resolve, reject) => {
    db.get(`SELECT name FROM _migrations WHERE name = ?`, ['nonexistent.sql'], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  console.log('Query result for nonexistent:', result2);
  console.log('Nonexistent === undefined:', result2 === undefined);
  
  db.close();
}

testMigrationCheck().catch(console.error);
