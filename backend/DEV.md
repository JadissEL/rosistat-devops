# Backend Development Guide

## Quick Start

```bash
cd backend
npm install
npm run dev
```

The `npm run dev` command will:
1. Compile TypeScript to JavaScript (`npm run build`)
2. Start the Node.js server with `--watch` flag for automatic restart on file changes

## Development Workflow

### Hot-Reload (Recommended)
```bash
npm run dev
```

- Compiles TypeScript and runs the server with `node --watch`
- Auto-restarts when files in `dist/` change (triggered by `tsc --watch`)
- Stable and production-aligned

### Manual Build + Run
```bash
npm run build
npm run dev:fallback
```

- Build once, then run the compiled output
- Useful for debugging TypeScript compilation issues

## Why Not ts-node-dev?

The project uses `"type": "module"` with `"module": "NodeNext"` in `tsconfig.json`, which creates conflicts with `ts-node-dev`'s ESM loader integration. The error:

```
Error: Must use import to load ES Module
```

is a known limitation in this environment. The compiled-run approach (`npm run dev`) is:
- ✅ Stable and widely tested
- ✅ Closer to production behavior
- ✅ Works across all environments

## Testing the Backend

```bash
# Run health check
curl http://localhost:8080/api/health

# Run smoke tests
npm run test:smoke
```

## Environment Variables

Create a `.env` file in the `backend/` directory (see `.env.example`):

```env
PORT=8080
NODE_ENV=development
DB_FILE=/path/to/database.db  # Optional; defaults to repo-relative path
```

## Database

Migrations and seeds are applied automatically on server start (see `backend/src/db.ts`).

- **Migrations**: `database/migrations/*.sql`
- **Seeds**: `database/seed/*.sql`
