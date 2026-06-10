"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { DeltaChips } from "@/components/PlayScreen";
import {
  kickPlayer,
  playerColor,
  playerConnected,
  playerName,
  startHost,
  usePings,
  usePlayers,
  useServerConnection,
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
  averageStats,
  backToLobby,
  beginChooseLocation,
  beginEpilogue,
  beginResolve,
  beginStorylets,
  endNight,
  getPublishedEnding,
  playerFlags,
  playerHistory,
  playerPick,
  playerResult,
  playerStats,
  playerVote,
  publishEnding,
  startGame,
  useActiveEvent,
  useAssignments,
  useDeadline,
  useEnding,
  useNight,
  usePhase,
} from "@/lib/game/state";
import { getStoryContent } from "@/lib/ink/loadStory";
import { runToEnd } from "@/lib/ink/storylet";
import {
  audioUnlocked,
  isMuted,
  playAmbient,
  setMuted,
  stinger,
  stopAmbient,
  unlockAudio,
} from "@/lib/audio/sound";
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
    let settled = false;
    startHost(readSavedRoom() ?? undefined).then(
      (code) => {
        settled = true;
        localStorage.setItem(
          HOST_ROOM_KEY,
          JSON.stringify({ code, at: Date.now() }),
        );
        setRoomCode(code);
      },
      (e: Error) => {
        settled = true;
        setError(e.message);
      },
    );
    // Route a never-resolving connect into the error screen. With the
    // self-hosted server this should only happen if the server died.
    const timeout = setTimeout(() => {
      if (!settled) {
        setError(
          "timed out after 15 s. The game server isn't answering — is the Seven Nights window (start-game.bat) still running?",
        );
      }
    }, 15_000);
    return () => clearTimeout(timeout);
  }, []);

  if (error) {
    return (
      <Centered>
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="text-2xl text-red-400">Could not open a room: {error}</p>
          <p className="max-w-md text-zinc-400">
            If the game window is running, this is usually stale saved data in
            this browser.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="rounded-xl bg-amber-500 px-8 py-3 text-lg font-bold text-zinc-950 hover:bg-amber-400"
          >
            Clear saved data &amp; open a fresh room
          </button>
        </div>
      </Centered>
    );
  }
  if (!roomCode) {
    return <ConnectingScreen />;
  }
  return <HostGame roomCode={roomCode} />;
}

/**
 * Connecting to Playroom takes an unknowable 1–10 s, so the bar eases toward
 * 95% and the real arrival of the room code swaps this screen out. A hung
 * connection hits HostScreen's 15 s timeout and lands on the error screen.
 */
