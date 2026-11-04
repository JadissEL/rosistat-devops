import { describe, expect, it } from "vitest";
import {
  applyNovibetBetConstraints,
  enforceTotalSpinCap,
  NOVIBET_EUROPEAN_TABLE,
  roundDownToChip,
} from "./novibetConstraints";

describe("novibetConstraints", () => {
  it("rounds down to €0.20 chips", () => {
    expect(roundDownToChip(12.37)).toBe(12.2);
    expect(roundDownToChip(0.19)).toBe(0);
    expect(roundDownToChip(0.2)).toBe(0.2);
  });

  it("clamps straight-up to table max", () => {
    const r = applyNovibetBetConstraints(200, "single");
    expect(r.bet).toBe(NOVIBET_EUROPEAN_TABLE.maxStraightUp);
    expect(r.hitMax).toBe(true);
    expect(r.belowMin).toBe(false);
  });

  it("rejects stakes below table minimum", () => {
    const r = applyNovibetBetConstraints(0.1, "color");
    expect(r.bet).toBe(0);
    expect(r.belowMin).toBe(true);
  });

  it("enforces total spin cap proportionally", () => {
    const capped = enforceTotalSpinCap(
      { a: 6000, b: 6000 },
      10000,
    );
    const total = capped.a + capped.b;
    expect(total).toBeLessThanOrEqual(10000);
    expect(capped.a).toBeGreaterThan(0);
    expect(capped.b).toBeGreaterThan(0);
  });
});
