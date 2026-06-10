import type { LocationId, PlayerStats, StatId } from "./types";

export const NIGHT_COUNT = 7;

/** Soft timer for the choose-location round. */
export const CHOOSE_SECONDS = 60;

/** How long the night title card stays up before choosing begins. */
export const NIGHT_INTRO_MS = 4500;

/** Pace of the resolve screen: one player's outcome revealed per beat. */
export const RESOLVE_BEAT_MS = 4000;

export const DEFAULT_STATS: PlayerStats = {
  mind: 2,
  body: 2,
  charm: 2,
  shadow: 0,
};

/**
 * Stats clamp to 0..STAT_CAP (enforced by the ink engine on the way out).
 * Gate escalation convention: "needs 3" early week, "needs 4" behind
 * {night >= 4} choices, "needs 5" behind {night >= 6} — so growth stays
 * meaningful all seven nights. The validator rejects gates above the cap.
 */
export const STAT_CAP = 5;

export const STAT_LABELS: Record<StatId, string> = {
  mind: "Mind",
  body: "Body",
  charm: "Charm",
  shadow: "Shadow",
};

export interface LocationDef {
  id: LocationId;
  name: string;
  blurb: string;
  /** Ink knot that plays when a player spends the night here. */
  knot: string;
}

export const LOCATIONS: LocationDef[] = [
  { id: "tavern", name: "The Crooked Lantern", blurb: "Cider, gossip, debts.", knot: "storylet_tavern" },
  { id: "church", name: "The Old Church", blurb: "Candles and confessions.", knot: "storylet_church" },
  { id: "market", name: "The Night Market", blurb: "Everything has a price.", knot: "storylet_market" },
  { id: "woods", name: "The Whispering Woods", blurb: "Paths that move.", knot: "storylet_woods" },
  { id: "harbor", name: "The Harbor", blurb: "Salt, rope, smugglers.", knot: "storylet_harbor" },
  { id: "manor", name: "The Vane Manor", blurb: "Lights in empty rooms.", knot: "storylet_manor" },
];

export function locationDef(id: LocationId): LocationDef {
  const def = LOCATIONS.find((l) => l.id === id);
  if (!def) throw new Error(`Unknown location: ${id}`);
  return def;
}

/**
 * Party-level drama events. Evaluated by the host at each night-intro
 * against the party's AVERAGE stats; the first match (in order) wins and
 * the night gets a different title card, an optional closed location, and
 * an `event` id visible to ink ({event == "dark_tide": ...}).
 */
export interface DramaEvent {
  id: string;
  /** Earliest night this can fire (events are a mid/late-week thing). */
  minNight: number;
  trigger: (avg: PlayerStats) => boolean;
  /** Replaces nightIntro() on the title card. */
  introOverride: string;
  /** This location can't be visited tonight. */
  closedLocation?: LocationId;
}

export const DRAMA_EVENTS: DramaEvent[] = [
  {
    id: "dark_tide",
    minNight: 4,
    trigger: (avg) => avg.shadow >= 3,
    introOverride:
      "The tide has come up the channel black and wrong, and the harbor bell is ringing with nobody at the rope. No boats tonight. No harbor tonight.",
    closedLocation: "harbor",
  },
  {
    id: "lantern_festival",
    minNight: 3,
    trigger: (avg) => avg.charm >= 4,
    introOverride:
      "Somebody strung lanterns across the square at dusk, and the whole village came out to stand under them. Tonight, Hollowbrook almost lets itself be happy.",
  },
];

/** One flavour line per night for the title card. Index = night - 1. */
export const NIGHT_INTROS: string[] = [
  "The village of Hollowbrook settles in for the week. Seven nights. Make them count.",
  "Word travels fast in a small place. Last night's choices are already someone's gossip.",
  "Halfway to nowhere. The stranger at the tavern has started paying in silver.",
  "A cold wind off the harbor tonight. The dogs won't stop barking at the manor.",
  "The church bell rang thirteen times at dusk. Nobody wants to talk about it.",
  "One night left after this. Whatever you've been putting off, it's now or never.",
  "The seventh night. Hollowbrook holds its breath.",
];

export function nightIntro(night: number): string {
  return NIGHT_INTROS[night - 1] ?? `Night ${night} falls on Hollowbrook.`;
}
