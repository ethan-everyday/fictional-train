"use client";

/**
 * The ONLY module allowed to import playroomkit.
 *
 * Everything multiplayer goes through here so that if Playroom's pricing or
 * limits ever bite, the swap to Colyseus (or anything else) touches one file.
 * Components import hooks and actions from /lib/game, never from
 * "playroomkit" directly.
 */

import {
  getRoomCode,
  getState,
  insertCoin,
  myPlayer,
  resetPlayersStates,
  resetStates,
  setState,
  useMultiplayerState,
  usePlayersList,
  usePlayersState,
  usePlayerState,
  type PlayerState,
} from "playroomkit";

// Player-state keys. Keep them here so host and phone can't drift apart.
export const KEY_NAME = "name";
export const KEY_PING = "ping";
export const KEY_STATS = "stats";
export const KEY_FLAGS = "flags";
export const KEY_PICK = "pick";
export const KEY_RESULT = "result";
export const KEY_VOTE = "vote";
export const KEY_HISTORY = "history";

/** How long Playroom keeps a disconnected player's slot + state alive. */
const RECONNECT_GRACE_MS = 3 * 60 * 1000;

/** README says 2–6 phones; without this a 7th join degrades the pacing. */
const MAX_PLAYERS = 6;

/**
 * Playroom project id. Empty string = anonymous dev mode, which works but
 * carries dev branding/limits. Before a public release, register a free game
 * at dev.joinplayroom.com and paste its id here.
 */
const GAME_ID = "";

export interface Ping {
  count: number;
  at: number; // epoch ms of the latest ping
}

// insertCoin must only ever run once per page; React 18 strict mode and
// fast-refresh both re-run effects, so guard with a module-level promise.
let coinInserted: Promise<void> | null = null;

/**
 * Open a room as the host screen (the TV/laptop). The host is a "stream
 * screen", not a player: it never appears in the players list.
 * Pass a room code to rejoin an existing room after a host refresh.
 * Resolves to the room code phones use to join.
 */
export async function startHost(rejoinCode?: string): Promise<string> {
  if (!coinInserted) {
    coinInserted = insertCoin({
      gameId: GAME_ID || undefined,
      streamMode: true,
      skipLobby: true,
      roomCode: rejoinCode?.trim().toUpperCase() || undefined,
      reconnectGracePeriod: RECONNECT_GRACE_MS,
      maxPlayersPerRoom: MAX_PLAYERS,
    });
  }
  try {
    await coinInserted;
  } catch (err) {
    // A cached rejected promise would brick every retry until a reload.
    coinInserted = null;
    throw err;
  }
  const code = getRoomCode();
  if (!code) throw new Error("Playroom did not return a room code");
  return code;
}

/**
 * Join an existing room as a phone player. Safe to call after a phone
 * refresh: Playroom restores the same player slot within the grace period,
 * so existing stats/flags survive.
 */
export async function joinRoom(roomCode: string, name: string): Promise<void> {
  if (!coinInserted) {
    coinInserted = insertCoin({
      gameId: GAME_ID || undefined,
      skipLobby: true,
      roomCode: roomCode.trim().toUpperCase(),
      reconnectGracePeriod: RECONNECT_GRACE_MS,
      maxPlayersPerRoom: MAX_PLAYERS,
    });
  }
  try {
    await coinInserted;
  } catch (err) {
    // A cached rejected promise would brick every retry until a reload.
    coinInserted = null;
    throw err;
  }
  myPlayer().setState(KEY_NAME, name.trim(), true);
}

/**
 * Remove a player from the room (host action). Playroom drops their slot and
 * shared state; if their phone is still open it falls back to the join form.
 */
export async function kickPlayer(player: PlayerState): Promise<void> {
  await player.kick();
}

/** Send a PING from this phone; the host screen renders it. */
export function sendPing(): void {
  const prev = (myPlayer().getState(KEY_PING) as Ping | undefined) ?? {
    count: 0,
    at: 0,
  };
  myPlayer().setState(KEY_PING, { count: prev.count + 1, at: Date.now() }, true);
}

/** Display name for a player: chosen name, falling back to Playroom profile. */
export function playerName(player: PlayerState): string {
  return (
    (player.getState(KEY_NAME) as string | undefined) ||
    player.getProfile()?.name ||
    "???"
  );
}

// Fallback palette for players Playroom didn't assign a profile colour to.
// We join with skipLobby, which skips avatar selection, so getProfile().color
// can be undefined. Picked by a hash of the player id so a given player keeps
// the same colour across re-renders instead of flickering.
const FALLBACK_COLORS = [
  "#f59e0b", "#ef4444", "#10b981", "#3b82f6",
  "#a855f7", "#ec4899", "#14b8a6", "#f97316",
];

/** Profile colour Playroom assigned this player (hex string). */
export function playerColor(player: PlayerState): string {
  const fromProfile = player.getProfile()?.color?.hexString;
  if (fromProfile) return fromProfile;
  let hash = 0;
  for (const ch of player.id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

/** All connected players, re-rendering when any player's state changes. */
export function usePlayers(): PlayerState[] {
  return usePlayersList(true);
}

/** Every player's latest ping, for the host's ping feed. */
export function usePings(): { player: PlayerState; ping: Ping | null }[] {
  return usePlayersState(KEY_PING).map(({ player, state }) => ({
    player,
    ping: (state as Ping | undefined) ?? null,
  }));
}

// --- Shared (room-wide) state. The host writes, everyone reads. ---

export function useShared<T>(key: string, defaultValue: T) {
  return useMultiplayerState<T>(key, defaultValue);
}

export function getShared<T>(key: string): T | undefined {
  return getState(key) as T | undefined;
}

export function setShared<T>(key: string, value: T): void {
  setState(key, value, true);
}

// --- This phone's own player state. ---

/** Only call from components rendered after joinRoom resolved. */
export function useMyState<T>(key: string, defaultValue: T) {
  return usePlayerState<T>(myPlayer(), key, defaultValue);
}

export function getMyState<T>(key: string): T | undefined {
  return myPlayer().getState(key) as T | undefined;
}

export function setMyState<T>(key: string, value: T): void {
  myPlayer().setState(key, value, true);
}

export function getMyId(): string {
  return myPlayer().id;
}

/** Wipe all game state but keep player names; used by "back to lobby". */
export async function resetRoom(): Promise<void> {
  await resetStates();
  await resetPlayersStates([KEY_NAME]);
}

export type { PlayerState };
