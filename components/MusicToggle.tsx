"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Title-screen music: the same folk track the host plays in-game
 * (/audio/ambient.mp3). Autoplay policy means it must start from a click;
 * navigating away unmounts this and stops the audio.
 */
export default function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/ambient.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  }

  return (
    <button
      onClick={toggle}
      className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${
        playing
          ? "border-amber-500/60 text-amber-400"
          : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
      }`}
    >
      {playing ? "♪ The minstrel plays — hush him" : "♪ Let the minstrel play"}
    </button>
  );
}
