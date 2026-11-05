import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { all, createDbConnection, get, run, applyMigrations, applySeeds } from "./db.js";
import {
  createSimulation,
  listSimulations,
  insertSpins,
  getSimulationWithSpins,
  listSpins,
  getSpinsStats,
  insertSpinEvent,
  insertSpinEventsBulk,
  listSpinEvents,
  type SpinEventInsert,
} from "./dao.js";
import { computeSimulationKpis } from "./kpis.js";
import type { CorsOptions } from "cors";
import compression from "compression";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

/** In-process Prometheus-style counters for /api/metrics */
const metricsState = {
  startedAt: Date.now(),
  httpRequestsTotal: 0,
  httpErrorsTotal: 0,
  byRoute: new Map<string, { count: number; errors: number; durationMsSum: number }>(),
};

// Security headers
app.use(helmet());

// Strict CORS configuration from env; fallback to permissive in dev
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
const corsOptions: CorsOptions = allowedOrigins.length
  ? {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow same-origin/no-origin
        const ok = allowedOrigins.some((o) => origin === o || (o.startsWith("*") && origin.endsWith(o.slice(1))));
        callback(ok ? null : new Error("Not allowed by CORS"), ok);
      },
      credentials: true,
    }
  : { origin: true };
app.use(cors(corsOptions));

// Rate limiting (basic): 100 requests/minute per IP
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Enable HTTP compression
app.use(compression());

// JSON parsing with explicit limit
app.use(express.json({ limit: process.env.JSON_LIMIT || "1mb" }));

// Request metrics middleware
app.use((req, res, next) => {
  const started = Date.now();
  const routeKey = `${req.method} ${req.path}`;
  res.on("finish", () => {
    metricsState.httpRequestsTotal += 1;
    const isError = res.statusCode >= 400;
    if (isError) metricsState.httpErrorsTotal += 1;
    const prev = metricsState.byRoute.get(routeKey) || {
      count: 0,
      errors: 0,
      durationMsSum: 0,
    };
    prev.count += 1;
    if (isError) prev.errors += 1;
    prev.durationMsSum += Date.now() - started;
    metricsState.byRoute.set(routeKey, prev);
  });
  next();
});

// Root
app.get("/", (_req, res) => {
  res.json({ service: "rosistat-backend", status: "ok" });
});

// DB + Migrations + Seeds
const db = createDbConnection();
let dbReady = false;

// Allow overriding migrations/seeds directories via environment variables
const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR || path.resolve(__dirname, "../../database/migrations");
const SEEDS_DIR = process.env.SEEDS_DIR || path.resolve(__dirname, "../../database/seed");
// Only seed by default in non-production; can force with SEED_ON_START=true or disable with SEED_ON_START=false
const ENABLE_SEEDS = process.env.SEED_ON_START === "true" || (process.env.NODE_ENV !== "production" && process.env.SEED_ON_START !== "false");

// Health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development", dbReady });
});

// Prometheus text exposition (observability)
app.get("/api/metrics", (_req, res) => {
  const uptimeSec = (Date.now() - metricsState.startedAt) / 1000;
  const lines: string[] = [
    "# HELP rosistat_up 1 if process is up",
    "# TYPE rosistat_up gauge",
    "rosistat_up 1",
    "# HELP rosistat_uptime_seconds Process uptime in seconds",
    "# TYPE rosistat_uptime_seconds gauge",
    `rosistat_uptime_seconds ${uptimeSec.toFixed(3)}`,
    "# HELP rosistat_db_ready 1 if migrations/seeds finished",
    "# TYPE rosistat_db_ready gauge",
    `rosistat_db_ready ${dbReady ? 1 : 0}`,
    "# HELP rosistat_http_requests_total Total HTTP requests",
    "# TYPE rosistat_http_requests_total counter",
    `rosistat_http_requests_total ${metricsState.httpRequestsTotal}`,
    "# HELP rosistat_http_errors_total Total HTTP responses with status >= 400",
    "# TYPE rosistat_http_errors_total counter",
    `rosistat_http_errors_total ${metricsState.httpErrorsTotal}`,
  ];
  for (const [route, stats] of metricsState.byRoute.entries()) {
    const label = route.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const avg = stats.count ? stats.durationMsSum / stats.count : 0;
    lines.push(
      `rosistat_http_requests_by_route_total{route="${label}"} ${stats.count}`,
    );
    lines.push(
      `rosistat_http_errors_by_route_total{route="${label}"} ${stats.errors}`,
    );
    lines.push(
      `rosistat_http_request_duration_ms_avg{route="${label}"} ${avg.toFixed(3)}`,
    );
  }
  res.type("text/plain; version=0.0.4; charset=utf-8").send(lines.join("\n") + "\n");
});

