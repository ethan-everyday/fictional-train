"use client";

import { useEffect, useRef, useState } from "react";
import { getStoryContent } from "@/lib/ink/loadStory";
import { StoryletSession } from "@/lib/ink/storylet";
import type {
  LocationId,
  PlayerStats,
  StoryletResult,
  UiChoice,
} from "@/lib/game/types";
import { locationDef } from "@/lib/game/constants";

interface Props {
  night: number;
  location: LocationId;
  stats: PlayerStats;
  flags: string[];
  /** Previous nights this player spent at this location (0 = first visit). */
  visits: number;
  /** localStorage key for mid-storylet recovery after a phone refresh. */
  saveKey: string;
  onComplete: (result: StoryletResult) => void;
}

interface SaveBlob {
  inkState: string;
  revealed: string[];
  startStats: PlayerStats;
}

export default function StoryletPlayer({
  night,
  location,
  stats,
  flags,
  visits,
  saveKey,
  onComplete,
}: Props) {
  const sessionRef = useRef<StoryletSession | null>(null);
  const revealedRef = useRef<string[]>([]);
  const statsRef = useRef<PlayerStats>(stats);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [choices, setChoices] = useState<UiChoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoryContent()
      .then((content) => {
        if (cancelled || sessionRef.current) return;
        const saved = readSave(saveKey);
        if (saved) {
          sessionRef.current = StoryletSession.restore(
            content,
            saved.inkState,
            saved.startStats,
          );
          revealedRef.current = saved.revealed;
          setRevealed(saved.revealed);
        } else {
          sessionRef.current = StoryletSession.begin(
            content,
            locationDef(location).knot,
            stats,
            flags,
            { night, visits },
          );
        }
        setLoaded(true);
        advance();
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [revealed, choices]);

  function persist() {
    const session = sessionRef.current;
    if (!session) return;
    const blob: SaveBlob = {
      inkState: session.save(),
      revealed: revealedRef.current,
      startStats: statsRef.current,
    };
    try {
      localStorage.setItem(saveKey, JSON.stringify(blob));
    } catch {
      // Storage full or blocked: recovery degrades, play continues.
    }
  }

  function advance() {
    const session = sessionRef.current;
    if (!session) return;
    const step = session.step(statsRef.current);
    if (step.kind === "paragraph") {
      revealedRef.current = [...revealedRef.current, step.text];
      setRevealed(revealedRef.current);
      setChoices(null);
      persist();
    } else if (step.kind === "choices") {
      setChoices(step.choices);
      persist();
    } else {
      try {
        localStorage.removeItem(saveKey);
      } catch {}
      onComplete({
        night,
        location,
        outcome: step.outcome,
        stats: step.finalStats,
        deltas: session.deltas(step.finalStats),
        flagsSet: step.flagsSet,
      });
    }
  }

  function choose(choice: UiChoice) {
    const session = sessionRef.current;
    if (!session || choice.disabled) return;
    session.choose(choice.index);
    setChoices(null);
    advance();
  }

  if (error) {
    return <p className="p-6 text-center text-red-400">{error}</p>;
  }
  if (!loaded) {
    return (
      <p className="animate-pulse p-6 text-center text-zinc-400">
        The night begins…
      </p>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-6">
      <p className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-amber-400">
        {locationDef(location).name}
      </p>
      <div className="flex flex-col gap-4 pb-6">
        {revealed.map((text, i) => (
          <p
            key={i}
            className={`text-lg leading-relaxed ${
              i === revealed.length - 1 ? "text-zinc-100" : "text-zinc-400"
            }`}
          >
            {text}
          </p>
        ))}
      </div>

      {choices ? (
        <div className="mt-auto flex flex-col gap-3 pb-4">
          {choices.map((choice) => (
            <button
              key={choice.index}
              onClick={() => choose(choice)}
              disabled={choice.disabled}
              className={`rounded-xl border px-5 py-4 text-left text-lg font-semibold ${
                choice.disabled
                  ? "border-zinc-800 text-zinc-600"
                  : "border-amber-500/60 bg-zinc-900 text-zinc-100 active:bg-zinc-800"
              }`}
            >
              {choice.text}
              {choice.requirement && (
                <span
                  className={`mt-1 block text-sm font-normal ${
                    choice.disabled ? "text-red-400/80" : "text-emerald-400/80"
                  }`}
                >
                  {choice.requirement}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={advance}
          className="mt-auto rounded-xl bg-zinc-800 px-5 py-4 pb-4 text-lg font-bold text-zinc-200 active:bg-zinc-700"
        >
          Continue…
        </button>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function readSave(saveKey: string): SaveBlob | null {
  try {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return null;
    const blob = JSON.parse(raw) as SaveBlob;
    if (!blob.inkState || !Array.isArray(blob.revealed)) return null;
    // A blob without startStats would make every delta NaN downstream.
    if (typeof blob.startStats?.mind !== "number") return null;
    return blob;
  } catch {
    return null;
  }
}
