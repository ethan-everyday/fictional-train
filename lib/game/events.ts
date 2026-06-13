import type {
  Activity,
  EventEffect,
  GameEvent,
  LocationId,
  PlayerStats,
  StatId,
} from "./types";
import { STAT_CAP } from "./constants";
import { ACTIVITIES, EVENTS, fallbackEvent } from "./content";

/**
 * The event engine: pure functions that decide what happens when a player
 * does an activity. No ink, no cloud — just data and deterministic rules.
 *
 *  - Activities are the 2–4 things you can do at a location (no stat gates
 *    are ever shown).
 *  - Doing one draws a random ELIGIBLE event from that location's pool.
 *    Eligibility chains the week together: an event's `requires`/`forbids`
 *    flags gate it on what has (or hasn't) happened before, here or
 *    elsewhere (meet the steward at the tavern → audience at the castle).
 *  - Stats never appear as requirements. They tilt hidden `check`s inside
 *    events, deciding pass/fail behind the curtain.
 */

const STAT_IDS: StatId[] = [
  "intelligence",
  "strength",
  "agility",
  "craft",
  "will",
  "wealth",
];

export function activitiesFor(location: LocationId): Activity[] {
  return ACTIVITIES.filter((a) => a.location === location);
}

export function activityDef(id: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}

export function eventById(id: string): GameEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

/**
 * Every event that could fire for this activity given what's happened.
 * `flags` = story flags the player carries; `seen` = event ids already fired
 * this week (so once-only events don't repeat).
 */
export function eligibleEvents(
  location: LocationId,
  activityId: string,
  flags: Iterable<string>,
  seen: Iterable<string>,
): GameEvent[] {
  const flagSet = new Set(flags);
  const seenSet = new Set(seen);
  return EVENTS.filter((e) => {
    if (e.location !== location) return false;
    if (e.activities.length > 0 && !e.activities.includes(activityId)) {
      return false;
    }
    if (!e.repeatable && seenSet.has(e.id)) return false;
    if (e.requires && !e.requires.every((f) => flagSet.has(f))) return false;
    if (e.forbids && e.forbids.some((f) => flagSet.has(f))) return false;
    return true;
  });
}

// --- Seeded RNG so a phone refresh re-selects the SAME event ----------

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable seed for one player's choice on one night — survives refresh. */
export function selectionSeed(
  playerId: string,
  night: number,
  activityId: string,
): number {
  return hashString(`${playerId}|${night}|${activityId}`);
}

/**
 * Pick the event that fires. Weighted-random among eligible events using the
 * stable seed; falls back to the location's "quiet night" if nothing is
 * eligible. Never returns null.
 */
export function pickEvent(
  location: LocationId,
  activityId: string,
  flags: Iterable<string>,
  seen: Iterable<string>,
  seed: number,
): GameEvent {
  const candidates = eligibleEvents(location, activityId, flags, seen);
  if (candidates.length === 0) return fallbackEvent(location, activityId);

  const total = candidates.reduce((sum, e) => sum + (e.weight ?? 1), 0);
  const roll = mulberry32(seed)() * total;
  let acc = 0;
  for (const e of candidates) {
    acc += e.weight ?? 1;
    if (roll < acc) return e;
  }
  return candidates[candidates.length - 1];
}

// --- Resolution -------------------------------------------------------

/** Does this event's hidden check pass for these stats? */
export function checkPasses(event: GameEvent, stats: PlayerStats): boolean {
  if (!event.check) return true;
  return (stats[event.check.stat] ?? 0) >= event.check.dc;
}

/**
 * The effect that applies, given the event, the player's stats, and (for
 * choice events) which option they took. Returns null only if the event
 * needs a choice that hasn't been made yet.
 */
export function resolveEffect(
  event: GameEvent,
  stats: PlayerStats,
  chosenIndex?: number,
): EventEffect | null {
  if (event.choices && event.choices.length > 0) {
    if (chosenIndex === undefined) return null;
    return event.choices[chosenIndex]?.effect ?? null;
  }
  if (event.check) {
    return checkPasses(event, stats) ? (event.pass ?? null) : (event.fail ?? null);
  }
  return event.effect ?? null;
}

/** Apply an effect's stat deltas (clamped) and return new stats + the delta. */
export function applyEffect(
  stats: PlayerStats,
  effect: EventEffect,
): { stats: PlayerStats; deltas: PlayerStats } {
  const next = {} as PlayerStats;
  const deltas = {} as PlayerStats;
  for (const stat of STAT_IDS) {
    const raw = (stats[stat] ?? 0) + (effect.stats?.[stat] ?? 0);
    next[stat] = Math.max(0, Math.min(STAT_CAP, raw));
    deltas[stat] = next[stat] - (stats[stat] ?? 0);
  }
  return { stats: next, deltas };
}
