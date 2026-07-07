"use client";

import { STAT_CAP, STAT_LABELS, STAT_SHORT } from "@/lib/game/constants";
import type { PlayerStats, StatId } from "@/lib/game/types";

/** The +1 / -1 stat-change chips shown after an event resolves: inked tokens. */
export function DeltaChips({ deltas }: { deltas: PlayerStats }) {
  const chips = (Object.keys(STAT_LABELS) as StatId[])
    // Partial deltas happen (stale saves); only real non-zero numbers chip.
    .filter((s) => typeof deltas[s] === "number" && deltas[s] !== 0)
    .map((s) => `${deltas[s] > 0 ? "+" : ""}${deltas[s]} ${STAT_LABELS[s]}`);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip}
          className={`rounded border px-2.5 py-1 font-mono text-xs font-bold tracking-wide ${
            chip.startsWith("-")
              ? "border-red-400/40 bg-red-950/40 text-red-300"
              : "border-amber-400/40 bg-amber-500/10 text-amber-300"
          }`}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

/**
 * The player's six stats, shown as n/cap — a slim inked ledger strip.
 * Stats are visible; gates are not.
 */
export function StatsBar({ stats, big }: { stats: PlayerStats; big?: boolean }) {
  return (
    <div
      className={`flex divide-x divide-bark/60 rounded-md border border-bark bg-oak/60 shadow-inner shadow-black/30 ${
        big ? "px-2 py-2.5" : "px-1 py-2"
      }`}
    >
      {(Object.keys(STAT_SHORT) as StatId[]).map((s) => (
        <span key={s} className={`text-center ${big ? "px-3" : "px-2.5"}`}>
          <span
            className={`font-display block font-semibold leading-tight text-parch-100 ${
              big ? "text-lg" : "text-sm"
            }`}
          >
            {stats[s]}
            <span className="text-parch-600">/{STAT_CAP}</span>
          </span>
          <span
            className={`block text-[9px] uppercase tracking-[0.18em] ${
              s === "wealth" ? "text-amber-400" : "text-parch-500"
            }`}
          >
            {STAT_SHORT[s]}
          </span>
        </span>
      ))}
    </div>
  );
}
