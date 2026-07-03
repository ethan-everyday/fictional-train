import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { ACTIVITIES, EVENTS } from "@/lib/game/content";
import { ROLES, BACKGROUNDS } from "@/lib/game/character";
import {
  LOCATIONS,
  STAT_CAP,
  STAT_LABELS,
  THREAT_LABELS,
} from "@/lib/game/constants";
import type { EventChoice, EventEffect, GameEvent } from "@/lib/game/types";

const LOCATION_IDS = LOCATIONS.map((l) => l.id);
const STAT_IDS = Object.keys(STAT_LABELS);
const THREAT_IDS = Object.keys(THREAT_LABELS);

/** Every effect a single choice can resolve to (all three choice shapes). */
function choiceBranches(c: EventChoice): EventEffect[] {
  if (c.check) return [c.pass, c.fail].filter(Boolean) as EventEffect[];
  if (c.random) return c.random.map((o) => o.effect).filter(Boolean);
  return c.effect ? [c.effect] : [];
}

/** Every effect an event can resolve to, traversing nested choice shapes. */
function branches(ev: GameEvent): EventEffect[] {
  if (ev.choices) return ev.choices.flatMap(choiceBranches);
  if (ev.check) return [ev.pass, ev.fail].filter(Boolean) as EventEffect[];
  return ev.effect ? [ev.effect] : [];
}

/** Every flag any event/branch/origin can SET — the universe of prerequisites. */
function producibleFlags(): Set<string> {
  const flags = new Set<string>();
  for (const ev of EVENTS) {
    for (const b of branches(ev)) b.flags?.forEach((f) => flags.add(f));
  }
  [...ROLES, ...BACKGROUNDS].forEach((o) => o.startFlag && flags.add(o.startFlag));
  return flags;
}

