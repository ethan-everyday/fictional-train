"use client";

/**
 * The ONLY module that touches audio, and only the host screen imports it
 * (same confinement rule as connection.ts and storylet.ts). Phones stay
 * silent — the room's sound comes from the TV.
 *
 * Everything here is silence-tolerant: missing files or autoplay blocks are
 * caught and reported, never thrown. The game must be unaffected by audio.
 *
 * Files live in /public/audio (none ship with the repo — drop in your own):
 *   ambient.mp3          looping bed, starts at BEGIN THE WEEK
 *   stinger-night.mp3    each ordinary night-intro
 *   stinger-drama.mp3    a drama-event night-intro
 *   stinger-resolve.mp3  the resolve screen
 *   stinger-finale.mp3   the finale (ambient stops here)
 */

const FILES = {
  ambient: "/audio/ambient.mp3",
  night: "/audio/stinger-night.mp3",
  drama: "/audio/stinger-drama.mp3",
  resolve: "/audio/stinger-resolve.mp3",
  finale: "/audio/stinger-finale.mp3",
} as const;

export type SoundName = keyof typeof FILES;

const MUTE_KEY = "7n:muted";

let elements: Map<SoundName, HTMLAudioElement> | null = null;
let unlocked = false;

function ensureElements(): Map<SoundName, HTMLAudioElement> {
  if (!elements) {
    elements = new Map();
    for (const [name, src] of Object.entries(FILES) as [SoundName, string][]) {
      const el = new Audio(src);
      el.preload = "auto";
      el.volume = name === "ambient" ? 0.4 : 0.7;
      if (name === "ambient") el.loop = true;
      el.muted = isMuted();
      elements.set(name, el);
    }
  }
  return elements;
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(value: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {}
  elements?.forEach((el) => {
    el.muted = value;
  });
}

/**
 * Bless every element inside a user gesture (autoplay policy demands each
 * element be individually played once). Resolves true if the browser let
 * audio through; false means show the "tap to enable sound" pill.
 */
export async function unlockAudio(): Promise<boolean> {
  const els = ensureElements();
  const attempts: Promise<boolean>[] = [];
  els.forEach((el, name) => {
    attempts.push(
      el
        .play()
        .then(() => {
          if (name !== "ambient") {
            el.pause();
            el.currentTime = 0;
          }
          return true;
        })
        .catch(() => false), // blocked or file missing — both fine
    );
  });
  // "Unlocked" if anything played; all-false usually means autoplay block.
  const results = await Promise.all(attempts);
  unlocked = results.some(Boolean);
  return unlocked;
}

export function audioUnlocked(): boolean {
  return unlocked;
}

export function playAmbient(): void {
  ensureElements()
    .get("ambient")
    ?.play()
    .catch(() => {});
}

export function stopAmbient(): void {
  const el = elements?.get("ambient");
  if (el) el.pause();
}

export function stinger(name: Exclude<SoundName, "ambient">): void {
  const el = ensureElements().get(name);
  if (!el) return;
  try {
    el.currentTime = 0;
    el.play().catch(() => {});
  } catch {}
}
