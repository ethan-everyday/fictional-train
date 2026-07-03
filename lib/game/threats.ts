import type { ThreatDeltas, ThreatId, ThreatScores } from "./types";
import { THREAT_CAP, THREAT_TICKS } from "./constants";

/**
 * The threat engine: pure functions over the town's four doom tracks.
 * No sockets, no React — just numbers, like events.ts.
 *
 * The rhythm: each arriving week TICKS every track up (exponentially — see
 * THREAT_TICKS), and each resolved night applies whatever relief or harm the
 * players' outcomes carried. Any track still at the cap when the finale
 * comes claims its toll on St Sebastian.
 */

const THREAT_IDS: ThreatId[] = ["plague", "starvation", "war", "devils"];

function clamp(n: number): number {
  return Math.max(0, Math.min(THREAT_CAP, n));
}

/** The rise that comes with a week's arrival: += THREAT_TICKS[week - 1],
 * clamped to 0..THREAT_CAP. Week 1 costs nothing; week 7 costs dearly. */
export function tickThreats(t: ThreatScores, week: number): ThreatScores {
  const tick = THREAT_TICKS[week - 1] ?? 0;
  const next = {} as ThreatScores;
  for (const id of THREAT_IDS) next[id] = clamp((t[id] ?? 0) + tick);
  return next;
}

/** Sum a night's worth of deltas onto the tracks, clamped. Negative deltas
 * are the party buying the town time; positive ones are recklessness. */
export function applyThreatDeltas(
  t: ThreatScores,
  deltas: ThreatDeltas[],
): ThreatScores {
  const next = {} as ThreatScores;
  for (const id of THREAT_IDS) {
    let value = t[id] ?? 0;
    for (const d of deltas) value += d[id] ?? 0;
    next[id] = clamp(value);
  }
  return next;
}

/** The tracks that have hit the cap — the dooms that WILL land at the end. */
export function maxedThreats(t: ThreatScores): ThreatId[] {
  return THREAT_IDS.filter((id) => (t[id] ?? 0) >= THREAT_CAP);
}
