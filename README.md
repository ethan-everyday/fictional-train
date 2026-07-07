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
shown as requirements**; they tilt hidden checks behind the prose. Four **threat
dials** — plague, starvation, war, devils — climb every week and are the only
thing shown on the host screen: the party's real job is to read which doom is
running away and spend its weeks holding it back. Any dial still at the top when
the seventh week ends lands its doom in full, and the number that do decides the
town's fate, from a town that stands untouched to utter ruin.

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

If phones can't reach the page (blank screen = their connection never
arrives; the server window logs every request, so silence means blocked):

1. **Set the Wi-Fi network to "Private"** — Windows Settings → Network &
   internet → Wi-Fi → your network → Network profile type → Private.
   Security software silently drops game traffic on "Public" networks,
   and Windows re-registers the network as a new Public profile more
   often than you'd think (e.g. after switching Ethernet ↔ Wi-Fi).
2. **Third-party antivirus firewalls** (AVG, Avast, Norton, McAfee…)
   replace Windows Firewall — allow the game there: mark the home network
   as Private/Trusted in the AV's firewall settings, or add an allow rule
   for `node.exe` / inbound TCP 3100. (If no third-party AV: allow Node
   through Windows Firewall, inbound TCP 3100.)
3. Make sure the phones are on the **same Wi-Fi** — not a guest network,
   not the router's public hotspot (EE/BT hubs broadcast one that phones
   auto-join), and with mobile data off.

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

## Writing a storyline by hand (the Scribe)

Double-click **`write-storyline.bat`** (→ `http://localhost:4100/write`).
A guided, step-by-step page for writing one storyline from scratch — you
write every word; the Scribe walks the beats in order (where → doing what →
the scene → how it resolves → outcomes → rewards → timing, with the house
writing rules as prompts) and handles only the bookkeeping. The story
model it builds:

- Each beat **returns weekly until it advances** — you tick which written
  outcome carries the story forward (a choice can hide its own stat test:
  the barrels-in-the-cellar pattern), and every other outcome is colour
  the player can come back from next week.
- An advancing outcome can leave a **note on the player's phone** ("the
  barman's shipment lands at the docks come week 3") — their standing
  lead, shown while they wait and while they choose where to go, replaced
  by the next beat and cleared on completion.
- Beats take week windows ("weeks 1–3" makes an offer the town can miss)
  and the wiring never lets a later beat open before the one it needs.
- Finishing registers the storyline with your **ending panel** — anyone
  who completes it sees that panel under their name at the epilogue.

Drafts autosave to the browser, so a half-written storyline survives
closing the window. Since the 2026-07-03 clean slate the story is written
this way, storyline by storyline; empty pools fall back to a quiet night,
so the game is playable at every stage of the rewrite.

## Editing the story (visual editor)

Double-click **`edit-story.bat`**, or:

```bash
npm run editor      # → http://localhost:4100
```

A dev-only tool (never shipped) for laying out the story:

- **Map** — the whole prerequisite graph: every event as a node under its
  location, gold edges where one event's flag *unlocks* another, red dashed
  edges where a flag *blocks* one. Click any node to edit it; alt-click to
  isolate its whole storyline. The **filter bar** cuts the graph by chain
  (storylines are derived automatically from the flag wiring — nothing to
  maintain), location, threat (relief or worsen), week, or full-text search;
  non-matching nodes dim and their edges vanish, and the readout shows what
  the filtered set contributes to each doom dial.
- **Quick creation** — **+ Event** births a draft from a shape template
  (flat / check / choice / moral choice / gamble) already valid and ready
  for prose; **+ Storyline** takes 2–5 beats (location + premise + week)
  and creates the whole chain with its flags wired beat-to-beat. Drafts
  carry `[draft]` in their prose and show as a counter in the header,
  dashed on the map, until written out.
- **Edit** — pick a location, edit its activities and events: setup prose,
  the resolution shape (flat / hidden stat check / player choice), stat
  changes, and the flags it sets. Each branch also takes **threat deltas**
  (the four doom dials, −2..+2, negative relieves the town) and each player
  **choice** picks its own shape — flat, hidden check, or a weighted random
  pool. Wire connections by ticking **Requires** / **Forbids** flags; the
  **Connections** panel shows, for the selected event, exactly what it unlocks
  and what unlocks it.
- **Origins** — edit the 6 roles and 6 backgrounds: name, description, stat
  bonuses, and the starting flag each carries (which can gate events).
