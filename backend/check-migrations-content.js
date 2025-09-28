// Check migrations table content
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/rosistrat.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

// Check migrations table content
db.all("SELECT * FROM _migrations", (err, rows) => {
  if (err) {
    console.error('Error querying migrations:', err);
  } else {
    console.log('Migrations table content:');
    console.log(rows);
  }
  
  // Also check table structure
  db.all("PRAGMA table_info(_migrations)", (err, info) => {
    if (err) {
      console.error('Error getting table info:', err);
    } else {
      console.log('\nMigrations table structure:');
      console.log(info);
    }
    db.close();
  });
});
