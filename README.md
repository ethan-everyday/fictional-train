# Seven Nights (working title)

A 7-night narrative party game: one host screen (TV/laptop), 2–6 phones as
controllers, story content driven by [Ink](https://www.inklestudios.com/ink/).

Setting: grounded medieval — seven nights before the Michaelmas Fair in the
village of Hollowbrook. Seven locations (church, tavern, market, farms,
castle, slums, docks), each with its own people (the priest, the innkeep and
gamblers, the Shire Reeve, the lord, the foreign traders…), stat-gated and
flag-gated choices, and a week that remembers what you did.

## Architecture: local-first, Steam-shaped

The game hosts its own multiplayer. **No cloud, no account, no internet
required** — the host machine runs a small server (`server.js`) that serves
the game and syncs state; phones on the same Wi-Fi connect straight to it.
Wi-Fi blips and phone refreshes self-heal: clients auto-reconnect and pick
up exactly where they were, and room state is persisted to disk so even the
server restarting mid-game recovers the night.

```
[Host PC: server.js] ── serves ──> host screen (this PC's browser/window)
        ^ ws                        phones browse to http://<lan-ip>:3100/play
        └──────── ws ─────────────  2–6 phones on the same Wi-Fi
```

## Run it

### Windows: double-click `start-game.bat`

Installs dependencies on first run, builds once, kills any stale servers,
starts the game on port 3100, and opens the host screen with the QR code
phones scan. Close the window to stop. After changing code, run
`start-game.bat --rebuild`.

If phones can't reach the page, allow Node through Windows Firewall
(inbound TCP 3100), and make sure the phones are on the same Wi-Fi network
(router "guest/AP isolation" modes block device-to-device traffic).

### Desktop app (the Steam build)

```bash
npm run build      # once
npm run desktop    # Electron window embedding the server
npm run dist       # package: NSIS installer + portable .exe in /dist
```

The packaged app is the product: players install one thing, double-click
one icon, and the host window opens with the room code. Phones join via QR.

### Development (hot reload)

Double-click `dev-game.bat`, or run the two halves yourself:

```bash
npm run ws    # game server (WebSocket only) on 3199
npm run dev   # next dev on 3100
```

## Testing

```bash
npm test       # engine unit tests + server protocol tests (real sockets)
npm run e2e    # Playwright: two phones play a FULL 7-night game to the
               # epilogue and start a second week; phone refresh mid-story
               # auto-rejoins and resumes (requires `npm run build` first)
```

CI runs all of it on every push.

## Layout

```
server.js        the whole multiplayer backend + static file server
electron/        desktop shell: embeds server.js, opens the host window
/app
  /host          the TV/laptop screen
  /play          the phone controller
/components      the actual screens (loaded client-only)
/lib
  /game          connection.ts + socket.ts (ALL multiplayer), turn machine
  /ink           ALL ink code; nothing else imports inkjs
  /audio         host-only sound (ambient + stingers, silence-tolerant)
/stories         Ink sources; `npm run stories` compiles + contract-checks
/scripts         ink build + validator (runs automatically before dev/build)
/tests           server protocol tests        /e2e   full-game Playwright
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
  `{night >= 6: -> storylet_castle_eve}` (see the castle for the pattern).
- **Each night is a fresh story.** Sequences, cycles, and read counts do NOT
  carry between nights — only stats, `flag_*`, and the context vars above do.
- `npm run stories` compiles AND contract-checks every knot (every choice
  path must reach END with `outcome` set, gate tags must parse, finale knots
  must be choice-free). Run it after every writing session.

## Sound (optional)

The host screen plays an ambient bed + stingers from `public/audio/`:
`ambient.mp3` (loops), `stinger-night.mp3`, `stinger-drama.mp3`,
`stinger-resolve.mp3`, `stinger-finale.mp3`. Missing files are silently
skipped. Phones never play sound. Mute toggle bottom-right of the host.

## Toward Steam

The pieces in place: the desktop app embeds everything (no install steps
beyond the app itself), works fully offline, and the e2e suite plays whole
games against the exact build that ships. Remaining for a storefront build:
app icon + store art, code signing, Steamworks SDK integration (overlay,
achievements if wanted), and a settled title.
