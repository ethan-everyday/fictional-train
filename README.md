# Seven Nights (working title)

A 7-night narrative party game: one host screen (TV/laptop), 2–6 phones as
controllers, driven by a data-defined event engine.

Setting: grounded medieval — seven nights before the Michaelmas Fair in the
village of Hollowbrook. Each player builds a character (1 of 6 **roles** ×
1 of 6 **backgrounds**, which set hidden base stats), then spends each night
at one of seven locations. Each location offers 2–4 **activities**; doing one
draws a random **event** from that location's pool. Events chain across the
week — meet the lord's steward at the tavern and the castle gate opens later.
**Stats are never shown as requirements**; they tilt hidden checks behind the
prose. The week remembers everything you did.

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
  /game          connection.ts + socket.ts (ALL multiplayer), turn machine,
                 character.ts, events.ts (engine), finale.ts
  /game/content  one file per location: activities + the event pool
  /audio         host-only sound (ambient + stingers, silence-tolerant)
/tests           engine, content-contract, and server protocol tests
/e2e             full-game Playwright
```

Ground rules: multiplayer goes through `/lib/game`, all content is data in
`/lib/game/content`, and every architectural choice gets a line in
`DECISIONS.md`.

## Writing content

Content is plain TypeScript data in `lib/game/content/<location>.ts` (see
`tavern.ts` as the reference). Each location exports `{ activities, events }`.

- **Activities** (2–4 per location): the things a player can choose to do.
  Just `{ id, location, name, blurb }` — they never show stat requirements.
- **Events** (7–10 per location) fire at random when an activity is done.
  Each event is ONE of three shapes:
  - flat `effect` — a fixed outcome;
  - hidden `check: { stat, dc }` + `pass`/`fail` — stats decide the branch,
    invisibly (dc is 1–10, never shown);
  - `choices: [...]` — 2–3 player options, each a plain action label.
- Every branch (`effect`/`pass`/`fail`/`choices[].effect`) sets `text` (the
  prose the player reads), `outcome` (one short host line: "<name> <outcome>"),
  optional `stats` deltas, and optional `flags`.
- **Chaining**: an event's `flags` unlock later events via their `requires`
  (and `forbids`) — works across locations and nights (e.g. tavern's
  `met_steward` → castle's `audience_with_lord`). `repeatable` events can
  fire again; everything else fires once per week.
- `baseStats` come from the chosen role + background (`lib/game/character.ts`);
  stats clamp 0–`STAT_CAP`.
- `npm test` runs the content contract: unique ids, valid shapes, real
  stats/locations/activities, dc ≤ cap, and **no orphan prerequisites** (every
  required flag is producible somewhere). Run it after every writing session.

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
