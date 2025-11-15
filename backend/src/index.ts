import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { all, createDbConnection, get, run, applyMigrations, applySeeds } from "./db.js";
import { createSimulation, listSimulations, insertSpins, getSimulationWithSpins, listSpins, getSpinsStats } from "./dao.js";
import path from "node:path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Root
app.get("/", (_req, res) => {
  res.json({ service: "rosistat-backend", status: "ok" });
});

// DB + Migrations + Seeds
const db = createDbConnection();
let dbReady = false;

// Initialize database synchronously before starting server
(async () => {
  try {
    console.log("Applying migrations...");
    await applyMigrations(db, path.resolve(process.cwd(), "../database/migrations"));
    console.log("Migrations completed successfully");
    
    // Verify tables were created
    const tables = await all<{ name: string }>(db, "SELECT name FROM sqlite_master WHERE type='table'");
    console.log("Tables created:", tables.map((t) => t.name));
    
    console.log("Applying seeds...");
    await applySeeds(db, path.resolve(process.cwd(), "../database/seed"));
    console.log("Seeds completed successfully");
    dbReady = true;
    console.log("Database initialization complete");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("Migration/Seed error:", message);
    if (stack) console.error("Stack trace:", stack);
    process.exit(1);
  }
})();

// Health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development", dbReady });
});

// Editor endpoint (mock implementation)
app.post("/api/editor", async (req, res) => {
  try {
    const { prompt } = req.body as { prompt?: string } | undefined;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt' in request body" });
    }

    // Simple mock processing: echo and simulate a small processing time
    await new Promise((r) => setTimeout(r, 150));
    const processed = `Processed: ${prompt}`;

    return res.json({ text: processed });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("/api/editor error:", message);
    return res.status(500).json({ error: "Internal server error" });
  }
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

const PORT = Number(process.env.PORT || 8080);

// Wait for database initialization before starting server
setTimeout(() => {
  app.listen(PORT, () => {
    /* eslint-disable no-console */
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}, 1000);


