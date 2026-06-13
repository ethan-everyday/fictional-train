// Seven Nights story editor — dev tool, never shipped.
//
//   npm run editor   →   http://localhost:4100
//
// Reads and writes the location content JSON in lib/game/content/data, the
// same files the game imports. Validates against the content contract before
// writing, so the editor can never save a story that fails the build.

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.EDITOR_PORT) || 4100;
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "lib", "game", "content", "data");
const ORIGINS_FILE = path.join(DATA_DIR, "origins.json");
const EDITOR_HTML = path.join(__dirname, "editor.html");

const LOCATIONS = [
  "church",
  "tavern",
  "market",
  "farms",
  "castle",
  "slums",
  "docks",
];
const STAT_IDS = [
  "intelligence",
  "strength",
  "agility",
  "craft",
  "will",
  "wealth",
];
const STAT_CAP = 10;

// --- content contract (mirror of tests/content.test.ts) -------------

function producibleFlags(locations, origins) {
  const flags = new Set();
  const addEffect = (e) => e && e.flags && e.flags.forEach((f) => flags.add(f));
  for (const loc of Object.values(locations)) {
    for (const ev of loc.events ?? []) {
      addEffect(ev.effect);
      addEffect(ev.pass);
      addEffect(ev.fail);
      (ev.choices ?? []).forEach((c) => addEffect(c.effect));
    }
  }
  // Origin start-flags the character can begin the week carrying.
  for (const o of [...(origins?.roles ?? []), ...(origins?.backgrounds ?? [])]) {
    if (o.startFlag) flags.add(o.startFlag);
  }
  return flags;
}

function branches(ev) {
  if (ev.choices) return ev.choices.map((c) => c.effect).filter(Boolean);
  if (ev.check) return [ev.pass, ev.fail].filter(Boolean);
  return ev.effect ? [ev.effect] : [];
}

function validate(locations, origins) {
  const errors = [];
  const allEvents = [];
  const allActivities = [];
  for (const [loc, content] of Object.entries(locations)) {
    (content.activities ?? []).forEach((a) => allActivities.push({ ...a, loc }));
    (content.events ?? []).forEach((e) => allEvents.push({ ...e, loc }));
    const n = (content.activities ?? []).length;
    if (n < 2 || n > 4) errors.push(`${loc}: must have 2–4 activities (has ${n})`);
  }

  const eventIds = allEvents.map((e) => e.id);
  if (new Set(eventIds).size !== eventIds.length) {
    errors.push("duplicate event ids exist");
  }
  const activityIds = allActivities.map((a) => a.id);
  if (new Set(activityIds).size !== activityIds.length) {
    errors.push("duplicate activity ids exist");
  }

  // Origins: the game assumes exactly 6 roles and 6 backgrounds.
  if (origins) {
    if ((origins.roles ?? []).length !== 6) errors.push(`must have exactly 6 roles (has ${(origins.roles ?? []).length})`);
    if ((origins.backgrounds ?? []).length !== 6) errors.push(`must have exactly 6 backgrounds (has ${(origins.backgrounds ?? []).length})`);
    for (const o of [...(origins.roles ?? []), ...(origins.backgrounds ?? [])]) {
      if (!o.name || !o.name.trim()) errors.push(`an origin (${o.id || "?"}) has no name`);
      for (const stat of Object.keys(o.bonus ?? {})) {
        if (!STAT_IDS.includes(stat)) errors.push(`origin ${o.id}: unknown stat "${stat}"`);
      }
    }
  }

  const producible = producibleFlags(locations, origins);

  for (const ev of allEvents) {
    if (ev.location !== ev.loc) {
      errors.push(`${ev.id}: location "${ev.location}" doesn't match its file (${ev.loc})`);
    }
    const localActs = allActivities
      .filter((a) => a.loc === ev.loc)
      .map((a) => a.id);
    for (const act of ev.activities ?? []) {
      if (!localActs.includes(act)) {
        errors.push(`${ev.id}: references activity "${act}" not in ${ev.loc}`);
      }
    }
    const shapes = [
      Boolean(ev.effect),
      Boolean(ev.check),
      Boolean(ev.choices && ev.choices.length > 0),
    ].filter(Boolean).length;
    if (shapes !== 1) {
      errors.push(`${ev.id}: must have exactly one resolution shape (has ${shapes})`);
    }
    if (ev.minWeek !== undefined && !(ev.minWeek >= 1 && ev.minWeek <= 7)) {
      errors.push(`${ev.id}: minWeek out of range 1–7`);
    }
    if (ev.maxWeek !== undefined && !(ev.maxWeek >= 1 && ev.maxWeek <= 7)) {
      errors.push(`${ev.id}: maxWeek out of range 1–7`);
    }
    if (ev.minWeek !== undefined && ev.maxWeek !== undefined && ev.minWeek > ev.maxWeek) {
      errors.push(`${ev.id}: minWeek after maxWeek`);
    }
    if (ev.check) {
      if (!STAT_IDS.includes(ev.check.stat)) {
        errors.push(`${ev.id}: check uses unknown stat "${ev.check.stat}"`);
      }
      if (!(ev.check.dc >= 1 && ev.check.dc <= STAT_CAP)) {
        errors.push(`${ev.id}: dc ${ev.check.dc} out of range 1–${STAT_CAP}`);
      }
      if (!ev.pass || !ev.fail) errors.push(`${ev.id}: check needs both pass and fail`);
    }
    if (!ev.text || !ev.text.trim()) errors.push(`${ev.id}: empty setup text`);
    for (const b of branches(ev)) {
      if (!b.text || !b.text.trim()) errors.push(`${ev.id}: a branch has empty text`);
      if (!b.outcome || !b.outcome.trim()) errors.push(`${ev.id}: a branch has empty outcome`);
      for (const stat of Object.keys(b.stats ?? {})) {
        if (!STAT_IDS.includes(stat)) errors.push(`${ev.id}: effect touches unknown stat "${stat}"`);
      }
    }
    for (const f of ev.requires ?? []) {
      if (!producible.has(f)) errors.push(`${ev.id}: requires "${f}" which nothing ever sets (orphan prerequisite)`);
    }
    for (const f of ev.forbids ?? []) {
      if (!producible.has(f)) errors.push(`${ev.id}: forbids "${f}" which is never set (typo?)`);
    }
  }
  return errors;
}

