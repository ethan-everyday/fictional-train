"use client";

/**
 * The ONLY module allowed to import playroomkit.
 *
 * Everything multiplayer goes through here so that if Playroom's pricing or
 * limits ever bite, the swap to Colyseus (or anything else) touches one file.
 * Components import hooks and actions from this module, never from
 * "playroomkit" directly.
 */

import {
  getRoomCode,
  insertCoin,
  myPlayer,
  usePlayersList,
  usePlayersState,
  type PlayerState,
} from "playroomkit";

// Player-state keys. Keep them here so host and phone can't drift apart.
const KEY_NAME = "name";
const KEY_PING = "ping";

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
 * Resolves to the room code phones use to join.
 */
export async function startHost(): Promise<string> {
  if (!coinInserted) {
    coinInserted = insertCoin({ streamMode: true, skipLobby: true });
  }
  await coinInserted;
  const code = getRoomCode();
  if (!code) throw new Error("Playroom did not return a room code");
  return code;
}

/**
 * Join an existing room as a phone player.
 */
export async function joinRoom(roomCode: string, name: string): Promise<void> {
  if (!coinInserted) {
    coinInserted = insertCoin({
      skipLobby: true,
      roomCode: roomCode.trim().toUpperCase(),
    });
  }
  await coinInserted;
  myPlayer().setState(KEY_NAME, name.trim(), true);
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
    player.getProfile().name ||
    "???"
  );
}

/** Profile colour Playroom assigned this player (hex string). */
export function playerColor(player: PlayerState): string {
  return player.getProfile().color.hexString;
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

export type { PlayerState };