// Users (minimal for demo)
app.get("/api/users/:uid", async (req, res) => {
  try {
    const user = await get(db, "SELECT * FROM users WHERE uid = ?", [req.params.uid]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Simulations
app.get("/api/simulations", async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const rows = await listSimulations(db, userId);
    res.json(rows);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.post("/api/simulations", async (req, res) => {
  try {
    const { userId, strategy, startingInvestment, finalEarnings, finalPortfolio, totalSpins, settings, results } = req.body as {
      userId?: string | null;
      strategy: string;
      startingInvestment: number;
      finalEarnings: number;
      finalPortfolio: number;
      totalSpins: number;
      settings: Record<string, unknown>;
      results?: Array<{
        spin?: number;
        drawnNumber?: number;
        spinNetResult?: number;
        cumulativeEarnings?: number;
        [key: string]: unknown;
      }>;
    };
    const id = await createSimulation(db, { userId, strategy, startingInvestment, finalEarnings, finalPortfolio, totalSpins, settings });

    // Optional: persist per-spin results if provided
    if (Array.isArray(results) && results.length) {
      const spins = results.map((r, idx) => ({
        simulationId: id,
        spinNumber: r.spin ?? idx + 1,
        drawnNumber: r.drawnNumber ?? 0,
        spinNetResult: r.spinNetResult ?? 0,
        cumulativeEarnings: r.cumulativeEarnings ?? 0,
        raw: r as Record<string, unknown>,
      }));
      await insertSpins(db, spins);
    }
    res.status(201).json({ ok: true, id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.get("/api/simulations/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await getSimulationWithSpins(db, id);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Spins endpoints
app.get("/api/simulations/:id/spins", async (req, res) => {
  try {
    const simulationId = Number(req.params.id);
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const spins = await listSpins(db, simulationId, limit, offset);
    res.json(spins);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.get("/api/simulations/:id/spins/stats", async (req, res) => {
  try {
    const simulationId = Number(req.params.id);
    const stats = await getSpinsStats(db, simulationId);
    res.json(stats);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

function normalizeSpinPayload(body: Record<string, unknown>): SpinEventInsert | { error: string } {
  const number = Number(body.number);
  if (!Number.isInteger(number) || number < 0 || number > 36) {
    return { error: "number must be an integer 0–36" };
  }
  const tableId =
    typeof body.tableId === "string" && body.tableId.trim()
      ? body.tableId.trim()
      : "novibet-european-default";
  const sourceRaw = body.source;
  const source =
    sourceRaw === "devtools" || sourceRaw === "csv" || sourceRaw === "manual"
      ? sourceRaw
      : "manual";
  const ts =
    typeof body.ts === "string" && body.ts.length > 0
      ? body.ts
      : new Date().toISOString();
  const roundId =
    body.roundId === undefined || body.roundId === null || body.roundId === ""
      ? null
      : String(body.roundId);
  return { tableId, roundId, number, ts, source };
}

/** Live strike feed — paper-trade only (no auto-betting) */
app.post("/api/spins", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown> | unknown[];
    if (Array.isArray(body)) {
      const events: SpinEventInsert[] = [];
      for (const item of body) {
        const n = normalizeSpinPayload((item || {}) as Record<string, unknown>);
        if ("error" in n) return res.status(400).json(n);
        events.push(n);
      }
      const result = await insertSpinEventsBulk(db, events);
      return res.status(201).json({ ok: true, ...result });
    }
    const one = normalizeSpinPayload((body || {}) as Record<string, unknown>);
    if ("error" in one) return res.status(400).json(one);
    const result = await insertSpinEvent(db, one);
    res.status(result.inserted ? 201 : 200).json({ ok: true, ...result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

app.get("/api/spins", async (req, res) => {
  try {
    const tableId = req.query.tableId as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const afterId = req.query.afterId ? Number(req.query.afterId) : undefined;
    const rows = await listSpinEvents(db, { tableId, limit, afterId });
    res.json(rows);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Advanced KPIs (drawdown, volatility, profit factor, ruin) from persisted spins
app.get("/api/simulations/:id/kpis", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await getSimulationWithSpins(db, id);
    if (!data) return res.status(404).json({ error: "Not found" });
    const startingInvestment = Number(
      (data.simulation as { startingInvestment?: number }).startingInvestment ?? 0,
    );
    const points = (data.spins as Array<{ spinNetResult: number; cumulativeEarnings: number }>).map(
      (s) => ({
        spinNetResult: Number(s.spinNetResult) || 0,
        cumulativeEarnings: Number(s.cumulativeEarnings) || 0,
      }),
    );
    const kpis = computeSimulationKpis(points, startingInvestment);
    res.json({
      simulationId: id,
      startingInvestment,
      seed: (() => {
        try {
          const settings = (data.simulation as { settings?: string | Record<string, unknown> }).settings;
          const parsed =
            typeof settings === "string" ? (JSON.parse(settings) as Record<string, unknown>) : settings;
          return typeof parsed?.seed === "number" ? parsed.seed : null;
        } catch {
          return null;
        }
      })(),
      kpis,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

const PORT = Number(process.env.PORT || 8080);

// Start server ONLY after migrations/seeds complete
const initPromise = (async () => {
  try {
    console.log("Applying migrations...");
    if (fs.existsSync(MIGRATIONS_DIR)) {
      await applyMigrations(db, MIGRATIONS_DIR);
      console.log("Migrations completed successfully");
    } else {
      console.warn(`[Migrations] Directory not found, skipping: ${MIGRATIONS_DIR}`);
    }

    const tables = await all<{ name: string }>(db, "SELECT name FROM sqlite_master WHERE type='table'");
    console.log("Tables created:", tables.map((t) => t.name));

    console.log("Applying seeds...");
    if (ENABLE_SEEDS) {
      if (fs.existsSync(SEEDS_DIR)) {
        await applySeeds(db, SEEDS_DIR);
        console.log("Seeds completed successfully");
      } else {
        console.warn(`[Seeds] Directory not found, skipping: ${SEEDS_DIR}`);
      }
    } else {
      console.log("[Seeds] Skipped by configuration (ENABLE_SEEDS=false)");
    }
    dbReady = true;
    console.log("Database initialization complete");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("Migration/Seed error:", message);
    if (stack) console.error("Stack trace:", stack);
    throw e; // Propagate to initPromise.catch
  }
})();

initPromise
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      /* eslint-disable no-console */
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    // If initialization failed, exit with non-zero code
    process.exit(1);
  });

// Centralized error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  res.status(500).json({ error: message });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Graceful shutdown: close DB to flush WAL and release file locks
function shutdown(signal: string) {
  console.log(`[Shutdown] Received ${signal}, closing database and exiting...`);
  try {
    (db as any).close?.((err: Error | null) => {
      if (err) console.error("Error closing DB:", err.message);
      process.exit(0);
    });
  } catch (e) {
    console.error("Unexpected error during shutdown:", e);
    process.exit(0);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));


