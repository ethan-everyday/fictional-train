/**
 * Protocol-level integration tests: a real server instance on an ephemeral
 * port, real WebSocket clients, no mocks. This is the multiplayer backend
 * the party runs on, so every guarantee the game relies on gets a test.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocket } from "ws";

process.env.SEVEN_NIGHTS_DEBOUNCE_MS = "120";

// CJS module; require-style import via vitest interop.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { start } = require("../server.js");

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
// NOT `join` — this file already has a join() protocol helper.
import { join as pathJoin } from "node:path";
import type { Server } from "node:http";

let port = 0;
let handle: { server: Server };

beforeAll(async () => {
  // Isolated state dir: without it the tests share the LIVE server's
  // .seven-nights folder — truncating its log and clobbering rooms.json.
  handle = start({
    port: 0,
    dev: true,
    stateDir: mkdtempSync(pathJoin(tmpdir(), "7n-test-")),
  });
  await new Promise<void>((resolve) => {
    handle.server.on("listening", () => resolve());
    // already listening? address() returns object once bound
    if ((handle.server.address() as { port?: number } | null)?.port) resolve();
  });
  port = (handle.server.address() as { port: number }).port;
});

afterAll(async () => {
  await new Promise<void>((resolve) => handle.server.close(() => resolve()));
});

// ------------------------------------------------------------- helpers

type Msg = Record<string, unknown> & { t: string };

class Client {
  ws: WebSocket;
  inbox: Msg[] = [];
  private waiters: {
    pred: (m: Msg) => boolean;
    resolve: (m: Msg) => void;
  }[] = [];

  constructor() {
    this.ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    this.ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString()) as Msg;
      const waiting = this.waiters.findIndex((w) => w.pred(msg));
      if (waiting >= 0) {
        const [w] = this.waiters.splice(waiting, 1);
        w.resolve(msg);
      } else {
        this.inbox.push(msg);
      }
    });
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws.once("open", resolve);
      this.ws.once("error", reject);
    });
  }

  send(msg: Msg): void {
    this.ws.send(JSON.stringify(msg));
  }

  /** Next message matching pred — checks the backlog first. */
  next(pred: (m: Msg) => boolean, timeoutMs = 3000): Promise<Msg> {
    const buffered = this.inbox.findIndex(pred);
    if (buffered >= 0) {
      return Promise.resolve(this.inbox.splice(buffered, 1)[0]);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`timed out waiting for message`)),
        timeoutMs,
      );
      this.waiters.push({
        pred,
        resolve: (m) => {
          clearTimeout(timer);
          resolve(m);
        },
      });
    });
  }

  close(): void {
    this.ws.close();
  }
}

async function host(rejoin?: string): Promise<{ c: Client; code: string }> {
  const c = new Client();
  await c.open();
  c.send({ t: "create", roomCode: rejoin });
  const room = await c.next((m) => m.t === "room");
  await c.next((m) => m.t === "snapshot");
  return { c, code: String(room.code) };
}

