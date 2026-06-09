"use client";

import { FormEvent, useState } from "react";
import { joinRoom, sendPing } from "@/lib/game/connection";

type Status = "form" | "joining" | "joined";

export default function PlayScreen() {
  // Rendered with ssr:false, so window is safe at first render.
  const codeFromUrl =
    new URLSearchParams(window.location.search).get("room") ?? "";

  const [roomCode, setRoomCode] = useState(codeFromUrl);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("form");
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!roomCode.trim() || !name.trim()) return;
    setStatus("joining");
    setError(null);
    try {
      await joinRoom(roomCode, name);
      setStatus("joined");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the room");
      setStatus("form");
    }
  }

  if (status === "joined") {
    return <Controller name={name} />;
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

function Controller({ name }: { name: string }) {
  const [pressed, setPressed] = useState(0);

  function handlePing() {
    sendPing();
    setPressed((n) => n + 1);
    if (navigator.vibrate) navigator.vibrate(50);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <p className="text-xl text-zinc-400">
        You're in, <span className="font-bold text-zinc-100">{name}</span>.
        Watch the big screen.
      </p>
      <button
        onClick={handlePing}
        className="h-56 w-56 rounded-full bg-amber-500 text-4xl font-black text-zinc-950 shadow-lg shadow-amber-500/30 active:scale-95 active:bg-amber-400"
      >
        PING
      </button>
      <p className="font-mono text-zinc-500">
        {pressed === 0 ? "Tap it." : `Sent ${pressed} ping${pressed === 1 ? "" : "s"}`}
      </p>
    </main>
  );
}
