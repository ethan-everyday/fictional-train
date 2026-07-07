import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  activitiesFor,
  applyEffect,
  checkPasses,
  choiceRoll,
  eligibleEvents,
  pickEvent,
  resolveEffect,
  selectionSeed,
} from "@/lib/game/events";
import { baseStats, ROLES, BACKGROUNDS } from "@/lib/game/character";
import { ACTIVITIES, EVENTS } from "@/lib/game/content";
import { LOCATIONS, STAT_CAP } from "@/lib/game/constants";
import type { GameEvent, PlayerStats } from "@/lib/game/types";

const ZERO: PlayerStats = {
  intelligence: 0,
  strength: 0,
  agility: 0,
  craft: 0,
  will: 0,
  wealth: 0,
};

// These engine tests are deliberately CONTENT-AGNOSTIC: they probe the rules
// against whatever events exist, so editing the story never breaks them.

describe("activities", () => {
  it("returns only the activities for a location, and every location has some", () => {
    for (const loc of LOCATIONS) {
      const acts = activitiesFor(loc.id);
      expect(acts.length, loc.id).toBeGreaterThanOrEqual(2);
      expect(acts.every((a) => a.location === loc.id)).toBe(true);
    }
  });
});

describe("eligibility rules", () => {
  // SYNTHETIC fixtures pushed into the pool for this file only, so the rules
  // stay provable even on a clean content slate (the 2026-07-03 rewrite).
  // Each vitest file gets its own module registry — no cross-file leakage.
  const tavernAct = () => activitiesFor("tavern")[0].id;
  const flat = { text: "x", outcome: "did." };
  const FIXTURES: GameEvent[] = [
    { id: "__test_once", location: "tavern", activities: [], text: "t", effect: flat },
    { id: "__test_gated", location: "tavern", activities: [], requires: ["__test_flag"], text: "t", effect: flat },
    { id: "__test_bound", location: "tavern", activities: [], text: "t", effect: flat },
  ];
  beforeAll(() => {
    FIXTURES[0].activities = [tavernAct()];
    FIXTURES[2].activities = [tavernAct()];
    EVENTS.push(...FIXTURES);
  });
  afterAll(() => {
    for (const f of FIXTURES) {
      const i = EVENTS.indexOf(f);
      if (i >= 0) EVENTS.splice(i, 1);
    }
  });

  it("drops a once-only event after it has been seen", () => {
    const ev = FIXTURES[0];
    const act = ev.activities[0];
    const fresh = eligibleEvents(ev.location, act, [], []);
    expect(fresh.some((e) => e.id === ev.id)).toBe(true);
    const seen = eligibleEvents(ev.location, act, [], [ev.id]);
    expect(seen.some((e) => e.id === ev.id)).toBe(false);
  });

  it("hides a required-flag event until the flag is present (the chain mechanism)", () => {
    const ev = FIXTURES[1];
    const act = tavernAct();
    const without = eligibleEvents(ev.location, act, [], []);
    expect(without.some((e) => e.id === ev.id)).toBe(false);
    const withFlags = eligibleEvents(ev.location, act, ev.requires!, []);
    expect(withFlags.some((e) => e.id === ev.id)).toBe(true);
  });

  it("blocks a forbidden-flag event once the flag is present", () => {
    const ev = EVENTS.find(
      (e) => e.forbids && e.forbids.length > 0 && (e.requires?.length ?? 0) === 0,
    );
    if (!ev) return; // no pure-forbid event; fine
    const act = ev.activities[0] ?? "";
    const open = eligibleEvents(ev.location, act, [], []);
    expect(open.some((e) => e.id === ev.id)).toBe(true);
    const blocked = eligibleEvents(ev.location, act, [ev.forbids![0]], []);
    expect(blocked.some((e) => e.id === ev.id)).toBe(false);
  });

  it("respects week gates", () => {
    const ev = EVENTS.find((e) => e.minWeek && e.minWeek > 1);
    if (!ev) return;
    const act = ev.activities[0] ?? "";
    const early = eligibleEvents(ev.location, act, ev.requires ?? [], [], 1);
    expect(early.some((e) => e.id === ev.id)).toBe(false);
    const onTime = eligibleEvents(ev.location, act, ev.requires ?? [], [], ev.minWeek!);
    expect(onTime.some((e) => e.id === ev.id)).toBe(true);
  });

  it("only returns events bound to the chosen activity", () => {
    const ev = FIXTURES[2];
    const otherAct = ACTIVITIES.find(
      (a) => a.location === ev.location && a.id !== ev.activities[0],
    );
    expect(otherAct, "tavern has a second activity").toBeTruthy();
    const elsewhere = eligibleEvents(ev.location, otherAct!.id, [], []);
    expect(elsewhere.some((e) => e.id === ev.id)).toBe(false);
  });
});

