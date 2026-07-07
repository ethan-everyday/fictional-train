import { afterEach, describe, expect, it } from "vitest";
import { createRequire } from "module";
import fs from "fs";
import os from "os";
import path from "path";

// The editor is CommonJS (a plain-Node dev tool); require keeps the module
// shape intact. Importing must never start the server (require.main guard).
const require = createRequire(import.meta.url);
const editor = require("../scripts/editor-server.js");

/**
 * The editor's validate() mirrors the build contract in tests/content.test.ts.
 * These tests keep that mirror honest: the live story must pass it, and each
 * class of defect the contract rejects must be rejected here too — otherwise
 * the editor could save (or refuse) content the build disagrees about.
 */

function liveContent() {
  return { locations: editor.readContent(), origins: editor.readOrigins() };
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

/**
 * Inject a synthetic, valid event into the cloned content and return it —
 * tests then break it one rule at a time. Synthetic (not probed from the
 * live story) so the lockstep holds even on a clean content slate.
 */
let syntheticN = 0;
function injectEvent(locations: Record<string, { events: any[] }>, shape: "effect" | "check" | "choices" | "random" = "effect"): any {
  const flat = () => ({ text: "x", outcome: "did." });
  const ev: any = { id: `__test_ev_${syntheticN++}`, location: "tavern", activities: [], text: "t" };
  if (shape === "effect") ev.effect = flat();
  else if (shape === "check") { ev.check = { stat: "will", dc: 4 }; ev.pass = flat(); ev.fail = flat(); }
  else if (shape === "choices") ev.choices = [ { label: "a", effect: flat() }, { label: "b", effect: flat() } ];
  else ev.choices = [ { label: "a", random: [ { weight: 1, effect: flat() }, { weight: 1, effect: flat() } ] }, { label: "b", effect: flat() } ];
  locations.tavern.events.push(ev);
  return ev;
}

describe("editor validate() mirrors the build contract", () => {
  it("accepts the live story exactly as the game ships it", () => {
    const { locations, origins } = liveContent();
    expect(editor.validate(locations, origins)).toEqual([]);
  });

  it("rejects duplicate event ids", () => {
    const { locations, origins } = clone(liveContent());
    const ev = injectEvent(locations);
    locations.tavern.events.push(clone(ev));
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes("duplicate event ids"))).toBe(true);
  });

  it("rejects an event with two resolution shapes", () => {
    const { locations, origins } = clone(liveContent());
    const ev = injectEvent(locations, "effect");
    ev.check = { stat: "will", dc: 3 };
    ev.pass = { text: "x", outcome: "y" };
    ev.fail = { text: "x", outcome: "y" };
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(ev.id) && e.includes("one resolution shape"))).toBe(true);
  });

  it("rejects a choice with two shapes", () => {
    const { locations, origins } = clone(liveContent());
    const ev = injectEvent(locations, "choices");
    ev.choices[0].random = [{ effect: { text: "x", outcome: "y" } }, { effect: { text: "x", outcome: "y" } }];
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(ev.id) && e.includes("flat effect / hidden check / random"))).toBe(true);
  });

  it("rejects a random choice with a single outcome or a bad weight", () => {
    const { locations, origins } = clone(liveContent());
    const ev = injectEvent(locations, "random");
    ev.choices[0].random = [{ weight: 0, effect: { text: "x", outcome: "y" } }];
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes("at least 2 weighted outcomes"))).toBe(true);
    expect(errors.some((e: string) => e.includes("weight must be a number > 0"))).toBe(true);
  });

  it("rejects threat deltas that are zero, out of range, or on unknown threats", () => {
    const { locations, origins } = clone(liveContent());
    const ev = injectEvent(locations, "effect");
    ev.effect.threats = { plague: 0, war: -3, dragons: 1 };
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(`"plague" delta`))).toBe(true);
    expect(errors.some((e: string) => e.includes(`"war" delta`))).toBe(true);
    expect(errors.some((e: string) => e.includes(`unknown threat "dragons"`))).toBe(true);
  });

  it("rejects a malformed note (empty id, non-string text)", () => {
    const { locations, origins } = clone(liveContent());
    const ev = injectEvent(locations, "effect");
    ev.effect.note = { id: "  ", text: 5 };
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes("note needs a non-empty id"))).toBe(true);
    expect(errors.some((e: string) => e.includes("note's text must be a string"))).toBe(true);
  });

  it("rejects storylines whose doneFlag nothing sets, or with missing parts", () => {
    const { locations, origins } = clone(liveContent());
    const ev = injectEvent(locations, "effect");
    ev.effect.flags = ["tale_done"];
    const good = [{ id: "tale", title: "A Tale", doneFlag: "tale_done", ending: "It ends." }];
    expect(editor.validate(locations, origins, good)).toEqual([]);
    const bad = [
      { id: "tale", title: "A Tale", doneFlag: "never_set_anywhere", ending: "It ends." },
      { id: "tale", title: "", doneFlag: "tale_done", ending: "" },
    ];
    const errors = editor.validate(locations, origins, bad);
    expect(errors.some((e: string) => e.includes(`doneFlag "never_set_anywhere"`))).toBe(true);
    expect(errors.some((e: string) => e.includes("duplicate storyline ids"))).toBe(true);
    expect(errors.some((e: string) => e.includes("no title"))).toBe(true);
    expect(errors.some((e: string) => e.includes("no ending panel"))).toBe(true);
  });

  it("rejects orphan prerequisites", () => {
    const { locations, origins } = clone(liveContent());
    const ev = injectEvent(locations);
    ev.requires = ["flag_nothing_ever_sets"];
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes("orphan prerequisite"))).toBe(true);
  });

  it("rejects non-positive selection weights", () => {
    const { locations, origins } = clone(liveContent());
    const ev = injectEvent(locations);
    ev.weight = -2;
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(ev.id) && e.includes("weight must be a positive integer"))).toBe(true);
  });

  it("rejects a hidden check with dc beyond the cap", () => {
    const { locations, origins } = clone(liveContent());
    const ev = injectEvent(locations, "check");
    ev.check.dc = 11;
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(ev.id) && e.includes("out of range"))).toBe(true);
  });
});

