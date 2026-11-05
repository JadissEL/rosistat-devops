/**
 * Novibet European Compound — robust mode + incremental live session.
 * European rules: full loss on single zero. Does not edit Index.tsx.
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

export interface NovibetRobustOptions {
  safetyRatio: number;
  maxLossStreak: number;
  progressionFactor: number;
  riskBudgetPct: number;
  profitLockPct: number;
  softMaxMultiplier: number;
  pauseZeroDrawdownPct: number;
}

export const NOVIBET_ROBUST_DEFAULTS: NovibetRobustOptions = {
  safetyRatio: 8,
  maxLossStreak: 4,
  progressionFactor: 1.5,
  riskBudgetPct: 0.08,
  profitLockPct: 0.2,
  softMaxMultiplier: 8,
  pauseZeroDrawdownPct: 0.1,
};

export interface NovibetSpinRow {
  spin: number;
  drawnNumber: number;
  spinNetResult: number;
  cumulativeEarnings: number;
  portfolio: number;
  floor: number;
  peak: number;
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
  lossStreak: number;
  hitMaxCount: number;
  skippedCount: number;
};

export interface NovibetLiveSession {
  startingCredit: number;
  opts: NovibetRobustOptions;
  lines: Record<string, LineState>;
  cum: number;
  peak: number;
  floor: number;
  spinIndex: number;
  rows: NovibetSpinRow[];
}

function softCap(line: LineState, opts: NovibetRobustOptions): number {
  const hard = line.config.maxBet ?? Infinity;
  const soft = line.config.initialBet * opts.softMaxMultiplier;
  return Math.min(hard, soft);
}

function nextPlannedBet(
  line: LineState,
  won: boolean,
  opts: NovibetRobustOptions,
): number {
  const { config } = line;
  if (won) {
    line.lossStreak = 0;
    line.progressionStep = 0;
    return config.initialBet;
  }

  line.lossStreak += 1;
  if (line.lossStreak >= opts.maxLossStreak) {
    line.lossStreak = 0;
    line.progressionStep = 0;
    return config.initialBet;
  }

  let next: number;
  if (config.progression === "custom" && config.customProgression?.length) {
    line.progressionStep = Math.min(
      line.progressionStep + 1,
      config.customProgression.length - 1,
    );
    next = config.customProgression[line.progressionStep];
  } else {
    next = roundDownToChip(line.plannedBet * opts.progressionFactor);
    if (next < line.plannedBet + NOVIBET_EUROPEAN_TABLE.minChip) {
      next = roundDownToChip(
        line.plannedBet +
          Math.max(config.initialBet, NOVIBET_EUROPEAN_TABLE.minChip),
      );
    }
  }

  return Math.min(next, softCap(line, opts));
}

function initLines(): Record<string, LineState> {
  const out: Record<string, LineState> = {};
  for (const config of NOVIBET_COMPOUND_STRATEGIES) {
    out[config.id] = {
      config,
      plannedBet: config.initialBet,
      progressionStep: 0,
      lossStreak: 0,
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
      : Date.now() >>> 0;
  const rnd = () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, () => Math.floor(rnd() * 37));
}

export function createNovibetLiveSession(options: {
  startingCredit: number;
  robust?: Partial<NovibetRobustOptions>;
}): NovibetLiveSession {
  const startingCredit = Math.max(0, options.startingCredit);
  const opts: NovibetRobustOptions = {
    ...NOVIBET_ROBUST_DEFAULTS,
    ...options.robust,
  };
  return {
    startingCredit,
    opts,
    lines: initLines(),
    cum: 0,
    peak: startingCredit,
    floor: startingCredit * 0.5,
    spinIndex: 0,
    rows: [],
  };
}

/** Advance paper-trade session by one real (or simulated) strike. */
export function stepNovibetLiveSession(
  session: NovibetLiveSession,
  drawnNumber: number,
): NovibetSpinRow {
  const { opts, lines, startingCredit } = session;
  session.spinIndex += 1;

  let portfolio = Number((startingCredit + session.cum).toFixed(2));
  if (portfolio > session.peak) session.peak = portfolio;

  const peakProfit = Math.max(0, session.peak - startingCredit);
  const lockedFloor = startingCredit * 0.5 + peakProfit * opts.profitLockPct;
  session.floor = Math.max(session.floor, lockedFloor);

  const hitMaxIds: string[] = [];
  const skippedIds: string[] = [];
  const rawBets: Record<string, number> = {};

  const riskCapital = Math.max(0, portfolio - session.floor);
  const drawdownPct =
    session.peak > 0 ? (session.peak - portfolio) / session.peak : 0;

  if (
    portfolio < NOVIBET_EUROPEAN_TABLE.minBet ||
    riskCapital < NOVIBET_EUROPEAN_TABLE.minBet
  ) {
    const row: NovibetSpinRow = {
      spin: session.spinIndex,
      drawnNumber,
      spinNetResult: 0,
      cumulativeEarnings: session.cum,
      portfolio,
      floor: Number(session.floor.toFixed(2)),
      peak: Number(session.peak.toFixed(2)),
      totalStaked: 0,
      hitMaxIds: [],
      skippedIds: Object.keys(lines),
      bets: {},
      wins: {},
    };
    session.rows.push(row);
    return row;
  }

  for (const [id, line] of Object.entries(lines)) {
    if (id === "zero" && drawdownPct >= opts.pauseZeroDrawdownPct) {
      skippedIds.push(id);
      rawBets[id] = 0;
      line.skippedCount++;
      continue;
    }

    if (portfolio < opts.safetyRatio * line.plannedBet) {
      skippedIds.push(id);
      rawBets[id] = 0;
      line.skippedCount++;
      continue;
    }

    const constrained = applyNovibetBetConstraints(
      Math.min(line.plannedBet, softCap(line, opts)),
      line.config.betType,
    );
    if (constrained.belowMin || constrained.bet <= 0) {
      skippedIds.push(id);
      rawBets[id] = 0;
      line.skippedCount++;
      continue;
    }
    if (constrained.hitMax || constrained.bet >= softCap(line, opts)) {
      hitMaxIds.push(id);
      line.hitMaxCount++;
    }
    rawBets[id] = constrained.bet;
  }

  let bets = enforceTotalSpinCap(rawBets);
  let totalStaked = Object.values(bets).reduce((a, b) => a + b, 0);

  const budget = roundDownToChip(riskCapital * opts.riskBudgetPct);
  const affordCap = Math.min(budget, riskCapital, portfolio - session.floor);
  if (totalStaked > affordCap && totalStaked > 0 && affordCap > 0) {
    const scale = affordCap / totalStaked;
    const scaled: Record<string, number> = {};
    for (const [id, b] of Object.entries(bets)) {
      scaled[id] = roundDownToChip(b * scale);
      if (scaled[id] < NOVIBET_EUROPEAN_TABLE.minBet) {
        scaled[id] = 0;
        if (!skippedIds.includes(id)) skippedIds.push(id);
      }
    }
    bets = scaled;
    totalStaked = Object.values(bets).reduce((a, b) => a + b, 0);
  } else if (affordCap <= 0) {
    bets = Object.fromEntries(Object.keys(bets).map((id) => [id, 0]));
    totalStaked = 0;
    for (const id of Object.keys(lines)) {
      if (!skippedIds.includes(id)) skippedIds.push(id);
    }
  }

  let profit = 0;
  const wins: Record<string, boolean> = {};

  for (const [id, line] of Object.entries(lines)) {
    const bet = bets[id] ?? 0;
    if (bet <= 0) {
      wins[id] = false;
      continue;
    }
    const won = BET_TYPES[line.config.betType](
      drawnNumber,
      line.config.target,
    );
    wins[id] = won;
    profit += won ? bet * (line.config.winMultiplier - 1) : -bet;
    line.plannedBet = nextPlannedBet(line, won, opts);
  }

  session.cum = Number((session.cum + profit).toFixed(2));
  portfolio = Number((startingCredit + session.cum).toFixed(2));
  if (portfolio > session.peak) session.peak = portfolio;

  const row: NovibetSpinRow = {
    spin: session.spinIndex,
    drawnNumber,
    spinNetResult: Number(profit.toFixed(2)),
    cumulativeEarnings: session.cum,
    portfolio,
    floor: Number(session.floor.toFixed(2)),
    peak: Number(session.peak.toFixed(2)),
    totalStaked: Number(totalStaked.toFixed(2)),
    hitMaxIds,
    skippedIds,
    bets,
    wins,
  };
  session.rows.push(row);
  return row;
}

export function runNovibetCompoundSimulation(options: {
  spins: number[];
  startingCredit: number;
  robust?: Partial<NovibetRobustOptions>;
}): NovibetSpinRow[] {
  const session = createNovibetLiveSession({
    startingCredit: options.startingCredit,
    robust: options.robust,
  });
  for (const n of options.spins) {
    stepNovibetLiveSession(session, n);
  }
  return session.rows;
}

export { NOVIBET_EUROPEAN_TABLE, NOVIBET_COMPOUND_STRATEGIES };
