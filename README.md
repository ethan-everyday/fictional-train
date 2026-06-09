# Seven Nights (working title)

A 7-night narrative party game: one host screen (TV/laptop), 2–6 phones as
controllers, story content driven by [Ink](https://www.inklestudios.com/ink/).
This repo is the **Phase 1 prototype** — see the spec for the full picture.

## Status: M1–M5 built, awaiting real-phone testing

The whole prototype loop is in: lobby → night intro → choose location (60 s
soft timer) → private storylets on phones → resolve on the big screen → ×7
nights → finale (three Ink endings off the party's average stats) → vote →
epilogue scoreboard. Story content is generic placeholder writing in
`stories/main.ink` — six locations, one stat-gated choice each, flags that
echo across locations.

Reconnection basics: a phone refresh mid-storylet resumes where it was (ink
state in localStorage, stats via Playroom's grace period); a host refresh
rejoins its room and the game carries on.

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
  /game        ALL multiplayer code + the turn machine; nothing else imports playroomkit
  /ink         ALL ink code; nothing else imports inkjs
/stories       Ink sources; `npm run stories` compiles them to /public/stories
/scripts       the ink → JSON build step (runs automatically before dev/build)
```

Ground rules: multiplayer goes through `/lib/game`, Ink goes through
`/lib/ink`, and every architectural choice gets a line in `DECISIONS.md`.

## Writing storylets

Edit `stories/main.ink` (plain text; Inky optional — the build compiles it).
The contract per storylet knot:

- The game writes `mind/body/charm/shadow` in before the knot runs and reads
  them back out at the end. Change them with `~ charm = charm + 1`.
- Set `~ outcome = "..."` to one short line; the host shows "<name> <outcome>".
- `flag_*` booleans become persistent story flags on the player.
- Gate a choice with a tag *inside* the brackets:
  `* [Arm-wrestle the blacksmith # needs: body 3]` — shown but disabled until
  the stat meets the bar.

## Milestones

- [x] **M1 Plumbing** — room code, QR, join, PING round-trip
- [x] **M2 Turn machine** — GamePhase state machine, choose-location round, soft timer
- [x] **M3 Ink runtime** — storylets compiled from ink, stat gates, stat changes, resolve screen
- [x] **M4 Full night loop** — six placeholder storylets, 7 nights, finale + epilogue *(needs the 3-human playtest)*
- [x] **M5 Reconnection + finale** — phone refresh resumes mid-storylet, host refresh recovers, 3 stub endings *(needs the kill-a-phone test)*
