// Debug SQL statement splitting
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsPath = path.resolve(__dirname, '../database/migrations');
const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql')).sort();

for (const name of files) {
  console.log(`\n=== ${name} ===`);
  const sql = fs.readFileSync(path.join(migrationsPath, name), 'utf8');
  console.log('Raw SQL:');
  console.log(sql);
  
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`\nSplit into ${statements.length} statements:`);
  statements.forEach((stmt, i) => {
    console.log(`${i + 1}. ${stmt.substring(0, 100)}${stmt.length > 100 ? '...' : ''}`);
  });
}