describe("editor pages", () => {
  // Nothing else in CI parses these pages: a missing paren shipped in the
  // 2026-06-13 theme overhaul left the editor dead for three weeks. The
  // Function constructor parses (without executing) the whole script.
  for (const page of ["editor.html", "write.html"]) {
    it(`${page}'s script parses — a syntax error means a silent blank page`, () => {
      const html = fs.readFileSync(path.join(process.cwd(), "scripts", page), "utf8");
      const m = html.match(/<script>([\s\S]*)<\/script>/);
      expect(m, `${page} has one <script> block`).toBeTruthy();
      expect(() => new Function(m![1])).not.toThrow();
    });
  }
});

describe("editor backups", () => {
  let tmp: string;

  afterEach(() => {
    delete process.env.EDITOR_DATA_DIR;
    delete process.env.EDITOR_BACKUP_DIR;
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  /** Sandbox: copy the real story into a temp dir and point the editor at it. */
  function sandbox(): string {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seven-nights-editor-"));
    const dataDir = path.join(tmp, "data");
    fs.mkdirSync(dataDir);
    const realDir = path.join(process.cwd(), "lib", "game", "content", "data");
    for (const f of fs.readdirSync(realDir)) {
      fs.copyFileSync(path.join(realDir, f), path.join(dataDir, f));
    }
    process.env.EDITOR_DATA_DIR = dataDir;
    process.env.EDITOR_BACKUP_DIR = path.join(tmp, "backups");
    return dataDir;
  }

  it("snapshot + restore round-trips a clobbered story", () => {
    const dataDir = sandbox();
    const tavernFile = path.join(dataDir, "tavern.json");
    const original = fs.readFileSync(tavernFile, "utf8");

    const id = editor.snapshot();
    fs.writeFileSync(tavernFile, JSON.stringify({ activities: [], events: [] }));
    editor.restoreBackup(id);

    expect(fs.readFileSync(tavernFile, "utf8")).toBe(original);
    // The restore itself snapshotted the clobbered state, so it is undoable.
    expect(editor.listBackups().length).toBe(2);
  });

  it("rejects restore ids that are not real backups (no path traversal)", () => {
    sandbox();
    expect(() => editor.restoreBackup("../../lib")).toThrow(/unknown backup/);
  });

  it("prunes old snapshots beyond the keep limit", () => {
    sandbox();
    for (let i = 0; i < 23; i++) editor.snapshot(`n${i}`);
    expect(editor.listBackups().length).toBeLessThanOrEqual(20);
  });

  it("a save WITHOUT storylines is still checked against the on-disk registry", () => {
    const dataDir = sandbox();
    // Register a storyline on disk whose doneFlag no posted event sets.
    fs.writeFileSync(path.join(dataDir, "storylines.json"),
      JSON.stringify([{ id: "ghost", title: "Ghost", doneFlag: "ghost_done", ending: "…" }]));
    const { locations, origins } = clone({ locations: editor.readContent(), origins: editor.readOrigins() });
    // validate with storylines omitted (the editor's save shape) must read
    // the registry from disk and reject the orphaned doneFlag.
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(`doneFlag "ghost_done"`))).toBe(true);
  });

  it("writeContent honours the sandbox dir", () => {
    const dataDir = sandbox();
    const { locations, origins } = liveContent();
    editor.writeContent(locations, origins);
    // Round-trip: what the editor writes, the editor reads back identically.
    expect(editor.readContent()).toEqual(locations);
    // And the sandbox files really were the ones written.
    const stat = fs.statSync(path.join(dataDir, "docks.json"));
    expect(stat.isFile()).toBe(true);
  });
});
