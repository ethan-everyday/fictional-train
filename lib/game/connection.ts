"use client";

/**
 * The ONLY module components use for multiplayer.
 *
 * Backed by the self-hosted game server (server.js) over a WebSocket — no
 * third-party cloud, no internet required. Phones and the host all talk to
 * the machine running the game. If Wi-Fi blips, the socket reconnects and
 * re-syncs automatically.
 */

import { useCallback, useSyncExternalStore } from "react";
import {
  connectAsHost,
  connectAsPlayer,
  sendKick,
  sendReset,
  store,
  writePlayer,
  writeShared,
} from "./socket";

// Player-state keys. Keep them here so host and phone can't drift apart.
export const KEY_NAME = "name";
export const KEY_PING = "ping";
export const KEY_STATS = "stats";
export const KEY_FLAGS = "flags";
export const KEY_PICK = "pick";
export const KEY_RESULT = "result";
export const KEY_VOTE = "vote";
export const KEY_HISTORY = "history";
export const KEY_CHARACTER = "character";

export interface Ping {
  count: number;
  at: number; // epoch ms of the latest ping
}

// Fallback palette in case a player record arrives without a colour.
const FALLBACK_COLORS = [
  "#f59e0b", "#ef4444", "#10b981", "#3b82f6",
  "#a855f7", "#ec4899", "#14b8a6", "#f97316",
];

// ------------------------------------------------------------ PlayerState

/**
 * What components see as "a player". Mirrors the old Playroom surface
 * (id / getState / getProfile / kick) so the rest of the app didn't have
 * to change when the backend did.
 */
export class PlayerState {
  constructor(
    public readonly id: string,
    private readonly read: () => {
      slot: number;
      connected: boolean;
      color: string;
      state: Record<string, unknown>;
    } | null,
  ) {}

  getState(key: string): unknown {
    return this.read()?.state[key];
  }

  getProfile(): { name?: string; color?: { hexString: string } } {
    const record = this.read();
    return { color: { hexString: record?.color ?? FALLBACK_COLORS[0] } };
  }

  get connected(): boolean {
    return this.read()?.connected ?? false;
  }

  async kick(): Promise<void> {
    sendKick(this.id);
  }
}

const shimCache = new Map<string, PlayerState>();

function shim(id: string): PlayerState {
  let cached = shimCache.get(id);
  if (!cached) {
    cached = new PlayerState(id, () => store.players.get(id) ?? null);
    shimCache.set(id, cached);
  }
  return cached;
}

// ------------------------------------------------------------------ hooks

/** Re-render whenever anything in the synced store changes. */
function useStoreVersion(): number {
  return useSyncExternalStore(
    store.subscribe,
    store.getVersion,
    () => 0,
  );
}

/** True while the socket to the game server is open. */
export function useServerConnection(): boolean {
  useStoreVersion();
  return store.connectedToServer;
}

/**
 * The base URL phones must use to join — built from the LAN IP the server
 * reported, NOT from how this page happens to be open (localhost in the
 * desktop app). The QR must just work.
 */
export function useJoinBase(): string {
  useStoreVersion();
  if (store.lanIp) {
    const port = window.location.port ? `:${window.location.port}` : "";
    return `${window.location.protocol}//${store.lanIp}${port}`;
  }
  return window.location.origin;
}

// ------------------------------------------------------------ connecting

/**
 * Open a room as the host screen (the TV/laptop). The host is a screen,
 * not a player: it never appears in the players list.
 * Pass a room code to rejoin an existing room after a host refresh.
 * `freshGame` = the title screen's NEW GAME: the server closes every other
 * room, so no phone can linger in (or auto-rejoin) an old game.
 */
export async function startHost(
  rejoinCode?: string,
  freshGame = false,
): Promise<string> {
  return connectAsHost(rejoinCode?.trim().toUpperCase() || undefined, freshGame);
}

/** This phone's stable-for-the-session identity (survives refresh). */
function myClientId(): string {
  try {
    let id = sessionStorage.getItem("7n:player-id");
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `p-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
      sessionStorage.setItem("7n:player-id", id);
    }
    return id;
  } catch {
    return `p-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

/**
 * Join a room as a phone player. Safe to call after a phone refresh: the
 * per-tab identity reattaches to the same player slot, so existing
 * stats/flags/history survive.
 */
export async function joinRoom(roomCode: string, name: string): Promise<void> {
  await connectAsPlayer(
    roomCode.trim().toUpperCase(),
    myClientId(),
    name.trim(),
  );
}

/** Remove a player from the room (host action). */
export async function kickPlayer(player: PlayerState): Promise<void> {
  await player.kick();
}

// -------------------------------------------------------------- players

/** Send a PING from this phone; the host screen renders it. */
export function sendPing(): void {
  const id = store.myId;
  if (!id) return;
  const prev =
    (store.players.get(id)?.state[KEY_PING] as Ping | undefined) ?? {
      count: 0,
      at: 0,
    };
  writePlayer(id, KEY_PING, { count: prev.count + 1, at: Date.now() });
}

/** Display name for a player. */
export function playerName(player: PlayerState): string {
  return (player.getState(KEY_NAME) as string | undefined) || "???";
}

/** The colour the server assigned this player (hex string). */
export function playerColor(player: PlayerState): string {
  const fromRecord = player.getProfile()?.color?.hexString;
  if (fromRecord) return fromRecord;
  let hash = 0;
  for (const ch of player.id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

/** Whether this player's phone is currently attached to the server. */
export function playerConnected(player: PlayerState): boolean {
  return player.connected;
}

/** All players, re-rendering when any player's state changes. */
export function usePlayers(): PlayerState[] {
  useStoreVersion();
  return store.playersArray().map((record) => shim(record.id));
}

/** Every player's latest ping, for the host's lobby feed. */
export function usePings(): { player: PlayerState; ping: Ping | null }[] {
  useStoreVersion();
  return store.playersArray().map((record) => ({
    player: shim(record.id),
    ping: (record.state[KEY_PING] as Ping | undefined) ?? null,
  }));
}

// --- Shared (room-wide) state. The host writes, everyone reads. ---

export function useShared<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  useStoreVersion();
  const value = (store.shared[key] as T | undefined) ?? defaultValue;
  const set = useCallback((next: T) => writeShared(key, next), [key]);
  return [value, set];
}

export function getShared<T>(key: string): T | undefined {
  return store.shared[key] as T | undefined;
}

export function setShared<T>(key: string, value: T): void {
  writeShared(key, value);
}

// --- This phone's own player state. ---

/** Only call from components rendered after joinRoom resolved. */
export function useMyState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  useStoreVersion();
  const id = store.myId;
  const value =
    id !== null
      ? ((store.players.get(id)?.state[key] as T | undefined) ?? defaultValue)
      : defaultValue;
  const set = useCallback(
    (next: T) => {
      if (store.myId) writePlayer(store.myId, key, next);
    },
    [key],
  );
  return [value, set];
}

export function getMyState<T>(key: string): T | undefined {
  const id = store.myId;
  if (!id) return undefined;
  return store.players.get(id)?.state[key] as T | undefined;
}

export function setMyState<T>(key: string, value: T): void {
  if (store.myId) writePlayer(store.myId, key, value);
}

export function getMyId(): string {
  return store.myId ?? "";
}

/** Wipe a week's state but keep player names and their built characters,
 * so "play another week" replays with the same people. */
export async function resetRoom(): Promise<void> {
  sendReset([KEY_NAME, KEY_CHARACTER]);
}
