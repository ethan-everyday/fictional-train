"use client";

/**
 * Client side of the self-hosted multiplayer: one WebSocket to the game
 * server (which runs on the host machine — start-game.bat, `node
 * server.js`, or the desktop app), a tiny synced store, and aggressive
 * auto-reconnect so Wi-Fi blips and refreshes self-heal.
 *
 * Only lib/game/connection.ts imports this.
 */

interface PlayerRecord {
  id: string;
  slot: number;
  connected: boolean;
  color: string;
  state: Record<string, unknown>;
}

type Json = unknown;

const DEV = process.env.NODE_ENV === "development";
/** Dev: `next dev` serves pages, the WS server runs separately on 3199. */
const DEV_WS_PORT = 3199;

function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return DEV
    ? `${proto}//${window.location.hostname}:${DEV_WS_PORT}/ws`
    : `${proto}//${window.location.host}/ws`;
}

// ------------------------------------------------------------------ store

class GameStore {
  version = 0;
  shared: Record<string, Json> = {};
  players = new Map<string, PlayerRecord>();
  myId: string | null = null;
  connectedToServer = false;

  private listeners = new Set<() => void>();
  private playersArrayCache: PlayerRecord[] = [];
  private playersArrayDirty = true;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getVersion = (): number => this.version;

  bump(): void {
    this.version++;
    this.playersArrayDirty = true;
    this.listeners.forEach((fn) => fn());
  }

  playersArray(): PlayerRecord[] {
    if (this.playersArrayDirty) {
      this.playersArrayCache = Array.from(this.players.values()).sort(
        (a, b) => a.slot - b.slot,
      );
      this.playersArrayDirty = false;
    }
    return this.playersArrayCache;
  }

  applySnapshot(msg: {
    shared: Record<string, Json>;
    players: {
      id: string;
      slot: number;
      connected: boolean;
      color: string;
      state: Record<string, unknown>;
    }[];
  }): void {
    this.shared = msg.shared ?? {};
    this.players = new Map(
      (msg.players ?? []).map((p) => [
        p.id,
        {
          id: p.id,
          slot: p.slot,
          connected: p.connected,
          color: p.color,
          state: p.state ?? {},
        },
      ]),
    );
    this.bump();
  }
}

export const store = new GameStore();

// -------------------------------------------------------------- transport

type Role =
  | { kind: "host"; rejoinCode?: string }
  | { kind: "player"; room: string; clientId: string; name: string };

let socket: WebSocket | null = null;
let desiredRole: Role | null = null;
let reconnectDelay = 500;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let closedForGood = false;

let resolveHello: ((value: string) => void) | null = null;
let rejectHello: ((err: Error) => void) | null = null;

function sendRaw(msg: Record<string, Json>): void {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
  }
}

function hello(): void {
  if (!desiredRole) return;
  if (desiredRole.kind === "host") {
    sendRaw({ t: "create", roomCode: desiredRole.rejoinCode });
  } else {
    sendRaw({
      t: "join",
      room: desiredRole.room,
      clientId: desiredRole.clientId,
      name: desiredRole.name,
    });
  }
}

function connect(): void {
  if (closedForGood) return;
  try {
    socket = new WebSocket(wsUrl());
  } catch (err) {
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    reconnectDelay = 500;
    hello();
  };

  socket.onmessage = (event) => {
    let msg: Record<string, never>;
    try {
      msg = JSON.parse(String(event.data));
    } catch {
      return;
    }
    handleMessage(msg as Record<string, never> & { t: string });
  };

  socket.onclose = () => {
    store.connectedToServer = false;
    store.bump();
    scheduleReconnect();
  };

  socket.onerror = () => {
    // onclose follows; reconnect is handled there.
  };
}

function scheduleReconnect(): void {
  if (closedForGood || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, 10_000);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function handleMessage(msg: any): void {
  switch (msg.t) {
    case "room": {
      store.connectedToServer = true;
      store.bump();
      resolveHello?.(String(msg.code));
      resolveHello = null;
      rejectHello = null;
      return;
    }
    case "joined": {
      store.connectedToServer = true;
      store.myId = String(msg.playerId);
      store.bump();
      resolveHello?.(String(msg.playerId));
      resolveHello = null;
      rejectHello = null;
      return;
    }
    case "snapshot": {
      store.applySnapshot(msg);
      return;
    }
    case "shared": {
      store.shared[msg.key] = msg.value;
      store.bump();
      return;
    }
    case "player": {
      const player = store.players.get(msg.id);
      if (player) {
        player.state[msg.key] = msg.value;
        store.bump();
      }
      return;
    }
    case "presence": {
      const existing = store.players.get(msg.id);
      if (existing) {
        existing.connected = Boolean(msg.connected);
      } else {
        store.players.set(msg.id, {
          id: msg.id,
          slot: Number(msg.slot) || 0,
          connected: Boolean(msg.connected),
          color: String(msg.color ?? "#f59e0b"),
          state: {},
        });
      }
      store.bump();
      return;
    }
    case "player-left": {
      store.players.delete(msg.id);
      store.bump();
      return;
    }
    case "kicked": {
      closedForGood = true;
      try {
        sessionStorage.removeItem("7n:player-id");
      } catch {}
      window.location.replace("/play?kicked=1");
      return;
    }
    case "error": {
      const err = new Error(String(msg.msg ?? msg.code ?? "server error"));
      if (rejectHello) {
        rejectHello(err);
        rejectHello = null;
        resolveHello = null;
        // The hello failed (bad room code etc.) — stop retrying this role.
        desiredRole = null;
      }
      return;
    }
    default:
      return;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Open (or reuse) the connection in a role; resolves with code/playerId. */
function establish(role: Role): Promise<string> {
  desiredRole = role;
  closedForGood = false;
  return new Promise<string>((resolve, reject) => {
    resolveHello = resolve;
    rejectHello = reject;
    if (socket && socket.readyState === WebSocket.OPEN) {
      hello();
    } else if (!socket || socket.readyState === WebSocket.CLOSED) {
      connect();
    }
    // CONNECTING/CLOSING: onopen/onclose paths take it from here.
  });
}

export function connectAsHost(rejoinCode?: string): Promise<string> {
  return establish({ kind: "host", rejoinCode });
}

export function connectAsPlayer(
  room: string,
  clientId: string,
  name: string,
): Promise<string> {
  return establish({ kind: "player", room, clientId, name });
}

// ------------------------------------------------- outgoing state writes

/** Host-only: write a shared key. Applied locally first (optimistic). */
export function writeShared(key: string, value: Json): void {
  store.shared[key] = value;
  store.bump();
  sendRaw({ t: "set-shared", key, value });
}

/** Write a player-state key (own id for phones; any id for the host). */
export function writePlayer(id: string, key: string, value: Json): void {
  const player = store.players.get(id);
  if (player) {
    player.state[key] = value;
    store.bump();
  }
  sendRaw({ t: "set-player", id, key, value });
}

export function sendKick(id: string): void {
  sendRaw({ t: "kick", id });
}

export function sendReset(keepPlayerKeys: string[]): void {
  // Optimistic local apply so the host's next writes layer on a clean slate.
  store.shared = {};
  store.players.forEach((player) => {
    const next: Record<string, unknown> = {};
    for (const key of keepPlayerKeys) {
      if (key in player.state) next[key] = player.state[key];
    }
    player.state = next;
  });
  store.bump();
  sendRaw({ t: "reset", keepPlayerKeys });
}
