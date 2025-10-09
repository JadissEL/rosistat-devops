// Strategy configuration constants extracted from Index.tsx
import type { CompoundMartingaleConfig } from "./types";

export const COMPOUND_MARTINGALE_STRATEGIES: CompoundMartingaleConfig[] = [
  {
    id: "zero",
    name: "Number 0",
    initialBet: 1,
    betType: "single",
    target: 0,
    progression: "custom",
    winMultiplier: 36,
    customProgression: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    resetOnWin: true,
  },
  {
    id: "first_dozen",
    name: "1st Dozen (1-12)",
    initialBet: 12,
    betType: "dozen",
    target: "1-12",
    progression: "martingale",
    winMultiplier: 3,
    resetOnWin: true,
  },
  {
    id: "second_dozen",
    name: "2nd Dozen (13-24)",
    initialBet: 12,
    betType: "dozen",
    target: "13-24",
    progression: "martingale",
    winMultiplier: 3,
    resetOnWin: true,
  },
  {
    id: "black",
    name: "Black",
    initialBet: 18,
    betType: "color",
    target: "black",
    progression: "martingale",
    winMultiplier: 2,
    resetOnWin: true,
  },
  {
    id: "even",
    name: "Even",
    initialBet: 18,
    betType: "even_odd",
    target: "even",
    progression: "martingale",
    winMultiplier: 2,
    resetOnWin: true,
  },
];

export const MAX_LOSE_STRATEGIES = [
  { id: "red", name: "Red", initialBet: 18, betType: "color" as const, target: "red", winMultiplier: 2 },
  { id: "black", name: "Black", initialBet: 18, betType: "color" as const, target: "black", winMultiplier: 2 },
  { id: "odd", name: "Odd", initialBet: 18, betType: "even_odd" as const, target: "odd", winMultiplier: 2 },
  { id: "even", name: "Even", initialBet: 18, betType: "even_odd" as const, target: "even", winMultiplier: 2 },
  { id: "zero", name: "Number 0", initialBet: 1, betType: "single" as const, target: 0, winMultiplier: 36 },
];