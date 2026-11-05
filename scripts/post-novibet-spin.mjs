#!/usr/bin/env node
/**
 * Post one or more European roulette numbers to the local spin feed.
 * Usage:
 *   node scripts/post-novibet-spin.mjs 17
 *   node scripts/post-novibet-spin.mjs --table novibet-european-default --source manual 0 32 15
 */
const args = process.argv.slice(2);
let tableId = "novibet-european-default";
let source = "manual";
const numbers = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--table") {
    tableId = args[++i];
    continue;
  }
  if (a === "--source") {
    source = args[++i];
    continue;
  }
  if (a === "--base") {
    process.env.API_BASE = args[++i];
    continue;
  }
  const n = Number(a);
  if (!Number.isInteger(n) || n < 0 || n > 36) {
    console.error(`Invalid number: ${a}`);
    process.exit(1);
  }
  numbers.push(n);
}

if (!numbers.length) {
  console.error("Provide at least one number 0–36");
  process.exit(1);
}

const base = process.env.API_BASE || "http://localhost:8080";
const body =
  numbers.length === 1
    ? {
        number: numbers[0],
        tableId,
        source,
        ts: new Date().toISOString(),
        roundId: `cli-${Date.now()}-${numbers[0]}`,
      }
    : numbers.map((number, idx) => ({
        number,
        tableId,
        source,
        ts: new Date().toISOString(),
        roundId: `cli-${Date.now()}-${idx}-${number}`,
      }));

const res = await fetch(`${base}/api/spins`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const text = await res.text();
console.log(res.status, text);
if (!res.ok) process.exit(1);