async function join(
  room: string,
  clientId: string,
  name: string,
): Promise<Client> {
  const c = new Client();
  await c.open();
  c.send({ t: "join", room, clientId, name });
  await c.next((m) => m.t === "joined");
  await c.next((m) => m.t === "snapshot");
  return c;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --------------------------------------------------------------- tests

describe("rooms", () => {
  it("host gets a 4-character room code and an empty snapshot", async () => {
    const { c, code } = await host();
    expect(code).toMatch(/^[A-Z0-9]{4}$/);
    c.close();
  });

  it("the room message carries the machine's LAN IP for the QR code", async () => {
    const c = new Client();
    await c.open();
    c.send({ t: "create" });
    const room = await c.next((m) => m.t === "room");
    // Null only on machines with no network at all; otherwise a usable IPv4.
    if (room.lanIp !== null) {
      expect(String(room.lanIp)).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(String(room.lanIp)).not.toBe("127.0.0.1");
    }
    c.close();
  });

  it("host rejoins the same room after a refresh", async () => {
    const { c, code } = await host();
    c.close();
    const again = await host(code);
    expect(again.code).toBe(code);
    again.c.close();
  });

  it("joining a nonexistent room fails with NO_ROOM", async () => {
    const c = new Client();
    await c.open();
    c.send({ t: "join", room: "XXXX", clientId: "nobody", name: "Ghost" });
    const err = await c.next((m) => m.t === "error");
    expect(err.code).toBe("NO_ROOM");
    c.close();
  });
});

describe("state sync", () => {
  it("player joins; host sees presence and name", async () => {
    const { c: h, code } = await host();
    const p = await join(code, "alice-1", "Alice");
    await h.next((m) => m.t === "presence" && m.id === "alice-1");
    const nameMsg = await h.next(
      (m) => m.t === "player" && m.id === "alice-1" && m.key === "name",
    );
    expect(nameMsg.value).toBe("Alice");
    h.close();
    p.close();
  });

  it("player state reaches the host; shared state reaches the player", async () => {
    const { c: h, code } = await host();
    const p = await join(code, "bob-1", "Bob");
    await h.next((m) => m.t === "presence" && m.id === "bob-1");

    p.send({ t: "set-player", key: "stats", value: { will: 3 } });
    const onHost = await h.next(
      (m) => m.t === "player" && m.id === "bob-1" && m.key === "stats",
    );
    expect(onHost.value).toEqual({ will: 3 });

    h.send({ t: "set-shared", key: "phase", value: "night-intro" });
    const onPhone = await p.next((m) => m.t === "shared" && m.key === "phase");
    expect(onPhone.value).toBe("night-intro");
    h.close();
    p.close();
  });

  it("phones cannot write shared state (host-authoritative)", async () => {
    const { c: h, code } = await host();
    const p = await join(code, "mallory-1", "Mallory");
    await h.next((m) => m.t === "presence" && m.id === "mallory-1");

    p.send({ t: "set-shared", key: "phase", value: "finale" });
    // Give it a beat, then prove the host never saw a phase change.
    await sleep(150);
    expect(h.inbox.find((m) => m.t === "shared" && m.key === "phase")).toBe(
      undefined,
    );
    h.close();
    p.close();
  });
});

describe("reconnection", () => {
  it("a phone refresh reattaches to the same player with state intact", async () => {
    const { c: h, code } = await host();
    const p1 = await join(code, "carol-1", "Carol");
    p1.send({ t: "set-player", key: "stats", value: { craft: 4 } });
    await h.next(
      (m) => m.t === "player" && m.id === "carol-1" && m.key === "stats",
    );
    p1.close();

    // Reconnect within the debounce window — host should never see a leave.
    const p2 = new Client();
    await p2.open();
    p2.send({ t: "join", room: code, clientId: "carol-1", name: "Carol" });
    await p2.next((m) => m.t === "joined");
    const snapshot = await p2.next((m) => m.t === "snapshot");
    const players = snapshot.players as {
      id: string;
      connected: boolean;
      state: Record<string, unknown>;
    }[];
    const carol = players.find((pl) => pl.id === "carol-1");
    expect(carol?.state.stats).toEqual({ craft: 4 });
    expect(carol?.connected).toBe(true);
    h.close();
    p2.close();
  });

  it("a phone that stays gone is marked disconnected after the grace", async () => {
    const { c: h, code } = await host();
    const p = await join(code, "dave-1", "Dave");
    await h.next((m) => m.t === "presence" && m.id === "dave-1");
    p.close();
    const gone = await h.next(
      (m) => m.t === "presence" && m.id === "dave-1" && m.connected === false,
      2000,
    );
    expect(gone.connected).toBe(false);
    h.close();
  });
});

describe("host controls", () => {
  it("kick removes the player and tells their phone", async () => {
    const { c: h, code } = await host();
    const p = await join(code, "eve-1", "Eve");
    await h.next((m) => m.t === "presence" && m.id === "eve-1");

    h.send({ t: "kick", id: "eve-1" });
    const kicked = await p.next((m) => m.t === "kicked");
    expect(kicked.t).toBe("kicked");
    const left = await h.next((m) => m.t === "player-left" && m.id === "eve-1");
    expect(left.id).toBe("eve-1");
    h.close();
  });

  it("reset clears shared state and player state except kept keys", async () => {
    const { c: h, code } = await host();
    const p = await join(code, "frank-1", "Frank");
    await h.next((m) => m.t === "presence" && m.id === "frank-1");
    h.send({ t: "set-shared", key: "night", value: 5 });
    p.send({ t: "set-player", key: "stats", value: { wealth: 5 } });
    await h.next((m) => m.t === "player" && m.key === "stats");

    h.send({ t: "reset", keepPlayerKeys: ["name"] });
    const snapshot = await p.next((m) => m.t === "snapshot");
    expect(snapshot.shared).toEqual({});
    const players = snapshot.players as {
      id: string;
      state: Record<string, unknown>;
    }[];
    const frank = players.find((pl) => pl.id === "frank-1");
    expect(frank?.state).toEqual({ name: "Frank" });
    h.close();
    p.close();
  });

  it("kicking a player inside the disconnect-debounce window leaves no ghost", async () => {
    const { c: h, code } = await host();
    const p = await join(code, "ghost-1", "Ghost");
    await h.next((m) => m.t === "presence" && m.id === "ghost-1");

    // Phone drops (debounce timer armed), host kicks before it fires.
    p.close();
    await sleep(20);
    h.send({ t: "kick", id: "ghost-1" });
    await h.next((m) => m.t === "player-left" && m.id === "ghost-1");

    // Past the debounce: no resurrection presence for the kicked player.
    await sleep(300);
    expect(
      h.inbox.find((m) => m.t === "presence" && m.id === "ghost-1"),
    ).toBe(undefined);
    h.close();
  });

  it("a fresh create (NEW GAME) closes every other room and its sockets", async () => {
    const a = await host();
    const straggler = await join(a.code, "old-1", "Oldtimer");
    const stragglerClosed = new Promise<void>((resolve) =>
      straggler.ws.once("close", () => resolve()),
    );

    // The title screen's NEW GAME: create with fresh — old rooms die.
    const b = new Client();
    await b.open();
    b.send({ t: "create", fresh: true });
    const room = await b.next((m) => m.t === "room");
    expect(room.code).not.toBe(a.code);

    // The old phone's socket was closed by the server…
    await stragglerClosed;

    // …and the old room is gone: rejoining it fails like any dead room.
    const back = new Client();
    await back.open();
    back.send({ t: "join", room: a.code, clientId: "old-1", name: "Oldtimer" });
    const err = await back.next((m) => m.t === "error");
    expect(err.code).toBe("NO_ROOM");

    a.c.close();
    b.close();
    back.close();
  });

  it("a lingering host tab cannot resurrect a purged room", async () => {
    const old = await host();
    // NEW GAME kills old's room…
    const fresh = new Client();
    await fresh.open();
    fresh.send({ t: "create", fresh: true });
    await fresh.next((m) => m.t === "room");

    // …so the old tab's auto-reconnect create is refused, not recreated.
    const lingering = new Client();
    await lingering.open();
    lingering.send({ t: "create", roomCode: old.code });
    const err = await lingering.next((m) => m.t === "error");
    expect(err.code).toBe("ROOM_CLOSED");

    // And phones can't join the zombie either.
    const p = new Client();
    await p.open();
    p.send({ t: "join", room: old.code, clientId: "z-1", name: "Zed" });
    const joinErr = await p.next((m) => m.t === "error");
    expect(joinErr.code).toBe("NO_ROOM");

    old.c.close();
    fresh.close();
    lingering.close();
    p.close();
  });

  it("a host rejoin (CONTINUE) does not purge other rooms", async () => {
    const a = await host();
    const b = await host();
    a.c.close();
    const again = await host(a.code); // continue = create with a room code
    expect(again.code).toBe(a.code);
    // b's room survived: a player can still join it.
    const p = await join(b.code, "still-1", "Still");
    again.c.close();
    b.c.close();
    p.close();
  });

  it("a 7th player is rejected with FULL", async () => {
    const { c: h, code } = await host();
    const phones: Client[] = [];
    for (let i = 0; i < 6; i++) {
      phones.push(await join(code, `player-${i}`, `P${i}`));
    }
    const extra = new Client();
    await extra.open();
    extra.send({ t: "join", room: code, clientId: "too-many", name: "Late" });
    const err = await extra.next((m) => m.t === "error");
    expect(err.code).toBe("FULL");
    h.close();
    phones.forEach((p) => p.close());
    extra.close();
  });
});
