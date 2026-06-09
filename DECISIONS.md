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
