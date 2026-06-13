"use client";

/**
 * The turn machine: typed views over shared/player state, plus the host's
 * phase-transition actions. The host screen is the only caller of the
 * transition functions; phones only read.
 */

import {
  getShared,
  KEY_FLAGS,
  KEY_HISTORY,
  KEY_PICK,
  KEY_RESULT,
  KEY_STATS,
  KEY_VOTE,
  resetRoom,
  setShared,
  useShared,
  type PlayerState,
} from "./connection";
import {
  CHOOSE_SECONDS,
  DEFAULT_STATS,
  DRAMA_EVENTS,
  LOCATIONS,
  NIGHT_COUNT,
  type DramaEvent,
} from "./constants";
import type {
  GamePhase,
  LocationId,
  LocationPick,
  NightRecord,
  PlayerStats,
  StoryletResult,
} from "./types";

// Shared-state keys owned by the host.
const KEY_PHASE = "phase";
const KEY_NIGHT = "night";
const KEY_DEADLINE = "deadline";
const KEY_ASSIGNMENTS = "assignments";
const KEY_ENDING = "ending";
const KEY_EVENT = "event";

/** The drama event the host rolled for a night (or null = ordinary night). */
export interface ActiveEvent {
  id: string;
  night: number;
}

// --- Hooks (host and phones) ---

export function usePhase() {
  return useShared<GamePhase>(KEY_PHASE, "lobby");
}

export function useNight() {
  return useShared<number>(KEY_NIGHT, 1);
}

/** Epoch ms when the choose-location soft timer expires. */
export function useDeadline() {
  return useShared<number>(KEY_DEADLINE, 0);
}

/** playerId -> location for the current night; null until the host locks. */
export function useAssignments() {
  return useShared<Record<string, LocationId> | null>(KEY_ASSIGNMENTS, null);
}

/** Finale paragraphs, written once by the host so they survive refreshes. */
export function useEnding() {
  return useShared<string[] | null>(KEY_ENDING, null);
}

/**
 * The full DramaEvent definition active for the given night, or null.
 * (Shared state stores only {id, night}; the definition lives in constants.)
 */
export function useActiveEvent(night: number): DramaEvent | null {
  const [active] = useShared<ActiveEvent | null>(KEY_EVENT, null);
  if (!active || active.night !== night) return null;
  return DRAMA_EVENTS.find((e) => e.id === active.id) ?? null;
}

// --- Reading other players' state (host screens mostly) ---

export function playerStats(p: PlayerState): PlayerStats {
  return (p.getState(KEY_STATS) as PlayerStats | undefined) ?? DEFAULT_STATS;
}

export function playerFlags(p: PlayerState): string[] {
  return (p.getState(KEY_FLAGS) as string[] | undefined) ?? [];
}

export function playerPick(p: PlayerState, night: number): LocationId | null {
  const pick = p.getState(KEY_PICK) as LocationPick | undefined;
  return pick && pick.night === night ? pick.location : null;
}

export function playerResult(
  p: PlayerState,
  night: number,
): StoryletResult | null {
  const result = p.getState(KEY_RESULT) as StoryletResult | undefined;
  return result && result.night === night ? result : null;
}

export function playerVote(p: PlayerState): string | null {
  return (p.getState(KEY_VOTE) as string | undefined) ?? null;
}

/** The player's finished nights, oldest first. */
export function playerHistory(p: PlayerState): NightRecord[] {
  const history = (p.getState(KEY_HISTORY) as NightRecord[] | undefined) ?? [];
  return [...history].sort((a, b) => a.night - b.night);
}

// --- Host transitions ---

/** The party's average stats; the finale and drama triggers both use this. */
export function averageStats(all: PlayerStats[]): PlayerStats {
  const n = Math.max(1, all.length);
  const out = { ...DEFAULT_STATS };
  for (const stat of Object.keys(out) as (keyof PlayerStats)[]) {
    const sum = all.reduce((acc, s) => acc + (s[stat] ?? 0), 0);
    out[stat] = Math.round(sum / n);
  }
  return out;
}

/** Set up a week's shared state (assignments, deadline, drama event, number)
 * without choosing the phase — callers pick prologue vs night-intro. */
function setupWeek(night: number, players: PlayerState[]): void {
  setShared(KEY_ASSIGNMENTS, null);
  // Clear the old deadline too: if a write arrives out of order, a phone
  // could briefly see choose-location with last week's expired timer.
  setShared(KEY_DEADLINE, 0);
  // Roll the week's drama event off the party's average stats.
  const avg = averageStats(players.map(playerStats));
  const event =
    players.length > 0
      ? DRAMA_EVENTS.find((e) => night >= e.minNight && e.trigger(avg)) ?? null
      : null;
  setShared(KEY_EVENT, event ? { id: event.id, night } : null);
  setShared(KEY_NIGHT, night);
}

/** Once everyone has built a character, set up week 1 and play the TOWN
 * prologue (arriving at St Sebastian). The SETTING prologue — the 1348 doom
 * and the Herald's vision — plays earlier, on the lobby, during selection. */
export function startGame(players: PlayerState[]): void {
  setupWeek(1, players);
  setShared(KEY_PHASE, "prologue");
}

/** Leave the town prologue and begin week 1 proper. */
export function beginAfterPrologue(): void {
  setShared(KEY_PHASE, "night-intro");
}

export function beginNightIntro(night: number, players: PlayerState[]): void {
  setupWeek(night, players);
  setShared(KEY_PHASE, "night-intro");
}

export function beginChooseLocation(): void {
  setShared(KEY_DEADLINE, Date.now() + CHOOSE_SECONDS * 1000);
  setShared(KEY_PHASE, "choose-location");
}

/**
 * Lock in everyone's locations and start the storylets. Players who never
 * picked get a random location rather than sitting the night out. A drama
 * event's closed location is never assigned, even if somehow picked.
 */
export function beginStorylets(players: PlayerState[], night: number): void {
  const active = getShared<ActiveEvent | null>(KEY_EVENT) ?? null;
  const closed =
    active && active.night === night
      ? DRAMA_EVENTS.find((e) => e.id === active.id)?.closedLocation ?? null
      : null;
  const open = LOCATIONS.filter((l) => l.id !== closed);
  const assignments: Record<string, LocationId> = {};
  for (const p of players) {
    const pick = playerPick(p, night);
    assignments[p.id] =
      (pick !== null && pick !== closed ? pick : null) ??
      open[Math.floor(Math.random() * open.length)].id;
  }
  setShared(KEY_ASSIGNMENTS, assignments);
  setShared(KEY_PHASE, "storylets");
}

export function beginResolve(): void {
  setShared(KEY_PHASE, "resolve");
}

export function endNight(night: number, players: PlayerState[]): void {
  if (night >= NIGHT_COUNT) {
    setShared(KEY_PHASE, "finale");
  } else {
    beginNightIntro(night + 1, players);
  }
}

export function publishEnding(paragraphs: string[]): void {
  setShared(KEY_ENDING, paragraphs);
}

export function getPublishedEnding(): string[] | null {
  return getShared<string[] | null>(KEY_ENDING) ?? null;
}

export function beginEpilogue(): void {
  setShared(KEY_PHASE, "epilogue");
}

export async function backToLobby(): Promise<void> {
  await resetRoom();
  setShared(KEY_NIGHT, 1);
  setShared(KEY_ENDING, null);
  setShared(KEY_ASSIGNMENTS, null);
  setShared(KEY_EVENT, null);
  setShared(KEY_PHASE, "lobby");
}
