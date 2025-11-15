# Backend Production Runbook

This file describes how to run the backend in production.

Main points
- Build the project: `npm ci && npm run build`
- The server executable: `node dist/index.js`
- Environment variables: create a `backend/.env` from `backend/.env.example` and set `DB_FILE` to where you want the SQLite DB stored (e.g. `/var/lib/rosistat/rosistat.db`).

Docker

- Build image (from repo root):
  ```bash
  docker build -t rosistat-backend:latest -f backend/Dockerfile backend/
  ```

- Run container (example):
  ```bash
  docker run -d --name rosistat-backend \
    -p 8080:8080 \
    -v /var/lib/rosistat:/var/lib/rosistat \
    -e NODE_ENV=production \
    -e DB_FILE=/var/lib/rosistat/rosistat.db \
    rosistat-backend:latest
  ```

- Dockerfile includes a `HEALTHCHECK` that probes `GET /api/health`.

Process manager (PM2)

- We provide `backend/ecosystem.config.js`. Example start:
  ```bash
  # install pm2 globally if needed
  pm2 start backend/ecosystem.config.js --env production
  pm2 save
  ```

Migrations

- The server applies migrations/seeds on startup. Ensure the `DB_FILE` location is writable by the container or process user.

Logs & monitoring

- Logs are printed to stdout/stderr. Use your container runtime or PM2 to capture logs.