describe("event selection", () => {
  it("is stable for the same seed (survives a refresh)", () => {
    const loc = "tavern" as const;
    const act = activitiesFor(loc)[0].id;
    const seed = selectionSeed("player-1", 1, act);
    const a = pickEvent(loc, act, [], [], seed, 1);
    const b = pickEvent(loc, act, [], [], seed, 1);
    expect(a.id).toBe(b.id);
  });

  it("always returns an event, falling back when the pool is dry", () => {
    const loc = "tavern" as const;
    const act = activitiesFor(loc)[0].id;
    const allSeen = EVENTS.filter((e) => e.location === loc).map((e) => e.id);
    const picked = pickEvent(loc, act, [], allSeen, 123, 1);
    expect(picked.id).toBe("quiet_tavern");
  });
});

describe("hidden stat checks (synthetic)", () => {
  const checkEvent: GameEvent = {
    id: "x",
    location: "tavern",
    activities: [],
    check: { stat: "will", dc: 4 },
    text: "t",
    pass: { text: "p", outcome: "passed." },
    fail: { text: "f", outcome: "failed." },
  };

  it("passes only when the stat meets the dc", () => {
    expect(checkPasses(checkEvent, { ...ZERO, will: 3 })).toBe(false);
    expect(checkPasses(checkEvent, { ...ZERO, will: 4 })).toBe(true);
  });

  it("resolves to the pass or fail branch by the check", () => {
    expect(resolveEffect(checkEvent, { ...ZERO, will: 9 })).toBe(checkEvent.pass);
    expect(resolveEffect(checkEvent, { ...ZERO, will: 0 })).toBe(checkEvent.fail);
  });
});

