// Spin generation using PRNG and streak amplification
import { RealisticRoulettePRNG, REALISTIC_ROULETTE_CONFIG } from "./prngCore";
import { applyStreakAmplification } from "./streaks";

export function generateFixedSpins(count: number = 500): number[] {
  const spins: number[] = [];
  const prng = new RealisticRoulettePRNG();
  for (let i = 0; i < count; i++) {
    let nextSpin: number;
    if (REALISTIC_ROULETTE_CONFIG.realistic_streaks_enabled && i > 0) {
      nextSpin = applyStreakAmplification(spins, prng, REALISTIC_ROULETTE_CONFIG);
    } else {
      nextSpin = prng.randomInt(0, 36);
    }
    spins.push(nextSpin);
  }
  return spins;
}