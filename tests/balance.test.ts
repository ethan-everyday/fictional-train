import { describe, expect, it } from "vitest";
import { EVENTS } from "@/lib/game/content";
import { THREAT_LABELS } from "@/lib/game/constants";
import type {
  EventChoice,
  EventEffect,
  GameEvent,
  ThreatId,
} from "@/lib/game/types";

/**
 * Content-driven balance guard: whatever the story says, the MATHS of the
 * threat economy must hold. Every threat needs enough relief in the pool to
 * be saveable, and some of that relief must be reachable without a flag
 * chain — otherwise a party that never finds the chain cannot fight at all.
 */

const THREAT_IDS = Object.keys(THREAT_LABELS) as ThreatId[];

function choiceBranches(c: EventChoice): EventEffect[] {
  if (c.check) return [c.pass, c.fail].filter(Boolean) as EventEffect[];
  if (c.random) return c.random.map((o) => o.effect).filter(Boolean);
  return c.effect ? [c.effect] : [];
}

function branches(ev: GameEvent): EventEffect[] {
  if (ev.choices) return ev.choices.flatMap(choiceBranches);
  if (ev.check) return [ev.pass, ev.fail].filter(Boolean) as EventEffect[];
  return ev.effect ? [ev.effect] : [];
}

/** The most relief one event can grant a threat (its best-case branch),
 * counted ONCE per event — most events are once-only. 0 if none. */
function bestRelief(ev: GameEvent, threat: ThreatId): number {
  let best = 0;
  for (const b of branches(ev)) {
    const delta = b.threats?.[threat] ?? 0;
    if (delta < best) best = delta;
  }
  return -best;
}

describe("threat economy balance", () => {
  it.each(THREAT_IDS)(
    "offers at least 4 points of total relief against %s",
    (threat) => {
      const total = EVENTS.reduce((sum, ev) => sum + bestRelief(ev, threat), 0);
      expect(
        total,
        `total best-case relief available against ${threat}`,
      ).toBeGreaterThanOrEqual(4);
    },
  );

  it.each(THREAT_IDS)(
    "keeps at least one %s relief branch reachable without a flag chain",
    (threat) => {
      const open = EVENTS.some(
        (ev) =>
          (ev.requires?.length ?? 0) === 0 &&
          branches(ev).some((b) => (b.threats?.[threat] ?? 0) < 0),
      );
      expect(
        open,
        `an unchained (no requires) relief branch exists for ${threat}`,
      ).toBe(true);
    },
  );
});
