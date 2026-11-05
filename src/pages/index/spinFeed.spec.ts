import { describe, expect, it } from "vitest";
import {
  dedupeKey,
  normalizeSpinEvent,
  parseSpinNumbers,
} from "./spinFeed";

describe("spinFeed", () => {
  it("normalizes a valid European number", () => {
    const r = normalizeSpinEvent({ number: 17, source: "devtools" });
    expect("error" in r).toBe(false);
    if (!("error" in r)) {
      expect(r.number).toBe(17);
      expect(r.tableId).toBe("novibet-european-default");
      expect(r.source).toBe("devtools");
    }
  });

  it("rejects invalid numbers", () => {
    expect(normalizeSpinEvent({ number: 37 })).toEqual({
      error: "number must be an integer 0–36",
    });
  });

  it("parses CSV paste", () => {
    const { numbers, error } = parseSpinNumbers("0, 32, 15\n19");
    expect(error).toBeUndefined();
    expect(numbers).toEqual([0, 32, 15, 19]);
  });

  it("dedupes by roundId when present", () => {
    expect(
      dedupeKey({
        tableId: "t",
        roundId: "r1",
        ts: "2026-01-01",
        number: 1,
      }),
    ).toBe("t::r1");
  });
});
