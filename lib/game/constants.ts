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
