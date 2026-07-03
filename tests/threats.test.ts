import { describe, expect, it } from "vitest";
import {
  applyThreatDeltas,
  maxedThreats,
  tickThreats,
} from "@/lib/game/threats";
import {
  NIGHT_COUNT,
  THREAT_CAP,
  THREAT_TICKS,
  ZERO_THREATS,
} from "@/lib/game/constants";
import type { ThreatScores } from "@/lib/game/types";

// Content-agnostic checks on the threat engine and its tuning constants.

describe("tickThreats", () => {
  it("raises every track by the arriving week's tick", () => {
    const week3 = tickThreats(ZERO_THREATS, 3);
    for (const value of Object.values(week3)) {
      expect(value).toBe(THREAT_TICKS[2]);
    }
  });

  it("costs nothing on week 1 (the game opens calm)", () => {
    expect(tickThreats(ZERO_THREATS, 1)).toEqual(ZERO_THREATS);
  });

  it("clamps at the cap", () => {
    const nearCap: ThreatScores = {
      plague: THREAT_CAP,
      starvation: THREAT_CAP - 1,
      war: 0,
      devils: THREAT_CAP,
    };
    const ticked = tickThreats(nearCap, NIGHT_COUNT);
    expect(ticked.plague).toBe(THREAT_CAP);
    expect(ticked.starvation).toBe(THREAT_CAP);
    expect(ticked.devils).toBe(THREAT_CAP);
    expect(ticked.war).toBeLessThanOrEqual(THREAT_CAP);
  });

  it("does not mutate its input", () => {
    const before = { ...ZERO_THREATS };
    tickThreats(before, 5);
    expect(before).toEqual(ZERO_THREATS);
  });
});

describe("applyThreatDeltas", () => {
  it("sums a night's deltas across players", () => {
    const start: ThreatScores = { plague: 5, starvation: 5, war: 5, devils: 5 };
    const next = applyThreatDeltas(start, [
      { plague: -1, war: 1 },
      { plague: -1 },
      { devils: -2 },
    ]);
    expect(next).toEqual({ plague: 3, starvation: 5, war: 6, devils: 3 });
  });

  it("clamps to 0 below and the cap above", () => {
    const start: ThreatScores = {
      plague: 1,
      starvation: THREAT_CAP - 1,
      war: 0,
      devils: 0,
    };
    const next = applyThreatDeltas(start, [
      { plague: -2 },
      { starvation: 2 },
    ]);
    expect(next.plague).toBe(0);
    expect(next.starvation).toBe(THREAT_CAP);
  });

  it("is a no-op with no deltas", () => {
    const start: ThreatScores = { plague: 4, starvation: 3, war: 2, devils: 1 };
    expect(applyThreatDeltas(start, [])).toEqual(start);
  });
});

describe("maxedThreats", () => {
  it("returns only the tracks at (or past) the cap", () => {
    expect(maxedThreats(ZERO_THREATS)).toEqual([]);
    const grim: ThreatScores = {
      plague: THREAT_CAP,
      starvation: THREAT_CAP - 1,
      war: THREAT_CAP,
      devils: 0,
    };
    expect(maxedThreats(grim)).toEqual(["plague", "war"]);
  });
});

describe("THREAT_TICKS tuning", () => {
  it("has one tick per week", () => {
    expect(THREAT_TICKS).toHaveLength(NIGHT_COUNT);
  });

  it("is harsh enough that neglect is fatal (sum >= cap + 3)", () => {
    const sum = THREAT_TICKS.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThanOrEqual(THREAT_CAP + 3);
  });

  it("drives an untouched threat to the cap by week 7", () => {
    let scores = ZERO_THREATS;
    for (let week = 1; week <= NIGHT_COUNT; week++) {
      scores = tickThreats(scores, week);
    }
    expect(scores.plague).toBe(THREAT_CAP);
    expect(scores.starvation).toBe(THREAT_CAP);
    expect(scores.war).toBe(THREAT_CAP);
    expect(scores.devils).toBe(THREAT_CAP);
  });
});
