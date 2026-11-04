/**
 * Novibet European Compound Martingale — simulation engine only.
 * Avoids Index.tsx (large OneDrive file). European rules: full loss on 0.
 */
import { BET_TYPES } from "./betTypes";
import { NOVIBET_COMPOUND_STRATEGIES } from "./config";
import type { CompoundMartingaleConfig } from "./types";
import {
  applyNovibetBetConstraints,
  enforceTotalSpinCap,
  NOVIBET_EUROPEAN_TABLE,
  roundDownToChip,
} from "./novibetConstraints";

export interface NovibetSpinRow {
  spin: number;
  drawnNumber: number;
  spinNetResult: number;
  cumulativeEarnings: number;
  portfolio: number;
  totalStaked: number;
  hitMaxIds: string[];
  skippedIds: string[];
  bets: Record<string, number>;
  wins: Record<string, boolean>;
}

type LineState = {
  config: CompoundMartingaleConfig;
  plannedBet: number;
  progressionStep: number;
  hitMaxCount: number;
  skippedCount: number;
};

function nextPlannedBet(line: LineState, won: boolean): number {
  const { config } = line;
  if (won && config.resetOnWin) {
    line.progressionStep = 0;
    return config.initialBet;
  }
  if (won) return line.plannedBet;

  switch (config.progression) {
    case "martingale":
      return line.plannedBet * 2;
    case "custom": {
      if (!config.customProgression?.length) return config.initialBet;
      line.progressionStep = Math.min(
        line.progressionStep + 1,
        config.customProgression.length - 1,
      );
      return config.customProgression[line.progressionStep];
    }
    default:
      return config.initialBet;
  }
}

function initLines(): Record<string, LineState> {
  const out: Record<string, LineState> = {};
  for (const config of NOVIBET_COMPOUND_STRATEGIES) {
    out[config.id] = {
      config,
      plannedBet: config.initialBet,
      progressionStep: 0,
      hitMaxCount: 0,
      skippedCount: 0,
    };
  }
  return out;
}

/** Uniform European spin 0–36 */
export function generateSpins(count: number, seed?: number): number[] {
  let s =
    seed !== undefined && Number.isFinite(seed)
      ? seed >>> 0
      : (Date.now() >>> 0);
  const rnd = () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, () => Math.floor(rnd() * 37));
}

export function runNovibetCompoundSimulation(options: {
  spins: number[];
  startingCredit: number;
}): NovibetSpinRow[] {
  const { spins, startingCredit } = options;
  const lines = initLines();
  let cum = 0;
  const rows: NovibetSpinRow[] = [];

  for (let i = 0; i < spins.length; i++) {
    const drawnNumber = spins[i];
    let portfolio = startingCredit + cum;
    const hitMaxIds: string[] = [];
    const skippedIds: string[] = [];
    const rawBets: Record<string, number> = {};

    if (portfolio < NOVIBET_EUROPEAN_TABLE.minBet) {
      rows.push({
        spin: i + 1,
        drawnNumber,
        spinNetResult: 0,
        cumulativeEarnings: cum,
        portfolio,
        totalStaked: 0,
        hitMaxIds: [],
        skippedIds: Object.keys(lines),
        bets: {},
        wins: {},
      });
      continue;
    }

    for (const [id, line] of Object.entries(lines)) {
      const constrained = applyNovibetBetConstraints(
        line.plannedBet,
        line.config.betType,
      );
      if (constrained.belowMin || constrained.bet <= 0) {
        skippedIds.push(id);
        rawBets[id] = 0;
        line.skippedCount++;
        continue;
      }
      if (constrained.hitMax) {
        hitMaxIds.push(id);
        line.hitMaxCount++;
      }
      rawBets[id] = constrained.bet;
    }

    let bets = enforceTotalSpinCap(rawBets);
    let totalStaked = Object.values(bets).reduce((a, b) => a + b, 0);

    // Bankroll: cannot stake more than remaining credit
    if (totalStaked > portfolio && totalStaked > 0) {
      const scale = portfolio / totalStaked;
      const scaled: Record<string, number> = {};
      for (const [id, b] of Object.entries(bets)) {
        scaled[id] = roundDownToChip(b * scale);
        if (scaled[id] < NOVIBET_EUROPEAN_TABLE.minBet && scaled[id] > 0) {
          scaled[id] = 0;
          if (!skippedIds.includes(id)) skippedIds.push(id);
        }
      }
      bets = scaled;
      totalStaked = Object.values(bets).reduce((a, b) => a + b, 0);
    }

    let profit = 0;
    const wins: Record<string, boolean> = {};

    for (const [id, line] of Object.entries(lines)) {
      const bet = bets[id] ?? 0;
      if (bet <= 0) {
        wins[id] = false;
        // Still advance planned progression as loss if we intended to bet but skipped?
        // Skip: keep plannedBet (couldn't play) — real table: no bet, no progression change.
        continue;
      }
      const won = BET_TYPES[line.config.betType](
        drawnNumber,
        line.config.target,
      );
      wins[id] = won;
      profit += won
        ? bet * (line.config.winMultiplier - 1)
        : -bet;
      // Progression uses planned path; after max, planned stays capped next time via constraints
      const next = nextPlannedBet(line, won);
      line.plannedBet = next;
      // Stick planned at table max once hit (Martingale blocked)
      const maxForLine = line.config.maxBet;
      if (maxForLine && line.plannedBet > maxForLine) {
        line.plannedBet = maxForLine;
      }
    }

    cum = Number((cum + profit).toFixed(2));
    portfolio = Number((startingCredit + cum).toFixed(2));

    rows.push({
      spin: i + 1,
      drawnNumber,
      spinNetResult: Number(profit.toFixed(2)),
      cumulativeEarnings: cum,
      portfolio,
      totalStaked: Number(totalStaked.toFixed(2)),
      hitMaxIds,
      skippedIds,
      bets,
      wins,
    });
  }

  return rows;
}

export { NOVIBET_EUROPEAN_TABLE, NOVIBET_COMPOUND_STRATEGIES };
