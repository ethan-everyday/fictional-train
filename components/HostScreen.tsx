"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { DeltaChips } from "@/components/PlayScreen";
import {
  playerColor,
  playerName,
  startHost,
  usePings,
  usePlayers,
  type PlayerState,
} from "@/lib/game/connection";
import {
  locationDef,
  LOCATIONS,
  NIGHT_COUNT,
  NIGHT_INTRO_MS,
  nightIntro,
  RESOLVE_BEAT_MS,
  STAT_LABELS,
} from "@/lib/game/constants";
import {
  backToLobby,
  beginChooseLocation,
  beginEpilogue,
  beginResolve,
  beginStorylets,
  endNight,
  getPublishedEnding,
  playerFlags,
  playerPick,
  playerResult,
  playerStats,
  playerVote,
  publishEnding,
  startGame,
  useAssignments,
  useDeadline,
  useEnding,
  useNight,
  usePhase,
} from "@/lib/game/state";
import { getStoryContent } from "@/lib/ink/loadStory";
import { runToEnd } from "@/lib/ink/storylet";
import type { PlayerStats, StatId } from "@/lib/game/types";

// How long a ping keeps a player's row lit on the lobby screen.
const PING_FLASH_MS = 1500;
const HOST_ROOM_KEY = "7n:host-room";
const HOST_ROOM_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export default function HostScreen() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Rejoin our last room after a host refresh; Playroom keeps the room
    // (and all shared state) alive, so the game resumes where it was.
    startHost(readSavedRoom() ?? undefined).then((code) => {
      localStorage.setItem(
        HOST_ROOM_KEY,
        JSON.stringify({ code, at: Date.now() }),
      );
      setRoomCode(code);
    }, (e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Centered>
        <p className="text-2xl text-red-400">Could not open a room: {error}</p>
      </Centered>
    );
  }
  if (!roomCode) {
    return (
      <Centered>
        <p className="animate-pulse text-3xl text-zinc-400">Opening room…</p>
      </Centered>
    );
  }
  return <HostGame roomCode={roomCode} />;
}

function readSavedRoom(): string | null {
  try {
    const raw = localStorage.getItem(HOST_ROOM_KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw) as { code: string; at: number };
    return Date.now() - at < HOST_ROOM_MAX_AGE_MS ? code : null;
  } catch {
    return null;
  }
}

/**
 * The turn machine driver. This component (and only this component) calls
 * the phase transitions in /lib/game/state; phones just render shared state.
 */
function HostGame({ roomCode }: { roomCode: string }) {
  const [phase] = usePhase();
  const [night] = useNight();
  const players = usePlayers();
  const [deadline] = useDeadline();
  const [assignments] = useAssignments();

  // One-shot guard so transition effects can't double-fire while the local
  // echo of a setState is still in flight.
  const fired = useRef(new Set<string>());
  function once(key: string, fn: () => void) {
    if (fired.current.has(key)) return;
    fired.current.add(key);
    fn();
  }

  // night-intro: title card, then on to choosing.
  useEffect(() => {
    if (phase !== "night-intro") return;
    const id = setTimeout(
      () => once(`choose-${night}`, beginChooseLocation),
      NIGHT_INTRO_MS,
    );
    return () => clearTimeout(id);
  }, [phase, night]);

  // choose-location: advance when everyone picked or the soft timer expires.
  const now = useClock(phase === "choose-location" ? 500 : 0);
  useEffect(() => {
    if (phase !== "choose-location" || players.length === 0) return;
    const allPicked = players.every((p) => playerPick(p, night));
    const expired = deadline > 0 && now >= deadline;
    if (allPicked || expired) {
      once(`storylets-${night}`, () => beginStorylets(players, night));
    }
  }, [phase, players, night, deadline, now]);

  // storylets: resolve once every connected assigned player has reported.
  useEffect(() => {
    if (phase !== "storylets" || !assignments) return;
    const assigned = players.filter((p) => assignments[p.id]);
    if (assigned.length > 0 && assigned.every((p) => playerResult(p, night))) {
      once(`resolve-${night}`, beginResolve);
    }
  }, [phase, players, assignments, night]);

  switch (phase) {
    case "lobby":
      return <LobbyScreen roomCode={roomCode} players={players} />;
    case "night-intro":
      return (
        <Centered>
          <div className="text-center">
            <h1 className="text-8xl font-black tracking-tight">
              NIGHT {night}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-2xl text-zinc-400">
              {nightIntro(night)}
            </p>
          </div>
        </Centered>
      );
    case "choose-location":
      return (
        <ChooseScreen
          night={night}
          players={players}
          deadline={deadline}
          now={now}
        />
      );
    case "storylets":
      return (
        <StoryletsScreen night={night} players={players} assignments={assignments} />
      );
    case "resolve":
      return <ResolveScreen key={night} night={night} players={players} />;
    case "finale":
      return <FinaleScreen players={players} />;
    case "epilogue":
      return <EpilogueScreen players={players} />;
  }
}

