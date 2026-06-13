import { describe, expect, it } from "vitest";
import {
  activitiesFor,
  applyEffect,
  checkPasses,
  eligibleEvents,
  eventById,
  pickEvent,
  resolveEffect,
  selectionSeed,
} from "@/lib/game/events";
import { baseStats, ROLES, BACKGROUNDS } from "@/lib/game/character";
import { ACTIVITIES, EVENTS } from "@/lib/game/content";
import { STAT_CAP } from "@/lib/game/constants";
import type { GameEvent, PlayerStats } from "@/lib/game/types";

const ZERO: PlayerStats = {
  intelligence: 0,
  strength: 0,
  agility: 0,
  craft: 0,
  will: 0,
  wealth: 0,
};

describe("activities", () => {
  it("returns only the activities for a location", () => {
    const acts = activitiesFor("tavern");
    expect(acts.length).toBeGreaterThanOrEqual(2);
    expect(acts.every((a) => a.location === "tavern")).toBe(true);
  });
});

describe("eligibility & prerequisite chains", () => {
  it("hides an event until its required flag is set (cross-location)", () => {
    const without = eligibleEvents("castle", "castle_gate", [], []);
    expect(without.some((e) => e.id === "audience_with_lord")).toBe(false);

    const withFlag = eligibleEvents("castle", "castle_gate", ["met_steward"], []);
    expect(withFlag.some((e) => e.id === "audience_with_lord")).toBe(true);
  });

  it("forbids an event once a blocking flag is present", () => {
    const open = eligibleEvents("castle", "castle_gate", [], []);
    expect(open.some((e) => e.id === "turned_away")).toBe(true);
    const blocked = eligibleEvents("castle", "castle_gate", ["met_steward"], []);
    expect(blocked.some((e) => e.id === "turned_away")).toBe(false);
  });

  it("drops a once-only event after it has been seen", () => {
    const fresh = eligibleEvents("tavern", "tavern_gossip", [], []);
    expect(fresh.some((e) => e.id === "steward_in_cups")).toBe(true);
    const seen = eligibleEvents("tavern", "tavern_gossip", [], ["steward_in_cups"]);
    expect(seen.some((e) => e.id === "steward_in_cups")).toBe(false);
  });

  it("respects the activity an event is bound to", () => {
    const gambleEvents = eligibleEvents("tavern", "tavern_gamble", [], []);
    expect(gambleEvents.some((e) => e.id === "gamblers_table")).toBe(true);
    const gossipEvents = eligibleEvents("tavern", "tavern_gossip", [], []);
    expect(gossipEvents.some((e) => e.id === "gamblers_table")).toBe(false);
  });
});

describe("event selection", () => {
  it("is stable for the same seed (survives a refresh)", () => {
    const seed = selectionSeed("player-1", 1, "tavern_gossip");
    const a = pickEvent("tavern", "tavern_gossip", [], [], seed);
    const b = pickEvent("tavern", "tavern_gossip", [], [], seed);
    expect(a.id).toBe(b.id);
  });

  it("always returns an event, falling back when the pool is dry", () => {
    const allSeen = EVENTS.filter((e) => e.location === "tavern").map((e) => e.id);
    const picked = pickEvent("tavern", "tavern_gossip", [], allSeen, 123);
    expect(picked).toBeTruthy();
    expect(picked.id).toBe("quiet_tavern");
  });
});

describe("hidden stat checks", () => {
  it("passes only when the stat meets the dc", () => {
    const ev = eventById("audience_with_lord") as GameEvent;
    expect(ev.check).toBeTruthy();
    const weak = { ...ZERO, will: 3 };
    const strong = { ...ZERO, will: 4 };
    expect(checkPasses(ev, weak)).toBe(false);
    expect(checkPasses(ev, strong)).toBe(true);
  });

  it("resolves to the pass or fail branch by the check", () => {
    const ev = eventById("gamblers_table") as GameEvent;
    const lucky = resolveEffect(ev, { ...ZERO, agility: 9 });
    const unlucky = resolveEffect(ev, { ...ZERO, agility: 0 });
    expect(lucky).toBe(ev.pass);
    expect(unlucky).toBe(ev.fail);
  });
});

describe("choice events", () => {
  it("needs a choice index, then resolves to that option", () => {
    const ev = eventById("round_for_the_room") as GameEvent;
    expect(resolveEffect(ev, ZERO)).toBeNull();
    expect(resolveEffect(ev, ZERO, 0)).toBe(ev.choices?.[0].effect);
    expect(resolveEffect(ev, ZERO, 1)).toBe(ev.choices?.[1].effect);
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
    expect(stats.wealth).toBe(0); // clamped at floor, not -2
    expect(deltas.wealth).toBe(-1);
    expect(stats.strength).toBe(STAT_CAP); // clamped at ceiling
    expect(deltas.strength).toBe(0);
  });
});

describe("character creation", () => {
  it("builds base stats from floor + role + background", () => {
    const stats = baseStats({ role: "knight", background: "soldier" });
    // floor 1 + knight strength 3 + soldier strength 1
    expect(stats.strength).toBe(5);
    // floor 1 + knight will 2 + soldier will 1
    expect(stats.will).toBe(4);
    // floor only
    expect(stats.craft).toBe(1);
  });

  it("offers exactly six roles and six backgrounds", () => {
    expect(ROLES).toHaveLength(6);
    expect(BACKGROUNDS).toHaveLength(6);
  });
});
