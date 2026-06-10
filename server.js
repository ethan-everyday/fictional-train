// Seven Nights game server — the whole multiplayer backend, self-hosted.
//
// One Node process does everything the Playroom cloud used to do, plus
// serving the game itself:
//   - serves the static Next export from /out (with Range support for audio)
//   - a WebSocket endpoint at /ws: rooms, shared state, per-player state,
//     kick, reset, reconnection
//   - room state persisted to disk, so even a server restart mid-game
//     recovers the night
//
// Modes:
//   node server.js          production: HTTP + WS on PORT (default 3100)
//   node server.js --dev    dev: WS only on 3199 (next dev serves the pages)
//
// CommonJS on purpose: runs with plain `node`, and the Electron main
// process can require() it directly.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const DEV = process.argv.includes("--dev");
const PORT = Number(process.env.PORT) || (DEV ? 3199 : 3100);
const OUT_DIR = path.join(__dirname, "out");

// Where room state persists. The desktop app overrides this via start()
// because a packaged app can't write inside its own bundle.
let stateFile = path.join(__dirname, ".seven-nights", "rooms.json");

/** How long a closed socket keeps its player marked connected (blip grace).
 * Env override exists so tests don't have to wait out the real grace. */
const DISCONNECT_DEBOUNCE_MS =
  Number(process.env.SEVEN_NIGHTS_DEBOUNCE_MS) || 8_000;
/** Idle rooms older than this are purged. */
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_PLAYERS = 6;
const MAX_MSG_BYTES = 64 * 1024;

const PLAYER_COLORS = [
  "#f59e0b", "#ef4444", "#10b981", "#3b82f6",
  "#a855f7", "#ec4899", "#14b8a6", "#f97316",
];

// ---------------------------------------------------------------- rooms

/**
 * rooms: Map<code, {
 *   code, createdAt, touchedAt,
 *   shared: Record<string, any>,
 *   players: Map<clientId, { id, slot, connected, state: Record<string, any> }>,
 *   sockets: Set<ws>            // every live socket in the room (host + phones)
 *   hostSockets: Set<ws>
 * }>
 */
const rooms = new Map();

function makeCode() {
  // No 0/O/1/I lookalikes; phones type this.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    if (!rooms.has(code)) return code;
  }
  throw new Error("could not allocate a room code");
}

function getOrCreateRoom(code) {
  let room = code ? rooms.get(code) : undefined;
  if (!room) {
    const newCode = code && /^[A-Z0-9]{4}$/.test(code) ? code : makeCode();
    room = {
      code: newCode,
      createdAt: Date.now(),
      touchedAt: Date.now(),
      shared: {},
      players: new Map(),
      sockets: new Set(),
      hostSockets: new Set(),
    };
    rooms.set(newCode, room);
  }
  room.touchedAt = Date.now();
  return room;
}

function roomSnapshot(room) {
  return {
    t: "snapshot",
    shared: room.shared,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      slot: p.slot,
      connected: p.connected,
      color: PLAYER_COLORS[p.slot % PLAYER_COLORS.length],
      state: p.state,
    })),
  };
}

function broadcast(room, msg, except) {
  const data = JSON.stringify(msg);
  for (const ws of room.sockets) {
    if (ws !== except && ws.readyState === ws.OPEN) ws.send(data);
  }
}

function presence(room, player) {
  broadcast(room, {
    t: "presence",
    id: player.id,
    slot: player.slot,
    connected: player.connected,
    color: PLAYER_COLORS[player.slot % PLAYER_COLORS.length],
  });
}

// ---------------------------------------------------------- persistence

let saveTimer = null;

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(stateFile), { recursive: true });
      const blob = [...rooms.values()].map((room) => ({
        code: room.code,
        createdAt: room.createdAt,
        touchedAt: room.touchedAt,
        shared: room.shared,
        players: [...room.players.entries()].map(([clientId, p]) => ({
          clientId,
          id: p.id,
          slot: p.slot,
          state: p.state,
        })),
      }));
      fs.writeFileSync(stateFile, JSON.stringify(blob));
    } catch (err) {
      console.warn("could not persist rooms:", err.message);
    }
  }, 500);
}

function loadRooms() {
  try {
    const blob = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    for (const r of blob) {
      if (Date.now() - r.touchedAt > ROOM_TTL_MS) continue;
      const room = {
        code: r.code,
        createdAt: r.createdAt,
        touchedAt: r.touchedAt,
        shared: r.shared ?? {},
        players: new Map(),
        sockets: new Set(),
        hostSockets: new Set(),
      };
      for (const p of r.players ?? []) {
        room.players.set(p.clientId, {
          id: p.id,
          slot: p.slot,
          connected: false, // nobody is attached after a restart
          state: p.state ?? {},
          disconnectTimer: null,
        });
      }
      rooms.set(room.code, room);
    }
    if (rooms.size > 0) {
      console.log(`restored ${rooms.size} room(s) from disk`);
    }
  } catch {
    // first boot or unreadable state: start clean
  }
}

