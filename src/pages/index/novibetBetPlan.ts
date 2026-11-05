/**
 * Human-confirmed multi-spot bet plan for Novibet Compound.
 * RoSiStrat computes stakes; user confirms; extension only places that list.
 */
import { NOVIBET_EUROPEAN_TABLE } from "./novibetConstraints";
import type { NovibetLiveSession } from "./novibetCompoundEngine";

export type BetSpotId =
  | "zero"
  | "first_dozen"
  | "second_dozen"
  | "black"
  | "even";

export interface PlannedSpot {
  id: BetSpotId;
  label: string;
  amount: number;
  /** Heuristic labels used by the extension to find the table spot */
  spotHints: string[];
}

export interface NovibetBetPlan {
  id: string;
  tableId: string;
  createdAt: string;
  status: "pending" | "placing" | "done" | "cancelled";
  currency: "EUR";
  total: number;
  spots: PlannedSpot[];
  /** Chip tray order, largest first, for greedy placement */
  chipDenoms: number[];
  note: string;
}

const SPOT_META: Record<
  BetSpotId,
  { label: string; spotHints: string[] }
> = {
  zero: {
    label: "Number 0",
    spotHints: ["0", "Zero", "zero"],
  },
  first_dozen: {
    label: "1st Dozen",
    spotHints: ["1st 12", "1-12", "1st Dozen", "1st dozen", "1st12"],
  },
  second_dozen: {
    label: "2nd Dozen",
    spotHints: ["2nd 12", "13-24", "2nd Dozen", "2nd dozen", "2nd12"],
  },
  black: {
    label: "Black",
    spotHints: ["Black", "black", "Noir"],
  },
  even: {
    label: "Even",
    spotHints: ["Even", "even", "Pair"],
  },
};

export function getNextBetPlanFromSession(
  session: NovibetLiveSession,
  tableId = "novibet-european-default",
): NovibetBetPlan {
  const spots: PlannedSpot[] = [];
  for (const id of Object.keys(SPOT_META) as BetSpotId[]) {
    const line = session.lines[id];
    if (!line) continue;
    const amount = Number(line.plannedBet) || 0;
    if (amount < NOVIBET_EUROPEAN_TABLE.minBet) continue;
    const meta = SPOT_META[id];
    spots.push({
      id,
      label: meta.label,
      amount: Number(amount.toFixed(2)),
      spotHints: meta.spotHints,
    });
  }
  const total = Number(
    spots.reduce((s, p) => s + p.amount, 0).toFixed(2),
  );
  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tableId,
    createdAt: new Date().toISOString(),
    status: "pending",
    currency: "EUR",
    total,
    spots,
    chipDenoms: [...NOVIBET_EUROPEAN_TABLE.chipDenominations].slice().reverse(),
    note: "Human confirmation required before extension places chips. Paper motor only decides amounts.",
  };
}

/** Break an amount into chip clicks using available denoms (largest first). */
export function chipBreakdown(
  amount: number,
  denoms: readonly number[] = NOVIBET_EUROPEAN_TABLE.chipDenominations,
): number[] {
  let left = Math.round(amount * 100);
  const ordered = [...denoms]
    .map((d) => Math.round(d * 100))
    .sort((a, b) => b - a);
  const clicks: number[] = [];
  for (const d of ordered) {
    while (left >= d) {
      clicks.push(d / 100);
      left -= d;
    }
  }
  // residual under min chip: drop (cannot place)
  return clicks;
}
