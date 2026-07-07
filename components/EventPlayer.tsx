"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChronicleHeading, Plate, Rule } from "@/components/Ornament";
import { DeltaChips } from "@/components/StatBits";
import {
  activitiesFor,
  applyEffect,
  choiceRoll,
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
  ThreatDeltas,
  ThreatId,
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
    // The random-choice roll is seeded like event selection, so the same
    // save blob resolves to the same fate after a refresh.
    const rand01 =
      chosenIndex !== null && activityId
        ? choiceRoll(playerId, night, activityId, chosenIndex)
        : undefined;
    return resolveEffect(event, stats, chosenIndex ?? undefined, rand01);
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
      threats: resolved.threats,
      note: resolved.note,
    });
  }

  const locName = locationDef(location).name;

  return (
    <main className="flex min-h-screen flex-col p-6">
      <ChronicleHeading className="mb-5 pt-1">{locName}</ChronicleHeading>

      {stage === "activity" && (
        <div className="flex flex-1 flex-col">
          <div className="story-prose mb-6">
            <p className="text-lg leading-relaxed text-parch-200">
              The night is yours. What will you do here?
            </p>
          </div>
          {/* A framed woodcut of tonight's haunt fills the middle of the page;
              Plate degrades to nothing if the file is missing, so the buttons
              simply drift down and the screen stays intact. */}
          <div className="my-auto flex justify-center py-4">
            <Plate
              src={`/images/locations/${location}.png`}
              className="w-56 rotate-1"
              imgClassName="w-full"
            />
          </div>
          <div className="mt-auto flex flex-col gap-3 pb-4">
            {activities.map((a) => (
              <button
                key={a.id}
                onClick={() => chooseActivity(a.id)}
                className="btn-parch w-full flex-col items-start gap-0.5 px-5 py-4 text-left normal-case tracking-normal"
              >
                <span className="font-display block w-full text-base tracking-wide text-parch-100">
                  {a.name}
                </span>
                <span className="font-prose block w-full text-sm italic leading-snug text-parch-400">
                  {a.blurb}
                </span>
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
                  className="font-prose btn-parch w-full justify-start px-5 py-4 text-left text-base normal-case tracking-normal text-parch-100"
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={reveal} className="btn-quest mt-auto w-full py-4 text-base">
              Continue…
            </button>
          )}
        </div>
      )}

      {stage === "outcome" && resolved && (
        <div className="flex flex-1 flex-col">
          <div className="story-prose flex flex-col gap-4 pb-4">
            {event && !event.choices && (
              <p className="text-lg leading-relaxed text-parch-400">
                {event.text}
              </p>
            )}
            <p className="text-lg leading-relaxed text-parch-100">
              {resolved.text}
            </p>
          </div>
          <Rule className="mb-4" />
          <div className="mb-6 flex flex-col items-center gap-3">
            <DeltaChips deltas={fullDelta(stats, resolved)} />
            <ThreatLines threats={resolved.threats} />
          </div>
          <button onClick={finish} className="btn-quest mt-auto w-full py-4 text-base">
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

// One quiet line per threat the outcome touched — eased or fed.
const THREAT_EASED: Record<ThreatId, string> = {
  plague: "The town's plague-burden eases.",
  starvation: "The town will eat a little longer.",
  war: "The town stands a little readier for the warband.",
  devils: "The dark loses a little of its footing.",
};

const THREAT_FED: Record<ThreatId, string> = {
  plague: "The sickness tightens its grip on the town.",
  starvation: "The town's stores run thinner.",
  war: "The town is left less ready for what marches on it.",
  devils: "The dark grows bolder.",
};

/** Small centred lines under the stat chips: what tonight did to the town. */
function ThreatLines({ threats }: { threats?: ThreatDeltas }) {
  if (!threats) return null;
  const lines = (Object.keys(threats) as ThreatId[])
    .filter((id) => typeof threats[id] === "number" && threats[id] !== 0)
    .map((id) => ({
      id,
      text: (threats[id]! < 0 ? THREAT_EASED : THREAT_FED)[id],
      eased: threats[id]! < 0,
    }));
  if (lines.length === 0) return null;
  return (
    <div className="flex flex-col items-center gap-1">
      {lines.map((l) => (
        <p
          key={l.id}
          className={`font-prose text-center text-sm italic ${
            l.eased ? "text-amber-200/90" : "text-red-300"
          }`}
        >
          {l.text}
        </p>
      ))}
    </div>
  );
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
