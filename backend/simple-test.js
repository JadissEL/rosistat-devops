// Simple test to isolate the migration issue
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

// Test simple table creation
db.run("CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)", (err) => {
  if (err) {
    console.error('Error creating test table:', err);
  } else {
    console.log('Test table created successfully');
    
    // List tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) {
        console.error('Error listing tables:', err);
      } else {
        console.log('Tables in database:');
        rows.forEach(row => console.log('  -', row.name));
      }
      db.close();
    });
  }
});
