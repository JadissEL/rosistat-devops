// Predefined bet types and their win conditions
import { getRouletteNumber } from "./roulette";

export const BET_TYPES = {
  single: (num: number, target: string | number) => num === Number(target),
  dozen: (num: number, target: string | number) => {
    if (target === "1-12") return num >= 1 && num <= 12;
    if (target === "13-24") return num >= 13 && num <= 24;
    if (target === "25-36") return num >= 25 && num <= 36;
    return false;
  },
  color: (num: number, target: string | number) => {
    const rouletteNum = getRouletteNumber(num);
    return rouletteNum.color === target;
  },
  even_odd: (num: number, target: string | number) => {
    if (num === 0) return false;
    const isEven = num % 2 === 0;
    return target === "even" ? isEven : !isEven;
  },
  high_low: (num: number, target: string | number) => {
    if (num === 0) return false;
    return target === "high" ? num >= 19 : num <= 18;
  },
  column: (num: number, target: string | number) => {
    if (num === 0) return false;
    const col = ((num - 1) % 3) + 1;
    return col === Number(target);
  },
} as const;