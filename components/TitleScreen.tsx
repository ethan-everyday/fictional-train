"use client";

import { useEffect, useState } from "react";
import {
  isMuted,
  playAmbient,
  setMuted,
  stopAmbient,
  unlockAudio,
} from "@/lib/audio/sound";

interface Props {
  /** A recent room exists — offer CONTINUE alongside NEW GAME. */
  hasSave: boolean;
  onStart: (freshRoom: boolean) => void;
}

/**
 * The game's front door: woodcut, music, and a proper menu.
 * Shown when the host loads, before any room is opened.
 */
export default function TitleScreen({ hasSave, onStart }: Props) {
  const [showOptions, setShowOptions] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [exitNote, setExitNote] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  // Music: the desktop app allows autoplay outright; browsers need a
  // gesture, so the first pointer/key press anywhere also starts it.
  useEffect(() => {
    let started = false;
    const tryStart = () => {
      if (started) return;
      unlockAudio().then((ok) => {
        if (ok) {
          started = true;
          playAmbient();
          cleanup();
        }
      });
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", tryStart);
      window.removeEventListener("keydown", tryStart);
    };
    tryStart();
    window.addEventListener("pointerdown", tryStart);
    window.addEventListener("keydown", tryStart);
    return cleanup;
  }, []);

  function toggleMusic() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) {
      unlockAudio().then((ok) => {
        if (ok) playAmbient();
      });
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    } else {
      document.documentElement
        .requestFullscreen()
        .then(() => setFullscreen(true))
        .catch(() => {});
    }
  }

  function exitGame() {
    stopAmbient();
    window.close();
    // A plain browser tab often refuses window.close(); say so.
    setTimeout(() => setExitNote(true), 400);
  }

  const menuButton =
    "font-display w-72 rounded-xl border-2 px-8 py-4 text-2xl tracking-wide transition-colors";

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/village-woodcut.jpg"
        alt=""
        className="kenburns absolute inset-0 h-full w-full object-cover object-center sepia-[.35] contrast-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/55 via-zinc-950/25 to-zinc-950" />
      <div
        aria-hidden
        className="lantern pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_600px_at_50%_120%,rgba(245,158,11,0.16),transparent_65%)]"
      />

      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-between px-6 py-[8vh] text-center">
        <header className="fade-up">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.45em] text-amber-300 [text-shadow:0_1px_8px_rgba(9,9,11,0.9)]">
            A party game of village fortunes
          </p>
          <h1 className="text-8xl leading-none text-zinc-50 [text-shadow:0_3px_28px_rgba(9,9,11,0.95)] sm:text-9xl">
            Seven Nights
          </h1>
        </header>

        {showOptions ? (
          <div className="fade-up flex flex-col items-center gap-4">
            <h2 className="mb-2 text-3xl text-amber-300">Options</h2>
            <button
              onClick={toggleMusic}
              className={`${menuButton} border-zinc-600 bg-zinc-950/70 text-zinc-100 backdrop-blur hover:border-amber-400`}
            >
              Music: {muted ? "Off" : "On"}
            </button>
            <button
              onClick={toggleFullscreen}
              className={`${menuButton} border-zinc-600 bg-zinc-950/70 text-zinc-100 backdrop-blur hover:border-amber-400`}
            >
              Fullscreen: {fullscreen ? "On" : "Off"}
            </button>
            <button
              onClick={() => setShowOptions(false)}
              className={`${menuButton} border-zinc-700 bg-zinc-950/70 text-zinc-400 backdrop-blur hover:border-zinc-400 hover:text-zinc-200`}
            >
              Back
            </button>
          </div>
        ) : (
          <div className="fade-up fade-up-1 flex flex-col items-center gap-4">
            {hasSave ? (
              <>
                <button
                  onClick={() => onStart(false)}
                  className={`${menuButton} border-amber-500 bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400`}
                >
                  Continue
                </button>
                <button
                  onClick={() => onStart(true)}
                  className={`${menuButton} border-zinc-600 bg-zinc-950/70 text-zinc-100 backdrop-blur hover:border-amber-400`}
                >
                  New Game
                </button>
              </>
            ) : (
              <button
                onClick={() => onStart(true)}
                className={`${menuButton} border-amber-500 bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400`}
              >
                Start
              </button>
            )}
            <button
              onClick={() => setShowOptions(true)}
              className={`${menuButton} border-zinc-600 bg-zinc-950/70 text-zinc-100 backdrop-blur hover:border-amber-400`}
            >
              Options
            </button>
            <button
              onClick={exitGame}
              className={`${menuButton} border-zinc-700 bg-zinc-950/70 text-zinc-400 backdrop-blur hover:border-zinc-400 hover:text-zinc-200`}
            >
              Exit
            </button>
            {exitNote && (
              <p className="text-sm text-zinc-500">
                This browser won't let the page close itself — just close the
                tab or window.
              </p>
            )}
          </div>
        )}

        <footer className="fade-up fade-up-2 text-sm text-zinc-500 [text-shadow:0_1px_6px_rgba(9,9,11,0.9)]">
          2–6 players · phones join over Wi-Fi once the room opens
        </footer>
      </div>
    </main>
  );
}
