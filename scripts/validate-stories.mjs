// Contract validator for compiled ink stories. Run via `npm run stories`
// (compile-stories.mjs calls this after each successful compile), so every
// authoring mistake is caught at build time instead of mid-party.
//
// The contract (see stories/main.ink and README "Writing storylets"):
//   - every storylet_* knot must reach END down EVERY choice path, and every
//     path must leave `outcome` non-empty and stats numeric
//   - finale* knots must run to END with no choice points at all (the host
//     runs them unattended via runToEnd, which blindly takes choice 0)
//   - any choice tag mentioning "needs" must parse as "# needs: stat N"
//   - the required global VARs must be declared
//   - every knot named in lib/game/constants.ts LOCATIONS must exist

import { readFileSync } from "node:fs";
import { Story } from "inkjs";

// Keep in sync with NEEDS_TAG in lib/ink/storylet.ts.
const NEEDS_TAG = /^needs:\s*(mind|body|charm|shadow)\s+(\d+)\s*$/i;
const STAT_IDS = ["mind", "body", "charm", "shadow"];
const REQUIRED_GLOBALS = [...STAT_IDS, "outcome", "night", "visits", "event"];

const MAX_DEPTH = 6;
const MAX_PATHS = 500;

/** All knot names declared in the story. */
function knotNames(story) {
  return [...story.mainContentContainer.namedContent.keys()];
}

// Night-gated choices and {night >= N} dispatches only appear under the
// right context, so every knot is walked once per scenario.
const WALK_CONTEXTS = [
  { night: 1, visits: 0 },
  { night: 7, visits: 2 },
];

/**
 * Walk every choice path of a knot under each context scenario.
 * Returns a list of problems (empty = clean).
 */
function walkKnot(storyJson, knot, opts = {}) {
  const problems = new Set();
  for (const ctx of WALK_CONTEXTS) {
    for (const p of walkKnotOnce(storyJson, knot, ctx, opts)) problems.add(p);
  }
  return [...problems];
}

function walkKnotOnce(storyJson, knot, ctx, { forbidChoices = false } = {}) {
  const problems = [];
  const story = new Story(storyJson);
  for (const [name, value] of Object.entries(ctx)) {
    if (story.variablesState.GlobalVariableExistsWithName(name)) {
      story.variablesState.$(name, value);
    }
  }
  let paths = 0;

  function explore(pathSoFar, depth) {
    if (paths >= MAX_PATHS) return;
    while (story.canContinue) story.Continue();

    const choices = story.currentChoices;
    if (choices.length === 0) {
      paths += 1;
      const outcome = story.variablesState.$("outcome");
      const pathDesc = pathSoFar.length ? `path [${pathSoFar.join(" > ")}]` : "linear path";
      if (!forbidChoices && !outcome) {
        problems.push(`${knot}: ${pathDesc} ends without setting outcome`);
      }
      for (const stat of STAT_IDS) {
        const v = Number(story.variablesState.$(stat));
        if (!Number.isFinite(v)) {
          problems.push(`${knot}: ${pathDesc} left stat "${stat}" non-numeric`);
        }
      }
      return;
    }

    if (forbidChoices) {
      problems.push(
        `${knot}: offers choices, but finale knots run unattended and must be choice-free`,
      );
      return;
    }
    if (depth >= MAX_DEPTH) {
      problems.push(`${knot}: choice tree deeper than ${MAX_DEPTH} — runaway divert?`);
      return;
    }

    // Tag check on every choice we encounter.
    for (const choice of choices) {
      for (const tag of choice.tags ?? []) {
        if (/needs/i.test(tag) && !NEEDS_TAG.test(tag.trim())) {
          problems.push(
            `${knot}: choice "${choice.text}" has malformed gate tag "# ${tag}" (want "# needs: stat N")`,
          );
        }
      }
    }

    const snapshot = story.state.ToJson();
    for (let i = 0; i < choices.length; i++) {
      story.state.LoadJson(snapshot);
      story.ChooseChoiceIndex(i);
      explore([...pathSoFar, i], depth + 1);
    }
  }

  try {
    story.ChoosePathString(knot);
    explore([], 0);
  } catch (err) {
    problems.push(`${knot}: crashed while walking: ${err.message ?? err}`);
  }
  if (paths >= MAX_PATHS) {
    problems.push(`${knot}: more than ${MAX_PATHS} paths — runaway branching?`);
  }
  return problems;
}

/** Knot names referenced by lib/game/constants.ts LOCATIONS. */
function locationKnots() {
  try {
    const src = readFileSync("lib/game/constants.ts", "utf8");
    return [...src.matchAll(/knot:\s*"([^"]+)"/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

/**
 * Validate one compiled story. Returns problems; empty array = contract met.
 */
export function validateStory(storyJson, fileName) {
  const problems = [];
  let probe;
  try {
    probe = new Story(storyJson);
  } catch (err) {
    return [`${fileName}: could not load compiled story: ${err.message ?? err}`];
  }

  for (const name of REQUIRED_GLOBALS) {
    if (!probe.variablesState.GlobalVariableExistsWithName(name)) {
      problems.push(`${fileName}: missing required global VAR "${name}"`);
    }
  }

  const knots = knotNames(probe);

  for (const knot of locationKnots()) {
    if (!knots.includes(knot)) {
      problems.push(
        `${fileName}: LOCATIONS in constants.ts names knot "${knot}" but the story doesn't define it`,
      );
    }
  }

  for (const knot of knots) {
    if (knot.startsWith("storylet_")) {
      problems.push(...walkKnot(storyJson, knot));
    } else if (knot.startsWith("finale")) {
      problems.push(...walkKnot(storyJson, knot, { forbidChoices: true }));
    }
  }

  return problems;
}
