"use client";

import { useState } from "react";

/**
 * Art is optional the way audio is optional (see lib/audio/sound.ts):
 * generated images may be missing (generation quota, a re-roll in progress)
 * and the game must be unaffected — a failed load renders NOTHING, so every
 * screen must look correct bare. All generated art goes through these two
 * components; never hand-roll an <img> for /images/** assets.
 */

export function Art({
  src,
  alt = "",
  className,
  eager = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  eager?: boolean;
}) {
  // Keyed by src (not a boolean) so a changed src retries automatically.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailedSrc(src)}
      ref={(el) => {
        // Static export: a 404 can complete before hydration attaches
        // onError. If the img already finished and failed, catch it here.
        if (el && el.complete && el.naturalWidth === 0) setFailedSrc(src);
      }}
    />
  );
}

/**
 * A full-bleed dimmed backdrop behind a screen's content: the image AND its
 * darkening gradient live together, so a missing file removes both and the
 * screen degrades pixel-identically to today. The parent element supplies
 * `relative isolate overflow-hidden`; this sits at -z-10 inside that
 * stacking context — behind every sibling, above the body background.
 */
export function BackdropArt({
  src,
  imgClassName = "opacity-[0.18] sepia-[.3]",
  overlayClassName = "bg-gradient-to-b from-night/60 via-night/35 to-night/85",
}: {
  src: string;
  imgClassName?: string;
  overlayClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        className={`h-full w-full object-cover object-center ${imgClassName}`}
        onError={() => setFailed(true)}
        ref={(el) => {
          if (el && el.complete && el.naturalWidth === 0) setFailed(true);
        }}
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </div>
  );
}
