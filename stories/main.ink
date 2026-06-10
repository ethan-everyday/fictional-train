// SEVEN NIGHTS — generic placeholder storylets (M3/M4 stubs).
// Replace this with real writing in Phase 2; the structure is the contract.
//
// Contract with /lib/ink/storylet.ts:
//   - mind/body/charm/shadow are written in before a knot runs and read
//     back out when it ends.
//   - Every storylet must set `outcome` to ONE short line, lowercase start,
//     readable as "<player name> <outcome>" on the host resolve screen.
//   - Globals named flag_* are booleans; any that end up true become story
//     flags on the player and are passed back in on later nights.
//   - Tag a choice with "# needs: body 3" to show it disabled until the
//     stat meets the bar. The game enforces it; ink does not.

VAR mind = 2
VAR body = 2
VAR charm = 2
VAR shadow = 0
VAR outcome = ""

VAR flag_met_the_stranger = false
VAR flag_owes_the_landlady = false
VAR flag_blessed = false
VAR flag_found_the_locket = false
VAR flag_knows_the_password = false
VAR flag_marked_by_the_manor = false

// ---------------------------------------------------------------- TAVERN

=== storylet_tavern ===
The Crooked Lantern is packed wall to wall, and the air smells of spilled cider and wet dog.
The landlady catches your eye and tilts her head toward an empty stool. In the corner booth, someone in a travel cloak is buying drinks for anyone who'll talk.
* [Buy a round for the whole room]
    You put your coins on the bar like a magician revealing a card. The room cheers your name. Twice.
    ~ charm = charm + 1
    ~ flag_owes_the_landlady = true
    The landlady pours with a smile and quietly writes what you now owe her in a little black book.
    ~ outcome = "bought the whole tavern a round and is now beloved, broke, and in the landlady's little black book."
    -> END
* [Nurse a small beer and eavesdrop]
    You find the one seat where every conversation in the room overlaps, and you listen.
    The cloaked stranger is asking about the Vane Manor — who owns it now, who has keys, who'd miss a lantern from the gatehouse. And they're paying in silver.
    ~ mind = mind + 1
    ~ flag_met_the_stranger = true
    Before you leave, the stranger looks straight at you and raises a glass.
    ~ outcome = "spent the night listening, and learned a stranger is paying silver for secrets about the manor."
    -> END
