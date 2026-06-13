import type { PlayerStats } from "./types";

/**
 * The fate of St Sebastian, decided by what the WHOLE party achieved over the
 * seven weeks. Each player carries flags (set by events); the town's fate is
 * scored across three axes — Defence, Plague, Food — plus whether anyone gave
 * themselves to the dark, and whether the Herald's secret was found.
 *
 * The flags below are the "spine": events across the locations set them, and
 * this is the one place that reads them. Tune the thresholds freely.
 */

const DEFENCE = ["walls_repaired", "garrison_rallied", "militia_armed", "gate_secured"];
const PLAGUE = ["quarantine_set", "dead_burned", "healers_organized", "plague_source_found"];
const FOOD = ["granary_filled", "hoarders_broken", "forage_secured"];

export interface PartyMember {
  stats: PlayerStats;
  flags: string[];
}

/** The town's ending paragraphs (last line is the loud one). */
export function townEnding(party: PartyMember[]): string[] {
  const f = new Set(party.flatMap((p) => p.flags));
  const count = (keys: string[]) => keys.filter((k) => f.has(k)).length;
  const def = count(DEFENCE);
  const plg = count(PLAGUE);
  const food = count(FOOD);
  const dark = f.has("turned_to_darkness");
  const secret = f.has("secret_found") || f.has("herald_favour");

  if (dark && def + plg === 0) return ANARCHY;
  if (def === 0) return BURNT;
  if (plg === 0) return PLAGUE_SHELL;
  if (def >= 2 && plg >= 2 && food >= 2 && secret) return BEACON;
  if (def >= 2 && plg >= 2 && food >= 1) return HOLDS;
  if (def >= 1 && plg >= 1 && food === 0) return STARVATION;
  return REPEL_BUT_PLAGUE;
}

/** A closing line for one player, from the choices they alone made. */
export function playerEnding(flags: string[]): string {
  const f = new Set(flags);
  if (f.has("passage_secured"))
    return "You bought your passage and watched St Sebastian shrink to a smudge of smoke behind the ship. You lived. That would have to be enough.";
  if (f.has("turned_to_darkness"))
    return "Somewhere in the long dark you stopped fighting it. There was a place for you in the ruin that came — and you took it.";
  if (f.has("herald_favour"))
    return "The red eyes found you worthy. What reward such a patron grants, you would learn soon enough — for good or ill.";
  if (f.has("secret_found"))
    return "You alone learned what the town truly guarded. The knowing of it changed you.";
  return "You stayed to the end, and faced it on your feet. In a year like this one, that was its own kind of victory.";
}

const BURNT = [
  "The walls were never made ready, and the warband did not knock. They came over the undefended stretch at dusk and the town was theirs by full dark.",
  "St Sebastian burns. The screaming does not last as long as you would think.",
  "THE TOWN IS PUT TO THE TORCH.",
];

const PLAGUE_SHELL = [
  "The gates held. The blades were ready. None of it mattered: the sickness was already inside, and no one had thought to stop it.",
  "By the time the warband turns away — finding nothing left worth taking — St Sebastian is a town of shuttered houses and unburied dead. A shell, breathing faintly.",
  "THE PLAGUE HOLLOWS THE TOWN TO A SHELL.",
];

const ANARCHY = [
  "Nothing was held. Nothing was healed. In the dark the town ate itself — neighbour against neighbour in the streets, and behind his barred doors the lord set a long table and learned a new and terrible appetite.",
  "When the red eyes look again upon St Sebastian, they are well pleased.",
  "ANARCHY REIGNS. THE DARK HAS WON.",
];

const REPEL_BUT_PLAGUE = [
  "The walls held and the warband broke against them, dragging its dying back into the dark. A victory — paid for in a coin no one counted until after.",
  "For the plague was loose within, and it took its tithe street by street through the long winter. The town survives. So much of the town does not.",
  "THE RAIDERS ARE THROWN BACK; THE SICKNESS IS NOT.",
];

const STARVATION = [
  "The walls held; the sickness was checked; the warband found a town that would not break and slunk away to die elsewhere.",
  "But no one had filled the granaries, and a defended town is still a hungry one. The dying slows but does not stop, and St Sebastian crawls toward spring on empty bellies.",
  "THE TOWN IS SAVED, AND STARVES.",
];

const HOLDS = [
  "Walls manned, sick quarantined, mouths fed — barely, on all three. When the warband came, St Sebastian met it whole, and when the sickness rose, the town had hands enough to bury and to heal.",
  "It was the narrowest of margins. But the gate stayed shut, and behind it the people lived.",
  "ST SEBASTIAN HOLDS BACK THE DARK. BARELY.",
];

const BEACON = [
  "Walls, healers, granaries, and the thing the Herald sought, all secured before the end. When the dark came down on the whole of the world, it broke upon this one town and went around.",
  "Word spreads of a place that did not fall. Refugees turn their carts toward St Sebastian, and find its gates open and its fires lit — a single light held up against a continent of ash.",
  "ST SEBASTIAN BECOMES A BEACON IN THE LONG NIGHT.",
];
