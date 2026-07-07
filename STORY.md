# Seven Nights — Story Document

St Sebastian, 1348. Fugitives from a dying continent land at an English
fortress town with seven weeks before war, plague and famine reach its walls.
A red-eyed patron has named the party its HERALD: save the town, or let it
burn and flee. Edit this however helps you plan, then hand it back and the
changes get folded into the game.

**How it works**
- Each **location** offers 2–4 **activities**. Doing one fires a random
  eligible **event**. Players never see stats as requirements.
- Events resolve as an **Outcome** (flat), a **Hidden check** (a stat vs a
  difficulty → Pass/Fail, the stat/number never shown), or a **Choice**. A
  choice option can itself be flat, a hidden check, or a **weighted random**
  pool the dice settle.
- **Sets** adds a flag; **Requires**/**Forbids** gate on flags. Flags chain
  events across locations and weeks. **weeks N–M** limits when an event can fire.
- Outcomes also move the town's four **threat** dials (Plague, Starvation, War,
  Devils): negative relieves the town, positive feeds the doom. The number of
  dials still maxed when week seven ends decides the town's fate — see the
  THREATS section below and lib/game/finale.ts.

Stats: Intelligence, Strength, Agility, Craft, Will, Wealth (range 0–10).

## The story — a clean slate (2026-07-03)

Every event pool is empty by choice: the story is being rewritten BY HAND,
one storyline at a time, through the Storyline Scribe
(write-storyline.bat → http://localhost:4100/write). Until a location has
events again, a week spent there passes as a quiet night.

The Scribe's storyline model:

- A beat RETURNS weekly until its advancing outcome fires — failed tests
  and colour choices never strand the story.
- Advancing outcomes leave a NOTE on the player's phone (their standing
  lead), replaced by the next beat and cleared on completion.
- Completing a storyline earns its ENDING PANEL at the epilogue
  (data/storylines.json).

Registered storylines so far: (none yet — the parchment is blank.)

The pre-slate story (86 events, seventeen chains) lives in git at commit
b54479f if anything wants salvaging.
