import type { Activity, GameEvent, LocationId, StorylineDef } from "../types";
import { locationDef, registerLocationMeta } from "../constants";
// Content is data: edit it with the visual editor (`npm run editor`), which
// reads and writes these JSON files. The game imports them directly.
import tavern from "./data/tavern.json";
import castle from "./data/castle.json";
import church from "./data/church.json";
import market from "./data/market.json";
import farms from "./data/farms.json";
import slums from "./data/slums.json";
import docks from "./data/docks.json";
import storylines from "./data/storylines.json";

/** One location's content: its name and blurb, the activities offered, and
 * the event pool. `meta` is optional so pre-meta saves still load. */
export interface LocationContent {
  meta?: { name: string; blurb: string };
  activities: Activity[];
  events: GameEvent[];
}

const MODULES: [LocationId, LocationContent][] = ([
  ["tavern", tavern],
  ["castle", castle],
  ["church", church],
  ["market", market],
  ["farms", farms],
  ["slums", slums],
  ["docks", docks],
] as [LocationId, LocationContent][]);

// The content owns each location's display name and blurb.
for (const [id, m] of MODULES) if (m.meta) registerLocationMeta(id, m.meta);

export const ACTIVITIES: Activity[] = MODULES.flatMap(([, m]) => m.activities);
export const EVENTS: GameEvent[] = MODULES.flatMap(([, m]) => m.events);

/** Hand-written storylines registered by the Scribe: completing one (its
 * doneFlag) earns its ending panel at the epilogue. */
export const STORYLINES: StorylineDef[] = storylines as StorylineDef[];

/** The storylines this player saw through to the end. */
export function completedStorylines(flags: Iterable<string>): StorylineDef[] {
  const set = new Set(flags);
  return STORYLINES.filter((s) => set.has(s.doneFlag));
}

/**
 * The catch-all when nothing in the pool is eligible (everything's been
 * seen, or prerequisites locked it all out). Always available, repeatable,
 * harmless — keeps the night from ever dead-ending.
 */
export function fallbackEvent(
  location: LocationId,
  activityId: string,
): GameEvent {
  const name = locationDef(location).name;
  return {
    id: `quiet_${location}`,
    location,
    activities: [],
    repeatable: true,
    text: `You pass a quiet hour at ${name}. Nothing of note finds you tonight — which, in fair week, is its own small mercy.`,
    effect: {
      text: "You head home early, none the worse and a little rested.",
      outcome: `spent a quiet night at ${name}.`,
      stats: { will: 1 },
    },
  };
}
