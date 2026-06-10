/**
 * The ONLY module allowed to import inkjs (runtime side).
 *
 * The contract with story authors (see stories/main.ink):
 *  - Globals mind/body/charm/shadow are written in before a knot runs and
 *    read back out when it ends.
 *  - The knot sets `outcome` to one short line for the host resolve screen.
 *  - Globals named flag_* are booleans; any that end up true become story
 *    flags on the player.
 *  - A choice tagged `# needs: body 3` is shown but disabled until the stat
 *    meets the bar. The engine enforces it; ink does not.
 */

import { Story } from "inkjs";
import type { PlayerStats, StatId, UiChoice } from "@/lib/game/types";
import { STAT_CAP, STAT_LABELS } from "@/lib/game/constants";

const STAT_IDS: StatId[] = [
  "intelligence",
  "strength",
  "agility",
  "craft",
  "will",
  "wealth",
];
const FLAG_PREFIX = "flag_";
const NEEDS_TAG =
  /^needs:\s*(intelligence|strength|agility|craft|will|wealth)\s+(\d+)\s*$/i;

export type StoryletStep =
  | { kind: "paragraph"; text: string }
  | { kind: "choices"; choices: UiChoice[] }
  | { kind: "end"; outcome: string; finalStats: PlayerStats; flagsSet: string[] };

/**
 * Read-only context written into ink globals before a knot runs (each var
 * only if the story declares it, so older ink keeps working):
 *  - night:  1–7
 *  - visits: previous nights this player spent at this location (0 = first)
 *  - event:  current drama event id, or "" when the night is ordinary
 */
export interface StoryletContext {
  night?: number;
  visits?: number;
  event?: string;
}

export class StoryletSession {
  private story: Story;
  private startStats: PlayerStats;

  private constructor(story: Story, startStats: PlayerStats) {
    this.story = story;
    this.startStats = startStats;
  }

  /** Start a knot fresh: write stats, flags, and context in, jump to the knot. */
  static begin(
    storyContent: unknown,
    knot: string,
    stats: PlayerStats,
    flags: string[],
    ctx?: StoryletContext,
  ): StoryletSession {
    const story = new Story(storyContent as never);
    for (const stat of STAT_IDS) {
      story.variablesState.$(stat, stats[stat]);
    }
    for (const flag of flags) {
      const varName = FLAG_PREFIX + flag;
      if (story.variablesState.GlobalVariableExistsWithName(varName)) {
        story.variablesState.$(varName, true);
      }
    }
    const ctxVars: [string, number | string | undefined][] = [
      ["night", ctx?.night],
      ["visits", ctx?.visits],
      ["event", ctx?.event],
    ];
    for (const [name, value] of ctxVars) {
      if (
        value !== undefined &&
        story.variablesState.GlobalVariableExistsWithName(name)
      ) {
        story.variablesState.$(name, value);
      }
    }
    story.variablesState.$("outcome", "");
    story.ChoosePathString(knot);
    return new StoryletSession(story, { ...stats });
  }

  /** Resume from a saved ink state (phone refresh mid-storylet). */
  static restore(
    storyContent: unknown,
    savedInkState: string,
    startStats: PlayerStats,
  ): StoryletSession {
    const story = new Story(storyContent as never);
    story.state.LoadJson(savedInkState);
    return new StoryletSession(story, { ...startStats });
  }

  /** Serialized ink state, small enough to stash in localStorage. */
  save(): string {
    return this.story.state.ToJson();
  }

  /** Advance one beat: next paragraph, a choice point, or the end. */
  step(currentStats: PlayerStats): StoryletStep {
    while (this.story.canContinue) {
      const text = (this.story.Continue() ?? "").trim();
      if (text) return { kind: "paragraph", text };
    }
    const inkChoices = this.story.currentChoices;
    if (inkChoices.length > 0) {
      return {
        kind: "choices",
        choices: inkChoices.map((choice, index) =>
          toUiChoice(choice.text, readTags(choice), index, currentStats),
        ),
      };
    }
    return {
      kind: "end",
      outcome:
        (this.story.variablesState.$("outcome") as string) ||
        "survived the night.",
      finalStats: this.readStats(),
      flagsSet: this.readFlags(),
    };
  }

  choose(index: number): void {
    this.story.ChooseChoiceIndex(index);
  }

  /** Stat changes relative to where the storylet started. */
  deltas(finalStats: PlayerStats): PlayerStats {
    const out = {} as PlayerStats;
    for (const stat of STAT_IDS) {
      out[stat] = finalStats[stat] - this.startStats[stat];
    }
    return out;
  }

  private readStats(): PlayerStats {
    const stats = {} as PlayerStats;
    for (const stat of STAT_IDS) {
      const raw = Number(this.story.variablesState.$(stat)) || 0;
      // Clamp here, at the single point stats leave ink, so no storylet can
      // push a stat past the cap (or below zero) no matter what it writes.
      stats[stat] = Math.max(0, Math.min(STAT_CAP, raw));
    }
    return stats;
  }

  private readFlags(): string[] {
    // No public API to enumerate globals; reach into the runtime map.
    const globals = (
      this.story.variablesState as unknown as {
        _globalVariables: Map<string, unknown>;
      }
    )._globalVariables;
    const flags: string[] = [];
    globals.forEach((_value, name) => {
      if (name.startsWith(FLAG_PREFIX) && this.story.variablesState.$(name)) {
        flags.push(name.slice(FLAG_PREFIX.length));
      }
    });
    return flags;
  }
}

/**
 * Run a knot with no interaction (the finale): write stats in, collect every
 * paragraph until END. If the knot somehow offers choices, take the first.
 */
export function runToEnd(
  storyContent: unknown,
  knot: string,
  stats: PlayerStats,
): string[] {
  const session = StoryletSession.begin(storyContent, knot, stats, []);
  const paragraphs: string[] = [];
  // Hard cap so a looping knot can't hang the host's finale forever.
  for (let i = 0; i < 200; i++) {
    const step = session.step(stats);
    if (step.kind === "paragraph") paragraphs.push(step.text);
    else if (step.kind === "choices") session.choose(0);
    else return paragraphs;
  }
  return paragraphs;
}

function readTags(choice: { tags?: string[] | null }): string[] {
  return choice.tags ?? [];
}

function toUiChoice(
  text: string,
  tags: string[],
  index: number,
  stats: PlayerStats,
): UiChoice {
  for (const tag of tags) {
    const match = NEEDS_TAG.exec(tag.trim());
    if (match) {
      const stat = match[1].toLowerCase() as StatId;
      const needed = parseInt(match[2], 10);
      return {
        index,
        text,
        disabled: stats[stat] < needed,
        requirement: `Needs ${STAT_LABELS[stat]} ${needed}`,
      };
    }
  }
  return { index, text, disabled: false, requirement: null };
}
