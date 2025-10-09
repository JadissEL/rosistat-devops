// European roulette wheel configuration and helpers
import type { RouletteNumber } from "./types";

export const ROULETTE_NUMBERS: RouletteNumber[] = [
  { number: 0, color: "green", isEven: false, dozen: null },
  // Red numbers
  { number: 1, color: "red", isEven: false, dozen: 1 },
  { number: 3, color: "red", isEven: false, dozen: 1 },
  { number: 5, color: "red", isEven: false, dozen: 1 },
  { number: 7, color: "red", isEven: false, dozen: 1 },
  { number: 9, color: "red", isEven: false, dozen: 1 },
  { number: 12, color: "red", isEven: true, dozen: 1 },
  { number: 14, color: "red", isEven: true, dozen: 2 },
  { number: 16, color: "red", isEven: true, dozen: 2 },
  { number: 18, color: "red", isEven: true, dozen: 2 },
  { number: 19, color: "red", isEven: false, dozen: 2 },
  { number: 21, color: "red", isEven: false, dozen: 2 },
  { number: 23, color: "red", isEven: false, dozen: 2 },
  { number: 25, color: "red", isEven: false, dozen: 3 },
  { number: 27, color: "red", isEven: false, dozen: 3 },
  { number: 30, color: "red", isEven: true, dozen: 3 },
  { number: 32, color: "red", isEven: true, dozen: 3 },
  { number: 34, color: "red", isEven: true, dozen: 3 },
  { number: 36, color: "red", isEven: true, dozen: 3 },
  // Black numbers
  { number: 2, color: "black", isEven: true, dozen: 1 },
  { number: 4, color: "black", isEven: true, dozen: 1 },
  { number: 6, color: "black", isEven: true, dozen: 1 },
  { number: 8, color: "black", isEven: true, dozen: 1 },
  { number: 10, color: "black", isEven: true, dozen: 1 },
  { number: 11, color: "black", isEven: false, dozen: 1 },
  { number: 13, color: "black", isEven: false, dozen: 2 },
  { number: 15, color: "black", isEven: false, dozen: 2 },
  { number: 17, color: "black", isEven: false, dozen: 2 },
  { number: 20, color: "black", isEven: true, dozen: 2 },
  { number: 22, color: "black", isEven: true, dozen: 2 },
  { number: 24, color: "black", isEven: true, dozen: 2 },
  { number: 26, color: "black", isEven: true, dozen: 3 },
  { number: 28, color: "black", isEven: true, dozen: 3 },
  { number: 29, color: "black", isEven: false, dozen: 3 },
  { number: 31, color: "black", isEven: false, dozen: 3 },
  { number: 33, color: "black", isEven: false, dozen: 3 },
  { number: 35, color: "black", isEven: false, dozen: 3 },
];

export function getRouletteNumber(num: number): RouletteNumber {
  const found = ROULETTE_NUMBERS.find((r) => r.number === num);
  if (!found) {
    throw new Error(`Invalid roulette number: ${num}`);
  }
  return found;
}