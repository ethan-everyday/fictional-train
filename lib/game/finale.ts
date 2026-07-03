import type { PlayerStats, ThreatId, ThreatScores } from "./types";
import { maxedThreats } from "./threats";

/**
 * The fate of St Sebastian, decided by the four threat tracks the party
 * spent seven weeks holding back. Any track still at the cap when the end
 * comes lands its doom in full; the tier of the ending is simply HOW MANY
 * dooms landed — none is a triumph, all four is annihilation.
 *
 * Player flags still colour the edges: the Herald's secret can turn a clean
 * sweep into a beacon, and a soul given to the dark makes the devils' work
 * the more personal.
 */

export interface PartyMember {
  stats: PlayerStats;
  flags: string[];
}

/** The town's ending paragraphs (last line is the loud one). */
export function townEnding(
  party: PartyMember[],
  threats: ThreatScores,
): string[] {
  const f = new Set(party.flatMap((p) => p.flags));
  const maxed = maxedThreats(threats);
  const dark = f.has("turned_to_darkness");
  const secret = f.has("secret_found") || f.has("herald_favour");

  // A clean sweep with the Herald's secret in hand is the best of all ends.
  if (maxed.length === 0) return secret ? BEACON : FULL_SUCCESS;

  const tier = TIERS[Math.min(maxed.length, 4)];
  const paragraphs: string[] = [tier.opener];
  for (const id of maxed) {
    paragraphs.push(id === "devils" && dark ? DEVILS_DARKENED : VIGNETTES[id]);
  }
  paragraphs.push(tier.lastLine);
  return paragraphs;
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

// --- Tier openers and last lines (index = number of dooms that landed) ---

const TIERS: { opener: string; lastLine: string }[] = [
  {
    // 0 maxed — full success (the flagless version; see BEACON above).
    opener:
      "Seven weeks the dark pressed on St Sebastian, and seven weeks it found the town ready. The sick were tended, the granaries watched, the walls manned, the shadows swept. When the end came for the whole of the world, it could find no purchase here.",
    lastLine: "ST SEBASTIAN STANDS. NOT ONE DOOM CAME HOME.",
  },
  {
    // 1 maxed — minor success.
    opener:
      "The town holds — bruised, thinner, quieter than it was, but holding. Seven weeks of work turned aside almost every doom that came for it. Almost.",
    lastLine: "ST SEBASTIAN SURVIVES — AND CARRIES ONE SCAR FOREVER.",
  },
  {
    // 2 maxed — minor failure.
    opener:
      "You fought for the town, and the town knows it. But two of the dooms were never truly answered, and in the last weeks they came home together, each feeding the other in the streets.",
    lastLine: "ST SEBASTIAN ENDURES, BUT IT WILL NOT BE CALLED LUCKY.",
  },
  {
    // 3 maxed — major failure.
    opener:
      "What was done was not enough — not near enough. Three of the four dooms landed with their full weight, and no town in the world stands under three at once. What is left of St Sebastian is a name, a wall, and the people who could not leave.",
    lastLine: "ST SEBASTIAN FALLS IN ALL BUT NAME.",
  },
  {
    // 4 maxed — utter failure.
    opener:
      "Nothing was held. Nothing was healed, fed, defended, or driven out. The four dooms came down on St Sebastian together, and they did not quarrel over the spoils — there was ruin enough for all of them.",
    lastLine: "ST SEBASTIAN IS WIPED FROM THE MAP. UTTER RUIN.",
  },
];

// --- One vignette per doom that landed ---

const VIGNETTES: Record<ThreatId, string> = {
  plague:
    "The sick were never dealt with. The pest moved from the docks to the slums to every parish, faster than the carts could carry, and the pits beyond the wall grew wider week on week until no one troubled to count the dead.",
  starvation:
    "The food was never sorted. The granaries stood empty, the hoarders kept their locks, and hunger did its patient work — the kind of dying that makes no sound and spares no one small.",
  war:
    "The walls were never made ready for the warband. It came over the weak stretch at dusk, desperate and dying and vicious for it, and took in one night what the town had spent a hundred years building.",
  devils:
    "The dark took root. It had asked so little — a bargain here, a blind eye there — and by the last week it walked the streets openly, red-eyed and patient, and the town had nothing left to bar against it.",
};

/** The devils vignette when one of the party gave themselves to it. */
const DEVILS_DARKENED =
  "The dark took root — and it did not force the door, for one of your own company held it open. It knew the town's weak places because it had been told them, kindly, by a familiar voice, and by the last week the red eyes looked out of a face the town once trusted.";

// --- Full success, with the Herald's secret in hand ---

const FULL_SUCCESS_LINES = TIERS[0];

const BEACON = [
  "Seven weeks the dark pressed on St Sebastian, and seven weeks it found the town ready — the sick tended, the granaries full, the walls manned, the shadows swept. And beneath it all, the thing the Herald sought, found and held before the end.",
  "Word spreads of a place that did not fall. Refugees turn their carts toward St Sebastian, and find its gates open and its fires lit — a single light held up against a continent of ash.",
  "ST SEBASTIAN BECOMES A BEACON IN THE LONG NIGHT.",
];

const FULL_SUCCESS = [
  FULL_SUCCESS_LINES.opener,
  "It was the narrowest of margins, bought a night at a time by people who owed the town nothing. When the warband's smoke drifts elsewhere and the carts stop coming, St Sebastian is still standing to see the spring.",
  FULL_SUCCESS_LINES.lastLine,
];
