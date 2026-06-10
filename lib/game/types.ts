// Shared vocabulary for the whole game. Keep this file dependency-free.

export type GamePhase =
  | "lobby"
  | "night-intro"
  | "choose-location"
  | "storylets"
  | "resolve"
  | "finale"
  | "epilogue";

export type LocationId =
  | "church"
  | "tavern"
  | "market"
  | "farms"
  | "castle"
  | "slums"
  | "docks";

export type StatId =
  | "intelligence"
  | "strength"
  | "agility"
  | "craft"
  | "will"
  | "wealth";

export interface PlayerStats {
  intelligence: number;
  strength: number;
  agility: number;
  craft: number;
  will: number;
  wealth: number;
}

/** A phone's location pick, tagged with the night so stale picks are ignored. */
export interface LocationPick {
  night: number;
  location: LocationId;
}

/** What a phone reports back after finishing its storylet. */
export interface StoryletResult {
  night: number;
  location: LocationId;
  /** One short line for the host resolve screen, written by Ink. */
  outcome: string;
  /** Stats after the storylet. */
  stats: PlayerStats;
  /** Stat change this storylet caused (for the +1 Charm toasts). */
  deltas: PlayerStats;
  /** Flags this storylet set. */
  flagsSet: string[];
}

/** One finished night, appended to the player's week history (the archive
 * behind the epilogue recap and the "visits" count fed back into ink). */
export interface NightRecord {
  night: number;
  location: LocationId;
  outcome: string;
  deltas: PlayerStats;
  flagsSet: string[];
}

/** A choice as rendered on the phone: ink choice + stat-gate metadata. */
export interface UiChoice {
  index: number;
  text: string;
  /** Set when the choice carries a "# needs: stat N" tag the player fails. */
  disabled: boolean;
  /** Human-readable requirement, e.g. "Needs Body 3". Shown even when met. */
  requirement: string | null;
}
