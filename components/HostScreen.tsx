"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Art, BackdropArt } from "@/components/Art";
import {
  ChronicleHeading,
  PageFrame,
  Plate,
  Rule,
  Vignette,
} from "@/components/Ornament";
import { DeltaChips } from "@/components/StatBits";
import { ThreatMeters, ThreatMetersCompact } from "@/components/ThreatMeters";
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
  THREAT_TICKS,
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
  getThreats,
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
  useThreats,
} from "@/lib/game/state";
import { completedStorylines } from "@/lib/game/content";
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
import type { PlayerStats, StatId, ThreatScores } from "@/lib/game/types";

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
    // freshRoom also tells the server to close every OLD room, so phones
    // can't stay stuck in (or auto-rejoin) a previous game.
    startHost(freshRoom ? undefined : (readSavedRoom() ?? undefined), freshRoom).then(
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
            className="btn-quest px-8 py-3 text-lg md:text-lg"
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
        <p className="font-display text-sm font-bold uppercase tracking-[0.4em] text-amber-400/80">
          Seven Nights
        </p>
        <h1 className="text-4xl font-black tracking-tight">Opening the room</h1>
        <Rule />
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
  const [threats] = useThreats();
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
        <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden p-8">
          <BackdropArt
            src="/images/scenes/week-intro.png"
            imgClassName="opacity-[0.22] sepia-[.3]"
          />
          <Vignette />
          <div className="fade-up text-center">
            <ChronicleHeading className="mb-6">The Week Turns</ChronicleHeading>
            <NightDots night={night} />
            <p aria-hidden className="mt-4 text-xl tracking-[0.8em] text-amber-400/60">
              ❦
            </p>
            <h1 className="mt-2 text-8xl font-black tracking-[0.04em]">
              WEEK {night}
            </h1>
            {activeEvent ? (
              <>
                <p className="font-prose mx-auto mt-6 max-w-2xl text-2xl italic text-red-300">
                  {activeEvent.introOverride}
                </p>
                {activeEvent.closedLocation && (
                  <p className="font-display mt-4 text-lg uppercase tracking-widest text-red-400/80">
                    {locationDef(activeEvent.closedLocation).name} is closed
                    tonight
                  </p>
                )}
              </>
            ) : (
              <p className="font-prose mx-auto mt-6 max-w-2xl text-2xl italic text-parch-300">
                {nightIntro(night)}
              </p>
            )}
            {/* The four dooms, with this week's rise dramatized. The tick for
                the arriving week is applied by setupWeek before this screen
                shows, so a rise line appears whenever this week ticked. */}
            <div className="mt-10 flex justify-center">
              <ThreatMeters
                threats={threats}
                tick={THREAT_TICKS[night - 1] ?? 0}
              />
            </div>
          </div>
          <PageFrame />
        </main>
      );
    case "choose-location":
      return (
        <ChooseScreen
          night={night}
          players={players}
          deadline={deadline}
          now={now}
          closed={activeEvent?.closedLocation ?? null}
          threats={threats}
        />
      );
    case "storylets":
      return (
        <StoryletsScreen night={night} players={players} assignments={assignments} />
      );
    case "resolve":
      return (
        <ResolveScreen
          key={night}
          night={night}
          players={players}
          threats={threats}
        />
      );
    case "finale":
      return <FinaleScreen players={players} threats={threats} />;
    case "epilogue":
      return <EpilogueScreen players={players} threats={threats} />;
    default:
      // Unknown phase (stale room from another build): never render nothing.
      return <LobbyScreen roomCode={roomCode} players={players} />;
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
      className="flex justify-center gap-2.5 text-sm"
      aria-label={`Week ${night} of ${NIGHT_COUNT}`}
    >
      {Array.from({ length: NIGHT_COUNT }, (_, i) => (
        <span
          key={i}
          className={
            i < night
              ? "text-amber-400 [text-shadow:0_0_8px_rgba(212,169,55,0.45)]"
              : "text-bark-light"
          }
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
 * text over the sea scene; the first beat of the opening cinematic, read to
 * the room after BEGIN (the lobby itself is just join + character select). */
function SettingProse() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 text-center text-xl leading-relaxed text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.95)]">
      {/* The chronicle's opening leaf: IM Fell prose, illuminated drop cap. */}
      <div className="story-prose space-y-5">
        <p className="fade-up">
          It is 1348. God, angry with His creation, looses war, plague and famine
          across the continent. Millions begin to die of a black death spreading
          out of the east; the lords bar themselves in their castles while their
          serfs die in their thousands.
        </p>
        <p className="fade-up fade-up-1">
          You are fugitives, bound for England aboard the{" "}
          <span className="italic">St Michael's Fortune</span>, lucky to have
          outrun the brigands, the starving mobs, and the plague itself — for a
          time. Ahead lies the ancient fortress town of St Sebastian.
        </p>
      </div>
      <p className="fade-up fade-up-2 font-display text-2xl leading-snug text-red-300 [text-shadow:0_0_22px_rgba(220,40,40,0.5)]">
        On a moonless night a vision comes — a pair of glowing red eyes in the
        black: “YOU ARE MY HERALD. THIS TOWN HOLDS SECRET THINGS, PRECIOUS TO
        ME. SAVE IT, AND I SHALL REWARD THEE. FAIL — AND YOU WILL PERISH, AS ALL
        MUST IN THE END.”
      </p>
      <p className="fade-up fade-up-3 font-prose italic text-white/90">
        Seven weeks before the world's end.
      </p>
    </div>
  );
}