/** Re-render every `intervalMs`; returns the current time. 0 = off. */
function useClock(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!intervalMs) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// ------------------------------------------------------------------ LOBBY

function LobbyScreen({
  roomCode,
  players,
}: {
  roomCode: string;
  players: PlayerState[];
}) {
  const pings = usePings();
  const joinUrl = `${window.location.origin}/play?room=${roomCode}`;
  const now = useClock(500);
  const pingByPlayer = new Map(pings.map(({ player, ping }) => [player.id, ping]));

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-10">
      <header className="text-center">
        <h1 className="text-3xl font-black tracking-tight text-zinc-400">
          SEVEN NIGHTS
        </h1>
        <p className="mt-4 text-2xl text-zinc-300">Join on your phone</p>
        <p className="my-2 font-mono text-8xl font-black tracking-[0.2em] text-amber-400">
          {roomCode}
        </p>
        <p className="text-lg text-zinc-500">{joinUrl}</p>
      </header>

      <div className="rounded-2xl bg-white p-4">
        <QRCodeSVG value={joinUrl} size={180} />
      </div>

      <section className="w-full max-w-2xl">
        <h2 className="mb-4 text-center text-xl font-bold text-zinc-400">
          {players.length === 0
            ? "Waiting for players…"
            : `${players.length} player${players.length === 1 ? "" : "s"} ready`}
        </h2>
        <ul className="flex flex-col gap-3">
          {players.map((player) => {
            const ping = pingByPlayer.get(player.id) ?? null;
            const waved = ping !== null && now - ping.at < PING_FLASH_MS;
            return (
              <li
                key={`${player.id}-${ping?.count ?? 0}`}
                className={`flex items-center justify-between rounded-xl border border-zinc-800 px-6 py-3 text-2xl ${
                  waved ? "ping-flash" : ""
                }`}
              >
                <span className="flex items-center gap-4 font-bold">
                  <PlayerDot player={player} />
                  {playerName(player)}
                </span>
                {waved && <span className="font-mono text-amber-400">waves!</span>}
              </li>
            );
          })}
        </ul>
        {players.length > 0 && (
          <button
            onClick={() => startGame()}
            className="mx-auto mt-8 block rounded-xl bg-amber-500 px-12 py-4 text-2xl font-black text-zinc-950 hover:bg-amber-400"
          >
            BEGIN THE WEEK
          </button>
        )}
        {players.length === 1 && (
          <p className="mt-2 text-center text-sm text-zinc-500">
            (Solo works for testing; it's better with 2–6.)
          </p>
        )}
      </section>
    </main>
  );
}

// ----------------------------------------------------------------- CHOOSE

