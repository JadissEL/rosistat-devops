// Test script to verify database tables
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/rosistrat.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to database');
});

// List all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('Error listing tables:', err);
  } else {
    console.log('Tables in database:');
    rows.forEach(row => console.log('  -', row.name));
  }
  
  db.close();
});
