import type {
  BackgroundDef,
  Character,
  PlayerStats,
  RoleDef,
  StatId,
} from "./types";
import { STAT_CAP } from "./constants";
// Roles + backgrounds are data, editable in the story editor (the Origins
// tab) alongside the events. The game imports them here.
import origins from "./content/data/origins.json";

/**
 * Character creation: every player picks a ROLE (their calling — the bigger
 * stat shaper) and a BACKGROUND (where they came from — a smaller nudge,
 * sometimes a starting story flag). The two combine over a base floor of 1
 * in every stat to set where the week begins. Stats are never gates the
 * player sees — they tilt hidden event checks all week.
 */

/** Every stat starts here before role and background bonuses. */
const STAT_FLOOR = 1;

export const ROLES = origins.roles as RoleDef[];
export const BACKGROUNDS = origins.backgrounds as BackgroundDef[];

const STAT_IDS: StatId[] = [
  "intelligence",
  "strength",
  "agility",
  "craft",
  "will",
  "wealth",
];

export function roleDef(id: string): RoleDef | undefined {
  return ROLES.find((r) => r.id === id);
}

export function backgroundDef(id: string): BackgroundDef | undefined {
  return BACKGROUNDS.find((b) => b.id === id);
}

/** Base stats for a built character: floor + role bonus + background bonus. */
export function baseStats(character: Character): PlayerStats {
  const role = roleDef(character.role);
  const background = backgroundDef(character.background);
  const stats = {} as PlayerStats;
  for (const stat of STAT_IDS) {
    const total =
      STAT_FLOOR + (role?.bonus[stat] ?? 0) + (background?.bonus[stat] ?? 0);
    stats[stat] = Math.max(0, Math.min(STAT_CAP, total));
  }
  return stats;
}

/** Flags a freshly-built character starts the week with. */
export function startingFlags(character: Character): string[] {
  const flags: string[] = [];
  const roleFlag = roleDef(character.role)?.startFlag;
  const bgFlag = backgroundDef(character.background)?.startFlag;
  if (roleFlag) flags.push(roleFlag);
  if (bgFlag) flags.push(bgFlag);
  return flags;
}
