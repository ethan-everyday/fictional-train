import type {
  LocationId,
  PlayerStats,
  StatId,
  ThreatId,
  ThreatScores,
} from "./types";

export const NIGHT_COUNT = 7;

/** Soft timer for the choose-location round. */
export const CHOOSE_SECONDS = 60;

/** How long the night title card stays up before choosing begins. */
export const NIGHT_INTRO_MS = 4500;

/** Pace of the resolve screen: one player's outcome revealed per beat. */
export const RESOLVE_BEAT_MS = 4000;

// Fallback stats for a player who somehow reaches the game without having
// built a character. Real starting stats come from role + background
// (see lib/game/character.ts).
export const DEFAULT_STATS: PlayerStats = {
  intelligence: 2,
  strength: 2,
  agility: 2,
  craft: 2,
  will: 2,
  wealth: 1,
};

/**
 * Stats clamp to 0..STAT_CAP. Base stats land roughly 1–6 from role +
 * background; seven nights of gains push a focused stat toward the ceiling.
 * Hidden event checks (StatCheck.dc) must stay within this range — the
 * content validator rejects any dc above the cap.
 */
export const STAT_CAP = 10;

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

// ----------------------------------------------------------- threats

/** Threat tracks clamp to 0..THREAT_CAP. A track at the cap when the finale
 * comes means that doom lands on the town in full. */
export const THREAT_CAP = 10;

/**
 * How much every threat rises when a week ARRIVES (index = week - 1).
 * Untouched, a track runs 0,1,2,4,6,9,13→10 — a slow first fortnight, then
 * the world ends in a hurry. A threat needs net -3 of relief across the
 * game to stay under the cap.
 */
export const THREAT_TICKS = [0, 1, 1, 2, 2, 3, 4];

export const THREAT_LABELS: Record<ThreatId, string> = {
  plague: "Plague",
  starvation: "Starvation",
  war: "War",
  devils: "Devils",
};

/** One grim line per track for the host screen. */
export const THREAT_BLURBS: Record<ThreatId, string> = {
  plague: "The sick go untended, and the carts grow heavier by the week.",
  starvation: "No one has sorted the food, and the town's bellies know it.",
  war: "The warband draws closer, and the town is not ready to meet it.",
  devils: "Something with red eyes is taking root in the dark of St Sebastian.",
};

export const ZERO_THREATS: ThreatScores = {
  plague: 0,
  starvation: 0,
  war: 0,
  devils: 0,
};

export interface LocationDef {
  id: LocationId;
  name: string;
  blurb: string;
}

/**
 * A location's NAME and BLURB are content: each location JSON may carry a
 * `meta: { name, blurb }` block, which content/index.ts registers here at
 * import time (overwriting the fallbacks below in place, so every consumer
 * — LOCATIONS.map, locationDef — sees the content's words). The LIST of
 * locations, though, is game code: adding or removing one means the
 * LocationId union, this array, content/index.ts, the host UI, and the
 * editor server's whitelist. See README "Adding a location".
 */
export const LOCATIONS: LocationDef[] = [
  { id: "church", name: "The Church", blurb: "The priest preaches God's wrath; the dead need burying." },
  { id: "tavern", name: "The Tavern", blurb: "Panic, rumour, and deserters who can still hold a blade." },
  { id: "market", name: "The Market", blurb: "Hoarders, bare stalls, and what little food is left." },
  { id: "farms", name: "The Farms", blurb: "A failing harvest and the roads the warband will come down." },
  { id: "castle", name: "The Castle", blurb: "The lord behind his walls, if they'll let you in." },
  { id: "slums", name: "The Slums", blurb: "Where the sickness strikes first and the desperate gather." },
  { id: "docks", name: "The Docks", blurb: "Refugees, the sick off the boats, and the last ship out." },
];

export function registerLocationMeta(
  id: LocationId,
  meta: { name?: string; blurb?: string },
): void {
  const def = LOCATIONS.find((l) => l.id === id);
  if (!def) return;
  if (meta.name && meta.name.trim()) def.name = meta.name;
  if (meta.blurb !== undefined) def.blurb = meta.blurb;
}

export function locationDef(id: LocationId): LocationDef {
  const def = LOCATIONS.find((l) => l.id === id);
  // Degrade, never throw: a location id from a stale save (an older build's
  // room) must not crash a phone mid-party. The prose shows the raw id.
  return def ?? { id, name: String(id).replace(/_/g, " "), blurb: "" };
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
    id: "the_warband_nears",
    minNight: 6,
    trigger: () => true,
    introOverride:
      "Scouts ride in white-faced: the warband is a day closer than anyone hoped — a tattered mass of dying, desperate men who burn what they cannot eat. The roads belong to them now. The farms are no place to be this week.",
    closedLocation: "farms",
  },
  {
    id: "the_castle_shuts",
    minNight: 5,
    trigger: (avg) => avg.will < 3,
    introOverride:
      "The lord has heard enough. The castle gates are barred from within, guests turned away at spear-point, the great hall gone dark. Whatever help was to come from that quarter is not coming this week.",
    closedLocation: "castle",
  },
];

/** One line per week for the title card (index = week - 1). The arc: seven
 * weeks for fugitives to save St Sebastian — or flee it — as plague, famine,
 * and a warband close in and the world ends. */
export const NIGHT_INTROS: string[] = [
  "Your ship makes the dock at St Sebastian. The town bustles, blissfully unaware of the devastation creeping closer day by day.",
  "Whispers of a great destruction spread through the streets. The priest calls it God's wrath for sinners abroad; the lord says foreign wars are no concern of a town with strong walls and a stronger garrison.",
  "Fewer traders come, and those who do are desperate to leave again. A plume of smoke stands on the horizon, and messengers ride at breakneck speed toward the castle.",
  "The smoke has not lifted. In the markets and taverns they speak of a strange sickness taking the poor — and word of it has reached the great lord himself.",
  "The first death: blood pouring from the eyes and mouth, an awful drowning death. A band of horsemen is sighted, their purpose unknown. The castle turns guests away. Panic sets in.",
  "The dead are carted to pits beyond the walls, refugees wait at the gate, and the markets are bare. A great warband crawls over the horizon — a tattered mass of dying men, vicious and desperate. One last ship remains.",
  "The warband is at the gate. The dead lie in the streets, the castle is shut, the last ship slips its moorings. Behind barred doors, St Sebastian steals a few more hours of calm before the dark washes over it.",
];

export function nightIntro(night: number): string {
  return NIGHT_INTROS[night - 1] ?? `Week ${night} falls on St Sebastian.`;
}
