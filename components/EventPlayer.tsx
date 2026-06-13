"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DeltaChips } from "@/components/StatBits";
import {
  activitiesFor,
  applyEffect,
  pickEvent,
  resolveEffect,
  selectionSeed,
} from "@/lib/game/events";
import { locationDef } from "@/lib/game/constants";
import type {
  EventEffect,
  GameEvent,
  LocationId,
  NightRecord,
  PlayerStats,
  StoryletResult,
} from "@/lib/game/types";

interface Props {
  playerId: string;
  night: number;
  location: LocationId;
  stats: PlayerStats;
  flags: string[];
  history: NightRecord[];
  saveKey: string;
  onComplete: (result: StoryletResult) => void;
}

/** Persisted so a phone refresh resumes mid-night without re-rolling. */
interface SaveBlob {
  activityId: string;
  chosenIndex: number | null;
  revealed: boolean;
}

type Stage = "activity" | "event" | "outcome";

export default function EventPlayer({
  playerId,
  night,
  location,
  stats,
  flags,
  history,
  saveKey,
  onComplete,
}: Props) {
  const activities = useMemo(() => activitiesFor(location), [location]);
  const seen = useMemo(() => history.map((h) => h.eventId), [history]);

  const [activityId, setActivityId] = useState<string | null>(null);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Restore an in-progress night after a refresh.
  useEffect(() => {
    const saved = readSave(saveKey);
    if (saved) {
      setActivityId(saved.activityId);
      setChosenIndex(saved.chosenIndex);
      setRevealed(saved.revealed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The event is a pure function of (player, night, activity) + what's been
  // seen/unlocked — so it's identical before and after a refresh.
  const event: GameEvent | null = useMemo(() => {
    if (!activityId) return null;
    const seed = selectionSeed(playerId, night, activityId);
    return pickEvent(location, activityId, flags, seen, seed, night);
    // flags/seen are stable for the duration of one night's resolution.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, location, night, playerId]);

  const resolved: EventEffect | null = useMemo(() => {
    if (!event) return null;
    return resolveEffect(event, stats, chosenIndex ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, chosenIndex]);

  const stage: Stage = !activityId
    ? "activity"
    : event?.choices && chosenIndex === null
      ? "event"
      : revealed
        ? "outcome"
        : event?.choices
          ? "outcome"
          : "event";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stage, activityId, chosenIndex, revealed]);

  function persist(blob: SaveBlob) {
    try {
      localStorage.setItem(saveKey, JSON.stringify(blob));
    } catch {
      // Storage blocked: recovery degrades, play continues.
    }
  }

  function chooseActivity(id: string) {
    setActivityId(id);
    persist({ activityId: id, chosenIndex: null, revealed: false });
  }

  function chooseOption(index: number) {
    setChosenIndex(index);
    persist({ activityId: activityId!, chosenIndex: index, revealed: true });
  }

  function reveal() {
    setRevealed(true);
    persist({ activityId: activityId!, chosenIndex, revealed: true });
  }

  function finish() {
    if (!event || !resolved) return;
    const { stats: nextStats, deltas } = applyEffect(stats, resolved);
    onComplete({
      night,
      location,
      activity: activityId!,
      eventId: event.id,
      outcome: resolved.outcome,
      stats: nextStats,
      deltas,
      flagsSet: resolved.flags ?? [],
    });
  }

  const locName = locationDef(location).name;

  return (
    <main className="flex min-h-screen flex-col p-6">
      <p className="font-display mb-4 text-center text-base uppercase tracking-widest text-amber-400">
        {locName}
      </p>

      {stage === "activity" && (
        <div className="flex flex-1 flex-col">
          <p className="story-prose mb-6 text-lg leading-relaxed text-parch-200">
            The night is yours. What will you do here?
          </p>
          <div className="mt-auto flex flex-col gap-3 pb-4">
            {activities.map((a) => (
              <button
                key={a.id}
                onClick={() => chooseActivity(a.id)}
                className="rounded-xl border border-amber-500/50 bg-oak px-5 py-4 text-left active:bg-bark"
              >
                <span className="block text-lg font-semibold text-parch-100">
                  {a.name}
                </span>
                <span className="block text-sm text-parch-400">{a.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "event" && event && (
        <div className="flex flex-1 flex-col">
          <div className="story-prose flex flex-col gap-4 pb-6">
            <p className="text-lg leading-relaxed text-parch-100">{event.text}</p>
          </div>
          {event.choices ? (
            <div className="mt-auto flex flex-col gap-3 pb-4">
              {event.choices.map((c, i) => (
                <button
                  key={i}
                  onClick={() => chooseOption(i)}
                  className="rounded-xl border border-amber-500/50 bg-oak px-5 py-4 text-left text-lg font-semibold text-parch-100 active:bg-bark"
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={reveal}
              className="mt-auto rounded-xl bg-bark px-5 py-4 text-lg font-bold text-parch-200 active:bg-bark-light"
            >
              Continue…
            </button>
          )}
        </div>
      )}

      {stage === "outcome" && resolved && (
        <div className="flex flex-1 flex-col">
          <div className="story-prose flex flex-col gap-4 pb-4">
            {event && !event.choices && (
              <p className="text-base leading-relaxed text-parch-400">
                {event.text}
              </p>
            )}
            <p className="text-lg leading-relaxed text-parch-100">
              {resolved.text}
            </p>
          </div>
          <div className="mb-6 flex justify-center">
            <DeltaChips deltas={fullDelta(stats, resolved)} />
          </div>
          <button
            onClick={finish}
            className="font-display mt-auto rounded-xl bg-amber-500 px-5 py-4 text-xl text-night active:bg-amber-400"
          >
            Sleep on it →
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </main>
  );
}

/** The delta the outcome will produce, for the chips (before it's applied). */
function fullDelta(stats: PlayerStats, effect: EventEffect): PlayerStats {
  return applyEffect(stats, effect).deltas;
}

function readSave(saveKey: string): SaveBlob | null {
  try {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return null;
    const blob = JSON.parse(raw) as SaveBlob;
    if (typeof blob.activityId !== "string") return null;
    return blob;
  } catch {
    return null;
  }
}
