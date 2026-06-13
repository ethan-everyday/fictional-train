# Seven Nights (working title)

A narrative party game: one host screen (TV/laptop), 2–6 phones as
controllers, driven by a data-defined event engine.

Setting: St Sebastian, 1348. The party are fugitives who fled war, plague and
famine on the continent and landed at an English fortress town — where a
red-eyed patron has named them its Herald. Seven weeks before the apocalypse
reaches the walls: save the town, or let it burn and flee. Each player builds
a character (1 of 6 **roles** × 1 of 6 **backgrounds**, which set hidden base
stats), then spends each week at one of seven locations. Each offers 2–4
**activities**; doing one fires a random **event** from that location's pool.
Events chain and escalate week by week — meet the lord's steward and the
castle opens; the warband arrives only in the last weeks. **Stats are never
shown as requirements**; they tilt hidden checks behind the prose. What the
party achieves across the week decides which of seven town-fates befalls
St Sebastian.

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

## Editing the story (visual editor)

Double-click **`edit-story.bat`**, or:

```bash
npm run editor      # → http://localhost:4100
```

A dev-only tool (never shipped) for laying out the story:

- **Map** — the whole prerequisite graph: every event as a node under its
  location, gold edges where one event's flag *unlocks* another, red dashed
  edges where a flag *blocks* one. Click any node to edit it.
- **Edit** — pick a location, edit its activities and events: setup prose,
  the resolution shape (flat / hidden stat check / player choice), stat
  changes, and the flags it sets. Wire connections by ticking **Requires**
  / **Forbids** flags; the **Connections** panel shows, for the selected
  event, exactly what it unlocks and what unlocks it.
- **Origins** — edit the 6 roles and 6 backgrounds: name, description, stat
  bonuses, and the starting flag each carries (which can gate events).
- **Live validation** mirrors the build contract (no orphan prerequisites,
  valid shapes, dc within cap, 6 roles / 6 backgrounds…). **Save** writes the
  content + origins JSON the game imports — and refuses to save anything
  that would fail the build.

## Planning the story on paper

`STORY.md` (repo root) is a complete, readable snapshot of the whole story —
every character, location, activity, event (with prose, outcomes, stat
changes, and connections), plus a **flag index** that lays out the wiring of
the week. Edit it freely to plan; hand it back and the changes get folded
into the game's content. It's a generated view of the JSON below — JSON is
the source of truth, `STORY.md` is the human-readable mirror.

## Writing content (by hand)

Content is JSON data in `lib/game/content/data/<location>.json` — the same
files the editor reads and writes. Each location is `{ activities, events }`.

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
