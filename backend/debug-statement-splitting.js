// Debug statement splitting
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
  
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`Split into ${statements.length} statements:`);
  statements.forEach((stmt, i) => {
    console.log(`${i + 1}. ${stmt}`);
    console.log(`   Length: ${stmt.length}`);
    console.log(`   Starts with CREATE: ${stmt.startsWith('CREATE')}`);
    console.log(`   Starts with PRAGMA: ${stmt.startsWith('PRAGMA')}`);
    console.log('');
  });
}
