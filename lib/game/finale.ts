import type { PlayerStats } from "./types";

/**
 * The week's ending, chosen from the party's AVERAGE stats. Three shapes,
 * same spirit as the old ink finale — a prosperous week, a steadfast one,
 * or a quiet one — returned as paragraphs the host reveals, last line loud.
 */
export function finaleEnding(avg: PlayerStats): string[] {
  if (avg.wealth >= 3) return PROSPERITY;
  if (avg.will >= 3) return STEADFAST;
  return QUIET;
}

const PROSPERITY = [
  "Fair day dawns and Hollowbrook counts its takings. The market has never moved so much coin; the foreign traders speak of coming back twice a year; the lord's clerks record the best reckoning in a decade — with several of your names in the margins.",
  "Money changes a village. By spring there will be glass in windows that had shutters, and the lanes will argue forever about whether this was the week Hollowbrook was made, or sold.",
  "THE FAIR MAKES HOLLOWBROOK RICH.",
];

const STEADFAST = [
  "Fair day comes and the village meets it on its own feet. The reckoning is honest, the petitions are heard, and when the levy men try one last squeeze at the gate, Hollowbrook answers with one voice and the lord — remarkably — backs it.",
  "Nobody gets rich. But the well gets dug, the bailiff is replaced, and the village walks out of fair week owning itself a little more than it did walking in.",
  "THE VILLAGE STANDS ITS GROUND.",
];

const QUIET = [
  "Fair day comes and goes, dazzles, takes its coin, and folds away into wagons by the following dusk. Work was done, debts were moved around, and nothing happened that will make a ballad.",
  "But quiet weeks are what villages are made of, and the ledger of small kindnesses and small grudges you all wrote this week will still be open come next Michaelmas.",
  "THE WHEEL OF THE YEAR TURNS.",
];
