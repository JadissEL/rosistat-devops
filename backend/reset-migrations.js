// Reset migrations table
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/rosistrat.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

// Reset migrations table
db.run("DROP TABLE IF EXISTS _migrations", (err) => {
  if (err) {
    console.error('Error dropping migrations table:', err);
  } else {
    console.log('Migrations table dropped');
  }
  
  // List remaining tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      console.error('Error listing tables:', err);
    } else {
      console.log('Remaining tables:');
      rows.forEach(row => console.log('  -', row.name));
    }
    db.close();
  });
});