describe("content contract", () => {
  it("has unique event ids", () => {
    const ids = EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique activity ids", () => {
    const ids = ACTIVITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every location 2–4 activities", () => {
    for (const loc of LOCATION_IDS) {
      const n = ACTIVITIES.filter((a) => a.location === loc).length;
      expect(n, `${loc} activity count`).toBeGreaterThanOrEqual(2);
      expect(n, `${loc} activity count`).toBeLessThanOrEqual(4);
    }
  });

  it("points every event at a real location and real activities", () => {
    for (const ev of EVENTS) {
      expect(LOCATION_IDS, ev.id).toContain(ev.location);
      const localActs = ACTIVITIES.filter((a) => a.location === ev.location).map(
        (a) => a.id,
      );
      for (const act of ev.activities) {
        expect(localActs, `${ev.id} → ${act}`).toContain(act);
      }
    }
  });

  it("gives every event exactly one resolution shape", () => {
    for (const ev of EVENTS) {
      const shapes = [
        Boolean(ev.effect),
        Boolean(ev.check),
        Boolean(ev.choices && ev.choices.length > 0),
      ].filter(Boolean).length;
      expect(shapes, `${ev.id} resolution shapes`).toBe(1);
      if (ev.check) {
        expect(ev.pass, `${ev.id} pass`).toBeTruthy();
        expect(ev.fail, `${ev.id} fail`).toBeTruthy();
      }
    }
  });

  it("gives every event 2–3 choices, when it offers any", () => {
    for (const ev of EVENTS) {
      if (!ev.choices) continue;
      expect(ev.choices.length, `${ev.id} choice count`).toBeGreaterThanOrEqual(2);
      expect(ev.choices.length, `${ev.id} choice count`).toBeLessThanOrEqual(3);
    }
  });

  it("gives every choice exactly one resolution shape", () => {
    for (const ev of EVENTS) {
      (ev.choices ?? []).forEach((c, i) => {
        const label = `${ev.id} choice[${i}]`;
        const shapes = [
          Boolean(c.effect),
          Boolean(c.check),
          Boolean(c.random && c.random.length > 0),
        ].filter(Boolean).length;
        expect(shapes, `${label} resolution shapes`).toBe(1);
        if (c.check) {
          expect(c.pass, `${label} pass`).toBeTruthy();
          expect(c.fail, `${label} fail`).toBeTruthy();
          expect(STAT_IDS, `${label} check stat`).toContain(c.check.stat);
          expect(c.check.dc, `${label} dc`).toBeGreaterThanOrEqual(1);
          expect(c.check.dc, `${label} dc`).toBeLessThanOrEqual(STAT_CAP);
        }
        if (c.random) {
          expect(c.random.length, `${label} random entries`).toBeGreaterThanOrEqual(2);
          for (const o of c.random) {
            if (o.weight !== undefined) {
              expect(o.weight, `${label} random weight`).toBeGreaterThan(0);
            }
            expect(o.effect, `${label} random effect`).toBeTruthy();
          }
        }
      });
    }
  });

  it("keeps threat deltas to real threats, integers in -2..+2, never 0", () => {
    for (const ev of EVENTS) {
      for (const b of branches(ev)) {
        for (const [id, delta] of Object.entries(b.threats ?? {})) {
          const label = `${ev.id} threats.${id}`;
          expect(THREAT_IDS, label).toContain(id);
          expect(Number.isInteger(delta), `${label} integer`).toBe(true);
          expect(delta, label).not.toBe(0);
          expect(delta, label).toBeGreaterThanOrEqual(-2);
          expect(delta, label).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("sets a non-empty outcome and prose on every branch", () => {
    for (const ev of EVENTS) {
      expect(ev.text.length, `${ev.id} setup text`).toBeGreaterThan(0);
      for (const b of branches(ev)) {
        expect(b.outcome.trim().length, `${ev.id} branch outcome`).toBeGreaterThan(0);
        expect(b.text.trim().length, `${ev.id} branch text`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps week gates within 1–7 and min ≤ max", () => {
    for (const ev of EVENTS) {
      if (ev.minWeek !== undefined) {
        expect(ev.minWeek, `${ev.id} minWeek`).toBeGreaterThanOrEqual(1);
        expect(ev.minWeek, `${ev.id} minWeek`).toBeLessThanOrEqual(7);
      }
      if (ev.maxWeek !== undefined) {
        expect(ev.maxWeek, `${ev.id} maxWeek`).toBeGreaterThanOrEqual(1);
        expect(ev.maxWeek, `${ev.id} maxWeek`).toBeLessThanOrEqual(7);
      }
      if (ev.minWeek !== undefined && ev.maxWeek !== undefined) {
        expect(ev.minWeek, `${ev.id} min≤max`).toBeLessThanOrEqual(ev.maxWeek);
      }
    }
  });

  it("location meta, when present, carries a non-empty name", () => {
    // meta { name, blurb } is registered over the constants fallbacks at
    // import time — a blank name would blank every screen's location label.
    for (const loc of LOCATION_IDS) {
      const raw = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "lib", "game", "content", "data", `${loc}.json`), "utf8"),
      );
      if (raw.meta === undefined) continue;
      expect(typeof raw.meta.name, `${loc} meta.name`).toBe("string");
      expect(raw.meta.name.trim().length, `${loc} meta.name empty`).toBeGreaterThan(0);
      if (raw.meta.blurb !== undefined) {
        expect(typeof raw.meta.blurb, `${loc} meta.blurb`).toBe("string");
      }
    }
  });

  it("keeps selection weights positive integers", () => {
    // A zero/negative weight would corrupt the engine's weighted-random pick.
    for (const ev of EVENTS) {
      if (ev.weight === undefined) continue;
      expect(Number.isInteger(ev.weight), `${ev.id} weight integer`).toBe(true);
      expect(ev.weight, `${ev.id} weight`).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps stat checks to real stats within the cap", () => {
    for (const ev of EVENTS) {
      if (!ev.check) continue;
      expect(STAT_IDS, `${ev.id} check stat`).toContain(ev.check.stat);
      expect(ev.check.dc, `${ev.id} dc`).toBeGreaterThanOrEqual(1);
      expect(ev.check.dc, `${ev.id} dc`).toBeLessThanOrEqual(STAT_CAP);
    }
  });

  it("only touches real stats in effects", () => {
    for (const ev of EVENTS) {
      for (const b of branches(ev)) {
        for (const stat of Object.keys(b.stats ?? {})) {
          expect(STAT_IDS, `${ev.id} effect stat`).toContain(stat);
        }
      }
    }
  });

  it("has no orphan prerequisites — every required flag is producible", () => {
    const producible = producibleFlags();
    for (const ev of EVENTS) {
      for (const flag of ev.requires ?? []) {
        expect(
          producible.has(flag),
          `${ev.id} requires "${flag}" which no event or origin ever sets`,
        ).toBe(true);
      }
    }
  });

  it("references only producible flags in forbids (typo guard)", () => {
    const producible = producibleFlags();
    for (const ev of EVENTS) {
      for (const flag of ev.forbids ?? []) {
        expect(
          producible.has(flag),
          `${ev.id} forbids "${flag}" which is never set anywhere (typo?)`,
        ).toBe(true);
      }
    }
  });
});
