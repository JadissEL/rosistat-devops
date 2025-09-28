// Debug database path
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('__filename:', __filename);
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());

const dbPath1 = path.resolve(__dirname, '../database/rosistrat.db');
const dbPath2 = path.resolve(process.cwd(), '../database/rosistrat.db');

console.log('DB path 1 (__dirname):', dbPath1);
console.log('DB path 2 (process.cwd()):', dbPath2);

// Check if files exist
import fs from 'node:fs';
console.log('DB file 1 exists:', fs.existsSync(dbPath1));
console.log('DB file 2 exists:', fs.existsSync(dbPath2));
