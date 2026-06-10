"use client";

import { FormEvent, useEffect, useState } from "react";
import StoryletPlayer from "@/components/StoryletPlayer";
import {
  getMyId,
  getMyState,
  joinRoom,
  KEY_FLAGS,
  KEY_NAME,
  KEY_PICK,
  KEY_RESULT,
  KEY_STATS,
  KEY_VOTE,
  playerName,
  sendPing,
  useMyState,
  usePlayers,
} from "@/lib/game/connection";
import {
  DEFAULT_STATS,
  locationDef,
  LOCATIONS,
  nightIntro,
  STAT_LABELS,
} from "@/lib/game/constants";
import {
  useAssignments,
  useEnding,
  useNight,
  usePhase,
} from "@/lib/game/state";
import type {
  LocationPick,
  PlayerStats,
  StatId,
  StoryletResult,
} from "@/lib/game/types";

type Status = "form" | "joining" | "joined";

export default function PlayScreen() {
  // Rendered with ssr:false, so window is safe at first render.
  const codeFromUrl = (
    new URLSearchParams(window.location.search).get("room") ?? ""
  ).toUpperCase();

  const [roomCode, setRoomCode] = useState(
    codeFromUrl || localStorage.getItem("7n:last-room") || "",
  );
  const [name, setName] = useState(localStorage.getItem("7n:last-name") ?? "");
  const [status, setStatus] = useState<Status>("form");
  const [error, setError] = useState<string | null>(null);

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
  const [phase] = usePhase();
  const [night] = useNight();
  const [stats, setStats] = useMyState<PlayerStats | null>(KEY_STATS, null);
  const [flags, setFlags] = useMyState<string[]>(KEY_FLAGS, []);
  const [result, setResult] = useMyState<StoryletResult | null>(KEY_RESULT, null);

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
    setStats(r.stats);
    setFlags(Array.from(new Set([...flags, ...r.flagsSet])));
    setResult(r);
  }

  const effectiveStats = stats ?? DEFAULT_STATS;

  switch (phase) {
    case "lobby":
      return <PhoneLobby stats={effectiveStats} />;
    case "night-intro":
      return (
        <Waiting title={`Night ${night}`} line={nightIntro(night)} stats={effectiveStats} />
      );
    case "choose-location":
      return <PhoneChoose night={night} stats={effectiveStats} />;
    case "storylets":
      return (
        <PhoneStorylet
          room={room}
          night={night}
          stats={effectiveStats}
          flags={flags}
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
      return <PhoneEpilogue stats={effectiveStats} flags={flags} />;
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

function PhoneChoose({ night, stats }: { night: number; stats: PlayerStats }) {
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
        {LOCATIONS.map((loc) => (
          <button
            key={loc.id}
            disabled={locked}
            onClick={() => setPick({ night, location: loc.id })}
            className={`rounded-xl border p-4 text-left ${
              current === loc.id
                ? "border-amber-400 bg-amber-500/10"
                : "border-zinc-700 bg-zinc-900"
            } ${locked ? "opacity-60" : "active:bg-zinc-800"}`}
          >
            <span className="block font-bold">{loc.name}</span>
            <span className="block text-sm text-zinc-400">{loc.blurb}</span>
          </button>
        ))}
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
  result,
  onComplete,
}: {
  room: string;
  night: number;
  stats: PlayerStats;
  flags: string[];
  result: StoryletResult | null;
  onComplete: (r: StoryletResult) => void;
}) {
  const [assignments] = useAssignments();
  const myLocation = assignments?.[getMyId()] ?? null;

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

function PhoneEpilogue({ stats, flags }: { stats: PlayerStats; flags: string[] }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-black">Your week</h1>
      <StatsBar stats={stats} big />
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
            chip.includes("Shadow") && chip.startsWith("+")
              ? "bg-purple-500/20 text-purple-300"
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
      className={`flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3 ${
        big ? "text-lg" : "text-sm"
      }`}
    >
      {(Object.keys(STAT_LABELS) as StatId[]).map((s) => (
        <span key={s} className="text-center">
          <span className="block font-mono font-bold text-zinc-100">
            {stats[s]}
          </span>
          <span
            className={s === "shadow" ? "text-purple-400" : "text-zinc-500"}
          >
            {STAT_LABELS[s]}
          </span>
        </span>
      ))}
    </div>
  );
}
