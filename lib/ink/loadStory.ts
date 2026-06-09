"use client";

/** Compiled story JSON, fetched once per page and cached. */

let cache: Promise<unknown> | null = null;

export function getStoryContent(): Promise<unknown> {
  if (!cache) {
    cache = fetch("/stories/main.json").then((res) => {
      if (!res.ok) {
        cache = null;
        throw new Error(`Could not load story (${res.status})`);
      }
      return res.json();
    });
  }
  return cache;
}
