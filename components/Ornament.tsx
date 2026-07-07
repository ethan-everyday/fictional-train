"use client";

import { useState } from "react";

/**
 * The shared ornament kit: every screen of Seven Nights is a leaf of the
 * Chronicle of St Sebastian, and these pieces are its rubrication — rules,
 * running headers, page chrome, framed plates and vignettes. Import from
 * here; never re-draw them locally.
 */

/** A centred fleuron divider: thin hairlines flanking a ❦, amber and faint. */
export function Rule({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center gap-3 text-amber-400/40 ${className}`}
    >
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/40" />
      <span className="text-sm leading-none">❦</span>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/40" />
    </div>
  );
}

/** The running header: small-caps Cinzel flanked by hairline rules. */
export function ChronicleHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <span
        aria-hidden
        className="h-px max-w-[6rem] flex-1 bg-gradient-to-r from-transparent to-amber-300/30"
      />
      <span className="font-display text-sm uppercase tracking-[0.35em] text-amber-300/80">
        {children}
      </span>
      <span
        aria-hidden
        className="h-px max-w-[6rem] flex-1 bg-gradient-to-l from-transparent to-amber-300/30"
      />
    </div>
  );
}

/**
 * Host page chrome: a double rule inset from the screen edge with tiny
 * corner fleurons, so every host phase reads as a page of the same book.
 * Purely decorative — pointer-events-none, very low opacity.
 */
export function PageFrame({ className = "" }: { className?: string }) {
  const corners = [
    "left-1 top-0.5",
    "right-1 top-0.5 -scale-x-100",
    "left-1 bottom-0.5 -scale-y-100",
    "right-1 bottom-0.5 -scale-x-100 -scale-y-100",
  ];
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-3 rounded border border-parch-600/20 ${className}`}
    >
      <div className="absolute inset-1 rounded-sm border border-parch-600/10" />
      {corners.map((pos) => (
        <span
          key={pos}
          className={`absolute ${pos} text-[10px] leading-none text-amber-400/25`}
        >
          ❦
        </span>
      ))}
    </div>
  );
}

/**
 * A framed woodcut plate: parchment mat, double rule, deep shadow. Owns its
 * own failure state (same contract as components/Art.tsx) so that when the
 * image file is missing the FRAME vanishes with it — the screen degrades to
 * nothing, never to an empty frame.
 */
export function Plate({
  src,
  alt = "",
  className = "",
  imgClassName = "",
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
}) {
  // Keyed by src (not a boolean) so a changed src retries automatically.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return null;
  return (
    <div
      className={`inline-block rounded-sm border-4 border-double border-bark bg-parch-100 p-1.5 shadow-2xl shadow-black/60 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading="lazy"
        className={`block max-w-full ${imgClassName}`}
        onError={() => setFailedSrc(src)}
        ref={(el) => {
          // Static export: a 404 can complete before hydration attaches
          // onError. If the img already finished and failed, catch it here.
          if (el && el.complete && el.naturalWidth === 0) setFailedSrc(src);
        }}
      />
    </div>
  );
}

/** Radial edge-darkening for depth on host screens: clear centre, night corners. */
export function Vignette({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 55%, rgba(15, 11, 7, 0.6) 100%)",
      }}
    />
  );
}