* [Arm-wrestle the blacksmith # needs: body 3]
    The blacksmith's grip is like a bench vice, and her grin says she knows it.
    You win by a knuckle. The room goes absolutely feral.
    ~ body = body + 1
    ~ charm = charm + 1
    ~ outcome = "beat the blacksmith at arm-wrestling and will be dining out on the story for a year."
    -> END
* {flag_owes_the_landlady} [Work a shift behind the bar to pay your debt]
    The landlady hands you an apron without a word. Six hours of pouring, mopping, and hearing every secret in the village twice, and she crosses one line out of the little black book.
    ~ body = body + 1
    ~ mind = mind + 1
    ~ outcome = "worked off a debt behind the bar and earned the landlady's rarest currency: a nod."
    -> END
* {flag_met_the_stranger} [Find the stranger's corner booth again]
    The booth is empty, but the stranger's tab is still open — and the landlady lets slip they settle it in manor silverware, always an hour before the harbor bell.
    ~ mind = mind + 1
    ~ shadow = shadow + 1
    ~ outcome = "staked out the stranger's booth and connected the silver, the manor, and the harbor bell."
    -> END

// ---------------------------------------------------------------- CHURCH

=== storylet_church ===
The Old Church is empty except for a hundred lit candles nobody admits to lighting.
{flag_blessed: The verger nods at you like an old friend. | The verger watches you from the shadows by the font, deciding what sort of visitor you are.}
* [Kneel and sit with your thoughts]
    The quiet rearranges something in you. An hour passes like a held breath, and you leave lighter.
    ~ mind = mind + 1
    ~ flag_blessed = true
    ~ outcome = "sat alone with a hundred candles and came out calmer than anyone in Hollowbrook has a right to be."
    -> END
* [Help the verger snuff and reset the candles]
    It's careful, repetitive work, up and down ladders. The verger talks the whole time — births, debts, grudges, and which graves get fresh flowers from nobody.
    ~ body = body + 1
    ~ mind = mind + 1
    ~ outcome = "spent the night on ladders helping the verger, and now knows where Hollowbrook keeps its grudges."
    -> END
* [Pocket the silver candle-snuffer # needs: shadow 2]
    It's heavier than it looks, and it sings a little, sliding into your coat.
    Outside, you'd swear one of the gargoyles turned its head to watch you go.
    ~ shadow = shadow + 1
    ~ outcome = "left the church with a silver candle-snuffer and the uncomfortable attention of a gargoyle."
    -> END
* {flag_marked_by_the_manor} [Confess what happened at the manor]
    The verger listens without blinking, then fetches a ledger older than the church and adds your name to a very short list.
    "You'll want a candle," the verger says, and lights it personally. The weight you've been carrying eases, a little.
    ~ mind = mind + 1
    ~ flag_blessed = true
    ~ outcome = "confessed about the manor, joined a short list in a very old ledger, and left a candle burning."
    -> END

// ---------------------------------------------------------------- MARKET

=== storylet_market ===
The Night Market only opens after dark, which everyone agrees is normal and fine.
Stalls sell lamp oil, bad knives, excellent pies, and one table at the end sells things with no labels at all.
* [Haggle for one of the unlabelled things]
    The stallholder names a price. You laugh. They name another. You weep theatrically.
    Twenty minutes later you own a small brass box that hums when the church bell rings.
    ~ charm = charm + 1
    ~ outcome = "haggled the unlabelled-goods stall into the ground and won a small humming brass box."
    -> END
* [Work a shift hauling crates for pie money]
    The pie is genuinely outstanding. Your back will forgive you eventually.
    ~ body = body + 1
    ~ outcome = "hauled crates all night and was paid in what is honestly the best pie in the county."
    -> END
* [Charm the stallholders into talking # needs: charm 3]
    You drift stall to stall like you own the cobbles, and the market opens up to you.
    By midnight you know what the stranger bought here, and that they paid for it with manor silverware.
    ~ mind = mind + 1
    ~ flag_met_the_stranger = true
    ~ outcome = "charmed half the market and learned the stranger has been spending the manor's silverware."
    -> END

// ----------------------------------------------------------------- WOODS

=== storylet_woods ===
The Whispering Woods do whisper, though it might just be the wind. Might.
The path you came in on is not, on reflection, where you left it.
* [Follow the whispering deeper in]
    You walk until the trees stop pretending and the whispering becomes one voice, very politely asking you to leave.
    You leave. Briskly.
    ~ shadow = shadow + 1
    ~ outcome = "went too deep into the woods and was asked to leave by something extremely polite."
    -> END
* [Search the old ranger hut]
    Under a loose floorboard you find a locket. Inside is a portrait of the Vane Manor as it looked new — and someone has scratched out the windows.
    ~ mind = mind + 1
    ~ flag_found_the_locket = true
    ~ outcome = "found a locket in the ranger hut with the manor painted inside, all its windows scratched out."
    -> END
* [Climb the watch-oak to get your bearings # needs: body 3]
    From the top of the oldest tree you can see all of Hollowbrook: the harbor lights, the dark market, and one window glowing in the supposedly empty manor.
    ~ body = body + 1
    ~ mind = mind + 1
    ~ outcome = "climbed the great watch-oak and spotted a light burning in the empty manor."
    -> END
* {flag_met_the_stranger} [Track the stranger's bootprints off the path]
    The prints are fresh, with a long, sure stride — heading straight for the manor's back wall, where they simply stop. No gate. No ladder. No prints coming back.
    ~ shadow = shadow + 1
    ~ mind = mind + 1
    ~ outcome = "tracked the stranger's bootprints to the manor's back wall, where they stopped like the ground had opened."
    -> END

// ---------------------------------------------------------------- HARBOR

=== storylet_harbor ===
The Harbor at night is rope, salt, and lanterns that swing without wind.
A crew is unloading a boat with no name, fast and quiet, and they're a pair of hands short.
* [Join the crew, no questions asked]
    You haul crates that clink in a way fish do not. At the end the foreman pays double and taps her nose.
    She also teaches you the knock they use on the warehouse door.
    ~ body = body + 1
    ~ shadow = shadow + 1
    ~ flag_knows_the_password = true
    ~ outcome = "spent the night unloading a nameless boat, asked no questions, and learned the smugglers' knock."
    -> END
* [Swap stories with the old lighthouse keeper]
    The keeper trades a story for a story. Yours are decent; the keeper's are about what the light is actually for, and they are not decent at all.
    ~ charm = charm + 1
    ~ mind = mind + 1
    ~ outcome = "traded stories with the lighthouse keeper and rather wishes some of them could be untraded."
    -> END
* [Read the tide ledgers in the harbormaster's hut # needs: mind 3]
    Columns of arrivals, departures, cargo. Except one boat that arrives every seventh night and never, on paper, leaves.
    ~ mind = mind + 1
    ~ outcome = "read the tide ledgers and found a boat that arrives every seventh night and never leaves."
    -> END
* {flag_knows_the_password} [Use the smugglers' knock on the warehouse door]
    Two slow, three quick. The door opens on crates, charts, and a second harbor that exists only after dark — and nobody inside questions you for a second.
    You memorise what you can and leave before anyone thinks to.
    ~ mind = mind + 1
    ~ shadow = shadow + 1
    ~ outcome = "gave the warehouse the smugglers' knock, walked it like an old hand, and left knowing far too much."
    -> END

// ----------------------------------------------------------------- MANOR

=== storylet_manor ===
The Vane Manor has been empty for thirty years, which doesn't explain the footprints on the drive or the warm chimney.
{flag_met_the_stranger: You think of the stranger from the tavern, paying silver for exactly this address.}
* [Knock on the front door like a civilised person]
    The door opens before your second knock. Nobody is behind it.
    A tray waits in the hall with one cup of tea, still steaming. You drink it. It's perfect. You leave a coin.
    ~ charm = charm + 1
    ~ outcome = "knocked at the empty manor, was served a perfect cup of tea by nobody, and politely paid for it."
    -> END
* [Study the grounds from the gate]
    You count windows, doors, the gaps in the wall. The footprints on the drive go in. None come out.
    ~ mind = mind + 1
    ~ outcome = "cased the manor from the gate and noticed the footprints on the drive only go one way."
    -> END
* [Slip in through the cellar hatch # needs: shadow 2]
    Inside it smells of dust and fresh bread, in that order. On the cellar wall, someone has written tallies — seven marks, struck through, over and over.
    Something upstairs crosses the floor with confidence. You add a mark of your own and get out.
    ~ shadow = shadow + 1
    ~ flag_marked_by_the_manor = true
    ~ outcome = "broke into the manor cellar, found seven tally marks struck through, and unwisely added an eighth."
    -> END
* {flag_found_the_locket} [Hold the ranger's locket up at the gate]
    The gate, which was locked, is suddenly not. At the end of the drive the front door stands open, exactly as wide as a welcome.
    You don't go in. But all night the manor's one lit window stays on you like an eye that has finally remembered your face.
    ~ mind = mind + 1
    ~ flag_marked_by_the_manor = true
    ~ outcome = "showed the manor the locket with its own portrait inside, and the manor unlocked its gate in answer."
    -> END

// ---------------------------------------------------------------- FINALE
// The host runs this knot once with the party's AVERAGE stats and no flags.
// Three endings, picked from the week's overall shape.

=== finale ===
Seven nights, spent. Hollowbrook counts its spoons, its secrets, and its visitors, and decides what kind of week it has been.
{
- shadow >= 3: -> finale_shadow
- charm >= mind and charm >= body: -> finale_charm
- else: -> finale_steady
}

=== finale_shadow ===
It has been a dark week, on balance. Doors are bolted that never used to be. The gargoyle on the church roof now faces the village, and the manor's chimney smokes openly, as if it no longer cares who sees.
Whatever was waiting in Hollowbrook, this week fed it. The boat with no name will need extra hands again on the next seventh night — and it already has your names.
THE LONG NIGHT BEGINS.
-> END

=== finale_charm ===
It has been, against all odds, a charming week. The tavern has new songs with your names in them, the market held a feast on credit, and even the manor left its gate open with a pot of tea on the wall.
Hollowbrook's troubles are still out there in the dark. But the village faces them grinning, arm in arm, and that has always been worth more than silver.
THE BRIGHT WEEK ENDS IN SONG.
-> END

=== finale_steady ===
It has been a steady, watchful week. Ledgers read, ladders climbed, candles counted, lockets pocketed. Hollowbrook doesn't feel saved, exactly, but it feels seen — and things that prefer the dark hate being seen.
The seventh-night boat slips its moorings empty. The manor's light goes out, almost politely. For now.
THE VILLAGE KEEPS ITS WATCH.
-> END