function ConnectingScreen() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(
      () => setElapsed((Date.now() - started) / 1000),
      100,
    );
    return () => clearInterval(id);
  }, []);

  const progress = Math.min(95, 100 * (1 - Math.exp(-elapsed / 3)));
  const line =
    elapsed < 1.5
      ? "Lighting the lanterns…"
      : elapsed < 4
        ? "Waking the innkeep…"
        : elapsed < 8
          ? "Sending word to the castle…"
          : "Still working — the roads are muddy tonight…";

  return (
    <Centered>
      <div className="fade-up flex w-full max-w-md flex-col items-center gap-6 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.4em] text-amber-400/80">
          Seven Nights
        </p>
        <h1 className="text-4xl font-black tracking-tight">Opening the room</h1>
        <div
          className="h-3 w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-900"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-zinc-400">{line}</p>
      </div>
    </Centered>
  );
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
  const activeEvent = useActiveEvent(night);

  // One-shot guard so transition effects can't double-fire while the local
  // echo of a setState is still in flight.
  const fired = useRef(new Set<string>());
  function once(key: string, fn: () => void) {
    if (fired.current.has(key)) return;
    fired.current.add(key);
    fn();
  }

  // "Back to the lobby" starts a second game with the same night numbers, so
  // the guard keys must reset or no transition ever fires again.
  useEffect(() => {
    if (phase === "lobby") fired.current.clear();
  }, [phase]);

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

  // storylets: resolve once every assigned player still attached to the
  // server has reported. A phone that dies for good (past the server's
  // reconnect grace) stops blocking the night automatically.
  useEffect(() => {
    if (phase !== "storylets" || !assignments) return;
    const assigned = players.filter((p) => assignments[p.id]);
    const present = assigned.filter((p) => playerConnected(p));
    const reported = (p: PlayerState) => playerResult(p, night) !== null;
    if (
      assigned.length > 0 &&
      assigned.some(reported) &&
      present.every(reported)
    ) {
      once(`resolve-${night}`, beginResolve);
    }
  }, [phase, players, assignments, night]);

  // --- Audio. The lobby's BEGIN click unlocks it; a host refresh mid-game
  // has no gesture yet, so a failed resume shows the "enable sound" pill.
  const [soundBlocked, setSoundBlocked] = useState(false);
  const resumeTried = useRef(false);
  useEffect(() => {
    if (phase === "lobby" || audioUnlocked() || resumeTried.current) return;
    resumeTried.current = true;
    unlockAudio().then((ok) => {
      if (ok && phase !== "finale" && phase !== "epilogue") playAmbient();
      else if (!ok) setSoundBlocked(true);
    });
  }, [phase]);

  useEffect(() => {
    if (phase === "night-intro") stinger(activeEvent ? "drama" : "night");
    else if (phase === "resolve") stinger("resolve");
    else if (phase === "finale") {
      stopAmbient();
      stinger("finale");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const online = useServerConnection();

  const screen = renderPhase();
  return (
    <>
      {screen}
      {!online && (
        <div className="fixed inset-x-0 top-0 z-20 bg-red-950/90 py-2 text-center text-sm font-bold text-red-200">
          Lost the game server — reconnecting…
        </div>
      )}
      {phase !== "lobby" && (
        <div className="fixed bottom-4 right-4 z-10 flex items-center gap-2">
          {soundBlocked && (
            <button
              onClick={() => {
                unlockAudio().then((ok) => {
                  if (ok) {
                    setSoundBlocked(false);
                    playAmbient();
                  }
                });
              }}
              className="rounded-full border border-amber-500/60 bg-zinc-900 px-4 py-2 text-sm font-bold text-amber-400"
            >
              Sound off — tap to enable
            </button>
          )}
          <MuteButton />
        </div>
      )}
    </>
  );

  function renderPhase() {
    switch (phase) {
    case "lobby":
      return <LobbyScreen roomCode={roomCode} players={players} />;
    case "night-intro":
      return (
        <Centered>
          <div className="fade-up text-center">
            <NightDots night={night} />
            <h1 className="mt-6 text-8xl font-black tracking-tight">
              NIGHT {night}
            </h1>
            {activeEvent ? (
              <>
                <p className="mx-auto mt-6 max-w-2xl text-2xl font-bold text-red-300">
                  {activeEvent.introOverride}
                </p>
                {activeEvent.closedLocation && (
                  <p className="mt-4 text-lg uppercase tracking-widest text-red-400/80">
                    {locationDef(activeEvent.closedLocation).name} is closed
                    tonight
                  </p>
                )}
              </>
            ) : (
              <p className="mx-auto mt-6 max-w-2xl text-2xl text-zinc-400">
                {nightIntro(night)}
              </p>
            )}
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
          closed={activeEvent?.closedLocation ?? null}
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
}

function MuteButton() {
  const [muted, setMutedState] = useState(() => isMuted());
  return (
    <button
      onClick={() => {
        setMuted(!muted);
        setMutedState(!muted);
      }}
      title={muted ? "Unmute" : "Mute"}
      aria-label={muted ? "Unmute" : "Mute"}
      className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 hover:border-zinc-500"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

/** Week progress: one dot per night, lit up to the current one. */
function NightDots({ night }: { night: number }) {
  return (
    <div className="flex justify-center gap-2" aria-label={`Night ${night} of ${NIGHT_COUNT}`}>
      {Array.from({ length: NIGHT_COUNT }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${
            i < night ? "bg-amber-400" : "bg-zinc-800"
          }`}
        />
      ))}
    </div>
  );
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
        <button
          onClick={() => {
            // Full wipe, not just our saved room: Playroom keeps its own
            // session state in storage, and a stale/kicked identity makes
            // the next insertCoin hang forever on "Opening room".
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }}
          className="mt-3 text-sm text-zinc-600 underline hover:text-zinc-400"
        >
          Start a fresh room
        </button>
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
            const away = !playerConnected(player);
            return (
              <li
                key={`${player.id}-${ping?.count ?? 0}`}
                className={`flex items-center justify-between rounded-xl border border-zinc-800 px-6 py-3 text-2xl ${
                  waved ? "ping-flash" : ""
                } ${away ? "opacity-50" : ""}`}
              >
                <span className="flex items-center gap-4 font-bold">
                  <PlayerDot player={player} />
                  {playerName(player)}
                  {away && (
                    <span className="text-base font-normal text-zinc-500">
                      reconnecting…
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-4">
                  {waved && (
                    <span className="font-mono text-amber-400">waves!</span>
                  )}
                  <button
                    onClick={() => {
                      if (
                        window.confirm(`Kick ${playerName(player)} from the game?`)
                      ) {
                        kickPlayer(player);
                      }
                    }}
                    title={`Kick ${playerName(player)}`}
                    aria-label={`Kick ${playerName(player)}`}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-base font-bold text-zinc-500 hover:border-red-500 hover:text-red-400"
                  >
                    Kick
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
        {players.length > 0 && (
          <button
            onClick={() => {
              // This click is the user gesture that unlocks autoplay for the
              // whole session; the ambient bed starts here.
              unlockAudio().then((ok) => {
                if (ok) playAmbient();
              });
              startGame(players);
            }}
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
  closed,
}: {
  night: number;
  players: PlayerState[];
  deadline: number;
  now: number;
  closed: string | null;
}) {
  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));
  return (
    <main className="flex min-h-screen flex-col gap-8 p-10">
      <header className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-6">
          <h1 className="text-4xl font-black">
            Night {night} · Where is everyone going?
          </h1>
          <NightDots night={night} />
        </div>
        <span
          className={`font-mono text-4xl font-bold ${
            secondsLeft <= 10 ? "text-red-400" : "text-zinc-400"
          }`}
        >
          {secondsLeft}s
        </span>
      </header>
      <div className="grid flex-1 grid-cols-4 gap-5">
        {LOCATIONS.map((loc) => {
          const isClosed = loc.id === closed;
          const here = players.filter((p) => playerPick(p, night) === loc.id);
          return (
            <div
              key={loc.id}
              className={`flex flex-col rounded-2xl border p-6 ${
                isClosed
                  ? "border-red-900/60 opacity-50"
                  : here.length > 0
                    ? "border-amber-500/60 bg-amber-500/5"
                    : "border-zinc-800"
              }`}
            >
              <h2 className="text-2xl font-bold">{loc.name}</h2>
              <p className="text-zinc-400">
                {isClosed ? "Closed tonight." : loc.blurb}
              </p>
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
      <NightDots night={night} />
      <h1 className="text-5xl font-black text-zinc-300">
        Night {night} unfolds…
      </h1>
      <ul className="flex w-full max-w-3xl flex-col gap-4">
        {assigned.map((p) => {
          const done = playerResult(p, night) !== null;
          const away = !playerConnected(p);
          const loc = locationDef(assignments![p.id] as never);
          return (
            <li
              key={p.id}
              className={`flex items-center justify-between rounded-xl border border-zinc-800 px-6 py-4 text-2xl ${
                away ? "opacity-50" : ""
              }`}
            >
              <span className="flex items-center gap-4">
                <PlayerDot player={p} />
                <span>
                  <span className="font-bold">{playerName(p)}</span>
                  <span className="text-zinc-400"> is at {loc.name}…</span>
                  {away && !done && (
                    <span className="ml-3 text-base text-red-400/80">
                      (phone lost — reconnecting?)
                    </span>
                  )}
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
      <button
        onClick={() => {
          if (
            window.confirm(
              "End the night now? Players still mid-story won't get an outcome, and a permanently disconnected phone drops out of the finale.",
            )
          ) {
            beginResolve();
          }
        }}
        className="rounded-lg border border-zinc-800 px-5 py-2 text-sm text-zinc-600 hover:border-zinc-600 hover:text-zinc-400"
      >
        A phone died? End the night without them →
      </button>
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
        endNight(night, players);
      }
    }, RESOLVE_BEAT_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, results.length, night]);

  return (
    <main className="flex min-h-screen flex-col gap-8 p-10">
      <div className="flex flex-col items-center gap-4">
        <NightDots night={night} />
        <h1 className="text-center text-4xl font-black text-zinc-300">
          Night {night} · What happened out there
        </h1>
      </div>
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
            endNight(night, players);
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
      <section className="w-full max-w-6xl">
        <h2 className="mb-4 text-center text-xl font-bold text-zinc-400">
          The week, night by night
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <p className="mb-3 flex items-center gap-2 text-lg font-bold">
                <PlayerDot player={p} />
                {playerName(p)}
              </p>
              <ol className="flex flex-col gap-1.5 text-sm leading-snug text-zinc-400">
                {playerHistory(p).map((h) => (
                  <li key={h.night}>
                    <span className="font-mono font-bold text-amber-400/80">
                      N{h.night}
                    </span>{" "}
                    {h.outcome}
                  </li>
                ))}
                {playerHistory(p).length === 0 && (
                  <li className="text-zinc-600">slept through the week.</li>
                )}
              </ol>
            </div>
          ))}
        </div>
      </section>
      <button
        onClick={() => backToLobby()}
        className="rounded-xl border border-zinc-700 px-10 py-4 text-xl font-bold text-zinc-300 hover:border-zinc-500"
      >
        Play another week →
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
