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
const EDITOR_HTML = path.join(__dirname, "editor.html");

// Dirs resolve per call so tests can point the editor at a sandbox copy
// (EDITOR_DATA_DIR / EDITOR_BACKUP_DIR) without touching the real story.
function dataDir() {
  return process.env.EDITOR_DATA_DIR || path.join(ROOT, "lib", "game", "content", "data");
}
function backupRoot() {
  return process.env.EDITOR_BACKUP_DIR || path.join(ROOT, ".seven-nights", "editor-backups");
}
function originsFile() {
  return path.join(dataDir(), "origins.json");
}

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
// The four town threats (mirror of ThreatId in lib/game/types.ts). Any
// effect may carry "threats": deltas keyed by these ids, non-zero integers
// in -2..+2 (negative = the party relieves the threat).
const THREAT_IDS = ["plague", "starvation", "war", "devils"];

// --- content contract (mirror of tests/content.test.ts) -------------

function producibleFlags(locations, origins) {
  const flags = new Set();
  const addEffect = (e) => e && e.flags && e.flags.forEach((f) => flags.add(f));
  for (const loc of Object.values(locations)) {
    for (const ev of loc.events ?? []) {
      addEffect(ev.effect);
      addEffect(ev.pass);
      addEffect(ev.fail);
      // A choice is one of {effect} | {check,pass,fail} | {random:[{effect}]}
      // — every nested effect can set flags.
      (ev.choices ?? []).forEach((c) => choiceBranches(c).forEach(addEffect));
    }
  }
  // Origin start-flags the character can begin the week carrying.
  for (const o of [...(origins?.roles ?? []), ...(origins?.backgrounds ?? [])]) {
    if (o.startFlag) flags.add(o.startFlag);
  }
  return flags;
}

/** Every effect a single choice can resolve to, whatever its shape. */
function choiceBranches(c) {
  if (c.random) return (Array.isArray(c.random) ? c.random : []).map((r) => r.effect).filter(Boolean);
  if (c.check) return [c.pass, c.fail].filter(Boolean);
  return c.effect ? [c.effect] : [];
}

