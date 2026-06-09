"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  playerColor,
  playerName,
  startHost,
  usePings,
  usePlayers,
} from "@/lib/game/connection";

// How long a ping keeps a player's row lit on the host screen.
const PING_FLASH_MS = 1500;

export default function HostScreen() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startHost().then(setRoomCode, (e: Error) => setError(e.message));
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

  return <Lobby roomCode={roomCode} />;
}

function Lobby({ roomCode }: { roomCode: string }) {
  const players = usePlayers();
  const pings = usePings();
  const joinUrl = `${window.location.origin}/play?room=${roomCode}`;

  // Re-render on a short tick so ping flashes expire even with no new state.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const pingByPlayer = new Map(pings.map(({ player, ping }) => [player.id, ping]));

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 p-10">
      <header className="text-center">
        <h1 className="text-3xl font-black tracking-tight text-zinc-400">
          SEVEN NIGHTS
        </h1>
        <p className="mt-6 text-2xl text-zinc-300">Join on your phone</p>
        <p className="my-2 font-mono text-8xl font-black tracking-[0.2em] text-amber-400">
          {roomCode}
        </p>
        <p className="text-lg text-zinc-500">{joinUrl}</p>
      </header>

      <div className="rounded-2xl bg-white p-4">
        <QRCodeSVG value={joinUrl} size={200} />
      </div>

      <section className="w-full max-w-2xl">
        <h2 className="mb-4 text-center text-xl font-bold text-zinc-400">
          {players.length === 0
            ? "Waiting for players…"
            : `${players.length} player${players.length === 1 ? "" : "s"} in the room`}
        </h2>
        <ul className="flex flex-col gap-3">
          {players.map((player) => {
            const ping = pingByPlayer.get(player.id) ?? null;
            const justPinged = ping !== null && now - ping.at < PING_FLASH_MS;
            return (
              <li
                key={`${player.id}-${ping?.count ?? 0}`}
                className={`flex items-center justify-between rounded-xl border border-zinc-800 px-6 py-4 text-2xl ${
                  justPinged ? "ping-flash" : ""
                }`}
              >
                <span className="flex items-center gap-4 font-bold">
                  <span
                    className="inline-block h-5 w-5 rounded-full"
                    style={{ backgroundColor: playerColor(player) }}
                  />
                  {playerName(player)}
                </span>
                <span className="font-mono text-zinc-400">
                  {ping
                    ? justPinged
                      ? "PING!"
                      : `${ping.count} ping${ping.count === 1 ? "" : "s"}`
                    : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      {children}
    </main>
  );
}
