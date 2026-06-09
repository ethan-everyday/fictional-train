# Seven Nights (working title)

A 7-night narrative party game: one host screen (TV/laptop), 2–6 phones as
controllers, story content driven by [Ink](https://www.inklestudios.com/ink/).
This repo is the **Phase 1 prototype** — see the spec for the full picture.

## Current milestone: M1 — Plumbing

- `/host` opens a Playroom room and shows the room code + QR.
- `/play` joins with code + name; players appear on the host screen as they connect.
- Phone shows one big **PING** button; the host screen flashes the player's row
  and counts their pings. Round-trip should feel ~instant on the same Wi-Fi.

M1 is the go/no-go milestone: if this loop doesn't feel solid on real phones,
fix it before anything else.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000/host` on the laptop. **Phones can't reach
localhost** — Playroom needs a public URL for phone testing, so push and use a
Vercel preview deploy (free), then open `<preview-url>/host` on the laptop and
scan the QR with phones. For quick same-Wi-Fi testing without a deploy, `npm
run dev` also listens on your LAN IP (`http://<laptop-ip>:3000/play?room=…`).

## Layout

```
/app
  /host        the TV/laptop screen
  /play        the phone controller
/components    the actual screens (loaded client-only)
/lib
  /game        ALL multiplayer code; nothing else imports playroomkit
/stories       (M3+) Ink sources, compiled JSON goes to /public/stories
```

Ground rules: multiplayer goes through `/lib/game`, Ink goes through `/lib/ink`
(coming in M3), and every architectural choice gets a line in `DECISIONS.md`.

## Milestones

- [x] **M1 Plumbing** — room code, QR, join, PING round-trip
- [ ] **M2 Turn machine** — GamePhase state machine, choose-location round, soft timer
- [ ] **M3 Ink runtime** — one storylet authored in Inky, played on a phone, stats update
- [ ] **M4 Full night loop** — six stub storylets, full night with 3 humans
- [ ] **M5 Reconnection + finale** — rejoin mid-storylet, host refresh recovery, stub endings
