"use client";

import { useEffect, useState } from "react";
import { Art } from "@/components/Art";
import { Rule, Vignette } from "@/components/Ornament";
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
 * The game's front door: the chronicle's frontispiece. Woodcut, music,
 * and a proper menu. Shown when the host loads, before any room is opened.
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

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/village-woodcut.jpg"
        alt=""
        className="kenburns absolute inset-0 h-full w-full object-cover object-center sepia-[.35] contrast-105"
      />
      {/* Generated title art layers over the shipped woodcut; if it's
          missing, Art vanishes and the woodcut beneath is the screen. */}
      <Art
        src="/images/scenes/title.png"
        eager
        className="kenburns absolute inset-0 h-full w-full object-cover object-center sepia-[.35] contrast-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-night/55 via-night/25 to-night" />
      <div
        aria-hidden
        className="lantern pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_600px_at_50%_120%,rgba(245,158,11,0.16),transparent_65%)]"
      />
      <Vignette />

      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-between px-6 py-[7vh] text-center">
        <header className="fade-up flex flex-col items-center">
          <p className="mb-5 font-display text-xs font-bold uppercase tracking-[0.45em] text-amber-300 [text-shadow:0_1px_8px_rgba(9,9,11,0.9)] sm:text-sm">
            A party game of village fortunes
          </p>
          <Rule className="mb-4 w-72 max-w-full" />
          <h1 className="font-display text-8xl font-bold leading-[0.95] text-parch-100 [text-shadow:0_3px_28px_rgba(9,9,11,0.95)] sm:text-9xl">
            Seven Nights
          </h1>
          <Rule className="mt-5 w-72 max-w-full" />
          <p className="font-prose mt-4 text-lg italic text-parch-300 [text-shadow:0_1px_10px_rgba(9,9,11,0.9)] sm:text-xl">
            St Sebastian, 1348 · seven weeks before the dark
          </p>
        </header>

        {showOptions ? (
          <div className="fade-up flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border-4 border-double border-bark bg-oak/85 px-8 py-8 shadow-2xl shadow-black/60 backdrop-blur">
            <h2 className="font-display text-2xl uppercase tracking-[0.2em] text-amber-300">
              Options
            </h2>
            <Rule className="mb-1 w-40" />
            <button onClick={toggleMusic} className="btn-parch w-full py-4">
              Music: {muted ? "Off" : "On"}
            </button>
            <button onClick={toggleFullscreen} className="btn-parch w-full py-4">
              Fullscreen: {fullscreen ? "On" : "Off"}
            </button>
            <button
              onClick={() => setShowOptions(false)}
              className="btn-parch w-full py-4 text-parch-400 hover:text-parch-200"
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
                  className="btn-quest w-72 py-4"
                >
                  Continue
                </button>
                <button
                  onClick={() => onStart(true)}
                  className="btn-parch w-72 py-4"
                >
                  New Game
                </button>
              </>
            ) : (
              <button
                onClick={() => onStart(true)}
                className="btn-quest w-72 py-4"
              >
                Start
              </button>
            )}
            <button
              onClick={() => setShowOptions(true)}
              className="btn-parch w-72 py-4"
            >
              Options
            </button>
            <button
              onClick={exitGame}
              className="btn-parch w-72 py-4 text-parch-400 hover:text-parch-200"
            >
              Exit
            </button>
            {exitNote && (
              <p className="font-prose text-sm italic text-parch-500">
                This browser won't let the page close itself — just close the
                tab or window.
              </p>
            )}
          </div>
        )}

        <footer className="fade-up fade-up-2 font-display text-xs uppercase tracking-[0.25em] text-parch-500 [text-shadow:0_1px_6px_rgba(9,9,11,0.9)]">
          2–6 players · phones join over Wi-Fi once the room opens
        </footer>
      </div>

      <p
        aria-hidden
        className="pointer-events-none absolute bottom-3 right-4 z-10 font-display text-[10px] uppercase tracking-[0.3em] text-parch-600"
      >
        MMXXVI · a chronicle in seven nights
      </p>
    </main>
  );
}
