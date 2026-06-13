import type {
  BackgroundDef,
  Character,
  PlayerStats,
  RoleDef,
  StatId,
} from "./types";
import { STAT_CAP } from "./constants";

/**
 * Character creation: every player picks a ROLE (their calling — the bigger
 * stat shaper) and a BACKGROUND (where they came from — a smaller nudge,
 * sometimes a starting story flag). The two combine over a base floor of 1
 * in every stat to set where the week begins. Stats are never gates the
 * player sees — they tilt hidden event checks all week.
 */

/** Every stat starts here before role and background bonuses. */
const STAT_FLOOR = 1;

export const ROLES: RoleDef[] = [
  {
    id: "knight",
    name: "Knight",
    blurb: "Sworn to the sword. Doors open to steel and a hard stare.",
    bonus: { strength: 3, will: 2 },
  },
  {
    id: "scholar",
    name: "Scholar",
    blurb: "Letters, ledgers, and the patience to read a room.",
    bonus: { intelligence: 3, craft: 2 },
  },
  {
    id: "merchant",
    name: "Merchant",
    blurb: "Coin is a language, and you are fluent.",
    bonus: { wealth: 3, intelligence: 2 },
  },
  {
    id: "outlaw",
    name: "Outlaw",
    blurb: "Quick hands, quicker exits, no master but the night.",
    bonus: { agility: 3, will: 2 },
  },
  {
    id: "cleric",
    name: "Cleric",
    blurb: "The church's word carries where coin and steel cannot.",
    bonus: { will: 3, intelligence: 2 },
  },
  {
    id: "smith",
    name: "Smith",
    blurb: "Honest craft and an arm like a trip-hammer.",
    bonus: { craft: 3, strength: 2 },
  },
];

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: "noble",
    name: "Noble-born",
    blurb: "A name that turns heads, and a purse to match.",
    bonus: { wealth: 2, will: 1 },
    startFlag: "noble_born",
  },
  {
    id: "peasant",
    name: "Peasant",
    blurb: "Raised on the land. Strong back, longer memory.",
    bonus: { strength: 2, craft: 1 },
  },
  {
    id: "foreigner",
    name: "Foreigner",
    blurb: "New to Hollowbrook, and you see what locals miss.",
    bonus: { intelligence: 1, agility: 1, wealth: 1 },
    startFlag: "outsider",
  },
  {
    id: "orphan",
    name: "Orphan",
    blurb: "Brought yourself up. Light-footed and hard to rattle.",
    bonus: { agility: 2, will: 1 },
  },
  {
    id: "guild",
    name: "Guild-raised",
    blurb: "Apprenticed young; a trade and the gossip that comes with it.",
    bonus: { craft: 2, intelligence: 1 },
  },
  {
    id: "soldier",
    name: "Soldier's child",
    blurb: "Camp-raised: handy, watchful, and used to marching orders.",
    bonus: { strength: 1, will: 1, agility: 1 },
  },
];

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
