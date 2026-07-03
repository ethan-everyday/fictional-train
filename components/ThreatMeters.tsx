"use client";

import {
  THREAT_BLURBS,
  THREAT_CAP,
  THREAT_LABELS,
} from "@/lib/game/constants";
import type { ThreatId, ThreatScores } from "@/lib/game/types";

/** Display order for the four dooms, everywhere they appear. */
const THREAT_ORDER: ThreatId[] = ["plague", "starvation", "war", "devils"];

/** Host-facing drama line shown under a meter when the weekly tick lands. */
const RISE_LINES: Record<ThreatId, string> = {
  plague: "Plague tightens its grip",
  starvation: "Starvation gnaws deeper",
  war: "War draws closer",
  devils: "The devils grow bolder",
};

/**
 * Segment colour ramps amber → red as the meter climbs; a maxed meter burns
 * solid red (and pulses, via the wrapper).
 */
function segmentClass(index: number, filled: boolean, maxed: boolean): string {
  if (!filled) return "bg-bark";
  if (maxed) return "bg-red-500";
  if (index < 4) return "bg-amber-400";
  if (index < 7) return "bg-orange-400";
  if (index < 9) return "bg-orange-600";
  return "bg-red-500";
}

/** The 10-segment bar itself. Purely decorative; label text carries the value. */
function Meter({
  score,
  maxed,
  compact = false,
}: {
  score: number;
  maxed: boolean;
  compact?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`flex items-center ${compact ? "gap-[2px]" : "gap-1"} ${
        maxed ? "animate-pulse" : ""
      }`}
    >
      {Array.from({ length: THREAT_CAP }, (_, i) => (
        <span
          key={i}
          className={`${
            compact ? "h-1.5 w-1.5 rounded-full" : "h-3 w-5 rounded-sm"
          } ${segmentClass(i, i < score, maxed)}`}
        />
      ))}
    </span>
  );
}

/**
 * Full variant, for the night-intro and the finale: a centred vertical stack,
 * one row per threat — name, 10-segment meter, score. When `tick` > 0 each
 * still-live threat shows its rise line ("Plague tightens its grip (+2)");
 * a maxed threat shows its grim blurb instead — its fate is sealed.
 */
export function ThreatMeters({
  threats,
  tick = 0,
}: {
  threats: ThreatScores;
  tick?: number;
}) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5">
      {THREAT_ORDER.map((id) => {
        const score = threats[id] ?? 0;
        const maxed = score >= THREAT_CAP;
        return (
          <div
            key={id}
            className="flex flex-col items-center gap-1.5 text-center"
            aria-label={`${THREAT_LABELS[id]}: ${score} of ${THREAT_CAP}`}
          >
            <p
              className={`font-display text-lg uppercase tracking-[0.25em] ${
                maxed ? "text-red-400" : "text-parch-300"
              }`}
            >
              {THREAT_LABELS[id]}
            </p>
            <div className="flex items-center gap-3">
              <Meter score={score} maxed={maxed} />
              <span
                className={`font-mono text-lg font-bold ${
                  maxed ? "text-red-400" : "text-parch-400"
                }`}
              >
                {score}
                <span className="text-parch-600">/{THREAT_CAP}</span>
              </span>
            </div>
            {maxed ? (
              <p className="max-w-md text-sm text-red-300/90">
                {THREAT_BLURBS[id]}
              </p>
            ) : tick > 0 ? (
              <p className="text-sm text-red-300/80">
                {RISE_LINES[id]}{" "}
                <span className="font-mono font-bold">(+{tick})</span>
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact variant, for persistent display on the choose-location and resolve
 * screens: a single centred, wrapping row of four small chips. A maxed threat
 * turns its chip red and pulses.
 */
export function ThreatMetersCompact({ threats }: { threats: ThreatScores }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {THREAT_ORDER.map((id) => {
        const score = threats[id] ?? 0;
        const maxed = score >= THREAT_CAP;
        return (
          <span
            key={id}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
              maxed ? "border-red-500/60 bg-red-950/40" : "border-bark bg-oak/60"
            }`}
            aria-label={`${THREAT_LABELS[id]}: ${score} of ${THREAT_CAP}`}
          >
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                maxed ? "text-red-400" : "text-parch-500"
              }`}
            >
              {THREAT_LABELS[id]}
            </span>
            <Meter score={score} maxed={maxed} compact />
            <span
              className={`font-mono text-xs font-bold ${
                maxed ? "text-red-400" : "text-parch-300"
              }`}
            >
              {score}
            </span>
          </span>
        );
      })}
    </div>
  );
}