setInterval(() => {
  for (const [code, room] of rooms) {
    if (Date.now() - room.touchedAt > ROOM_TTL_MS && room.sockets.size === 0) {
      rooms.delete(code);
    }
  }
  scheduleSave();
}, 60 * 60 * 1000).unref();

// ------------------------------------------------------------ protocol

function handleSocket(ws) {
  /** Set after hello: { room, role: "host" | "player", clientId } */
  let session = null;

  // Liveness for the heartbeat sweep: browsers answer protocol pings
  // automatically, so a socket that stops ponging is genuinely dead
  // (battery died, walked out of range) and gets terminated, which fires
  // the normal close/debounce path instead of blocking the night forever.
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (raw) => {
    ws.isAlive = true;
    if (raw.length > MAX_MSG_BYTES) return ws.close(1009, "too big");
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    try {
      handleMessage(ws, msg, session, (s) => (session = s));
    } catch (err) {
      console.error("message handling failed:", err);
      send(ws, { t: "error", code: "INTERNAL", msg: "server error" });
    }
  });

  ws.on("close", () => {
    if (!session) return;
    const { room, role, clientId } = session;
    room.sockets.delete(ws);
    room.hostSockets.delete(ws);
    if (role === "player") {
      const player = room.players.get(clientId);
      // Debounce: a refresh/blip reconnects within seconds; don't tell the
      // host the player left unless they actually stay gone.
      if (player && player.attachedSocket === ws) {
        player.attachedSocket = null;
        player.disconnectTimer = setTimeout(() => {
          // The player may have been kicked or replaced since the timer was
          // armed; never broadcast presence for an object no longer in the
          // room (it would resurrect a "???" ghost on every client).
          if (room.players.get(clientId) !== player) return;
          if (!player.attachedSocket) {
            player.connected = false;
            presence(room, player);
            scheduleSave();
          }
        }, DISCONNECT_DEBOUNCE_MS);
      }
    }
  });

  ws.on("error", () => {});
}

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function handleMessage(ws, msg, session, setSession) {
  // --- hello messages establish the session ---
  if (msg.t === "create") {
    const code =
      typeof msg.roomCode === "string"
        ? msg.roomCode.trim().toUpperCase()
        : undefined;
    const room = getOrCreateRoom(code || undefined);
    room.sockets.add(ws);
    room.hostSockets.add(ws);
    setSession({ room, role: "host", clientId: null });
    send(ws, { t: "room", code: room.code });
    send(ws, roomSnapshot(room));
    scheduleSave();
    return;
  }

  if (msg.t === "join") {
    const code = String(msg.room ?? "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return send(ws, {
        t: "error",
        code: "NO_ROOM",
        msg: "No room with that code — check the host screen.",
      });
    }
    const clientId = String(msg.clientId ?? "").slice(0, 64);
    if (!clientId) {
      return send(ws, { t: "error", code: "BAD_ID", msg: "Missing client id." });
    }
    let player = room.players.get(clientId);
    if (!player) {
      if (room.players.size >= MAX_PLAYERS) {
        return send(ws, {
          t: "error",
          code: "FULL",
          msg: `The room already has ${MAX_PLAYERS} players.`,
        });
      }
      const usedSlots = new Set([...room.players.values()].map((p) => p.slot));
      let slot = 0;
      while (usedSlots.has(slot)) slot++;
      player = {
        id: clientId,
        slot,
        connected: true,
        state: {},
        attachedSocket: null,
        disconnectTimer: null,
      };
      room.players.set(clientId, player);
    }
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
    player.connected = true;
    player.attachedSocket = ws;
    if (typeof msg.name === "string" && msg.name.trim()) {
      player.state.name = msg.name.trim().slice(0, 32);
    }
    room.sockets.add(ws);
    room.touchedAt = Date.now();
    setSession({ room, role: "player", clientId });
    send(ws, { t: "joined", playerId: player.id });
    send(ws, roomSnapshot(room));
    presence(room, player);
    // Make sure everyone has the (possibly fresh) name.
    broadcast(room, { t: "player", id: player.id, key: "name", value: player.state.name ?? null });
    scheduleSave();
    return;
  }

  // --- everything else requires a session ---
  if (!session) {
    return send(ws, { t: "error", code: "NO_SESSION", msg: "Say hello first." });
  }
  const { room, role, clientId } = session;
  room.touchedAt = Date.now();

  switch (msg.t) {
    case "set-shared": {
      if (role !== "host") return; // host-authoritative by design
      room.shared[String(msg.key)] = msg.value;
      broadcast(room, { t: "shared", key: String(msg.key), value: msg.value }, ws);
      scheduleSave();
      return;
    }
    case "set-player": {
      // A phone writes its own state; the host may write any player's.
      const targetId =
        role === "host" && typeof msg.id === "string" ? msg.id : clientId;
      const player = room.players.get(targetId);
      if (!player) return;
      player.state[String(msg.key)] = msg.value;
      broadcast(room, { t: "player", id: targetId, key: String(msg.key), value: msg.value }, ws);
      scheduleSave();
      return;
    }
    case "kick": {
      if (role !== "host") return;
      const player = room.players.get(String(msg.id));
      if (!player) return;
      // A pending disconnect-debounce timer must die with the player, or it
      // fires later and broadcasts presence for a ghost.
      if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer);
        player.disconnectTimer = null;
      }
      room.players.delete(String(msg.id));
      if (player.attachedSocket) {
        send(player.attachedSocket, { t: "kicked" });
        player.attachedSocket.close();
      }
      broadcast(room, { t: "player-left", id: player.id });
      scheduleSave();
      return;
    }
    case "reset": {
      if (role !== "host") return;
      const keep = Array.isArray(msg.keepPlayerKeys)
        ? msg.keepPlayerKeys.map(String)
        : [];
      room.shared = {};
      for (const player of room.players.values()) {
        const next = {};
        for (const key of keep) {
          if (key in player.state) next[key] = player.state[key];
        }
        player.state = next;
      }
      broadcast(room, roomSnapshot(room));
      scheduleSave();
      return;
    }
    case "ping": {
      send(ws, { t: "pong" });
      return;
    }
    default:
      return;
  }
}

