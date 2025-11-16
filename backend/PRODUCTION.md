# Backend Production Runbook

This file describes how to run the backend in production.

## Quick Start

- Build the project: `npm ci && npm run build`
- Run: `node dist/index.js`
- Environment variables: create a `backend/.env` from `backend/.env.example` and set `DB_FILE` to where you want the SQLite DB stored (e.g. `/var/lib/rosistat/rosistat.db`).

## Docker

Build image (from repo root):
```bash
docker build -t rosistat-backend:latest -f backend/Dockerfile backend/
```

Run container (example):
```bash
docker run -d --name rosistat-backend \
  -p 8080:8080 \
  -v /var/lib/rosistat:/var/lib/rosistat \
  -e NODE_ENV=production \
  -e DB_FILE=/var/lib/rosistat/rosistat.db \
  rosistat-backend:latest
```

The Dockerfile includes a `HEALTHCHECK` that probes `GET /api/health` every 30 seconds.

## Process Manager (PM2)

We provide `backend/ecosystem.config.js` for production process management:

```bash
# Install PM2 globally if needed
npm install -g pm2

# Start with production environment
pm2 start backend/ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Enable startup at boot
pm2 startup
```

## Database

- The server **automatically applies migrations and seeds on startup** from `database/migrations/` and `database/seed/`.
- Ensure the `DB_FILE` location is writable by the container or process user.
- For migrations:
  - Place new SQL files in `database/migrations/` with numeric prefixes (e.g., `003_add_users_table.sql`)
  - Migrations are applied in order on every server restart
  - Each migration is idempotent; ensure SQL is safe to re-run

### Database Backup & Restore

```bash
# Backup (SQLite)
sqlite3 /var/lib/rosistat/rosistat.db ".dump" > backup.sql

# Restore (SQLite)
sqlite3 /var/lib/rosistat/rosistat_new.db < backup.sql
```

## Environment Variables

Key variables in `.env`:
- `PORT` (default: 8080)
- `NODE_ENV` (should be `production`)
- `DB_FILE` (path to SQLite database file)

See `backend/.env.example` for all options.

## Secrets & Security

- **Never commit `.env` or secrets** to Git. Use `backend/.env.example` as a template.
- In production, inject environment variables via your deployment platform (Docker Compose, Kubernetes, CI/CD, etc.).
- Use `--env-file` with Docker or config management tools to load secrets safely.

## Logs & Monitoring

- Logs are printed to stdout/stderr.
- With Docker: use `docker logs <container>`
- With PM2: use `pm2 logs`
- Consider setting up centralized logging (ELK, Splunk, CloudWatch) for production.

## Health & Readiness Checks

- **Health endpoint**: `GET /api/health` (returns `{status, env, dbReady}`)
- Use this in Kubernetes liveness/readiness probes or load balancer health checks.

## Troubleshooting

- **Server won't start**: Check logs for migration or database errors.
- **Health check fails**: Verify `DB_FILE` path is writable and migrations applied.
- **High memory usage**: Check logs for leaks; consider setting memory limits in container/PM2.
