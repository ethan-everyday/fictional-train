import type { Activity, GameEvent, LocationId } from "../types";
import { locationDef } from "../constants";
import { tavern } from "./tavern";
import { castle } from "./castle";
import { church } from "./church";
import { market } from "./market";
import { farms } from "./farms";
import { slums } from "./slums";
import { docks } from "./docks";

/** One location's content: the activities offered and the event pool. */
export interface LocationContent {
  activities: Activity[];
  events: GameEvent[];
}

const MODULES: LocationContent[] = [
  tavern,
  castle,
  church,
  market,
  farms,
  slums,
  docks,
];

export const ACTIVITIES: Activity[] = MODULES.flatMap((m) => m.activities);
export const EVENTS: GameEvent[] = MODULES.flatMap((m) => m.events);

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
