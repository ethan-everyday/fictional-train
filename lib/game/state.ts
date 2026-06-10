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
import { CHOOSE_SECONDS, DEFAULT_STATS, LOCATIONS, NIGHT_COUNT } from "./constants";
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

export function startGame(): void {
  beginNightIntro(1);
}

export function beginNightIntro(night: number): void {
  setShared(KEY_ASSIGNMENTS, null);
  // Clear the old deadline too: if Playroom delivers these writes out of
  // order, a phone could briefly see choose-location with last night's
  // expired timer.
  setShared(KEY_DEADLINE, 0);
  setShared(KEY_NIGHT, night);
  setShared(KEY_PHASE, "night-intro");
}

export function beginChooseLocation(): void {
  setShared(KEY_DEADLINE, Date.now() + CHOOSE_SECONDS * 1000);
  setShared(KEY_PHASE, "choose-location");
}

/**
 * Lock in everyone's locations and start the storylets. Players who never
 * picked get a random location rather than sitting the night out.
 */
export function beginStorylets(players: PlayerState[], night: number): void {
  const assignments: Record<string, LocationId> = {};
  for (const p of players) {
    assignments[p.id] =
      playerPick(p, night) ??
      LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)].id;
  }
  setShared(KEY_ASSIGNMENTS, assignments);
  setShared(KEY_PHASE, "storylets");
}

export function beginResolve(): void {
  setShared(KEY_PHASE, "resolve");
}

export function endNight(night: number): void {
  if (night >= NIGHT_COUNT) {
    setShared(KEY_PHASE, "finale");
  } else {
    beginNightIntro(night + 1);
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
  setShared(KEY_PHASE, "lobby");
}
