import type { LocationId, PlayerStats, StatId } from "./types";

export const NIGHT_COUNT = 7;

/** Soft timer for the choose-location round. */
export const CHOOSE_SECONDS = 60;

/** How long the night title card stays up before choosing begins. */
export const NIGHT_INTRO_MS = 4500;

/** Pace of the resolve screen: one player's outcome revealed per beat. */
export const RESOLVE_BEAT_MS = 4000;

// Everyone starts a capable nobody; Wealth starts low so coin is earned.
export const DEFAULT_STATS: PlayerStats = {
  intelligence: 2,
  strength: 2,
  agility: 2,
  craft: 2,
  will: 2,
  wealth: 1,
};

/**
 * Stats clamp to 0..STAT_CAP (enforced by the ink engine on the way out).
 * Gate escalation convention: "needs 3" early week, "needs 4" behind
 * {night >= 4} choices, "needs 5" behind {night >= 6} — so growth stays
 * meaningful all seven nights. The validator rejects gates above the cap.
 */
export const STAT_CAP = 5;

export const STAT_LABELS: Record<StatId, string> = {
  intelligence: "Intelligence",
  strength: "Strength",
  agility: "Agility",
  craft: "Craft",
  will: "Will",
  wealth: "Wealth",
};

/** Compact labels for the phone stats bar (six stats is a tight fit). */
export const STAT_SHORT: Record<StatId, string> = {
  intelligence: "Int",
  strength: "Str",
  agility: "Agi",
  craft: "Craft",
  will: "Will",
  wealth: "Gold",
};

export interface LocationDef {
  id: LocationId;
  name: string;
  blurb: string;
  /** Ink knot that plays when a player spends the night here. */
  knot: string;
}

export const LOCATIONS: LocationDef[] = [
  { id: "church", name: "The Church", blurb: "The priest, the candles, the tithe.", knot: "storylet_church" },
  { id: "tavern", name: "The Tavern", blurb: "The innkeep pours, the gamblers deal.", knot: "storylet_tavern" },
  { id: "market", name: "The Market", blurb: "Butcher, armourer, and every stall between.", knot: "storylet_market" },
  { id: "farms", name: "The Farms", blurb: "Harvest hands wanted; the reeve is counting.", knot: "storylet_farms" },
  { id: "castle", name: "The Castle", blurb: "The lord's hall, if they'll let you in.", knot: "storylet_castle" },
  { id: "slums", name: "The Slums", blurb: "Crowded, cold, and nobody lies to you here.", knot: "storylet_slums" },
  { id: "docks", name: "The Docks", blurb: "Foreign traders, heavy cargo, loose talk.", knot: "storylet_docks" },
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
    id: "kings_levy",
    minNight: 4,
    trigger: (avg) => avg.wealth >= 3,
    introOverride:
      "Word of the village's good fortune has travelled. The King's levy men ride in at dusk and shut the castle gates behind them — the lord is counting coin tonight, and so is everyone who has any.",
    closedLocation: "castle",
  },
  {
    id: "fair_eve",
    minNight: 3,
    trigger: (avg) => avg.craft >= 4,
    introOverride:
      "The first fair wagons rolled in early, and the whole village smells of sawdust, pitch, and roasting nuts. Tonight Hollowbrook works late and gladly.",
  },
];

/** One flavour line per night for the title card. Index = night - 1.
 * The week's arc: seven nights until the Michaelmas Fair, when the lord
 * reckons accounts — debts called in, fortunes made, reputations fixed. */
export const NIGHT_INTROS: string[] = [
  "Seven nights until the Michaelmas Fair, when the lord reckons all accounts. The village of Hollowbrook sharpens its knives and its manners.",
  "Word travels fast in a small place. Last night's business is already this morning's gossip at the well.",
  "The first fair wagons are a day out, they say. Prices in the market have started to drift upward accordingly.",
  "The Shire Reeve has begun his rounds with the big ledger. People are suddenly remembering debts they meant to settle.",
  "A ship from foreign parts tied up at the docks at dusk and is unloading by torchlight. The castle has noticed.",
  "One night left before fair's eve. Whatever you've been putting off, it's now or never.",
  "The seventh night. Tomorrow the lord holds court at the fair, and the whole week is weighed.",
];

export function nightIntro(night: number): string {
  return NIGHT_INTROS[night - 1] ?? `Night ${night} falls on Hollowbrook.`;
}
