"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { DeltaChips } from "@/components/StatBits";
import TitleScreen from "@/components/TitleScreen";
import { CampfireScene, SeaScene } from "@/components/Scenes";
import {
  KEY_CHARACTER,
  kickPlayer,
  playerColor,
  playerConnected,
  playerName,
  startHost,
  useJoinBase,
  usePings,
  usePlayers,
  useServerConnection,
  type PlayerState,
} from "@/lib/game/connection";
import { roleDef } from "@/lib/game/character";
import type { Character } from "@/lib/game/types";
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
  beginAfterPrologue,
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
import { playerEnding, townEnding } from "@/lib/game/finale";
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
  const [started, setStarted] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Leave the title screen and open (or rejoin) a room. */
  function begin(freshRoom: boolean) {
    if (freshRoom) {
      try {
        localStorage.removeItem(HOST_ROOM_KEY);
      } catch {}
    }
    setStarted(true);
    let settled = false;
    startHost(freshRoom ? undefined : (readSavedRoom() ?? undefined)).then(
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
    setTimeout(() => {
      if (!settled) {
        setError(
          "timed out after 15 s. The game server isn't answering — is the Seven Nights window (start-game.bat) still running?",
        );
      }
    }, 15_000);
  }

  if (!started) {
    return <TitleScreen hasSave={readSavedRoom() !== null} onStart={begin} />;
  }

  if (error) {
    return (
      <Centered>
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="text-2xl text-red-400">Could not open a room: {error}</p>
          <p className="max-w-md text-parch-400">
            If the game window is running, this is usually stale saved data in
            this browser.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="rounded-xl bg-amber-500 px-8 py-3 text-lg font-bold text-night hover:bg-amber-400"
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
          className="h-3 w-full overflow-hidden rounded-full border border-bark bg-oak"
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
        <p className="text-parch-400">{line}</p>
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
  // the guard keys must reset or no transition ever fires again. And a
  // reconnect snapshot can roll shared state BACKWARD (writes lost on a
  // dead-but-open socket); re-arm the current phase's exit transition so the
  // rescheduled timer/effect can fire it again. No-op in normal forward flow.
  useEffect(() => {
    if (phase === "lobby") fired.current.clear();
    else if (phase === "night-intro") fired.current.delete(`choose-${night}`);
    else if (phase === "choose-location")
      fired.current.delete(`storylets-${night}`);
    else if (phase === "storylets") fired.current.delete(`resolve-${night}`);
  }, [phase, night]);

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
              className="rounded-full border border-amber-500/60 bg-oak px-4 py-2 text-sm font-bold text-amber-400"
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
    case "prologue":
      return <PrologueScreen onBegin={beginAfterPrologue} />;
    case "night-intro":
      return (
        <Centered>
          <div className="fade-up text-center">
            <NightDots night={night} />
            <p aria-hidden className="mt-4 text-xl tracking-[0.8em] text-amber-400/60">
              ❦
            </p>
            <h1 className="mt-2 text-8xl font-black tracking-tight">
              WEEK {night}
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
              <p className="mx-auto mt-6 max-w-2xl text-2xl text-parch-400">
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
      className="rounded-full border border-bark-light bg-oak px-3 py-2 text-sm text-parch-400 hover:border-parch-500"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

/** Week progress: one star per night, lit up to the current one. */
function NightDots({ night }: { night: number }) {
  return (
    <div
      className="flex justify-center gap-2 text-base"
      aria-label={`Week ${night} of ${NIGHT_COUNT}`}
    >
      {Array.from({ length: NIGHT_COUNT }, (_, i) => (
        <span
          key={i}
          className={i < night ? "text-amber-400" : "text-bark-light"}
        >
          ✦
        </span>
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

// --------------------------------------------------------------- PROLOGUE

/** The SETTING prologue — the 1348 doom and the Herald's vision. Big white
 * text over the sea scene; shown on the lobby while players build characters. */
function SettingProse() {
  return (
    <div className="fade-up mx-auto max-w-3xl space-y-5 text-center text-xl leading-relaxed text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.95)]">
      <p>
        It is 1348. God, angry with His creation, looses war, plague and famine
        across the continent. Millions begin to die of a black death spreading
        out of the east; the lords bar themselves in their castles while their
        serfs die in their thousands.
      </p>
      <p>
        You are fugitives, bound for England aboard the{" "}
        <span className="italic">St Michael's Fortune</span>, lucky to have
        outrun the brigands, the starving mobs, and the plague itself — for a
        time. Ahead lies the ancient fortress town of St Sebastian.
      </p>
      <p className="font-display text-2xl leading-snug text-red-300 [text-shadow:0_0_22px_rgba(220,40,40,0.5)]">
        On a moonless night a vision comes — a pair of glowing red eyes in the
        black: “YOU ARE MY HERALD. THIS TOWN HOLDS SECRET THINGS, PRECIOUS TO
        ME. SAVE IT, AND I SHALL REWARD THEE. FAIL — AND YOU WILL PERISH, AS ALL
        MUST IN THE END.”
      </p>
      <p className="text-white/90">
        Seven weeks before the world's end. Choose who you are.
      </p>
    </div>
  );
}

/** The TOWN prologue — arrival at St Sebastian, after the party is assembled. */
function PrologueScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <SeaScene>
      <main className="flex min-h-screen flex-col items-center justify-center gap-7 px-8 py-12">
        <div className="fade-up max-w-3xl space-y-5 text-center text-xl leading-relaxed text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.95)]">
          <p>
            At dawn the ship rounds the headland and St Sebastian rises from the
            sea-mist: grey walls older than any living memory, a squat keep, a
            huddle of roofs above a working harbour. Gulls wheel. Bells ring for
            no reason you can name.
          </p>
          <p>
            The town is loud and blind and busy — fishermen crying their catch,
            traders haggling, children underfoot — a place that does not yet know
            it is already dead. Behind you the open sea is empty. Ahead, the
            gangplank comes down.
          </p>
          <p className="font-display text-2xl text-amber-300">
            You are the only ones who know what is coming. Make landfall, and
            begin.
          </p>
        </div>
        <button
          onClick={onBegin}
          className="font-display rounded-xl bg-amber-500 px-12 py-4 text-2xl text-night hover:bg-amber-400"
        >
          Make landfall →
        </button>
      </main>
    </SeaScene>
  );
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
  const joinBase = useJoinBase();
  const joinUrl = `${joinBase}/play?room=${roomCode}`;
  const now = useClock(500);
  const pingByPlayer = new Map(pings.map(({ player, ping }) => [player.id, ping]));

  const hasCharacter = (p: PlayerState) =>
    Boolean(p.getState(KEY_CHARACTER));
  const readyCount = players.filter(hasCharacter).length;
  // Don't begin until every connected player has built a character.
  const connected = players.filter(playerConnected);
  const allReady =
    players.length > 0 && connected.every(hasCharacter);

  return (
    <SeaScene>
      <main className="flex min-h-screen flex-col items-center gap-7 px-6 py-10">
      <SettingProse />
      <header className="text-center">
        <p className="text-xl text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]">
          Join on your phone
        </p>
        <p className="my-1 font-mono text-7xl font-black tracking-[0.2em] text-amber-400 [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]">
          {roomCode}
        </p>
        <p className="text-base text-white/50">{joinUrl}</p>
        <button
          onClick={() => {
            // Full wipe, not just our saved room: a stale/kicked identity in
            // this browser would make the next connection hang.
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }}
          className="mt-3 text-sm text-white/40 underline hover:text-white/70"
        >
          Start a fresh room
        </button>
      </header>

      <div className="-rotate-1 rounded-sm border-4 border-double border-bark bg-parch-100 p-4 shadow-[0_10px_34px_rgba(0,0,0,0.6)]">
        <p className="font-display mb-2 text-center text-sm uppercase tracking-[0.25em] text-[#3a2a14]">
          By order of the lord
        </p>
        <QRCodeSVG
          value={joinUrl}
          size={180}
          bgColor="#f2e8ce"
          fgColor="#1d1408"
        />
        <p className="font-display mt-2 text-center text-sm text-[#3a2a14]">
          scan &amp; join the week
        </p>
      </div>

      <section className="w-full max-w-2xl rounded-2xl bg-night/55 p-5 backdrop-blur-sm">
        <h2 className="mb-4 text-center text-xl font-bold text-white/85">
          {players.length === 0
            ? "Waiting for fugitives to come ashore…"
            : `${readyCount} of ${players.length} have chosen their lot`}
        </h2>
        <ul className="flex flex-col gap-3">
          {players.map((player) => {
            const ping = pingByPlayer.get(player.id) ?? null;
            const waved = ping !== null && now - ping.at < PING_FLASH_MS;
            const away = !playerConnected(player);
            return (
              <li
                key={`${player.id}-${ping?.count ?? 0}`}
                className={`flex items-center justify-between rounded-xl border border-bark px-6 py-3 text-2xl ${
                  waved ? "ping-flash" : ""
                } ${away ? "opacity-50" : ""}`}
              >
                <span className="flex items-center gap-4 font-bold">
                  <PlayerDot player={player} />
                  {playerName(player)}
                  {away ? (
                    <span className="text-base font-normal text-parch-500">
                      reconnecting…
                    </span>
                  ) : (
                    <span className="text-base font-normal text-parch-500">
                      {roleLabel(player)}
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
                    className="rounded-lg border border-bark-light px-3 py-1 text-base font-bold text-parch-500 hover:border-red-500 hover:text-red-400"
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
            disabled={!allReady}
            onClick={() => {
              // This click is the user gesture that unlocks autoplay for the
              // whole session; the ambient bed starts here.
              unlockAudio().then((ok) => {
                if (ok) playAmbient();
              });
              startGame(players);
            }}
            className="font-display mx-auto mt-8 block rounded-xl bg-amber-500 px-12 py-4 text-2xl text-night hover:bg-amber-400 disabled:opacity-40"
          >
            {allReady ? "BEGIN THE WEEK" : "Waiting for players to choose…"}
          </button>
        )}
        {players.length === 1 && allReady && (
          <p className="mt-2 text-center text-sm text-white/50">
            (Solo works for testing; it's better with 2–6.)
          </p>
        )}
      </section>
      </main>
    </SeaScene>
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
            Week {night} · Where is everyone going?
          </h1>
          <NightDots night={night} />
        </div>
        <span
          className={`font-mono text-4xl font-bold ${
            secondsLeft <= 10 ? "text-red-400" : "text-parch-400"
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
                    : "border-bark"
              }`}
            >
              <h2 className="text-2xl font-bold">{loc.name}</h2>
              <p className="text-parch-400">
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
      <p className="text-center text-xl text-parch-400">
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
      <h1 className="text-5xl font-black text-parch-300">
        Week {night} in St Sebastian…
      </h1>
      <ul className="flex w-full max-w-3xl flex-col gap-4">
        {assigned.map((p) => {
          const done = playerResult(p, night) !== null;
          const away = !playerConnected(p);
          const loc = locationDef(assignments![p.id] as never);
          return (
            <li
              key={p.id}
              className={`flex items-center justify-between rounded-xl border border-bark px-6 py-4 text-2xl ${
                away ? "opacity-50" : ""
              }`}
            >
              <span className="flex items-center gap-4">
                <PlayerDot player={p} />
                <span>
                  <span className="font-bold">{playerName(p)}</span>
                  <span className="text-parch-400"> is at {loc.name}…</span>
                  {away && !done && (
                    <span className="ml-3 text-base text-red-400/80">
                      (phone lost — reconnecting?)
                    </span>
                  )}
                </span>
              </span>
              <span
                className={done ? "text-emerald-400" : "animate-pulse text-parch-600"}
              >
                {done ? "✓" : "…"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-parch-500">
        Their phones know things this screen doesn't.
      </p>
      <button
        onClick={() => {
          if (
            window.confirm(
              "End the week now? Players still mid-story won't get an outcome, and a permanently disconnected phone drops out of the reckoning.",
            )
          ) {
            beginResolve();
          }
        }}
        className="rounded-lg border border-bark px-5 py-2 text-sm text-parch-600 hover:border-parch-600 hover:text-parch-400"
      >
        A phone died? End the week without them →
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
    <CampfireScene>
      <main className="flex min-h-screen flex-col gap-6 p-10">
        <div className="flex flex-col items-center gap-3">
          <NightDots night={night} />
          <h1 className="font-display text-center text-3xl text-amber-200/90 [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">
            Around the fire, week {night}
          </h1>
          <p className="text-center text-white/55">
            You take stock of the day, and tell each other what you saw.
          </p>
        </div>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4">
          {results.slice(0, shown).map(({ player, result }) => (
            <div
              key={player.id}
              className="fade-up rounded-2xl border border-amber-900/40 bg-black/45 p-5 backdrop-blur-sm"
            >
              <p className="text-2xl leading-snug">
                <span
                  className="font-display"
                  style={{ color: playerColor(player) }}
                >
                  {playerName(player)}
                </span>
                <span className="text-white/60"> — </span>
                <span className="text-white/95">{result!.outcome}</span>
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
          className="font-display mx-auto rounded-xl border border-amber-700/50 px-8 py-3 text-lg text-amber-200/80 hover:border-amber-400"
        >
          {night >= NIGHT_COUNT ? "To the reckoning →" : `On to week ${night + 1} →`}
        </button>
      </main>
    </CampfireScene>
  );
}

// ----------------------------------------------------------------- FINALE

function FinaleScreen({ players }: { players: PlayerState[] }) {
  const [ending] = useEnding();

  // Compute the ending once, on the party's average stats, and publish it
  // to shared state so it survives a host refresh.
  useEffect(() => {
    if (players.length === 0 || getPublishedEnding()) return;
    const party = players.map((p) => ({
      stats: playerStats(p),
      flags: playerFlags(p),
    }));
    publishEnding(townEnding(party));
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
      <h1 className="text-5xl font-black">THE SEVENTH WEEK ENDS</h1>
      <div className="max-w-3xl space-y-5 text-center">
        {ending ? (
          ending.map((p, i) => (
            <p
              key={i}
              className={
                i === ending.length - 1
                  ? "pt-2 text-3xl font-black tracking-wide text-amber-400"
                  : "text-2xl text-parch-300"
              }
            >
              {p}
            </p>
          ))
        ) : (
          <p className="animate-pulse text-2xl text-parch-500">
            St Sebastian waits to learn its fate…
          </p>
        )}
      </div>

      <section className="mt-4 w-full max-w-2xl">
        <h2 className="mb-3 text-center text-xl font-bold text-parch-400">
          Whose week was the wildest? · {voted}/{players.length} voted
        </h2>
        <ul className="flex flex-col gap-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-bark px-6 py-3 text-xl"
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
        className="font-display rounded-xl bg-amber-500 px-10 py-4 text-xl text-night hover:bg-amber-400"
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
      <h1 className="text-5xl font-black">SEVEN WEEKS, ENDED</h1>
      {wildest && (
        <p className="text-2xl text-parch-300">
          The village agrees:{" "}
          <span className="font-black text-amber-400">{playerName(wildest)}</span>{" "}
          had the wildest week.
        </p>
      )}
      <table className="w-full max-w-3xl border-separate border-spacing-y-2 text-xl">
        <thead>
          <tr className="text-left text-sm uppercase tracking-widest text-parch-500">
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
              <tr key={p.id} className="rounded-xl bg-oak/60">
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
        <h2 className="mb-4 text-center text-xl font-bold text-parch-400">
          What became of each of you
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-bark bg-oak/40 p-5"
            >
              <p className="mb-2 flex items-center gap-2 text-lg font-bold">
                <PlayerDot player={p} />
                {playerName(p)}
              </p>
              {/* Everyone sees every player's ending. */}
              <p className="story-prose mb-3 text-sm leading-relaxed text-parch-200">
                {playerEnding(playerFlags(p))}
              </p>
              <ol className="flex flex-col gap-1.5 text-sm leading-snug text-parch-500">
                {playerHistory(p).map((h) => (
                  <li key={h.night}>
                    <span className="font-mono font-bold text-amber-400/80">
                      W{h.night}
                    </span>{" "}
                    {h.outcome}
                  </li>
                ))}
                {playerHistory(p).length === 0 && (
                  <li className="text-parch-600">slept through the week.</li>
                )}
              </ol>
            </div>
          ))}
        </div>
      </section>
      <button
        onClick={() => backToLobby()}
        className="font-display rounded-xl border border-bark-light px-10 py-4 text-xl text-parch-300 hover:border-parch-500"
      >
        Play another week →
      </button>
    </main>
  );
}

// ------------------------------------------------------------------ BITS

/** A player's chosen role for the lobby, or "choosing…" until they pick. */
function roleLabel(player: PlayerState): string {
  const character = player.getState(KEY_CHARACTER) as Character | undefined;
  if (!character) return "choosing…";
  return roleDef(character.role)?.name ?? "ready";
}

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
      className="rounded-full px-3 py-1 text-sm font-bold text-night"
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