- **Threat budget** — a live panel totting up, per doom dial, how much
  relief and aggravation the whole story offers (and this location's share),
  against the −3 net each track needs to survive the week. Event rows and
  map nodes carry matching threat badges, so the levers are visible at a
  glance while writing.
- **Live validation** mirrors the build contract (no orphan prerequisites,
  valid shapes, dc within cap, positive weights, 6 roles / 6 backgrounds…).
  **Save** (or Ctrl+S) writes the content + origins JSON the game imports —
  and refuses to save anything that would fail the build.
- **Backups** — every save first snapshots the files it is about to
  overwrite (`.seven-nights/editor-backups/`, last 20 kept). The header's
  Restore dropdown rolls back to any snapshot; the restore itself is
  snapshotted too, so nothing done in the editor is ever more than one
  Restore away from undone.

## Planning the story on paper

`STORY.md` (repo root) is a complete, readable snapshot of the whole story —
every character, location, activity, event (with prose, outcomes, stat
changes, and connections), plus a **flag index** that lays out the wiring of
the week. Edit it freely to plan; hand it back and the changes get folded
into the game's content. It's a generated view of the JSON below — JSON is
the source of truth, `STORY.md` is the human-readable mirror.

## Writing content (by hand)

Content is JSON data in `lib/game/content/data/<location>.json` — the same
files the editor reads and writes. Each location is
`{ meta, activities, events }` — `meta: { name, blurb }` is the location's
display name and choose-screen card, registered over the `constants.ts`
fallbacks at import time (so renaming a location is a content edit, in the
editor or the JSON).

- **Activities** (2–4 per location): the things a player can choose to do.
  Just `{ id, location, name, blurb }` — they never show stat requirements.
- **Events** (9–14 per location) fire at random when an activity is done.
  Each event is ONE of three shapes:
  - flat `effect` — a fixed outcome;
  - hidden `check: { stat, dc }` + `pass`/`fail` — stats decide the branch,
    invisibly (dc is 1–10, never shown);
  - `choices: [...]` — 2–3 player options. Each choice is itself ONE of three
    shapes, so luck and hidden stats can live inside a single option:
    - flat `effect`;
    - hidden `check: { stat, dc }` + `pass`/`fail` (that option branches on a
      stat, still invisibly);
    - weighted `random: [{ weight?, effect }, …]` (2+ outcomes; the dice
      settle it, seeded so a phone refresh re-rolls the same result). E.g.
      the tavern's Gamble is one choice whose `random` pool wins or loses coin:

      ```json
      { "label": "Stake a coin and play the table", "random": [
        { "weight": 1, "effect": { "text": "The bones run kind…",
          "outcome": "came away ahead.", "stats": { "wealth": 1 } } },
        { "weight": 1, "effect": { "text": "The bones run cold…",
          "outcome": "dropped a coin to the dice.", "stats": { "wealth": -1 } } }
      ] }
      ```
- Every branch (`effect`/`pass`/`fail`/`choices[].effect`/`random[].effect`)
  sets `text` (the prose the player reads), `outcome` (one short host line:
  "<name> <outcome>"), optional `stats` deltas, optional `flags`, optional
  `threats` deltas — a partial map of `plague`/`starvation`/`war`/`devils` to a
  small number (**negative relieves** the town, positive feeds the doom; never
  0) — and an optional `note` (`{ id, text }`): the player's standing lead,
  shown on their waiting and choose screens. The same id replaces; empty
  text clears. Threats are the town's four doom dials; the host applies
  each night's deltas before the week ticks up.
- **Storylines** are registered in `data/storylines.json`
  (`{ id, title, doneFlag, ending }`): a player whose flags carry the
  `doneFlag` at the epilogue is shown the `ending` panel. The Scribe
  registers these automatically; the contract insists every `doneFlag` is
  actually set by some event.
- **Chaining**: an event's `flags` unlock later events via their `requires`
  (and `forbids`) — works across locations and nights (e.g. tavern's
  `met_steward` → castle's `audience_with_lord`). `repeatable` events can
  fire again; everything else fires once per week.
- `baseStats` come from the chosen role + background (`lib/game/character.ts`);
  stats clamp 0–`STAT_CAP`.
- `npm test` runs the content contract: unique ids, valid shapes, real
  stats/locations/activities, dc ≤ cap, and **no orphan prerequisites** (every
  required flag is producible somewhere). Run it after every writing session.

### Adding a location (a code task, not an editor feature)

Renaming and reflavouring locations is content (`meta` above). ADDING or
removing one is engine surgery — seven locations is a designed constant, so
do this rarely and deliberately:

1. `lib/game/types.ts` — extend the `LocationId` union.
2. `lib/game/constants.ts` — add the fallback entry to `LOCATIONS`.
3. `lib/game/content/data/<new>.json` — create it (meta, 2–4 activities,
   events), and import + register it in `lib/game/content/index.ts`.
4. `scripts/editor-server.js` — add the id to its `LOCATIONS` whitelist;
   same for `LOCS` in `scripts/editor.html`.
5. Check `DRAMA_EVENTS` (`closedLocation`) and any host copy that says
   "seven"; run `npm test` and one full e2e.

## Art (optional, like sound)

`public/images/` holds 23 generated woodcut plates — 7 locations, 6 role
portraits, 4 threat emblems, 6 scene backdrops — all rendered through
`components/Art.tsx`, which hides itself when a file is missing, so the
game is unaffected by absent art. Regenerate any image with the nano-banana
MCP using the same filename and the engraving style string recorded in
DECISIONS.md. Art is baked in at build time: run `start-game.bat --rebuild`
after changing images.

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
