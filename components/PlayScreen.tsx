"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Art } from "@/components/Art";
import { ChronicleHeading, Plate, Rule } from "@/components/Ornament";
import EventPlayer from "@/components/EventPlayer";
import CharacterCreate from "@/components/CharacterCreate";
import { DeltaChips, StatsBar } from "@/components/StatBits";
import {
  getMyId,
  getMyState,
  joinRoom,
  KEY_CHARACTER,
  KEY_FLAGS,
  KEY_HISTORY,
  KEY_NAME,
  KEY_NOTES,
  KEY_PICK,
  KEY_RESULT,
  KEY_STATS,
  KEY_VOTE,
  playerName,
  sendPing,
  useMyState,
  usePlayers,
  useServerConnection,
} from "@/lib/game/connection";
import {
  DEFAULT_STATS,
  locationDef,
  LOCATIONS,
  nightIntro,
  STAT_CAP,
  STAT_LABELS,
  STAT_SHORT,
} from "@/lib/game/constants";
import { baseStats, roleDef, startingFlags } from "@/lib/game/character";
import { completedStorylines } from "@/lib/game/content";
import { playerEnding } from "@/lib/game/finale";
import {
  useActiveEvent,
  useAssignments,
  useEnding,
  useNight,
  usePhase,
} from "@/lib/game/state";
import type {
  Character,
  LocationPick,
  NightRecord,
  PlayerStats,
  StatId,
  StoryletResult,
} from "@/lib/game/types";

type Status = "form" | "joining" | "joined";

