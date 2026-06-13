import { describe, expect, it } from "vitest";
import { ACTIVITIES, EVENTS } from "@/lib/game/content";
import { ROLES, BACKGROUNDS } from "@/lib/game/character";
import { LOCATIONS, STAT_CAP, STAT_LABELS } from "@/lib/game/constants";
import type { EventEffect, GameEvent } from "@/lib/game/types";

const LOCATION_IDS = LOCATIONS.map((l) => l.id);
const STAT_IDS = Object.keys(STAT_LABELS);

/** Every flag any event/branch/origin can SET — the universe of prerequisites. */
function producibleFlags(): Set<string> {
  const flags = new Set<string>();
  const addEffect = (e?: EventEffect) => e?.flags?.forEach((f) => flags.add(f));
  for (const ev of EVENTS) {
    addEffect(ev.effect);
    addEffect(ev.pass);
    addEffect(ev.fail);
    ev.choices?.forEach((c) => addEffect(c.effect));
  }
  [...ROLES, ...BACKGROUNDS].forEach((o) => o.startFlag && flags.add(o.startFlag));
  return flags;
}

function branches(ev: GameEvent): EventEffect[] {
  if (ev.choices) return ev.choices.map((c) => c.effect);
  if (ev.check) return [ev.pass, ev.fail].filter(Boolean) as EventEffect[];
  return ev.effect ? [ev.effect] : [];
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

  it("sets a non-empty outcome and prose on every branch", () => {
    for (const ev of EVENTS) {
      expect(ev.text.length, `${ev.id} setup text`).toBeGreaterThan(0);
      for (const b of branches(ev)) {
        expect(b.outcome.trim().length, `${ev.id} branch outcome`).toBeGreaterThan(0);
        expect(b.text.trim().length, `${ev.id} branch text`).toBeGreaterThan(0);
      }
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
