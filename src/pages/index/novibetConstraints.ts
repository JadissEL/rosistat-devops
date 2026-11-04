/**
 * Typical Evolution Live European Roulette limits as hosted by operators
 * like Novibet (EUR). Exact mins/maxes vary by table — always confirm the
 * in-game info panel. These values model a common mid-tier live table.
 *
 * European (not French): even-money bets lose in full on single zero.
 */

export const NOVIBET_EUROPEAN_TABLE = {
  label: "Novibet · Evolution European Roulette (typical mid-tier)",
  currency: "EUR",
  /** Smallest chip / stake increment */
  minChip: 0.2,
  /** Table minimum on any single spot */
  minBet: 0.2,
  /** Straight-up (incl. 0) */
  maxStraightUp: 100,
  /** Dozen / column (2:1) */
  maxDozen: 1000,
  /** Red/Black, Odd/Even, High/Low (1:1) */
  maxEvenMoney: 2500,
  /** Soft cap on total chips placed in one spin */
  maxTotalPerSpin: 10000,
  /** Common chip tray denominations (informational + rounding preference) */
  chipDenominations: [0.2, 1, 5, 25, 100, 500] as const,
} as const;

export type NovibetBetClass = "straight" | "dozen" | "even_money";

export function betClassForType(
  betType: "single" | "dozen" | "color" | "even_odd" | "high_low" | "column",
): NovibetBetClass {
  if (betType === "single") return "straight";
  if (betType === "dozen" || betType === "column") return "dozen";
  return "even_money";
}

export function maxBetForClass(betClass: NovibetBetClass): number {
  switch (betClass) {
    case "straight":
      return NOVIBET_EUROPEAN_TABLE.maxStraightUp;
    case "dozen":
      return NOVIBET_EUROPEAN_TABLE.maxDozen;
    case "even_money":
      return NOVIBET_EUROPEAN_TABLE.maxEvenMoney;
  }
}

/** Floor to a multiple of minChip (casino chip tray). */
export function roundDownToChip(
  amount: number,
  minChip: number = NOVIBET_EUROPEAN_TABLE.minChip,
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const units = Math.floor(amount / minChip + 1e-9);
  return Number((units * minChip).toFixed(2));
}

/**
 * Apply Novibet/Evolution constraints to a planned stake.
 * Returns 0 if below table minimum after rounding.
 */
export function applyNovibetBetConstraints(
  plannedBet: number,
  betType: "single" | "dozen" | "color" | "even_odd" | "high_low" | "column",
): { bet: number; hitMax: boolean; belowMin: boolean } {
  const betClass = betClassForType(betType);
  const max = maxBetForClass(betClass);
  const min = NOVIBET_EUROPEAN_TABLE.minBet;
  let hitMax = false;

  let bet = roundDownToChip(plannedBet);
  if (bet > max) {
    bet = roundDownToChip(max);
    hitMax = true;
  }
  if (bet < min) {
    return { bet: 0, hitMax, belowMin: true };
  }
  return { bet, hitMax: hitMax || plannedBet > max, belowMin: false };
}

/**
 * If sum of line bets exceeds table total max, scale down proportionally
 * and re-round to chip size (never below min unless forced to 0).
 */
export function enforceTotalSpinCap(
  bets: Record<string, number>,
  maxTotal: number = NOVIBET_EUROPEAN_TABLE.maxTotalPerSpin,
): Record<string, number> {
  const ids = Object.keys(bets);
  const total = ids.reduce((s, id) => s + bets[id], 0);
  if (total <= maxTotal || total <= 0) return { ...bets };

  const scale = maxTotal / total;
  const scaled: Record<string, number> = {};
  for (const id of ids) {
    scaled[id] = roundDownToChip(bets[id] * scale);
  }

  // Top-up residual to largest line if under cap due to rounding
  let sum = ids.reduce((s, id) => s + scaled[id], 0);
  if (sum < maxTotal && ids.length > 0) {
    const largest = ids.reduce((a, b) => (scaled[b] > scaled[a] ? b : a));
    const add = roundDownToChip(maxTotal - sum);
    scaled[largest] = roundDownToChip(scaled[largest] + add);
    // Ensure we never exceed maxTotal after top-up
    sum = ids.reduce((s, id) => s + scaled[id], 0);
    if (sum > maxTotal) {
      scaled[largest] = roundDownToChip(
        Math.max(0, scaled[largest] - (sum - maxTotal)),
      );
    }
  }

  return scaled;
}
