import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { all, createDbConnection, get, run, applyMigrations, applySeeds } from "./db.js";
import { createSimulation, listSimulations, insertSpins, getSimulationWithSpins, listSpins, getSpinsStats } from "./dao.js";
import type { CorsOptions } from "cors";
import compression from "compression";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

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

// ...existing code...

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


