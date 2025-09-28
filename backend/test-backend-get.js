// Test the backend get function
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/rosistrat.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

// Copy the exact get function from our backend
function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Test the exact same logic as our backend
async function testBackendGet() {
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
  const result = await get(db, `SELECT name FROM _migrations WHERE name = ?`, [name]);
  
  console.log('Backend get result:', result);
  console.log('Result type:', typeof result);
  console.log('Result === undefined:', result === undefined);
  console.log('Result !== undefined:', result !== undefined);
  
  // Test the exact same condition as our backend
  if (result !== undefined) {
    console.log('Migration already applied (backend logic)');
  } else {
    console.log('Migration not applied (backend logic)');
  }
  
  db.close();
}

testBackendGet().catch(console.error);
