// Types for roulette simulation and strategies

export interface RouletteNumber {
  number: number;
  color: "red" | "black" | "green";
  isEven: boolean;
  dozen: 1 | 2 | 3 | null;
}

export type StrategyType =
  | "compound_martingale"
  | "max_lose"
  | "zapping"
  | "safe_compound_martingale"
  | "sam_plus"
  | "standard_martingale";

export interface CompoundMartingaleConfig {
  id: string;
  name: string;
  initialBet: number;
  betType: "single" | "dozen" | "color" | "even_odd" | "high_low" | "column";
  target: string | number;
  progression: "flat" | "martingale" | "fibonacci" | "dalembert" | "custom";
  winMultiplier: number;
  customProgression?: number[];
  resetOnWin: boolean;
  maxBet?: number;
}

export interface CompoundMartingaleState {
  config: CompoundMartingaleConfig;
  currentBet: number;
  totalWagered: number;
  totalWon: number;
  netResult: number;
  progressionStep: number;
}

export interface MaxLoseState {
  id: string;
  name: string;
  currentBet: number;
  initialBet: number;
  lossStreak: number;
  totalWagered: number;
  totalWon: number;
  netResult: number;
  betType: "single" | "dozen" | "color" | "even_odd" | "high_low" | "column";
  target: string | number;
  winMultiplier: number;
}

export interface ZappingState {
  currentBet: number;
  initialBet: number;
  currentTarget: "red" | "black";
  totalWagered: number;
  totalWon: number;
  netResult: number;
  zapPosition: number;
}

export interface SafeCompoundMartingaleState {
  id: string;
  name: string;
  currentBet: number;
  initialBet: number;
  totalWagered: number;
  totalWon: number;
  netResult: number;
  progressionStep: number;
  isPaused: boolean;
  config: CompoundMartingaleConfig;
}

export interface SAMPlusState {
  id: string;
  name: string;
  currentBet: number;
  initialBet: number;
  totalWagered: number;
  totalWon: number;
  netResult: number;
  lossStreak: number;
  isPaused: boolean;
  lastWins: boolean[];
  kellyFraction: number;
  config: CompoundMartingaleConfig;
}

export interface SAMPlusAnalytics {
  portfolioVolatility: number;
  recentDrawdown: number;
  dynamicSafetyRatio: number;
  kellyOptimalBet: number;
  riskScore: number;
  adaptiveMode: "aggressive" | "balanced" | "conservative";
}

export interface SAMPlusZappingState {
  currentTarget: "red" | "black";
  transitionProbability: number;
  recentRedWins: number;
  recentBlackWins: number;
  markovState: number;
}

export interface StandardMartingaleState {
  currentBet: number;
  baseBet: number;
  totalWagered: number;
  totalWon: number;
  netResult: number;
  currentRound: number;
  lossStreak: number;
  maxBetReached: number;
  totalResets: number;
  maxStreakSurvived: number;
}

export interface SpinResult {
  spin: number;
  drawnNumber: number;
  spinNetResult: number;
  cumulativeEarnings: number;
  actualBetsUsed: Record<string, number>;
  wins: Record<string, boolean>;
  strategyType: StrategyType;
  compoundMartingaleState?: Record<string, CompoundMartingaleState>;
  maxLoseState?: Record<string, MaxLoseState>;
  zappingState?: ZappingState;
  safeCompoundMartingaleState?: Record<string, SafeCompoundMartingaleState>;
  samPlusState?: Record<string, SAMPlusState>;
  samPlusAnalytics?: SAMPlusAnalytics;
  samPlusZapping?: SAMPlusZappingState;
  standardMartingaleState?: StandardMartingaleState;
  pausedParameters?: string[];
}