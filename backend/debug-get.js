// Debug the get function
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/rosistrat.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

// Test the get function logic
async function testGet() {
  // Create migrations table
  await new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, appliedAt TEXT NOT NULL)`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log('Migrations table created');

  // Test get function
  const result = await new Promise((resolve, reject) => {
    db.get(`SELECT name FROM _migrations WHERE name = ?`, ['001_init.sql'], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  console.log('Get result:', result);
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
  
  console.log('All migrations:', allMigrations);
  
  db.close();
}

testGet().catch(console.error);
