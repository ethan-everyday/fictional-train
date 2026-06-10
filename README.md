# Seven Nights (working title)

A 7-night narrative party game: one host screen (TV/laptop), 2–6 phones as
controllers, story content driven by [Ink](https://www.inklestudios.com/ink/).
This repo is the **Phase 1 prototype** — see the spec for the full picture.

## Status: M1–M5 built, awaiting real-phone testing

The whole prototype loop is in: lobby → night intro → choose location (60 s
soft timer) → private storylets on phones → resolve on the big screen → ×7
nights → finale (three Ink endings off the party's average stats) → vote →
epilogue scoreboard. Setting: grounded medieval — seven nights before the
Michaelmas Fair in the village of Hollowbrook. Seven locations (church,
tavern, market, farms, castle, slums, docks), each with its own people
(the priest, the innkeep and gamblers, the Shire Reeve, the lord, the
foreign traders…), stat-gated and flag-gated choices, and a week that
remembers what you did.

Reconnection basics: a phone refresh mid-storylet resumes where it was (ink
state in localStorage, stats via Playroom's grace period); a host refresh
rejoins its room and the game carries on.

## Run it

### Windows: double-click `start-game.bat`

It installs dependencies on first run, starts the server on port 3100 bound
to your LAN, prints the host/join URLs with your actual Wi-Fi IP, and opens
the host screen in your browser. Close the window to stop the game.

### On your desktop, phones on the same Wi-Fi (no deploy needed)

```bash
git clone https://github.com/ethan-everyday/fictional-train.git seven-nights
cd seven-nights
npm install
npm run dev
```

Next prints two URLs — use the **Network** one (e.g.
`http://192.168.1.23:3000`), not localhost:

1. Open `http://<that-ip>:3000/host` on the desktop. **Important:** open the
   host page via the network IP, not localhost — the QR code encodes whatever
   address the host page was opened on, and phones can't reach localhost.
2. Scan the QR with each phone (or browse to
   `http://<that-ip>:3000/play` and type the room code).
3. The game itself syncs through Playroom's cloud, so only the page needs to
   be on your LAN.

If the Network URL doesn't appear or phones can't connect, check the desktop
firewall allows inbound port 3000, or run `npm run dev -- -H 0.0.0.0`.

### Public URL (for testing away from home)

Import the repo once at vercel.com/new (framework auto-detects, no env vars);
every push then gets a URL. Open `<deploy-url>/host` on the big screen and
scan from anywhere.

## Sound (optional)

The host screen plays an ambient bed + stingers if you drop files into
`public/audio/`: `ambient.mp3` (loops), `stinger-night.mp3`,
`stinger-drama.mp3`, `stinger-resolve.mp3`, `stinger-finale.mp3`. Missing
files are silently skipped — the repo ships silent. Phones never play sound.
Mute toggle bottom-right of the host screen.

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

- The game writes `intelligence/strength/agility/craft/will/wealth` in before
  the knot runs and reads them back out at the end (clamped 0–5). Change them
  with `~ craft = craft + 1`; wealth can also be spent: `~ wealth = wealth - 1`.
- Set `~ outcome = "..."` to one short line; the host shows "<name> <outcome>".
- `flag_*` booleans become persistent story flags on the player.
- Gate a choice with a tag *inside* the brackets:
  `* [Join the harvest line # needs: strength 3]` — shown but disabled until
  the stat meets the bar.
- Three read-only context vars are written in before the knot runs:
  `night` (1–7), `visits` (previous nights this player spent at this
  location — 0 on a first visit), and `event` (the current drama event id,
  or `""` on an ordinary night). Branch with conditional text
  `{visits == 0: first-time line | return-visit line}`, gate choices with
  `* {night >= 5} [...]`, or dispatch whole variants at the top of a knot:
  `{night >= 6: -> storylet_manor_endweek}` (see the manor for the pattern).
- **Each night is a fresh story.** Sequences, cycles, and read counts do NOT
  carry between nights — only stats, `flag_*`, and the context vars above do.
- `npm run stories` compiles AND contract-checks every knot (every choice
  path must reach END with `outcome` set, gate tags must parse, finale knots
  must be choice-free). Run it after every writing session.

## Milestones

- [x] **M1 Plumbing** — room code, QR, join, PING round-trip
- [x] **M2 Turn machine** — GamePhase state machine, choose-location round, soft timer
- [x] **M3 Ink runtime** — storylets compiled from ink, stat gates, stat changes, resolve screen
- [x] **M4 Full night loop** — six placeholder storylets, 7 nights, finale + epilogue *(needs the 3-human playtest)*
- [x] **M5 Reconnection + finale** — phone refresh resumes mid-storylet, host refresh recovers, 3 stub endings *(needs the kill-a-phone test)*