describe("choice events (synthetic)", () => {
  const choiceEvent: GameEvent = {
    id: "c",
    location: "tavern",
    activities: [],
    text: "t",
    choices: [
      { label: "A", effect: { text: "a", outcome: "did a." } },
      { label: "B", effect: { text: "b", outcome: "did b." } },
    ],
  };

  it("needs a choice index, then resolves to that option", () => {
    expect(resolveEffect(choiceEvent, ZERO)).toBeNull();
    expect(resolveEffect(choiceEvent, ZERO, 0)).toBe(choiceEvent.choices![0].effect);
    expect(resolveEffect(choiceEvent, ZERO, 1)).toBe(choiceEvent.choices![1].effect);
  });

  const checkChoiceEvent: GameEvent = {
    id: "cc",
    location: "tavern",
    activities: [],
    text: "t",
    choices: [
      {
        label: "Risk it",
        check: { stat: "agility", dc: 5 },
        pass: { text: "p", outcome: "slipped through." },
        fail: { text: "f", outcome: "was caught." },
      },
      { label: "Play it safe", effect: { text: "s", outcome: "walked away." } },
    ],
  };

  it("branches a choice's hidden check on stats, like an event check", () => {
    expect(resolveEffect(checkChoiceEvent, { ...ZERO, agility: 7 }, 0)).toBe(
      checkChoiceEvent.choices![0].pass,
    );
    expect(resolveEffect(checkChoiceEvent, { ...ZERO, agility: 2 }, 0)).toBe(
      checkChoiceEvent.choices![0].fail,
    );
    // The flat sibling choice ignores stats entirely.
    expect(resolveEffect(checkChoiceEvent, ZERO, 1)).toBe(
      checkChoiceEvent.choices![1].effect,
    );
  });

  const randomChoiceEvent: GameEvent = {
    id: "cr",
    location: "tavern",
    activities: [],
    text: "t",
    choices: [
      {
        label: "Chance it",
        random: [
          { weight: 1, effect: { text: "r0", outcome: "got away with it." } },
          { weight: 2, effect: { text: "r1", outcome: "was caught." } },
          { effect: { text: "r2", outcome: "overheard something." } }, // weight defaults to 1
        ],
      },
      { label: "Refuse", effect: { text: "n", outcome: "kept clear." } },
    ],
  };

  it("picks a random choice outcome by weight from the supplied roll", () => {
    const pool = randomChoiceEvent.choices![0].random!;
    // Total weight 4: [0,1) → first, [1,3) → second, [3,4) → third.
    expect(resolveEffect(randomChoiceEvent, ZERO, 0, 0)).toBe(pool[0].effect);
    expect(resolveEffect(randomChoiceEvent, ZERO, 0, 0.24)).toBe(pool[0].effect);
    expect(resolveEffect(randomChoiceEvent, ZERO, 0, 0.26)).toBe(pool[1].effect);
    expect(resolveEffect(randomChoiceEvent, ZERO, 0, 0.74)).toBe(pool[1].effect);
    expect(resolveEffect(randomChoiceEvent, ZERO, 0, 0.76)).toBe(pool[2].effect);
    expect(resolveEffect(randomChoiceEvent, ZERO, 0, 0.999)).toBe(pool[2].effect);
  });
});

describe("choiceRoll (refresh stability)", () => {
  it("is deterministic for the same player/night/activity/choice", () => {
    const a = choiceRoll("player-1", 3, "tavern_gamble", 1);
    const b = choiceRoll("player-1", 3, "tavern_gamble", 1);
    expect(a).toBe(b);
  });

  it("stays within [0, 1)", () => {
    for (let i = 0; i < 5; i++) {
      const roll = choiceRoll(`p-${i}`, i + 1, "docks_haul", i % 3);
      expect(roll).toBeGreaterThanOrEqual(0);
      expect(roll).toBeLessThan(1);
    }
  });

  it("varies across players, nights, and chosen options", () => {
    const rolls = new Set([
      choiceRoll("player-1", 1, "docks_haul", 0),
      choiceRoll("player-2", 1, "docks_haul", 0),
      choiceRoll("player-1", 2, "docks_haul", 0),
      choiceRoll("player-1", 1, "docks_haul", 1),
    ]);
    expect(rolls.size).toBeGreaterThan(1);
  });
});

describe("applying effects", () => {
  it("adds deltas and clamps to 0..STAT_CAP", () => {
    const start: PlayerStats = { ...ZERO, wealth: 1, strength: STAT_CAP };
    const { stats, deltas } = applyEffect(start, {
      text: "",
      outcome: "",
      stats: { wealth: -3, strength: 5 },
    });
    expect(stats.wealth).toBe(0);
    expect(deltas.wealth).toBe(-1);
    expect(stats.strength).toBe(STAT_CAP);
    expect(deltas.strength).toBe(0);
  });
});

describe("character creation", () => {
  it("builds base stats from floor + role + background", () => {
    const stats = baseStats({ role: "knight", background: "soldier" });
    expect(stats.strength).toBe(5); // 1 + 3 + 1
    expect(stats.will).toBe(4); // 1 + 2 + 1
    expect(stats.craft).toBe(1); // floor only
  });

  it("offers exactly six roles and six backgrounds", () => {
    expect(ROLES).toHaveLength(6);
    expect(BACKGROUNDS).toHaveLength(6);
  });
});
