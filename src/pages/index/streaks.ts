// Streak amplification and analysis helpers
import { getRouletteNumber, ROULETTE_NUMBERS } from "./roulette";
import { RealisticRoulettePRNG, REALISTIC_ROULETTE_CONFIG, RealisticRouletteConfig } from "./prngCore";

export function applyStreakAmplification(
  currentSpins: number[],
  prng: RealisticRoulettePRNG,
  config: RealisticRouletteConfig,
): number {
  if (!config.realistic_streaks_enabled || currentSpins.length < 2) {
    return prng.randomInt(0, 36);
  }

  const recentSpins = currentSpins.slice(-10);
  const lastSpin = recentSpins[recentSpins.length - 1];

  const patterns = {
    sameNumber: 0,
    sameColor: 0,
    sameEvenOdd: 0,
    sameDozen: 0,
    sameHighLow: 0,
  };

  for (let i = recentSpins.length - 1; i >= 1; i--) {
    const current = getRouletteNumber(recentSpins[i]);
    const previous = getRouletteNumber(recentSpins[i - 1]);

    if (recentSpins[i] === recentSpins[i - 1]) patterns.sameNumber++;
    else break;
  }

  for (let i = recentSpins.length - 1; i >= 1; i--) {
    const current = getRouletteNumber(recentSpins[i]);
    const previous = getRouletteNumber(recentSpins[i - 1]);

    if (current.color === previous.color && current.color !== "green")
      patterns.sameColor++;
    else break;
  }

  for (let i = recentSpins.length - 1; i >= 1; i--) {
    const current = getRouletteNumber(recentSpins[i]);
    const previous = getRouletteNumber(recentSpins[i - 1]);

    if (
      current.isEven === previous.isEven &&
      recentSpins[i] !== 0 &&
      recentSpins[i - 1] !== 0
    )
      patterns.sameEvenOdd++;
    else break;
  }

  const maxPatternLength = Math.max(
    patterns.sameColor,
    patterns.sameEvenOdd,
    patterns.sameDozen,
  );

  let continuationProbability = 0.48;

  if (maxPatternLength > 0) {
    continuationProbability = Math.max(
      0.15,
      0.48 - maxPatternLength * 0.04,
    );

    continuationProbability *= config.variance_amplifier;
    continuationProbability = Math.min(0.65, continuationProbability);
  }

  if (maxPatternLength > 0 && prng.random() < continuationProbability) {
    const lastNumber = getRouletteNumber(lastSpin);

    if (patterns.sameColor >= patterns.sameEvenOdd) {
      const sameColorNumbers = ROULETTE_NUMBERS.filter(
        (r) => r.color === lastNumber.color,
      );
      if (sameColorNumbers.length > 0) {
        const randomIndex = prng.randomInt(0, sameColorNumbers.length - 1);
        return sameColorNumbers[randomIndex].number;
      }
    } else {
      const sameParityNumbers = ROULETTE_NUMBERS.filter(
        (r) => r.number !== 0 && r.isEven === lastNumber.isEven,
      );
      if (sameParityNumbers.length > 0) {
        const randomIndex = prng.randomInt(0, sameParityNumbers.length - 1);
        return sameParityNumbers[randomIndex].number;
      }
    }
  }

  return prng.randomInt(0, 36);
}

export function analyzeStreakPatterns(spins: number[]) {
  let longestColorStreak = { color: "", length: 0, startIndex: 0 };
  let longestEvenOddStreak = { type: "", length: 0, startIndex: 0 };
  let longestNumberStreak = { number: 0, length: 0, startIndex: 0 };
  let totalStreaksOver5 = 0;
  let totalStreaksOver10 = 0;

  let currentColorStreak = 1;
  let currentColor = getRouletteNumber(spins[0]).color;
  let colorStartIndex = 0;

  for (let i = 1; i < spins.length; i++) {
    const spinColor = getRouletteNumber(spins[i]).color;

    if (spinColor === currentColor && spinColor !== "green") {
      currentColorStreak++;
    } else {
      if (
        currentColorStreak > longestColorStreak.length &&
        currentColor !== "green"
      ) {
        longestColorStreak = {
          color: currentColor,
          length: currentColorStreak,
          startIndex: colorStartIndex,
        };
      }
      if (currentColorStreak > 5) totalStreaksOver5++;
      if (currentColorStreak > 10) totalStreaksOver10++;

      currentColorStreak = 1;
      currentColor = spinColor;
      colorStartIndex = i;
    }
  }

  if (
    currentColorStreak > longestColorStreak.length &&
    currentColor !== "green"
  ) {
    longestColorStreak = {
      color: currentColor,
      length: currentColorStreak,
      startIndex: colorStartIndex,
    };
  }

  return {
    longestColorStreak,
    longestEvenOddStreak,
    longestNumberStreak,
    totalStreaksOver5,
    totalStreaksOver10,
  };
}