"use client";

import type { ReactNode } from "react";

/**
 * Atmospheric host backdrops, drawn in SVG so they ship offline and theme
 * with the rest of the game. Each takes children rendered over the scene.
 */

/** A ship crossing a dark, moonless sea — and two faint red eyes watching. */
export function SeaScene({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b12]">
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1020" />
            <stop offset="55%" stopColor="#0b1424" />
            <stop offset="100%" stopColor="#040810" />
          </linearGradient>
          <radialGradient id="eyeglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(220,40,40,0.5)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#sky)" />

        {/* The Herald, watching from the dark above the horizon. */}
        <g className="herald-eyes">
          <circle cx="565" cy="150" r="26" fill="url(#eyeglow)" />
          <circle cx="635" cy="150" r="26" fill="url(#eyeglow)" />
          <circle cx="565" cy="150" r="5" fill="#ff5a5a" />
          <circle cx="635" cy="150" r="5" fill="#ff5a5a" />
        </g>

        {/* The ship, bobbing on the swell. */}
        <g className="sea-ship">
          <g transform="translate(600 470)">
            <path d="M-70 0 Q0 34 70 0 L54 26 Q0 40 -54 26 Z" fill="#05080e" />
            <rect x="-2" y="-90" width="4" height="92" fill="#05080e" />
            <path d="M2 -86 Q56 -64 48 -16 L2 -16 Z" fill="#0c1422" />
            <path d="M-2 -78 Q-44 -58 -40 -22 L-2 -22 Z" fill="#0c1422" />
          </g>
        </g>

        {/* Wave layers, sliding slowly across each other. */}
        <g>
          <path className="wave wave-a" d="M0 520 Q150 500 300 520 T600 520 T900 520 T1200 520 T1500 520 V800 H0 Z" fill="#0a1626" opacity="0.9" />
          <path className="wave wave-b" d="M0 565 Q150 545 300 565 T600 565 T900 565 T1200 565 T1500 565 V800 H0 Z" fill="#0b1a2e" opacity="0.9" />
          <path className="wave wave-c" d="M0 615 Q150 595 300 615 T600 615 T900 615 T1200 615 T1500 615 V800 H0 Z" fill="#0d2138" opacity="0.95" />
        </g>
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** A campfire in the dark — warm flicker, embers, deep night around it. */
export function CampfireScene({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0805]">
      <div
        aria-hidden
        className="campfire-glow pointer-events-none absolute inset-0 bg-[radial-gradient(900px_700px_at_50%_88%,rgba(245,150,40,0.22),rgba(140,60,15,0.08)_45%,transparent_70%)]"
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-1/2 h-40 w-64 -translate-x-1/2"
        viewBox="0 0 200 140"
      >
        {/* logs */}
        <g stroke="#2a1a0e" strokeWidth="9" strokeLinecap="round">
          <line x1="55" y1="118" x2="150" y2="108" />
          <line x1="50" y1="108" x2="145" y2="120" />
        </g>
        {/* flames */}
        <path className="flame flame-1" d="M100 112 C84 92 92 70 100 50 C108 70 116 92 100 112 Z" fill="#ff7a18" />
        <path className="flame flame-2" d="M100 112 C90 96 95 80 100 66 C105 80 110 96 100 112 Z" fill="#ffd24a" />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