// --- io --------------------------------------------------------------

function readContent() {
  const out = {};
  for (const loc of LOCATIONS) {
    const file = path.join(DATA_DIR, `${loc}.json`);
    out[loc] = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return out;
}

function readOrigins() {
  return JSON.parse(fs.readFileSync(ORIGINS_FILE, "utf8"));
}

function writeContent(locations, origins) {
  for (const loc of LOCATIONS) {
    if (!locations[loc]) continue;
    const file = path.join(DATA_DIR, `${loc}.json`);
    fs.writeFileSync(file, JSON.stringify(locations[loc], null, 2) + "\n");
  }
  if (origins) {
    fs.writeFileSync(ORIGINS_FILE, JSON.stringify(origins, null, 2) + "\n");
  }
}

// --- server ----------------------------------------------------------

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "Content-Type": type });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    return send(res, 200, fs.readFileSync(EDITOR_HTML, "utf8"), "text/html; charset=utf-8");
  }
  if (req.method === "GET" && req.url === "/api/content") {
    try {
      const locations = readContent();
      const origins = readOrigins();
      return send(res, 200, { locations, origins, stats: STAT_IDS, statCap: STAT_CAP });
    } catch (err) {
      return send(res, 500, { error: String(err.message ?? err) });
    }
  }
  if (req.method === "POST" && req.url === "/api/content") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      let locations, origins;
      try {
        const parsed = JSON.parse(raw);
        locations = parsed.locations;
        origins = parsed.origins;
      } catch {
        return send(res, 400, { error: "bad JSON" });
      }
      const errors = validate(locations, origins);
      if (errors.length) return send(res, 400, { errors });
      try {
        writeContent(locations, origins);
        return send(res, 200, { ok: true });
      } catch (err) {
        return send(res, 500, { error: String(err.message ?? err) });
      }
    });
    return;
  }
  send(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`\n  Seven Nights story editor → http://localhost:${PORT}\n`);
});