// ------------------------------------------------------- static serving

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const candidates = [];
  if (clean === "/") {
    candidates.push("index.html");
  } else {
    const trimmed = clean.replace(/\/+$/, "");
    candidates.push(trimmed, `${trimmed}.html`, `${trimmed}/index.html`);
  }
  for (const candidate of candidates) {
    const full = path.normalize(path.join(OUT_DIR, candidate));
    if (!full.startsWith(OUT_DIR)) continue; // traversal guard
    try {
      const stat = fs.statSync(full);
      if (stat.isFile()) return { full, size: stat.size };
    } catch {
      /* try next */
    }
  }
  return null;
}

function serveStatic(req, res) {
  const found = resolveFile(req.url ?? "/");
  if (!found) {
    // SPA-ish fallback: unknown paths get the 404 page if present, else 404.
    const notFound = resolveFile("/404");
    if (notFound) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(notFound.full).pipe(res);
    } else {
      res.writeHead(404);
      res.end("not found");
    }
    return;
  }

  const type = MIME[path.extname(found.full).toLowerCase()] ?? "application/octet-stream";
  const range = req.headers.range;
  if (range) {
    // Single-range support, mainly so audio scrubbing/looping behaves.
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match) {
      let start = match[1] ? parseInt(match[1], 10) : 0;
      let end = match[2] ? parseInt(match[2], 10) : found.size - 1;
      if (start <= end && start < found.size) {
        end = Math.min(end, found.size - 1);
        res.writeHead(206, {
          "Content-Type": type,
          "Content-Length": end - start + 1,
          "Content-Range": `bytes ${start}-${end}/${found.size}`,
          "Accept-Ranges": "bytes",
        });
        fs.createReadStream(found.full, { start, end }).pipe(res);
        return;
      }
    }
  }
  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": found.size,
    "Accept-Ranges": "bytes",
  });
  fs.createReadStream(found.full).pipe(res);
}

// --------------------------------------------------------------- start

function start({ port = PORT, dev = DEV, stateDir } = {}) {
  if (stateDir) stateFile = path.join(stateDir, "rooms.json");
  loadRooms();

  const server = http.createServer((req, res) => {
    if (dev) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Seven Nights WS server (dev mode) — pages come from next dev.");
      return;
    }
    serveStatic(req, res);
  });

  const wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", handleSocket);

  // Heartbeat: terminate sockets that stop answering pings so abrupt phone
  // deaths surface within ~2x the interval instead of OS TCP timeouts
  // (minutes). terminate() emits 'close', which runs the normal debounce.
  const HEARTBEAT_MS = Number(process.env.SEVEN_NIGHTS_HEARTBEAT_MS) || 10_000;
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      try {
        ws.ping();
      } catch {}
    }
  }, HEARTBEAT_MS);
  heartbeat.unref();
  wss.on("close", () => clearInterval(heartbeat));

  server.listen(port, "0.0.0.0", () => {
    console.log(
      dev
        ? `Seven Nights WS server (dev) on ws://0.0.0.0:${port}/ws`
        : `Seven Nights server on http://0.0.0.0:${port} (WS at /ws)`,
    );
  });

  return { server, wss, rooms };
}

if (require.main === module) {
  start();
}

module.exports = { start, rooms };
