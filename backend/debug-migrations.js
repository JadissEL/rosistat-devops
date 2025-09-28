// Debug script for migrations
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/rosistrat.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

// Test migration manually
const migrationsPath = path.resolve(__dirname, '../database/migrations');
console.log('Migrations path:', migrationsPath);

const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql')).sort();
console.log('Migration files:', files);

// Create migrations table
db.run(`CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, appliedAt TEXT NOT NULL)`, (err) => {
  if (err) {
    console.error('Error creating migrations table:', err);
    return;
  }
  console.log('Migrations table created');
  
  // Apply first migration
  const firstMigration = files[0];
  if (firstMigration) {
    const sql = fs.readFileSync(path.join(migrationsPath, firstMigration), 'utf8');
    console.log('Applying migration:', firstMigration);
    console.log('SQL:', sql);
    
    db.run(sql, (err) => {
      if (err) {
        console.error('Error applying migration:', err);
      } else {
        console.log('Migration applied successfully');
        
        // List tables
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
          if (err) {
            console.error('Error listing tables:', err);
          } else {
            console.log('Tables after migration:');
            rows.forEach(row => console.log('  -', row.name));
          }
          db.close();
        });
      }
    });
  }
});
