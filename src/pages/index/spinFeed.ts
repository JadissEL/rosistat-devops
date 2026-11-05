/**
 * SpinFeed contract — real Novibet/Evolution strike numbers into RoSiStrat.
 * Paper-trade only; never places bets on Novibet.
 */

export type SpinSource = "devtools" | "csv" | "manual";

export interface SpinEvent {
  tableId: string;
  roundId?: string | null;
  number: number;
  ts: string; // ISO
  source: SpinSource;
}

export interface SpinEventRow extends SpinEvent {
  id: number;
  createdAt: string;
}

export function isValidEuropeanNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 36;
}

export function normalizeSpinEvent(
  input: Partial<SpinEvent> & { number: number },
): SpinEvent | { error: string } {
  if (!isValidEuropeanNumber(input.number)) {
    return { error: "number must be an integer 0–36" };
  }
  const tableId =
    typeof input.tableId === "string" && input.tableId.trim()
      ? input.tableId.trim()
      : "novibet-european-default";
  const source: SpinSource =
    input.source === "devtools" || input.source === "csv" || input.source === "manual"
      ? input.source
      : "manual";
  const ts =
    typeof input.ts === "string" && input.ts.length > 0
      ? input.ts
      : new Date().toISOString();
  const roundId =
    input.roundId === undefined || input.roundId === null || input.roundId === ""
      ? null
      : String(input.roundId);

  return { tableId, roundId, number: input.number, ts, source };
}

/** Parse paste/CSV: "0,32,15" or one number per line */
export function parseSpinNumbers(raw: string): { numbers: number[]; error?: string } {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (!tokens.length) return { numbers: [], error: "no numbers found" };
  const numbers: number[] = [];
  for (const t of tokens) {
    const n = Number(t);
    if (!isValidEuropeanNumber(n)) {
      return { numbers: [], error: `invalid number: ${t}` };
    }
    numbers.push(n);
  }
  return { numbers };
}

export function dedupeKey(e: Pick<SpinEvent, "tableId" | "roundId" | "ts" | "number">): string {
  if (e.roundId) return `${e.tableId}::${e.roundId}`;
  return `${e.tableId}::${e.ts}::${e.number}`;
}
