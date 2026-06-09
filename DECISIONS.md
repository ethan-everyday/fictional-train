# Decisions

One line per architectural choice. Append, don't rewrite history.

- 2026-06-09 — Next.js 14 App Router + TypeScript + Tailwind; existing stack, deploys to Vercel with zero config.
- 2026-06-09 — Playroom Kit for multiplayer; all playroomkit imports confined to `lib/game/connection.ts` so the Colyseus fallback is a one-file swap.
- 2026-06-09 — Host runs as a Playroom *stream screen* (`streamMode: true`): it owns the room and shows the code/QR but is never in the players list, matching the host-authoritative design.
- 2026-06-09 — `skipLobby: true` everywhere; we render our own lobby UI instead of Playroom's.
- 2026-06-09 — Player identity = Playroom player id; chosen display name stored as player state `name`, never as shared state.
- 2026-06-09 — PING (M1) implemented as player state `{count, at}` rather than RPC; player state survives observers (host) joining late, RPC doesn't.
- 2026-06-09 — `/host` and `/play` pages load their screens via `next/dynamic` with `ssr: false`; playroomkit touches browser globals at import time.
- 2026-06-09 — `qrcode.react` for the join QR; renders SVG locally, no network call.
- 2026-06-09 — No Zustand/Redux, no DB, no auth, no Electron in the prototype (per spec §2).
- 2026-06-09 — Ink compiled at build time by `scripts/compile-stories.mjs` using inkjs's bundled compiler (`inkjs/full`); authoring needs only a text editor, Inky optional.
- 2026-06-09 — All inkjs imports confined to `lib/ink/storylet.ts`, mirroring the Playroom rule.
- 2026-06-09 — Stat-gated choices use a tag INSIDE the choice brackets: `* [Force the door # needs: body 3]` (a tag after the bracket binds to the post-choice content, not the choice). The game shows-but-disables; ink itself doesn't gate.
- 2026-06-09 — Storylets set an `outcome` string var; the host resolve screen renders "<name> <outcome>". Flags are `flag_*` booleans diffed out after each run.
- 2026-06-09 — Picks and storylet results are PLAYER state tagged with the night number; the host derives the room view. One writer per key — no concurrent writes to a shared map.
- 2026-06-09 — Mid-storylet ink saves go to the phone's localStorage (key per room+night), not synced state: survives a phone refresh, costs nothing to sync. Stats/flags survive disconnects via Playroom's reconnectGracePeriod (3 min).
- 2026-06-09 — Host refresh recovery: the host stores its room code in localStorage (2 h window) and rejoins the same room, where Playroom still holds all shared state.
- 2026-06-09 — The finale knot runs on the party's AVERAGE stats so ending thresholds don't scale with player count.
- 2026-06-09 — Phase transitions live in `lib/game/state.ts` and are only ever called by the host screen; phones render shared state and never transition.
