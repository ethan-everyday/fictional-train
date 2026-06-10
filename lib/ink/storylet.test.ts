import { describe, expect, it } from "vitest";
import { Compiler } from "inkjs/full";
import { runToEnd, StoryletSession } from "./storylet";
import type { PlayerStats } from "@/lib/game/types";

/** Compile ink source to the same JSON shape the game fetches at runtime. */
function compile(src: string): unknown {
  const json = new Compiler(src).Compile().ToJson();
  if (!json) throw new Error("fixture failed to compile");
  return JSON.parse(json);
}

const VARS = `
VAR mind = 2
VAR body = 2
VAR charm = 2
VAR shadow = 0
VAR outcome = ""
VAR flag_x = false
VAR flag_y = false
`;

const STATS: PlayerStats = { mind: 2, body: 2, charm: 2, shadow: 0 };

function stepToChoices(session: StoryletSession, stats: PlayerStats) {
  for (let i = 0; i < 50; i++) {
    const step = session.step(stats);
    if (step.kind !== "paragraph") return step;
  }
  throw new Error("never reached a non-paragraph step");
}

describe("stat gates", () => {
  const content = compile(`${VARS}
=== test_knot ===
Intro line.
* [Easy choice]
    ~ outcome = "did the easy thing."
    -> END
* [Hard choice # needs: body 3]
    ~ outcome = "did the hard thing."
    -> END
`);

  it("disables a gated choice the stats fail, with a readable requirement", () => {
    const session = StoryletSession.begin(content, "test_knot", STATS, []);
    const step = stepToChoices(session, STATS);
    if (step.kind !== "choices") throw new Error("expected choices");
    expect(step.choices[0].disabled).toBe(false);
    expect(step.choices[0].requirement).toBeNull();
    expect(step.choices[1].disabled).toBe(true);
    expect(step.choices[1].requirement).toBe("Needs Body 3");
  });

  it("enables the gate once the stat meets the bar", () => {
    const strong = { ...STATS, body: 3 };
    const session = StoryletSession.begin(content, "test_knot", strong, []);
    const step = stepToChoices(session, strong);
    if (step.kind !== "choices") throw new Error("expected choices");
    expect(step.choices[1].disabled).toBe(false);
    expect(step.choices[1].requirement).toBe("Needs Body 3");
  });

  it("parses the needs tag case-insensitively", () => {
    const c = compile(`${VARS}
=== k ===
Line.
* [Go # NEEDS: BODY 3]
    -> END
`);
    const session = StoryletSession.begin(c, "k", STATS, []);
    const step = stepToChoices(session, STATS);
    if (step.kind !== "choices") throw new Error("expected choices");
    expect(step.choices[0].disabled).toBe(true);
  });

  it("ignores a malformed needs tag (choice stays enabled)", () => {
    const c = compile(`${VARS}
=== k ===
Line.
* [Go # needs body 3]
    -> END
`);
    const session = StoryletSession.begin(c, "k", STATS, []);
    const step = stepToChoices(session, STATS);
    if (step.kind !== "choices") throw new Error("expected choices");
    expect(step.choices[0].disabled).toBe(false);
    expect(step.choices[0].requirement).toBeNull();
  });
});

describe("flags", () => {
  const content = compile(`${VARS}
=== flag_knot ===
{flag_x: Seen before.|First time.}
* [Set the flag]
    ~ flag_x = true
    ~ outcome = "set a flag."
    -> END
* [Leave]
    ~ outcome = "left."
    -> END
`);

  it("diffs out only flags that ended up true", () => {
    const session = StoryletSession.begin(content, "flag_knot", STATS, []);
    const step = stepToChoices(session, STATS);
    if (step.kind !== "choices") throw new Error("expected choices");
    session.choose(0);
    const end = stepToChoices(session, STATS);
    if (end.kind !== "end") throw new Error("expected end");
    expect(end.flagsSet).toEqual(["x"]);
  });

  it("writes declared flags in and surfaces them in conditional text", () => {
    const session = StoryletSession.begin(content, "flag_knot", STATS, ["x"]);
    const step = session.step(STATS);
    if (step.kind !== "paragraph") throw new Error("expected paragraph");
    expect(step.text).toBe("Seen before.");
  });

  it("silently skips flags the story never declared", () => {
    expect(() =>
      StoryletSession.begin(content, "flag_knot", STATS, ["undeclared_flag"]),
    ).not.toThrow();
  });
});

describe("save/restore", () => {
  it("round-trips mid-choice state and finishes identically", () => {
    const content = compile(`${VARS}
=== k ===
Before the choice.
* [Take it]
    ~ charm = charm + 1
    ~ outcome = "took it."
    -> END
`);
    const original = StoryletSession.begin(content, "k", STATS, []);
    const choices = stepToChoices(original, STATS);
    if (choices.kind !== "choices") throw new Error("expected choices");

    const restored = StoryletSession.restore(content, original.save(), STATS);
    const restoredChoices = restored.step(STATS);
    if (restoredChoices.kind !== "choices") throw new Error("expected choices");
    expect(restoredChoices.choices.map((c) => c.text)).toEqual(
      choices.choices.map((c) => c.text),
    );

    restored.choose(0);
    const end = stepToChoices(restored, STATS);
    if (end.kind !== "end") throw new Error("expected end");
    expect(end.outcome).toBe("took it.");
    expect(end.finalStats.charm).toBe(3);
    expect(restored.deltas(end.finalStats)).toEqual({
      mind: 0,
      body: 0,
      charm: 1,
      shadow: 0,
    });
  });
});

describe("end step", () => {
  it("falls back to a default outcome when ink never set one", () => {
    const content = compile(`${VARS}
=== k ===
A quiet night.
-> END
`);
    const session = StoryletSession.begin(content, "k", STATS, []);
    session.step(STATS); // paragraph
    const end = session.step(STATS);
    if (end.kind !== "end") throw new Error("expected end");
    expect(end.outcome).toBe("survived the night.");
  });
});

describe("runToEnd", () => {
  it("collects every paragraph of a linear knot", () => {
    const content = compile(`${VARS}
=== fin ===
One.
Two.
THE END.
-> END
`);
    expect(runToEnd(content, "fin", STATS)).toEqual(["One.", "Two.", "THE END."]);
  });

  it("caps a looping knot instead of hanging", () => {
    const content = compile(`${VARS}
=== loop ===
Again.
-> loop
`);
    const paragraphs = runToEnd(content, "loop", STATS);
    expect(paragraphs.length).toBeLessThanOrEqual(200);
    expect(paragraphs.length).toBeGreaterThan(0);
  });
});