function branches(ev) {
  if (ev.choices) return ev.choices.flatMap(choiceBranches);
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
    // Optional meta { name, blurb }: the game shows these on every screen.
    if (content.meta !== undefined) {
      if (typeof content.meta.name !== "string" || !content.meta.name.trim()) {
        errors.push(`${loc}: meta.name must be a non-empty string`);
      }
      if (content.meta.blurb !== undefined && typeof content.meta.blurb !== "string") {
        errors.push(`${loc}: meta.blurb must be a string`);
      }
    }
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
    // A zero/negative weight would corrupt the engine's weighted-random pick.
    if (ev.weight !== undefined && (!Number.isInteger(ev.weight) || ev.weight < 1)) {
      errors.push(`${ev.id}: weight must be a positive integer (got ${ev.weight})`);
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
    if (ev.choices && ev.choices.length > 0) {
      if (ev.choices.length < 2 || ev.choices.length > 3) {
        errors.push(`${ev.id}: choices must number 2–3 (has ${ev.choices.length})`);
      }
      ev.choices.forEach((c, i) => {
        const cid = `${ev.id} choice ${i + 1}`;
        if (!c.label || !c.label.trim()) errors.push(`${cid}: empty label`);
        // Exactly one shape per choice: flat effect | hidden check | random.
        const cShapes = [
          Boolean(c.effect),
          Boolean(c.check),
          Boolean(c.random),
        ].filter(Boolean).length;
        if (cShapes !== 1) {
          errors.push(`${cid}: must be exactly one of flat effect / hidden check / random (has ${cShapes})`);
        }
        if (c.check) {
          if (!STAT_IDS.includes(c.check.stat)) {
            errors.push(`${cid}: check uses unknown stat "${c.check.stat}"`);
          }
          if (!(c.check.dc >= 1 && c.check.dc <= STAT_CAP)) {
            errors.push(`${cid}: dc ${c.check.dc} out of range 1–${STAT_CAP}`);
          }
          if (!c.pass || !c.fail) errors.push(`${cid}: check needs both pass and fail`);
        }
        if (c.random) {
          if (!Array.isArray(c.random) || c.random.length < 2) {
            errors.push(`${cid}: random needs at least 2 weighted outcomes`);
          }
          (Array.isArray(c.random) ? c.random : []).forEach((r, j) => {
            if (!r.effect) errors.push(`${cid}: random outcome ${j + 1} has no effect`);
            if (r.weight !== undefined && !(typeof r.weight === "number" && r.weight > 0)) {
              errors.push(`${cid}: random outcome ${j + 1} weight must be a number > 0`);
            }
          });
        }
      });
    }
    if (!ev.text || !ev.text.trim()) errors.push(`${ev.id}: empty setup text`);
    for (const b of branches(ev)) {
      if (!b.text || !b.text.trim()) errors.push(`${ev.id}: a branch has empty text`);
      if (!b.outcome || !b.outcome.trim()) errors.push(`${ev.id}: a branch has empty outcome`);
      for (const stat of Object.keys(b.stats ?? {})) {
        if (!STAT_IDS.includes(stat)) errors.push(`${ev.id}: effect touches unknown stat "${stat}"`);
      }
      // Optional threat deltas: real threat ids only, non-zero integers -2..+2.
      for (const [t, v] of Object.entries(b.threats ?? {})) {
        if (!THREAT_IDS.includes(t)) {
          errors.push(`${ev.id}: threat delta on unknown threat "${t}"`);
        } else if (!Number.isInteger(v) || v === 0 || v < -2 || v > 2) {
          errors.push(`${ev.id}: threat "${t}" delta must be a non-zero integer in -2..+2 (got ${v})`);
        }
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

const CONTENT_FILES = [...LOCATIONS.map((l) => `${l}.json`), "origins.json"];

function readContent() {
  const out = {};
  for (const loc of LOCATIONS) {
    const file = path.join(dataDir(), `${loc}.json`);
    out[loc] = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return out;
}

function readOrigins() {
  return JSON.parse(fs.readFileSync(originsFile(), "utf8"));
}

function writeContent(locations, origins) {
  for (const loc of LOCATIONS) {
    if (!locations[loc]) continue;
    const file = path.join(dataDir(), `${loc}.json`);
    fs.writeFileSync(file, JSON.stringify(locations[loc], null, 2) + "\n");
  }
  if (origins) {
    fs.writeFileSync(originsFile(), JSON.stringify(origins, null, 2) + "\n");
  }
}

// --- backups ----------------------------------------------------------
// Every save snapshots the files it is about to overwrite, so a bad save
// (valid but wrong — deleted events, mangled prose) is always undoable.

const BACKUP_KEEP = 20;

function listBackups() {
  const root = backupRoot();
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .filter((d) => /^\d{4}-\d{2}-\d{2}T/.test(d))
    .sort()
    .reverse();
}

/** Copy the current content files into a timestamped backup dir; prune old. */
function snapshot(label) {
  const stamp =
    new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "") +
    (label ? `-${label}` : "");
  const dir = path.join(backupRoot(), stamp);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of CONTENT_FILES) {
    const src = path.join(dataDir(), f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, f));
  }
  for (const old of listBackups().slice(BACKUP_KEEP)) {
    fs.rmSync(path.join(backupRoot(), old), { recursive: true, force: true });
  }
  return stamp;
}

/** Restore a backup by id (whitelisted — no path traversal). The current
 * state is snapshotted first, so a restore is itself undoable. */
function restoreBackup(id) {
  if (!listBackups().includes(id)) throw new Error(`unknown backup "${id}"`);
  snapshot("pre-restore");
  for (const f of CONTENT_FILES) {
    const src = path.join(backupRoot(), id, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dataDir(), f));
  }
}

// --- server ----------------------------------------------------------

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "Content-Type": type });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

function contentPayload() {
  return {
    locations: readContent(),
    origins: readOrigins(),
    stats: STAT_IDS,
    statCap: STAT_CAP,
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    return send(res, 200, fs.readFileSync(EDITOR_HTML, "utf8"), "text/html; charset=utf-8");
  }
  if (req.method === "GET" && req.url === "/favicon.ico") {
    res.writeHead(204);
    return res.end();
  }
  if (req.method === "GET" && req.url === "/api/content") {
    try {
      return send(res, 200, contentPayload());
    } catch (err) {
      return send(res, 500, { error: String(err.message ?? err) });
    }
  }
  if (req.method === "GET" && req.url === "/api/backups") {
    try {
      return send(res, 200, { backups: listBackups() });
    } catch (err) {
      return send(res, 500, { error: String(err.message ?? err) });
    }
  }
  if (req.method === "POST" && req.url === "/api/restore") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        const { id } = JSON.parse(raw);
        restoreBackup(id);
        return send(res, 200, contentPayload());
      } catch (err) {
        return send(res, 400, { error: String(err.message ?? err) });
      }
    });
    return;
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
        snapshot(); // the state being overwritten is always recoverable
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

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n  Seven Nights story editor → http://localhost:${PORT}\n`);
  });
}

// Exported so validation and backup logic can be exercised without
// starting the server (tests/editor.test.ts keeps this in lockstep with
// the build contract).
module.exports = {
  validate,
  producibleFlags,
  branches,
  readContent,
  readOrigins,
  writeContent,
  snapshot,
  restoreBackup,
  listBackups,
  server,
};