function ChooseScreen({
  night,
  players,
  deadline,
  now,
}: {
  night: number;
  players: PlayerState[];
  deadline: number;
  now: number;
}) {
  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));
  return (
    <main className="flex min-h-screen flex-col gap-8 p-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-4xl font-black">
          Night {night} · Where is everyone going?
        </h1>
        <span
          className={`font-mono text-4xl font-bold ${
            secondsLeft <= 10 ? "text-red-400" : "text-zinc-400"
          }`}
        >
          {secondsLeft}s
        </span>
      </header>
      <div className="grid flex-1 grid-cols-3 gap-5">
        {LOCATIONS.map((loc) => {
          const here = players.filter((p) => playerPick(p, night) === loc.id);
          return (
            <div
              key={loc.id}
              className={`flex flex-col rounded-2xl border p-6 ${
                here.length > 0
                  ? "border-amber-500/60 bg-amber-500/5"
                  : "border-zinc-800"
              }`}
            >
              <h2 className="text-2xl font-bold">{loc.name}</h2>
              <p className="text-zinc-400">{loc.blurb}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {here.map((p) => (
                  <PlayerChip key={p.id} player={p} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xl text-zinc-400">
        {players.filter((p) => playerPick(p, night)).length} of {players.length}{" "}
        decided · stragglers get sent somewhere random
      </p>
    </main>
  );
}

// -------------------------------------------------------------- STORYLETS

function StoryletsScreen({
  night,
  players,
  assignments,
}: {
  night: number;
  players: PlayerState[];
  assignments: Record<string, string> | null;
}) {
  const assigned = players.filter((p) => assignments?.[p.id]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-10">
      <h1 className="text-5xl font-black text-zinc-300">
        Night {night} unfolds…
      </h1>
      <ul className="flex w-full max-w-3xl flex-col gap-4">
        {assigned.map((p) => {
          const done = playerResult(p, night) !== null;
          const loc = locationDef(assignments![p.id] as never);
          return (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 px-6 py-4 text-2xl"
            >
              <span className="flex items-center gap-4">
                <PlayerDot player={p} />
                <span>
                  <span className="font-bold">{playerName(p)}</span>
                  <span className="text-zinc-400"> is at {loc.name}…</span>
                </span>
              </span>
              <span
                className={done ? "text-emerald-400" : "animate-pulse text-zinc-600"}
              >
                {done ? "✓" : "…"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-zinc-500">
        Their phones know things this screen doesn't.
      </p>
    </main>
  );
}

// ---------------------------------------------------------------- RESOLVE

function ResolveScreen({
  night,
  players,
}: {
  night: number;
  players: PlayerState[];
}) {
  const results = useMemo(
    () =>
      players
        .map((p) => ({ player: p, result: playerResult(p, night) }))
        .filter((r) => r.result !== null)
        .sort((a, b) => playerName(a.player).localeCompare(playerName(b.player))),
    [players, night],
  );
  const [shown, setShown] = useState(1);
  const advanced = useRef(false);

  useEffect(() => {
    if (shown <= results.length) {
      const id = setTimeout(() => setShown((n) => n + 1), RESOLVE_BEAT_MS);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      if (!advanced.current) {
        advanced.current = true;
        endNight(night);
      }
    }, RESOLVE_BEAT_MS);
    return () => clearTimeout(id);
  }, [shown, results.length, night]);

  return (
    <main className="flex min-h-screen flex-col gap-8 p-10">
      <h1 className="text-center text-4xl font-black text-zinc-300">
        Night {night} · What happened out there
      </h1>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
        {results.slice(0, shown).map(({ player, result }) => (
          <div
            key={player.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <p className="text-2xl leading-snug">
              <span className="font-black" style={{ color: playerColor(player) }}>
                {playerName(player)}
              </span>{" "}
              <span className="text-zinc-200">{result!.outcome}</span>
            </p>
            <div className="mt-3">
              <DeltaChips deltas={result!.deltas} />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          if (!advanced.current) {
            advanced.current = true;
            endNight(night);
          }
        }}
        className="mx-auto rounded-xl border border-zinc-700 px-8 py-3 text-lg text-zinc-400 hover:border-zinc-500"
      >
        {night >= NIGHT_COUNT ? "To the finale →" : `On to night ${night + 1} →`}
      </button>
    </main>
  );
}

// ----------------------------------------------------------------- FINALE

function FinaleScreen({ players }: { players: PlayerState[] }) {
  const [ending] = useEnding();

  // Run the finale knot exactly once, on the party's average stats, and
  // publish it to shared state so it survives a host refresh.
  useEffect(() => {
    if (players.length === 0 || getPublishedEnding()) return;
    getStoryContent().then((content) => {
      if (getPublishedEnding()) return;
      const avg = averageStats(players.map(playerStats));
      publishEnding(runToEnd(content, "finale", avg));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  const votes = new Map<string, number>();
  for (const p of players) {
    const v = playerVote(p);
    if (v) votes.set(v, (votes.get(v) ?? 0) + 1);
  }
  const voted = players.filter((p) => playerVote(p)).length;

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-10">
      <h1 className="text-5xl font-black">THE SEVENTH NIGHT ENDS</h1>
      <div className="max-w-3xl space-y-5 text-center">
        {ending ? (
          ending.map((p, i) => (
            <p
              key={i}
              className={
                i === ending.length - 1
                  ? "pt-2 text-3xl font-black tracking-wide text-amber-400"
                  : "text-2xl text-zinc-300"
              }
            >
              {p}
            </p>
          ))
        ) : (
          <p className="animate-pulse text-2xl text-zinc-500">
            Hollowbrook adds up the week…
          </p>
        )}
      </div>

      <section className="mt-4 w-full max-w-2xl">
        <h2 className="mb-3 text-center text-xl font-bold text-zinc-400">
          Whose week was the wildest? · {voted}/{players.length} voted
        </h2>
        <ul className="flex flex-col gap-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 px-6 py-3 text-xl"
            >
              <span className="flex items-center gap-3 font-bold">
                <PlayerDot player={p} />
                {playerName(p)}
              </span>
              <span className="font-mono text-amber-400">
                {"★".repeat(votes.get(p.id) ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <button
        onClick={() => beginEpilogue()}
        className="rounded-xl bg-amber-500 px-10 py-4 text-xl font-black text-zinc-950 hover:bg-amber-400"
      >
        END THE WEEK
      </button>
    </main>
  );
}

function averageStats(all: PlayerStats[]): PlayerStats {
  const sum = all.reduce(
    (acc, s) => ({
      mind: acc.mind + s.mind,
      body: acc.body + s.body,
      charm: acc.charm + s.charm,
      shadow: acc.shadow + s.shadow,
    }),
    { mind: 0, body: 0, charm: 0, shadow: 0 },
  );
  const n = Math.max(1, all.length);
  return {
    mind: Math.round(sum.mind / n),
    body: Math.round(sum.body / n),
    charm: Math.round(sum.charm / n),
    shadow: Math.round(sum.shadow / n),
  };
}

// --------------------------------------------------------------- EPILOGUE

function EpilogueScreen({ players }: { players: PlayerState[] }) {
  const votes = new Map<string, number>();
  for (const p of players) {
    const v = playerVote(p);
    if (v) votes.set(v, (votes.get(v) ?? 0) + 1);
  }
  const wildest = players.reduce<PlayerState | null>(
    (best, p) =>
      (votes.get(p.id) ?? 0) > (best ? votes.get(best.id) ?? 0 : 0) ? p : best,
    null,
  );

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 p-10">
      <h1 className="text-5xl font-black">SEVEN NIGHTS, SURVIVED</h1>
      {wildest && (
        <p className="text-2xl text-zinc-300">
          The village agrees:{" "}
          <span className="font-black text-amber-400">{playerName(wildest)}</span>{" "}
          had the wildest week.
        </p>
      )}
      <table className="w-full max-w-3xl border-separate border-spacing-y-2 text-xl">
        <thead>
          <tr className="text-left text-sm uppercase tracking-widest text-zinc-500">
            <th className="px-4">Player</th>
            {(Object.keys(STAT_LABELS) as StatId[]).map((s) => (
              <th key={s} className="px-4 text-center">
                {STAT_LABELS[s]}
              </th>
            ))}
            <th className="px-4 text-center">Marks</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const stats = playerStats(p);
            return (
              <tr key={p.id} className="rounded-xl bg-zinc-900/60">
                <td className="flex items-center gap-3 rounded-l-xl px-4 py-3 font-bold">
                  <PlayerDot player={p} />
                  {playerName(p)}
                </td>
                {(Object.keys(STAT_LABELS) as StatId[]).map((s) => (
                  <td key={s} className="px-4 text-center font-mono">
                    {stats[s]}
                  </td>
                ))}
                <td className="rounded-r-xl px-4 text-center font-mono">
                  {playerFlags(p).length}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button
        onClick={() => backToLobby()}
        className="rounded-xl border border-zinc-700 px-10 py-4 text-xl font-bold text-zinc-300 hover:border-zinc-500"
      >
        Back to the lobby
      </button>
    </main>
  );
}

// ------------------------------------------------------------------ BITS

function PlayerDot({ player }: { player: PlayerState }) {
  return (
    <span
      className="inline-block h-5 w-5 shrink-0 rounded-full"
      style={{ backgroundColor: playerColor(player) }}
    />
  );
}

function PlayerChip({ player }: { player: PlayerState }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-sm font-bold text-zinc-950"
      style={{ backgroundColor: playerColor(player) }}
    >
      {playerName(player)}
    </span>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      {children}
    </main>
  );
}
