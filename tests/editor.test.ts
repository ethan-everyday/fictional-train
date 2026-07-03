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

function firstEventWith(
  locations: Record<string, { events: any[] }>,
  pred: (ev: any) => boolean,
): any {
  for (const loc of Object.values(locations)) {
    const ev = loc.events.find(pred);
    if (ev) return ev;
  }
  throw new Error("no event in the live content matches the probe");
}

describe("editor validate() mirrors the build contract", () => {
  it("accepts the live story exactly as the game ships it", () => {
    const { locations, origins } = liveContent();
    expect(editor.validate(locations, origins)).toEqual([]);
  });

  it("rejects duplicate event ids", () => {
    const { locations, origins } = clone(liveContent());
    const evs = (Object.values(locations)[0] as { events: any[] }).events;
    evs.push(clone(evs[0]));
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes("duplicate event ids"))).toBe(true);
  });

  it("rejects an event with two resolution shapes", () => {
    const { locations, origins } = clone(liveContent());
    const ev = firstEventWith(locations, (e) => e.effect);
    ev.check = { stat: "will", dc: 3 };
    ev.pass = { text: "x", outcome: "y" };
    ev.fail = { text: "x", outcome: "y" };
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(ev.id) && e.includes("one resolution shape"))).toBe(true);
  });

  it("rejects a choice with two shapes", () => {
    const { locations, origins } = clone(liveContent());
    const ev = firstEventWith(locations, (e) => e.choices?.some((c: any) => c.effect));
    const choice = ev.choices.find((c: any) => c.effect);
    choice.random = [{ effect: { text: "x", outcome: "y" } }, { effect: { text: "x", outcome: "y" } }];
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(ev.id) && e.includes("flat effect / hidden check / random"))).toBe(true);
  });

  it("rejects a random choice with a single outcome or a bad weight", () => {
    const { locations, origins } = clone(liveContent());
    const ev = firstEventWith(locations, (e) => e.choices?.some((c: any) => c.random));
    const choice = ev.choices.find((c: any) => c.random);
    choice.random = [{ weight: 0, effect: { text: "x", outcome: "y" } }];
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes("at least 2 weighted outcomes"))).toBe(true);
    expect(errors.some((e: string) => e.includes("weight must be a number > 0"))).toBe(true);
  });

  it("rejects threat deltas that are zero, out of range, or on unknown threats", () => {
    const { locations, origins } = clone(liveContent());
    const ev = firstEventWith(locations, (e) => e.effect);
    ev.effect.threats = { plague: 0, war: -3, dragons: 1 };
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(`"plague" delta`))).toBe(true);
    expect(errors.some((e: string) => e.includes(`"war" delta`))).toBe(true);
    expect(errors.some((e: string) => e.includes(`unknown threat "dragons"`))).toBe(true);
  });

  it("rejects orphan prerequisites", () => {
    const { locations, origins } = clone(liveContent());
    const ev = firstEventWith(locations, () => true);
    ev.requires = [...(ev.requires ?? []), "flag_nothing_ever_sets"];
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes("orphan prerequisite"))).toBe(true);
  });

  it("rejects non-positive selection weights", () => {
    const { locations, origins } = clone(liveContent());
    const ev = firstEventWith(locations, () => true);
    ev.weight = -2;
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(ev.id) && e.includes("weight must be a positive integer"))).toBe(true);
  });

  it("rejects a hidden check with dc beyond the cap", () => {
    const { locations, origins } = clone(liveContent());
    const ev = firstEventWith(locations, (e) => e.check);
    ev.check.dc = 11;
    const errors = editor.validate(locations, origins);
    expect(errors.some((e: string) => e.includes(ev.id) && e.includes("out of range"))).toBe(true);
  });
});

describe("editor page", () => {
  it("the page script parses — a syntax error means a silent blank editor", () => {
    // Nothing else in CI parses editor.html: a missing paren shipped in the
    // 2026-06-13 theme overhaul left the editor dead for three weeks. The
    // Function constructor parses (without executing) the whole script.
    const html = fs.readFileSync(path.join(process.cwd(), "scripts", "editor.html"), "utf8");
    const m = html.match(/<script>([\s\S]*)<\/script>/);
    expect(m, "editor.html has one <script> block").toBeTruthy();
    expect(() => new Function(m![1])).not.toThrow();
  });
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