export default function PlayScreen() {
  // Rendered with ssr:false, so window is safe at first render.
  const params = new URLSearchParams(window.location.search);
  const codeFromUrl = (params.get("room") ?? "").toUpperCase();
  const wasKicked = params.get("kicked") === "1";
  const roomLost = params.get("lost") === "1";

  const [roomCode, setRoomCode] = useState(
    codeFromUrl || localStorage.getItem("7n:last-room") || "",
  );
  const [name, setName] = useState(localStorage.getItem("7n:last-name") ?? "");
  const [status, setStatus] = useState<Status>("form");
  const [error, setError] = useState<string | null>(
    wasKicked
      ? "The host removed you from the game."
      : roomLost
        ? "That game has ended or the room expired."
        : null,
  );

  // A refresh mid-game should not need a tap: if this tab was already in a
  // game (per-tab player id exists) and we're not arriving at a *different*
  // room via QR, rejoin silently.
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    if (wasKicked || roomLost) return;
    let hadSession = false;
    try {
      hadSession = sessionStorage.getItem("7n:player-id") !== null;
    } catch {}
    const lastRoom = localStorage.getItem("7n:last-room") ?? "";
    const lastName = localStorage.getItem("7n:last-name") ?? "";
    if (!hadSession || !lastRoom || !lastName) return;
    if (codeFromUrl && codeFromUrl !== lastRoom) return; // scanning a new room
    setStatus("joining");
    joinRoom(lastRoom, lastName).then(
      () => setStatus("joined"),
      () => setStatus("form"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!roomCode.trim() || !name.trim()) return;
    setStatus("joining");
    setError(null);
    try {
      await joinRoom(roomCode, name);
      localStorage.setItem("7n:last-room", roomCode.trim().toUpperCase());
      localStorage.setItem("7n:last-name", name.trim());
      setStatus("joined");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the room");
      setStatus("form");
    }
  }

  if (status === "joined") {
    return <PhoneGame room={roomCode.trim().toUpperCase()} />;
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <ChronicleHeading className="pt-1">St Sebastian</ChronicleHeading>
      <div className="flex flex-1 flex-col items-center justify-center">
        <form onSubmit={handleJoin} className="flex w-full max-w-sm flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-center text-3xl font-black tracking-[0.08em] text-parch-100">
              SEVEN NIGHTS
            </h1>
            <Rule />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-parch-500">
              Room code
            </span>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              autoCapitalize="characters"
              autoComplete="off"
              className="rounded-lg border border-bark-light bg-night/60 px-4 py-3 text-center font-mono text-3xl tracking-[0.5em] text-parch-100 caret-amber-400 shadow-inner shadow-black/50 outline-none transition-colors placeholder:text-parch-600/60 focus:border-amber-400"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-parch-500">
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maria"
              maxLength={16}
              autoComplete="off"
              className="font-prose rounded-lg border border-bark-light bg-night/60 px-4 py-3 text-center text-2xl text-parch-100 caret-amber-400 shadow-inner shadow-black/50 outline-none transition-colors placeholder:text-parch-600/60 focus:border-amber-400"
            />
          </label>
          {error && (
            <p className="font-prose text-center italic text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={status === "joining" || !roomCode.trim() || !name.trim()}
            className="btn-quest w-full py-4 text-base disabled:opacity-40"
          >
            {status === "joining" ? "Joining…" : "Join"}
          </button>
        </form>
      </div>
    </main>
  );
}

// --- Everything below renders only after the room join resolved. ---

function PhoneGame({ room }: { room: string }) {
  const online = useServerConnection();
  const [phase] = usePhase();
  const [night] = useNight();
  const [stats, setStats] = useMyState<PlayerStats | null>(KEY_STATS, null);
  const [flags, setFlags] = useMyState<string[]>(KEY_FLAGS, []);
  const [result, setResult] = useMyState<StoryletResult | null>(KEY_RESULT, null);
  const [history, setHistory] = useMyState<NightRecord[]>(KEY_HISTORY, []);
  const [notes, setNotes] = useMyState<Record<string, string>>(KEY_NOTES, {});
  const [character, setCharacter] = useMyState<Character | null>(
    KEY_CHARACTER,
    null,
  );

  /** Confirm a built character: it sets the starting stats and flags. */
  function confirmCharacter(c: Character) {
    setCharacter(c);
    setStats(baseStats(c));
    setFlags(startingFlags(c));
  }

  // "Play another week" keeps the character but wipes stats/flags. Back in
  // the lobby with a character but no stats, re-roll the starting stats so
  // the same person begins a fresh week.
  useEffect(() => {
    if (phase === "lobby" && character && stats === null) {
      setStats(baseStats(character));
      setFlags(startingFlags(character));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, character, stats]);

  // A finished (or abandoned) week leaves mid-storylet saves behind; if the
  // same room plays again, night 1 would resume a stale story. Lobby = clean.
  useEffect(() => {
    if (phase !== "lobby") return;
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith("7n:save:")) localStorage.removeItem(key);
      }
    } catch {}
  }, [phase]);

  // The night's recovery save has done its job once the night resolves.
  useEffect(() => {
    if (phase !== "resolve") return;
    try {
      localStorage.removeItem(`7n:save:${room}:n${night}`);
    } catch {}
  }, [phase, room, night]);

  // Warm the location art into the browser cache so the choose screen's
  // card backdrops appear instantly. Failures are ignored — art is optional.
  useEffect(() => {
    for (const loc of LOCATIONS) {
      const img = new Image();
      img.src = `/images/locations/${loc.id}.png`;
    }
  }, []);

  // Phones sleeping mid-game is a known party-game killer (spec §8).
  // NOTE: wakeLock needs a secure context — it silently no-ops over plain
  // http on a LAN IP. Only the HTTPS deploy gets real wake locks.
  useEffect(() => {
    let lock: { release(): Promise<void> } | null = null;
    const request = () =>
      (navigator as any).wakeLock
        ?.request("screen")
        .then((l: any) => (lock = l))
        .catch(() => {});
    request();
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  function completeStorylet(r: StoryletResult) {
    // Read latest values via getMyState, not the render closure — Playroom
    // setters don't take functional updaters, and a stale closure here would
    // drop flags or history entries.
    const prevFlags = getMyState<string[]>(KEY_FLAGS) ?? [];
    const prevHistory = getMyState<NightRecord[]>(KEY_HISTORY) ?? [];
    setStats(r.stats);
    setFlags(Array.from(new Set([...prevFlags, ...r.flagsSet])));
    if (r.note) {
      // A note with the same id replaces the old lead; empty text clears it.
      const prevNotes = getMyState<Record<string, string>>(KEY_NOTES) ?? {};
      const nextNotes = { ...prevNotes };
      if (r.note.text.trim()) nextNotes[r.note.id] = r.note.text;
      else delete nextNotes[r.note.id];
      setNotes(nextNotes);
    }
    if (!prevHistory.some((h) => h.night === r.night)) {
      setHistory([
        ...prevHistory,
        {
          night: r.night,
          location: r.location,
          activity: r.activity,
          eventId: r.eventId,
          outcome: r.outcome,
          deltas: r.deltas,
          flagsSet: r.flagsSet,
          threats: r.threats,
        },
      ]);
    }
    setResult(r);
  }

  const effectiveStats = stats ?? DEFAULT_STATS;
  const activeEvent = useActiveEvent(night);

  const screen = renderPhase();
  return (
    <>
      {!online && (
        <div className="fixed inset-x-0 top-0 z-20 bg-red-950/90 py-2 text-center text-sm font-bold text-red-200">
          Connection lost — reconnecting…
        </div>
      )}
      {screen}
    </>
  );

  function renderPhase() {
  switch (phase) {
    case "lobby":
      // Build a character before the week begins. A reconnect that already
      // has one skips straight to the lobby.
      if (!character) {
        return (
          <CharacterCreate initial={character} onConfirm={confirmCharacter} />
        );
      }
      return <PhoneLobby stats={effectiveStats} character={character} />;
    case "prologue":
      return (
        <Waiting
          title="A vision in the dark"
          line="Watch the big screen — the Herald's charge is read aloud."
          stats={effectiveStats}
        />
      );
    case "night-intro":
      return (
        <Waiting
          title={`Week ${night}`}
          line={activeEvent?.introOverride ?? nightIntro(night)}
          stats={effectiveStats}
          notes={notes}
        />
      );
    case "choose-location":
      return (
        <PhoneChoose
          night={night}
          stats={effectiveStats}
          closed={activeEvent?.closedLocation ?? null}
          notes={notes}
        />
      );
    case "storylets":
      return (
        <PhoneStorylet
          room={room}
          night={night}
          stats={effectiveStats}
          flags={flags}
          history={history}
          result={result}
          notes={notes}
          onComplete={completeStorylet}
        />
      );
    case "resolve":
      return (
        <Waiting
          title="The week resolves"
          line="Watch the screen…"
          stats={effectiveStats}
          deltas={result?.night === night ? result.deltas : undefined}
          notes={notes}
        />
      );
    case "finale":
      return <PhoneFinale stats={effectiveStats} />;
    case "epilogue":
      return (
        <PhoneEpilogue stats={effectiveStats} flags={flags} history={history} />
      );
    default:
      // A phase this build doesn't know (a stale room written by another
      // build). Never render nothing — hold calmly until the host resets.
      return (
        <Waiting
          title="Seven Nights"
          line="Watch the big screen…"
          stats={effectiveStats}
        />
      );
    }
  }
}

function PhoneLobby({
  stats,
  character,
}: {
  stats: PlayerStats;
  character: Character;
}) {
  const [waved, setWaved] = useState(0);
  const myName = getMyState<string>(KEY_NAME);
  const role = roleDef(character.role);
  return (
    <main className="flex min-h-screen flex-col p-6">
      <ChronicleHeading className="pt-1">St Sebastian</ChronicleHeading>
      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        <div className="flex flex-col items-center text-center">
          {/* The player's woodcut portrait — a round sealed plate. Missing
              art collapses the whole plate; the screen stays intact. */}
          <Plate
            src={`/images/roles/${character.role}.png`}
            className="float mb-4 rounded-full"
            imgClassName="h-24 w-24 rounded-full object-cover object-top sepia-[.15]"
          />
          <p className="font-prose text-xl text-parch-200">
            You're in{myName ? `, ${myName}` : ""}.
          </p>
          {role && (
            <p className="font-display mt-1 text-lg tracking-wide text-amber-400">
              {role.name}
            </p>
          )}
          <p className="font-prose mt-1 text-sm italic text-parch-500">
            Watch the big screen.
          </p>
        </div>
        <button
          onClick={() => {
            sendPing();
            setWaved((n) => n + 1);
            if (navigator.vibrate) navigator.vibrate(50);
          }}
          className="font-display h-44 w-44 rounded-full border-4 border-double border-amber-300/60 bg-amber-500 text-2xl font-bold tracking-[0.12em] text-night shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
        >
          WAVE
        </button>
        <p className="font-mono text-sm text-parch-500">
          {waved === 0 ? "Tap to wave at the screen" : `Waved ${waved}×`}
        </p>
        <StatsBar stats={stats} />
      </div>
    </main>
  );
}

function PhoneChoose({
  night,
  stats,
  closed,
  notes,
}: {
  night: number;
  stats: PlayerStats;
  closed: string | null;
  notes: Record<string, string>;
}) {
  const [pick, setPick] = useMyState<LocationPick | null>(KEY_PICK, null);
  const [assignments] = useAssignments();
  const locked = assignments !== null;
  const current = pick?.night === night ? pick.location : null;

  return (
    <main className="flex min-h-screen flex-col gap-4 p-5">
      <ChronicleHeading className="pt-1">St Sebastian</ChronicleHeading>
      <h1 className="font-display text-center text-xl font-bold tracking-wide text-parch-100">
        Week {night} · Where will you go?
      </h1>
      <NotesPanel notes={notes} />
      <div className="grid grid-cols-2 gap-3">
        {LOCATIONS.map((loc) => {
          const isClosed = loc.id === closed;
          return (
            <button
              key={loc.id}
              disabled={locked || isClosed}
              onClick={() => setPick({ night, location: loc.id })}
              className={`relative isolate min-h-[5.75rem] overflow-hidden rounded-xl border p-4 text-left transition-transform last:odd:col-span-2 ${
                isClosed
                  ? "border-red-900/60 opacity-40"
                  : current === loc.id
                    ? "scale-[1.02] border-gold bg-amber-500/10 ring-1 ring-gold/50"
                    : "border-bark-light bg-oak"
              } ${locked && !isClosed ? "opacity-60" : ""} ${
                !locked && !isClosed ? "active:bg-bark" : ""
              }`}
            >
              {/* Woodcut backdrop at whisper opacity — zero height cost,
                  and a missing file leaves the card exactly as before. */}
              <Art
                src={`/images/locations/${loc.id}.png`}
                className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-25 sepia-[.25]"
              />
              <span className="font-display block text-sm font-semibold uppercase tracking-[0.1em] text-parch-100">
                {loc.name}
              </span>
              <span className="font-prose block text-sm italic leading-snug text-parch-400">
                {isClosed ? "Closed tonight." : loc.blurb}
              </span>
            </button>
          );
        })}
      </div>
      <p className="font-prose text-center italic text-parch-400">
        {locked
          ? "Locked in. The week begins…"
          : current
            ? `Heading to ${locationDef(current).name}. Tap another to change.`
            : "Tap a place to spend the week."}
      </p>
      <div className="flex justify-center pb-2">
        <StatsBar stats={stats} />
      </div>
    </main>
  );
}

function PhoneStorylet({
  room,
  night,
  stats,
  flags,
  history,
  result,
  notes,
  onComplete,
}: {
  room: string;
  night: number;
  stats: PlayerStats;
  flags: string[];
  history: NightRecord[];
  result: StoryletResult | null;
  notes: Record<string, string>;
  onComplete: (r: StoryletResult) => void;
}) {
  const [assignments] = useAssignments();
  const myLocation = assignments?.[getMyId()] ?? null;

  if (result?.night === night) {
    return (
      <Waiting
        title="Your week is over"
        line="Watch the screen — the others are still out there."
        stats={stats}
        deltas={result.deltas}
        notes={notes}
      />
    );
  }
  if (!myLocation) {
    return (
      <Waiting
        title="Sit this one out"
        line="You joined mid-week; you're in from the next one."
        stats={stats}
      />
    );
  }
  return (
    <EventPlayer
      playerId={getMyId()}
      night={night}
      location={myLocation}
      stats={stats}
      flags={flags}
      history={history}
      saveKey={`7n:save:${room}:n${night}`}
      onComplete={onComplete}
    />
  );
}

function PhoneFinale({ stats }: { stats: PlayerStats }) {
  const players = usePlayers();
  const [vote, setVote] = useMyState<string | null>(KEY_VOTE, null);
  const [ending] = useEnding();
  const myId = getMyId();
  const others = players.filter((p) => p.id !== myId);

  return (
    <main className="flex min-h-screen flex-col gap-5 p-6">
      <ChronicleHeading className="pt-1">St Sebastian</ChronicleHeading>
      <h1 className="font-display text-center text-2xl font-bold tracking-wide text-parch-100">
        The week is over
      </h1>
      {ending && (
        <p className="font-prose text-center italic text-parch-400">
          {ending[ending.length - 1]}
        </p>
      )}
      <p className="font-prose text-center text-lg text-parch-300">
        One last thing: whose week was the wildest?
      </p>
      <div className="flex flex-col gap-3">
        {(others.length > 0 ? others : players).map((p) => (
          <button
            key={p.id}
            onClick={() => setVote(p.id)}
            className={`font-display rounded-xl border px-5 py-4 text-center text-lg tracking-wide ${
              vote === p.id
                ? "border-gold bg-amber-500/10 text-parch-100 ring-1 ring-gold/50"
                : "border-bark-light bg-oak text-parch-200 active:bg-bark"
            }`}
          >
            {playerName(p)}
          </button>
        ))}
      </div>
      <p className="font-prose text-center italic text-parch-500">
        {vote ? "Vote cast. You can change it until the host ends the week." : "Tap to vote."}
      </p>
      <div className="flex justify-center pb-2">
        <StatsBar stats={stats} />
      </div>
    </main>
  );
}

function PhoneEpilogue({
  stats,
  flags,
  history,
}: {
  stats: PlayerStats;
  flags: string[];
  history: NightRecord[];
}) {
  const week = [...history].sort((a, b) => a.night - b.night);
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-6 py-10">
      <ChronicleHeading>St Sebastian</ChronicleHeading>
      <h1 className="font-display -mt-2 text-3xl font-bold tracking-wide text-parch-100">
        Your seven weeks
      </h1>
      <StatsBar stats={stats} big />
      <div className="story-prose max-w-md text-center">
        <p className="text-lg leading-relaxed text-parch-200">
          {playerEnding(flags)}
        </p>
      </div>
      {completedStorylines(flags).map((s) => (
        <div
          key={s.id}
          className="relative w-full max-w-md rounded-lg border border-gold/40 bg-oak/70 px-5 pb-4 pt-6 text-center shadow-lg shadow-black/40"
        >
          {/* The letter's wax seal. */}
          <span
            aria-hidden
            className="absolute -top-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-red-800 shadow ring-2 ring-red-950/70"
          />
          <p className="font-display mb-1 text-lg tracking-wide text-amber-400">
            {s.title}
          </p>
          <p className="font-prose text-sm leading-relaxed text-parch-200">
            {s.ending}
          </p>
        </div>
      ))}
      {week.length > 0 && (
        <>
          <Rule />
          <ol className="w-full max-w-md divide-y divide-bark/50 border-y border-bark/50">
            {week.map((h) => (
              <li key={h.night} className="px-2 py-2.5 text-center text-sm">
                <span className="font-display text-base font-bold text-gold">
                  W{h.night}
                </span>{" "}
                <span className="font-display tracking-wide text-parch-300">
                  {locationDef(h.location).name}
                </span>
                <span className="font-prose block italic text-parch-400">
                  You {h.outcome}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
      {flags.length > 0 && (
        <div className="text-center">
          <p className="font-display mb-2 text-xs font-bold uppercase tracking-[0.25em] text-parch-500">
            What the weeks left on you
          </p>
          <p className="font-prose italic text-parch-300">
            {flags.map((f) => f.replaceAll("_", " ")).join(" · ")}
          </p>
        </div>
      )}
      <Rule />
      <p className="font-prose -mt-2 italic text-parch-500">
        Thanks for playing the prototype.
      </p>
    </main>
  );
}

function Waiting({
  title,
  line,
  stats,
  deltas,
  notes,
}: {
  title: string;
  line: string;
  stats: PlayerStats;
  deltas?: PlayerStats;
  notes?: Record<string, string>;
}) {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <ChronicleHeading className="pt-1">St Sebastian</ChronicleHeading>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <h1 className="font-display text-3xl font-bold tracking-wide text-parch-100">
          {title}
        </h1>
        <Rule className="-mt-3" />
        <p className="font-prose max-w-xs text-lg italic leading-relaxed text-parch-300">
          {line}
        </p>
        {deltas && <DeltaChips deltas={deltas} />}
        {notes && <NotesPanel notes={notes} />}
        <StatsBar stats={stats} />
      </div>
    </main>
  );
}

/**
 * The player's standing leads — notes storyline beats leave behind ("a big
 * shipment lands at the docks come week 3"). Shown while waiting and while
 * choosing where to spend the week, so a lead can actually be acted on.
 */
function NotesPanel({ notes }: { notes: Record<string, string> }) {
  const lines = Object.values(notes).filter((t) => t.trim());
  if (lines.length === 0) return null;
  return (
    // A parchment scrap pinned to the page: dark ink on pale paper, a wax pin.
    <div className="relative mx-auto w-full max-w-sm -rotate-1 rounded-sm bg-parch-100/95 px-4 pb-3 pt-4 shadow-lg shadow-black/40">
      <span
        aria-hidden
        className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-red-800 shadow ring-1 ring-red-950/60"
      />
      <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-bark">
        ✎ Your notes
      </p>
      {lines.map((t, i) => (
        <p
          key={i}
          className="font-prose text-center text-sm italic leading-snug text-oak"
        >
          {t}
        </p>
      ))}
    </div>
  );
}

