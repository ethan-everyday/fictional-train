"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import StoryletPlayer from "@/components/StoryletPlayer";
import {
  getMyId,
  getMyState,
  joinRoom,
  KEY_FLAGS,
  KEY_HISTORY,
  KEY_NAME,
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
import {
  useActiveEvent,
  useAssignments,
  useEnding,
  useNight,
  usePhase,
} from "@/lib/game/state";
import type {
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

  const [roomCode, setRoomCode] = useState(
    codeFromUrl || localStorage.getItem("7n:last-room") || "",
  );
  const [name, setName] = useState(localStorage.getItem("7n:last-name") ?? "");
  const [status, setStatus] = useState<Status>("form");
  const [error, setError] = useState<string | null>(
    wasKicked ? "The host removed you from the game." : null,
  );

  // A refresh mid-game should not need a tap: if this tab was already in a
  // game (per-tab player id exists) and we're not arriving at a *different*
  // room via QR, rejoin silently.
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    if (wasKicked) return;
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
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <form onSubmit={handleJoin} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-center text-3xl font-black tracking-tight">
          SEVEN NIGHTS
        </h1>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-zinc-400">Room code</span>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            autoCapitalize="characters"
            autoComplete="off"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center font-mono text-2xl tracking-[0.3em] outline-none focus:border-amber-400"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-zinc-400">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Maria"
            maxLength={16}
            autoComplete="off"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-2xl outline-none focus:border-amber-400"
          />
        </label>
        {error && <p className="text-center text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={status === "joining" || !roomCode.trim() || !name.trim()}
          className="rounded-xl bg-amber-500 px-6 py-4 text-xl font-bold text-zinc-950 disabled:opacity-40"
        >
          {status === "joining" ? "Joining…" : "Join"}
        </button>
      </form>
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

  // First join: give the player their starting stats.
  useEffect(() => {
    if (stats === null) setStats(DEFAULT_STATS);
  }, [stats, setStats]);

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
    if (!prevHistory.some((h) => h.night === r.night)) {
      setHistory([
        ...prevHistory,
        {
          night: r.night,
          location: r.location,
          outcome: r.outcome,
          deltas: r.deltas,
          flagsSet: r.flagsSet,
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
      return <PhoneLobby stats={effectiveStats} />;
    case "night-intro":
      return (
        <Waiting
          title={`Night ${night}`}
          line={activeEvent?.introOverride ?? nightIntro(night)}
          stats={effectiveStats}
        />
      );
    case "choose-location":
      return (
        <PhoneChoose
          night={night}
          stats={effectiveStats}
          closed={activeEvent?.closedLocation ?? null}
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
          eventId={activeEvent?.id ?? ""}
          result={result}
          onComplete={completeStorylet}
        />
      );
    case "resolve":
      return (
        <Waiting
          title="The night resolves"
          line="Watch the screen…"
          stats={effectiveStats}
          deltas={result?.night === night ? result.deltas : undefined}
        />
      );
    case "finale":
      return <PhoneFinale stats={effectiveStats} />;
    case "epilogue":
      return (
        <PhoneEpilogue stats={effectiveStats} flags={flags} history={history} />
      );
    }
  }
}

function PhoneLobby({ stats }: { stats: PlayerStats }) {
  const [waved, setWaved] = useState(0);
  const myName = getMyState<string>(KEY_NAME);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <p className="text-center text-xl text-zinc-300">
        You're in{myName ? `, ${myName}` : ""}. Watch the big screen.
      </p>
      <button
        onClick={() => {
          sendPing();
          setWaved((n) => n + 1);
          if (navigator.vibrate) navigator.vibrate(50);
        }}
        className="h-44 w-44 rounded-full bg-amber-500 text-3xl font-black text-zinc-950 shadow-lg shadow-amber-500/30 active:scale-95"
      >
        WAVE
      </button>
      <p className="font-mono text-sm text-zinc-500">
        {waved === 0 ? "Tap to wave at the screen" : `Waved ${waved}×`}
      </p>
      <StatsBar stats={stats} />
    </main>
  );
}

function PhoneChoose({
  night,
  stats,
  closed,
}: {
  night: number;
  stats: PlayerStats;
  closed: string | null;
}) {
  const [pick, setPick] = useMyState<LocationPick | null>(KEY_PICK, null);
  const [assignments] = useAssignments();
  const locked = assignments !== null;
  const current = pick?.night === night ? pick.location : null;

  return (
    <main className="flex min-h-screen flex-col gap-4 p-5">
      <h1 className="text-center text-2xl font-black">
        Night {night} · Where will you go?
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {LOCATIONS.map((loc) => {
          const isClosed = loc.id === closed;
          return (
            <button
              key={loc.id}
              disabled={locked || isClosed}
              onClick={() => setPick({ night, location: loc.id })}
              className={`rounded-xl border p-4 text-left ${
                isClosed
                  ? "border-red-900/60 opacity-40"
                  : current === loc.id
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-zinc-700 bg-zinc-900"
              } ${locked && !isClosed ? "opacity-60" : ""} ${
                !locked && !isClosed ? "active:bg-zinc-800" : ""
              }`}
            >
              <span className="block font-bold">{loc.name}</span>
              <span className="block text-sm text-zinc-400">
                {isClosed ? "Closed tonight." : loc.blurb}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-center text-zinc-400">
        {locked
          ? "Locked in. The night begins…"
          : current
            ? `Heading to ${locationDef(current).name}. Tap another to change.`
            : "Tap a place to spend the night."}
      </p>
      <StatsBar stats={stats} />
    </main>
  );
}

function PhoneStorylet({
  room,
  night,
  stats,
  flags,
  history,
  eventId,
  result,
  onComplete,
}: {
  room: string;
  night: number;
  stats: PlayerStats;
  flags: string[];
  history: NightRecord[];
  eventId: string;
  result: StoryletResult | null;
  onComplete: (r: StoryletResult) => void;
}) {
  const [assignments] = useAssignments();
  const myLocation = assignments?.[getMyId()] ?? null;
  const visits = myLocation
    ? history.filter((h) => h.location === myLocation).length
    : 0;

  if (result?.night === night) {
    return (
      <Waiting
        title="Your night is over"
        line="Watch the screen — the others are still out there."
        stats={stats}
        deltas={result.deltas}
      />
    );
  }
  if (!myLocation) {
    return (
      <Waiting
        title="Sit this one out"
        line="You joined mid-night; you're in from the next one."
        stats={stats}
      />
    );
  }
  return (
    <StoryletPlayer
      night={night}
      location={myLocation}
      stats={stats}
      flags={flags}
      visits={visits}
      eventId={eventId}
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
      <h1 className="text-center text-2xl font-black">The week is over</h1>
      {ending && (
        <p className="text-center italic text-zinc-400">{ending[ending.length - 1]}</p>
      )}
      <p className="text-center text-lg text-zinc-300">
        One last thing: whose week was the wildest?
      </p>
      <div className="flex flex-col gap-3">
        {(others.length > 0 ? others : players).map((p) => (
          <button
            key={p.id}
            onClick={() => setVote(p.id)}
            className={`rounded-xl border px-5 py-4 text-lg font-bold ${
              vote === p.id
                ? "border-amber-400 bg-amber-500/10"
                : "border-zinc-700 bg-zinc-900 active:bg-zinc-800"
            }`}
          >
            {playerName(p)}
          </button>
        ))}
      </div>
      <p className="text-center text-zinc-500">
        {vote ? "Vote cast. You can change it until the host ends the week." : "Tap to vote."}
      </p>
      <StatsBar stats={stats} />
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
      <h1 className="text-3xl font-black">Your week</h1>
      <StatsBar stats={stats} big />
      {week.length > 0 && (
        <ol className="flex w-full max-w-md flex-col gap-2">
          {week.map((h) => (
            <li
              key={h.night}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm"
            >
              <span className="font-mono font-bold text-amber-400">
                N{h.night}
              </span>{" "}
              <span className="font-bold text-zinc-300">
                {locationDef(h.location).name}
              </span>
              <span className="block text-zinc-400">You {h.outcome}</span>
            </li>
          ))}
        </ol>
      )}
      {flags.length > 0 && (
        <div className="text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
            Marks the week left on you
          </p>
          <p className="text-zinc-300">
            {flags.map((f) => f.replaceAll("_", " ")).join(" · ")}
          </p>
        </div>
      )}
      <p className="text-zinc-500">Thanks for playing the prototype.</p>
    </main>
  );
}

function Waiting({
  title,
  line,
  stats,
  deltas,
}: {
  title: string;
  line: string;
  stats: PlayerStats;
  deltas?: PlayerStats;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="max-w-xs text-lg text-zinc-400">{line}</p>
      {deltas && <DeltaChips deltas={deltas} />}
      <StatsBar stats={stats} />
    </main>
  );
}

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

function StatsBar({ stats, big }: { stats: PlayerStats; big?: boolean }) {
  return (
    <div
      className={`flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 ${
        big ? "text-base" : "text-xs"
      }`}
    >
      {(Object.keys(STAT_SHORT) as StatId[]).map((s) => (
        <span key={s} className="text-center">
          <span className="block font-mono font-bold text-zinc-100">
            {stats[s]}
            <span className="text-zinc-600">/{STAT_CAP}</span>
          </span>
          <span className={s === "wealth" ? "text-amber-400" : "text-zinc-500"}>
            {STAT_SHORT[s]}
          </span>
        </span>
      ))}
    </div>
  );
}
