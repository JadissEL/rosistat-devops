// PRNG core for roulette with natural streak behavior
// Extracted from Index.tsx to modularize spin generation logic

export interface RealisticRouletteConfig {
  realistic_streaks_enabled: boolean;
  max_expected_streak_length: number;
  volatility_model: "natural" | "enhanced" | "extreme";
  streak_probability_model: "MonteCarlo" | "weighted" | "natural";
  variance_amplifier: number;
}

export const REALISTIC_ROULETTE_CONFIG: RealisticRouletteConfig = {
  realistic_streaks_enabled: true,
  max_expected_streak_length: 15,
  volatility_model: "natural",
  streak_probability_model: "MonteCarlo",
  variance_amplifier: 1.2,
};

// Advanced PRNG (Mersenne Twister-inspired)
export class RealisticRoulettePRNG {
  private seed: number;
  private mt: number[] = [];
  private index: number = 0;

  constructor(seed?: number) {
    this.seed = seed || Date.now();
    this.initialize();
  }

  private initialize(): void {
    this.mt[0] = this.seed;
    for (let i = 1; i < 624; i++) {
      this.mt[i] =
        (1812433253 * (this.mt[i - 1] ^ (this.mt[i - 1] >> 30)) + i) &
        0xffffffff;
    }
  }

  private extractNumber(): number {
    if (this.index >= 624) {
      this.generateNumbers();
    }

    let y = this.mt[this.index];
    y = y ^ (y >> 11);
    y = y ^ ((y << 7) & 0x9d2c5680);
    y = y ^ ((y << 15) & 0xefc60000);
    y = y ^ (y >> 18);

    this.index++;
    return (y >>> 0) / 0x100000000;
  }

  private generateNumbers(): void {
    for (let i = 0; i < 624; i++) {
      const y =
        (this.mt[i] & 0x80000000) + (this.mt[(i + 1) % 624] & 0x7fffffff);
      this.mt[i] = this.mt[(i + 397) % 624] ^ (y >> 1);
      if (y % 2 !== 0) {
        this.mt[i] = this.mt[i] ^ 0x9908b0df;
      }
    }
    this.index = 0;
  }

  public random(): number {
    return this.extractNumber();
  }

  public randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
}