/**
 * The opening cinematic, played once the party is built and the host hits
 * BEGIN: two beats read aloud to the room — the Herald's charge (the 1348
 * vision), then arrival at St Sebastian — before week 1. Phones show
 * "watch the big screen" through the whole prologue phase.
 */
function PrologueScreen({ onBegin }: { onBegin: () => void }) {
  const [beat, setBeat] = useState(0);

  // Beat 1: the Herald's vision (the setting prose that used to crowd the lobby).
  if (beat === 0) {
    return (
      <SeaScene>
        <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-8 py-12">
          <Vignette />
          <ChronicleHeading className="fade-up">The Crossing</ChronicleHeading>
          <SettingProse />
          <button
            onClick={() => setBeat(1)}
            className="fade-up fade-up-3 btn-quest px-10 py-3 text-xl md:text-xl"
          >
            Go on →
          </button>
          <PageFrame />
        </main>
      </SeaScene>
    );
  }

  // Beat 2: arrival at St Sebastian.
  return (
    <SeaScene>
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-7 px-8 py-12">
        <Vignette />
        <ChronicleHeading className="fade-up">Landfall</ChronicleHeading>
        <div className="fade-up max-w-3xl space-y-5 text-center text-xl leading-relaxed text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.95)]">
          <p className="font-prose">
            At dawn the ship rounds the headland and St Sebastian rises from the
            sea-mist: grey walls older than any living memory, a squat keep, a
            huddle of roofs above a working harbour. Gulls wheel. Bells ring for
            no reason you can name.
          </p>
          <p className="font-prose">
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
        {/* A framed woodcut plate, like the lobby's parchment poster — the
            animated sea keeps moving around it. The float wrapper is separate
            from the Plate so the drift animation never fights the rotation
            (and if the file is missing, only an empty invisible div remains). */}
        <div className="fade-up fade-up-1 float w-full max-w-lg">
          <Plate
            src="/images/scenes/arrival.png"
            className="w-full -rotate-1"
            imgClassName="w-full"
          />
        </div>
        <button
          onClick={onBegin}
          className="fade-up fade-up-2 btn-quest px-12 py-4 text-2xl md:text-2xl"
        >
          Make landfall →
        </button>
        <PageFrame />
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

  // The lobby is the join + character-select screen: room code and QR up top,
  // the party roster (who's in, what they've chosen) front and centre. The
  // Herald's vision is no longer dumped here — it plays as the opening
  // cinematic once everyone's built a character and the host hits BEGIN.
  return (
    <SeaScene>
      <main className="relative flex min-h-screen flex-col items-center gap-7 px-6 py-9">
      <Vignette />
      <header className="text-center">
        <ChronicleHeading className="mb-3">The Muster</ChronicleHeading>
        <p className="font-display text-sm font-bold uppercase tracking-[0.4em] text-amber-300 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]">
          St Sebastian · 1348
        </p>
        <h1 className="mt-1 text-5xl font-black text-parch-100 [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]">
          Gather your party
        </h1>
        <p className="font-prose mt-2 text-lg italic text-white/75 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]">
          Join on a phone, choose who you are, then begin the seven weeks.
        </p>
      </header>

      {/* Join: code then QR, stacked straight down the centre. */}
      <section className="flex flex-col items-center gap-5">
        <div className="flex flex-col items-center text-center">
          <p className="font-prose text-xl italic text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]">
            Join on your phone
          </p>
          {/* Letterpress room code — the e2e locates p.font-mono.text-7xl. */}
          <div className="my-2 rounded-sm border border-amber-400/25 bg-night/60 px-8 py-3 shadow-[inset_0_2px_12px_rgba(0,0,0,0.75)]">
            <p className="font-mono text-7xl font-black tracking-[0.25em] text-amber-400 [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]">
              {roomCode}
            </p>
          </div>
          <p className="font-mono text-sm tracking-wide text-parch-500">{joinUrl}</p>
          <button
            onClick={() => {
              // Full wipe, not just our saved room: a stale/kicked identity in
              // this browser would make the next connection hang.
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="font-display mt-3 border-b border-parch-600/40 text-xs uppercase tracking-[0.2em] text-parch-500 hover:border-amber-400/60 hover:text-parch-300"
          >
            Start a fresh room
          </button>
        </div>

        {/* The join poster drifts like a page in a draught; the float wrapper
            is separate so the animation never fights the rotation. */}
        <div className="float">
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
        </div>
      </section>

      <section className="w-full max-w-2xl rounded-sm border border-parch-600/25 bg-night/55 p-5 backdrop-blur-sm">
        <h2 className="font-display mb-2 text-center text-xl tracking-wide text-parch-100/90">
          {players.length === 0
            ? "Waiting for fugitives to come ashore…"
            : `${readyCount} of ${players.length} have chosen their lot`}
        </h2>
        <Rule className="mb-4" />
        <ul className="flex flex-col gap-2.5">
          {players.map((player) => {
            const ping = pingByPlayer.get(player.id) ?? null;
            const waved = ping !== null && now - ping.at < PING_FLASH_MS;
            const away = !playerConnected(player);
            return (
              <li
                key={`${player.id}-${ping?.count ?? 0}`}
                className={`flex items-center justify-between rounded-sm border border-parch-600/25 bg-parch-100/[0.04] px-6 py-3 text-2xl ${
                  waved ? "ping-flash" : ""
                } ${away ? "opacity-50" : ""}`}
              >
                <span className="flex items-center gap-4 font-bold">
                  <PlayerDot player={player} />
                  <span className="font-display">{playerName(player)}</span>
                  {away ? (
                    <span className="font-prose text-base font-normal italic text-parch-500">
                      reconnecting…
                    </span>
                  ) : (
                    <span className="font-prose text-base font-normal italic text-parch-500">
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
                    className="font-display rounded-sm border border-bark-light px-3 py-1 text-sm uppercase tracking-wider text-parch-500 hover:border-red-500 hover:text-red-400"
                  >
                    Kick
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
        {players.length > 0 && (
          <div className="mt-8 flex justify-center">
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
              className={`btn-quest px-12 py-4 text-2xl md:text-2xl disabled:opacity-40 ${
                allReady ? "" : "normal-case"
              }`}
            >
              {allReady ? "BEGIN THE WEEK" : "Waiting for players to choose…"}
            </button>
          </div>
        )}
        {players.length === 1 && allReady && (
          <p className="font-prose mt-2 text-center text-sm italic text-white/50">
            (Solo works for testing; it's better with 2–6.)
          </p>
        )}
      </section>
      <PageFrame />
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
  threats,
}: {
  night: number;
  players: PlayerState[];
  deadline: number;
  now: number;
  closed: string | null;
  threats: ThreatScores;
}) {
  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));
  return (
    <main className="relative isolate flex min-h-screen flex-col gap-6 p-10">
      <Vignette />
      <header className="flex flex-col items-center gap-2 text-center">
        <ChronicleHeading>The Town Awaits</ChronicleHeading>
        <h1 className="text-4xl font-black">
          Week {night} · Where is everyone going?
        </h1>
        <div className="flex items-center gap-5">
          <NightDots night={night} />
          <span
            className={`font-mono text-3xl font-bold ${
              secondsLeft <= 10 ? "text-red-400" : "text-parch-400"
            }`}
          >
            {secondsLeft}s
          </span>
        </div>
      </header>
      {/* Centred wrap (not a grid): 7 cards break 4-over-3 with the short
          row centred, per the host-screen centred-composition rule. */}
      <div className="flex flex-1 flex-wrap content-center justify-center gap-5">
        {LOCATIONS.map((loc) => {
          const isClosed = loc.id === closed;
          const here = players.filter((p) => playerPick(p, night) === loc.id);
          return (
            <div
              key={loc.id}
              className={`relative flex min-w-[240px] basis-[23.5%] flex-col overflow-hidden rounded-sm border-2 ${
                isClosed
                  ? "border-red-900/60 bg-oak/30 opacity-60"
                  : here.length > 0
                    ? "border-amber-500/60 bg-amber-500/[0.06] shadow-[0_0_26px_rgba(212,169,55,0.10)]"
                    : "border-bark bg-oak/30"
              }`}
            >
              <Art
                src={`/images/locations/${loc.id}.png`}
                className={`pointer-events-none h-28 w-full border-b border-bark/60 object-cover 2xl:h-40 ${
                  isClosed ? "grayscale" : "sepia-[.2]"
                }`}
              />
              {/* Engraved caption bar under the plate. */}
              <div className="border-b border-bark/50 bg-night/40 px-3 py-2 text-center">
                <h2 className="font-display text-lg uppercase tracking-[0.15em] text-parch-200">
                  {loc.name}
                </h2>
              </div>
              <p className="font-prose px-4 pt-3 italic leading-snug text-parch-400">
                {isClosed ? "Closed tonight." : loc.blurb}
              </p>
              <div className="mt-auto flex flex-wrap justify-center gap-2 p-4">
                {here.map((p) => (
                  <PlayerChip key={p.id} player={p} />
                ))}
              </div>
              {isClosed && (
                <span
                  aria-hidden
                  className="font-display absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-sm border-2 border-red-500/60 bg-night/70 px-4 py-1 text-2xl uppercase tracking-[0.3em] text-red-400/90"
                >
                  Closed
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-3">
        <ThreatMetersCompact threats={threats} />
        <p className="font-prose text-center text-xl italic text-parch-400">
          {players.filter((p) => playerPick(p, night)).length} of{" "}
          {players.length} decided · stragglers get sent somewhere random
        </p>
      </div>
      <PageFrame />
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
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center gap-8 p-10">
      <Vignette />
      <div className="flex flex-col items-center gap-3 text-center">
        <ChronicleHeading>The Chronicle Is Written</ChronicleHeading>
        <NightDots night={night} />
        <h1 className="text-5xl font-black text-parch-300">
          Week {night} in St Sebastian…
        </h1>
      </div>
      {/* Each row a manuscript line: seal, plate thumbnail, entry, ink mark. */}
      <ul className="w-full max-w-3xl">
        {assigned.map((p) => {
          const done = playerResult(p, night) !== null;
          const away = !playerConnected(p);
          const loc = locationDef(assignments![p.id] as never);
          return (
            <li
              key={p.id}
              className={`flex items-center justify-between gap-4 border-b border-parch-600/15 px-4 py-4 text-2xl first:border-t ${
                away ? "opacity-50" : ""
              }`}
            >
              <span className="flex items-center gap-4">
                <PlayerDot player={p} />
                <Art
                  src={`/images/locations/${assignments![p.id]}.png`}
                  className="pointer-events-none h-10 w-14 rounded border border-bark/60 object-cover sepia-[.2]"
                />
                <span>
                  <span className="font-display font-bold">{playerName(p)}</span>
                  <span className="font-prose italic text-parch-400"> is at {loc.name}…</span>
                  {away && !done && (
                    <span className="ml-3 text-base text-red-400/80">
                      (phone lost — reconnecting?)
                    </span>
                  )}
                </span>
              </span>
              <span
                className={done ? "text-amber-300" : "animate-pulse text-parch-500"}
              >
                {done ? "✓" : "…"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="font-prose italic text-parch-500">
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
        className="font-display rounded-sm border border-bark px-5 py-2 text-xs uppercase tracking-[0.15em] text-parch-600 hover:border-parch-600 hover:text-parch-400"
      >
        A phone died? End the week without them →
      </button>
      <PageFrame />
    </main>
  );
}

// ---------------------------------------------------------------- RESOLVE

function ResolveScreen({
  night,
  players,
  threats,
}: {
  night: number;
  players: PlayerState[];
  threats: ThreatScores;
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
      <main className="relative flex min-h-screen flex-col gap-6 p-10">
        <Vignette />
        <div className="flex flex-col items-center gap-3">
          <ChronicleHeading>Around the Fire</ChronicleHeading>
          <NightDots night={night} />
          <h1 className="font-display text-center text-3xl text-amber-200/90 [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">
            Around the fire, week {night}
          </h1>
          <p className="font-prose text-center italic text-white/55">
            You take stock of the day, and tell each other what you saw.
          </p>
          {/* Where the four dooms stood as the week played out; tonight's
              relief or recklessness lands when the week ends. */}
          <ThreatMetersCompact threats={threats} />
        </div>
        {/* Parchment scraps read into the record, one by one. */}
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4">
          {results.slice(0, shown).map(({ player, result }, i) => (
            <div
              key={player.id}
              className={`fade-up rounded-sm border border-amber-900/40 bg-black/45 p-5 shadow-lg shadow-black/40 backdrop-blur-sm ${
                i % 2 === 0 ? "rotate-[0.5deg]" : "-rotate-[0.5deg]"
              }`}
            >
              <p className="text-2xl leading-snug">
                <span
                  className="font-display"
                  style={{ color: playerColor(player) }}
                >
                  {playerName(player)}
                </span>
                <span className="text-white/60"> — </span>
                <span className="font-prose text-white/95">{result!.outcome}</span>
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
          className="btn-quest mx-auto px-8 py-3 text-lg md:text-lg"
        >
          {night >= NIGHT_COUNT ? "To the reckoning →" : `On to week ${night + 1} →`}
        </button>
        <PageFrame />
      </main>
    </CampfireScene>
  );
}

// ----------------------------------------------------------------- FINALE

function FinaleScreen({
  players,
  threats,
}: {
  players: PlayerState[];
  threats: ThreatScores;
}) {
  const [ending] = useEnding();

  // Compute the ending once — party flags plus how many dooms hit the cap —
  // and publish it to shared state so it survives a host refresh.
  useEffect(() => {
    if (players.length === 0 || getPublishedEnding()) return;
    const party = players.map((p) => ({
      stats: playerStats(p),
      flags: playerFlags(p),
    }));
    publishEnding(townEnding(party, getThreats()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  const votes = new Map<string, number>();
  for (const p of players) {
    const v = playerVote(p);
    if (v) votes.set(v, (votes.get(v) ?? 0) + 1);
  }
  const voted = players.filter((p) => playerVote(p)).length;

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center gap-8 overflow-hidden p-10">
      <BackdropArt
        src="/images/scenes/finale.png"
        imgClassName="opacity-[0.16] sepia-[.3]"
      />
      <Vignette />
      <div className="flex flex-col items-center gap-3 text-center">
        <ChronicleHeading>The Reckoning</ChronicleHeading>
        <h1 className="text-5xl font-black">THE SEVENTH WEEK ENDS</h1>
        <Rule />
      </div>
      {/* The town's ending, an illuminated page: IM Fell prose with a drop
          cap; the final loud line rings out in Cinzel. */}
      <div className="max-w-2xl space-y-5 text-center">
        {ending ? (
          <>
            <div className="story-prose space-y-5">
              {ending.slice(0, -1).map((p, i) => (
                <p key={i} className="text-2xl leading-relaxed text-parch-300">
                  {p}
                </p>
              ))}
            </div>
            <p className="font-display pt-2 text-3xl font-black tracking-wide text-amber-400">
              {ending[ending.length - 1]}
            </p>
          </>
        ) : (
          <p className="font-prose animate-pulse text-2xl italic text-parch-500">
            St Sebastian waits to learn its fate…
          </p>
        )}
      </div>

      {/* Where the four dooms ended; a maxed meter burns red with its blurb. */}
      <div className="flex justify-center">
        <ThreatMeters threats={threats} />
      </div>

      <section className="mt-4 w-full max-w-2xl">
        <h2 className="font-display mb-3 text-center text-xl tracking-wide text-parch-300">
          Whose week was the wildest? · {voted}/{players.length} voted
        </h2>
        <ul className="flex flex-col gap-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-sm border border-parch-600/25 bg-parch-100/[0.04] px-6 py-3 text-xl"
            >
              <span className="flex items-center gap-3 font-bold">
                <PlayerDot player={p} />
                <span className="font-display">{playerName(p)}</span>
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
        className="btn-quest px-10 py-4 text-xl md:text-xl"
      >
        END THE WEEK
      </button>
      <PageFrame />
    </main>
  );
}

// --------------------------------------------------------------- EPILOGUE

function EpilogueScreen({
  players,
  threats,
}: {
  players: PlayerState[];
  threats: ThreatScores;
}) {
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
    <main className="relative isolate flex min-h-screen flex-col items-center gap-10 overflow-hidden p-10">
      <BackdropArt
        src="/images/scenes/epilogue.png"
        imgClassName="opacity-[0.10] sepia-[.3]"
      />
      <Vignette />
      <div className="flex flex-col items-center gap-3 text-center">
        <ChronicleHeading>What Became of Them</ChronicleHeading>
        <h1 className="text-5xl font-black">SEVEN WEEKS, ENDED</h1>
      </div>
      <ThreatMetersCompact threats={threats} />
      {wildest && (
        <p className="font-prose text-2xl italic text-parch-300">
          The village agrees:{" "}
          <span className="font-display font-black not-italic text-amber-400">
            {playerName(wildest)}
          </span>{" "}
          had the wildest week.
        </p>
      )}
      {/* The chronicle's ledger: hairline rules, Cinzel numerals, vellum tint. */}
      <table className="w-full max-w-3xl border-collapse text-xl">
        <thead>
          <tr className="text-sm uppercase tracking-widest text-parch-500">
            <th className="font-display border-b border-parch-600/40 px-4 pb-2 text-left font-normal">
              Player
            </th>
            {(Object.keys(STAT_LABELS) as StatId[]).map((s) => (
              <th
                key={s}
                className="font-display border-b border-parch-600/40 px-4 pb-2 text-center font-normal"
              >
                {STAT_LABELS[s]}
              </th>
            ))}
            <th className="font-display border-b border-parch-600/40 px-4 pb-2 text-center font-normal">
              Marks
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const stats = playerStats(p);
            return (
              <tr
                key={p.id}
                className="border-b border-parch-600/15 odd:bg-parch-100/[0.04]"
              >
                <td className="flex items-center gap-3 px-4 py-3 font-bold">
                  <PlayerDot player={p} />
                  <span className="font-display">{playerName(p)}</span>
                </td>
                {(Object.keys(STAT_LABELS) as StatId[]).map((s) => (
                  <td key={s} className="font-display px-4 text-center text-parch-200">
                    {stats[s]}
                  </td>
                ))}
                <td className="font-display px-4 text-center text-parch-200">
                  {playerFlags(p).length}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <section className="w-full max-w-6xl">
        <h2 className="font-display mb-3 text-center text-xl tracking-wide text-parch-400">
          What became of each of you
        </h2>
        <Rule className="mb-5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="rounded-sm border border-parch-600/30 bg-parch-100/[0.03] p-5"
            >
              <p className="font-display mb-2 flex items-center gap-2 text-lg font-bold">
                <PlayerDot player={p} />
                {playerName(p)}
              </p>
              {/* Everyone sees every player's ending. */}
              <div className="story-prose mb-3">
                <p className="text-sm leading-relaxed text-parch-200">
                  {playerEnding(playerFlags(p))}
                </p>
              </div>
              {/* Storylines this player saw through to the end — sealed letters. */}
              {completedStorylines(playerFlags(p)).map((s) => (
                <div
                  key={s.id}
                  className="relative mb-3 rounded-sm border border-amber-500/40 bg-amber-500/5 px-4 py-3"
                >
                  <span
                    aria-hidden
                    className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full bg-gold shadow ring-2 ring-night"
                  />
                  <p className="font-display mb-1 text-amber-400">{s.title}</p>
                  <p className="font-prose text-sm leading-relaxed text-parch-200">
                    {s.ending}
                  </p>
                </div>
              ))}
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
        className="btn-parch px-10 py-4 text-xl md:text-xl"
      >
        Play another week →
      </button>
      <PageFrame />
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

/** A player's colour as a wax seal: pressed dot in a pale vellum ring. */
function PlayerDot({ player }: { player: PlayerState }) {
  return (
    <span
      className="inline-block h-5 w-5 shrink-0 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.6)] ring-2 ring-parch-100/25"
      style={{ backgroundColor: playerColor(player) }}
    />
  );
}

/** A small wax seal with the player's name, for the location plates. */
function PlayerChip({ player }: { player: PlayerState }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-parch-500/40 bg-night/60 py-1 pl-1.5 pr-3 text-sm font-bold text-parch-200">
      <span
        className="inline-block h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-parch-100/40"
        style={{ backgroundColor: playerColor(player) }}
      />
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
