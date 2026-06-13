"use client";

import { STAT_CAP, STAT_LABELS, STAT_SHORT } from "@/lib/game/constants";
import type { PlayerStats, StatId } from "@/lib/game/types";

/** The +1 / -1 stat-change chips shown after an event resolves. */
export function DeltaChips({ deltas }: { deltas: PlayerStats }) {
  const chips = (Object.keys(STAT_LABELS) as StatId[])
    .filter((s) => deltas[s] !== 0)
    .map((s) => `${deltas[s] > 0 ? "+" : ""}${deltas[s]} ${STAT_LABELS[s]}`);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip}
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            chip.startsWith("-")
              ? "bg-rose-500/20 text-rose-300"
              : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

/** The player's six stats, shown as n/cap. Stats are visible; gates are not. */
export function StatsBar({ stats, big }: { stats: PlayerStats; big?: boolean }) {
  return (
    <div
      className={`flex gap-3 rounded-xl border border-bark bg-oak/60 px-4 py-3 ${
        big ? "text-base" : "text-xs"
      }`}
    >
      {(Object.keys(STAT_SHORT) as StatId[]).map((s) => (
        <span key={s} className="text-center">
          <span className="block font-mono font-bold text-parch-100">
            {stats[s]}
            <span className="text-parch-600">/{STAT_CAP}</span>
          </span>
          <span className={s === "wealth" ? "text-amber-400" : "text-parch-500"}>
            {STAT_SHORT[s]}
          </span>
        </span>
      ))}
    </div>
  );
}
