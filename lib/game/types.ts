// Shared vocabulary for the whole game. Keep this file dependency-free.

export type GamePhase =
  | "lobby"
  | "prologue"
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

// ---------------------------------------------------------- character

export type RoleId =
  | "knight"
  | "scholar"
  | "merchant"
  | "outlaw"
  | "cleric"
  | "smith";

export type BackgroundId =
  | "noble"
  | "peasant"
  | "foreigner"
  | "orphan"
  | "guild"
  | "soldier";

/** A role or background: a name, flavour, and the stat bonuses it grants. */
export interface OriginDef<Id extends string> {
  id: Id;
  name: string;
  blurb: string;
  /** Stat bonuses added on top of the floor (any subset of stats). */
  bonus: Partial<PlayerStats>;
  /** A story flag the character starts the week already carrying. */
  startFlag?: string;
}

export type RoleDef = OriginDef<RoleId>;
export type BackgroundDef = OriginDef<BackgroundId>;

/** The character a player built at the start. Null until they pick. */
export interface Character {
  role: RoleId;
  background: BackgroundId;
}

// ----------------------------------------------------------- threats

/**
 * The four dooms bearing down on St Sebastian. Each ticks up as the weeks
 * pass; events relieve (negative deltas) or feed (positive) them. Any that
 * reaches the cap by the finale claims its toll on the town's ending.
 */
export type ThreatId = "plague" | "starvation" | "war" | "devils";

/** The town's current score on every threat track (0..THREAT_CAP). */
export type ThreatScores = Record<ThreatId, number>;

/** What one event branch does to the tracks. Negative = the party relieves
 * the threat; positive = recklessness feeds it. */
export type ThreatDeltas = Partial<Record<ThreatId, number>>;

// ------------------------------------------------------------ events

/** A thing you can choose to do at a location. NEVER shows stat gates. */
export interface Activity {
  id: string;
  location: LocationId;
  name: string;
  blurb: string;
}

/** A hidden stat check: the event branches pass/fail on stat >= dc. */
export interface StatCheck {
  stat: StatId;
  dc: number;
}

/** The result of an event branch: prose, a host line, and what it changes. */
export interface EventEffect {
  /** Prose shown to the player for this branch. */
  text: string;
  /** One short line for the host resolve screen: "<name> <outcome>". */
  outcome: string;
  /** Stat deltas to apply (any subset). */
  stats?: Partial<PlayerStats>;
  /** Flags set true — these unlock later events across the week. */
  flags?: string[];
  /** Threat deltas this branch applies to the town's tracks. */
  threats?: ThreatDeltas;
}

/** One weighted outcome inside a choice's `random` pool (weight default 1). */
export interface RandomOutcome {
  weight?: number;
  effect: EventEffect;
}

/**
 * A player-facing choice within an event. The label never reveals stats.
 * Exactly ONE of three shapes (contract-enforced, like GameEvent itself):
 * a flat `effect`, a hidden `check` with `pass`/`fail`, or a weighted
 * `random` pool the dice settle.
 */
export interface EventChoice {
  label: string;
  /** A flat, deterministic outcome. */
  effect?: EventEffect;
  /** Hidden stat check — branches on stats exactly like an event's check. */
  check?: StatCheck;
  pass?: EventEffect;
  fail?: EventEffect;
  /** Weighted random outcomes (2+); the engine rolls, refresh-stable. */
  random?: RandomOutcome[];
}

/**
 * A random event that can fire when a player does an activity. One of three
 * shapes: a flat `effect`, a hidden `check` (pass/fail), or player `choices`.
 * `requires`/`forbids` chain events together across locations and nights.
 */
export interface GameEvent {
  id: string;
  location: LocationId;
  /** Activity ids that can trigger it; empty = any activity at the location. */
  activities: string[];
  /** All these flags must be set for the event to be eligible. */
  requires?: string[];
  /** If any of these flags are set, the event is ineligible. */
  forbids?: string[];
  /** Can fire more than once across the week? Default false (once only). */
  repeatable?: boolean;
  /** Earliest week (1–7) this can fire. Omit = from the start. */
  minWeek?: number;
  /** Latest week (1–7) this can fire. Omit = until the end. */
  maxWeek?: number;
  /** Relative selection weight among eligible events (default 1). */
  weight?: number;
  /** Setup prose, shown before any branch or choice. */
  text: string;

  // Exactly one of the following three resolution shapes:
  /** Hidden stat check; with `pass` and `fail`. */
  check?: StatCheck;
  pass?: EventEffect;
  fail?: EventEffect;
  /** A player choice (2–3 options). */
  choices?: EventChoice[];
  /** A flat, deterministic outcome. */
  effect?: EventEffect;
}

// --------------------------------------------------------- networking

/** A phone's location pick, tagged with the night so stale picks are ignored. */
export interface LocationPick {
  night: number;
  location: LocationId;
}

/** What a phone reports back after finishing its night. */
export interface StoryletResult {
  night: number;
  location: LocationId;
  /** The activity the player chose. */
  activity: string;
  /** The event that fired (id), for de-duping and the epilogue. */
  eventId: string;
  /** One short line for the host resolve screen. */
  outcome: string;
  /** Stats after the night. */
  stats: PlayerStats;
  /** Stat change this night caused (for the +1 toasts). */
  deltas: PlayerStats;
  /** Flags this night set. */
  flagsSet: string[];
  /** Threat deltas this night's outcome applies to the town. */
  threats?: ThreatDeltas;
}

/** One finished night, appended to the player's week history. */
export interface NightRecord {
  night: number;
  location: LocationId;
  activity: string;
  eventId: string;
  outcome: string;
  deltas: PlayerStats;
  flagsSet: string[];
  /** Threat deltas this night carried (for the host's ledger). */
  threats?: ThreatDeltas;
}
