// SEVEN NIGHTS — Hollowbrook, the week before the Michaelmas Fair.
// Grounded medieval: no magic, just a village, its people, and seven nights
// of positioning before the lord reckons accounts at the fair.
//
// Contract with /lib/ink/storylet.ts:
//   - intelligence/strength/agility/craft/will/wealth are written in before
//     a knot runs and read back out when it ends (clamped 0..5 by the game).
//   - Every storylet must set `outcome` to ONE short line, lowercase start,
//     readable as "<player name> <outcome>" on the host resolve screen.
//   - Globals named flag_* are booleans; any that end up true become story
//     flags on the player and are passed back in on later nights.
//   - Tag a choice with "# needs: strength 3" to show it disabled until the
//     stat meets the bar. The game enforces it; ink does not.
//   - night (1-7), visits (previous nights here), event (drama event id or
//     "") are read-only context. Each night is a FRESH story: sequences,
//     cycles, and read counts do NOT carry between nights.

VAR intelligence = 2
VAR strength = 2
VAR agility = 2
VAR craft = 2
VAR will = 2
VAR wealth = 1
VAR outcome = ""

VAR night = 1
VAR visits = 0
VAR event = ""

VAR flag_blessed = false
VAR flag_owes_the_innkeep = false
VAR flag_in_with_the_gamblers = false
VAR flag_reeves_favor = false
VAR flag_poacher = false
VAR flag_friend_of_the_poor = false
VAR flag_lords_eye = false
VAR flag_traders_friend = false
VAR flag_dockside_password = false

// ---------------------------------------------------------------- CHURCH
// NPC: the Priest.

=== storylet_church ===
{visits == 0: The church is cold, candle-bright, and smells of beeswax and old stone. The priest looks up from his ledger of tithes as if he has been expecting you specifically. | The priest nods you in like a regular. Your candle from last time is still burning, which is either devotion or thrift.}
The fair is coming, and the priest is a man with opinions about what the village owes — to God, to the lord, and to him, in roughly that order.
* [Keep the vigil through the small hours # needs: will 3]
    You kneel until your knees stop complaining and your head goes quiet. The priest wakes you at dawn with bread and the rare compliment of saying nothing at all.
    ~ will = will + 1
    ~ flag_blessed = true
    ~ outcome = "kept the night vigil at the church and walked out at dawn steadier than anyone in Hollowbrook."
    -> END
* [Help the priest balance the tithe ledger]
    The ledger is a battlefield of crossings-out. You find the missing shillings in an hour — half of them under a candle stain, half of them in the butcher's column, twice.
    ~ intelligence = intelligence + 1
    ~ craft = craft + 1
    ~ outcome = "untangled the priest's tithe ledger and now knows exactly who in Hollowbrook short-changes God."
    -> END
* [Slip a hand toward the alms box # needs: agility 3]
    The box is old, the lock older. Your fingers are quicker than both. Outside, you tell yourself the poor box was always meant for the poor, and tonight that's you.
    ~ wealth = wealth + 1
    ~ outcome = "left the church with the alms box lighter and a very specific new entry on the confession backlog."
    -> END
* {flag_poacher} [Confess the business with the lord's deer]
    The priest hears you out, sighs like a man who has heard far worse, and sets a penance of exactly one honest day's work. "The reeve counts hides," he adds mildly. "I'd burn yours."
    ~ will = will + 1
    ~ flag_blessed = true
    ~ outcome = "confessed to poaching, got off with a penance, and received one extremely practical piece of advice."
    -> END

// ---------------------------------------------------------------- TAVERN
// NPCs: the Innkeep and the Gamblers.

=== storylet_tavern ===
{visits == 0: The tavern is packed to the rafters, and the innkeep runs the room like a drover runs cattle — nothing moves without her noticing. | The innkeep has your cup down before you reach the bar. Being known here is its own kind of credit.}
{event == "kings_levy": Tonight the talk is all of the levy men up at the castle, and everyone with two coins is drinking like they'd rather be holding one.}
{event == "fair_eve": Fair folk have claimed the long table and are paying in coin nobody recognises, which the innkeep accepts with deep suspicion and great speed.}
In the corner, the gamblers' dice knock against the table like a slow heartbeat.
* [Stand a round for the room]
    You put your coin on the bar like a lord. The room cheers your name twice and forgets it once. The innkeep pours, smiles, and opens her slate book to a fresh line with your name on it.
    ~ wealth = wealth - 1
    ~ will = will + 1
    ~ flag_owes_the_innkeep = true
    ~ outcome = "stood the whole tavern a round and went on the innkeep's slate, beloved and slightly poorer."
    -> END
* [Sit in with the gamblers # needs: wealth 2]
    The dice are bone and the stakes are real.
    {shuffle:
    -   You play tight, watch the table, and rise two pennies the richer. The gamblers note your face with something like respect.
        ~ wealth = wealth + 1
        ~ flag_in_with_the_gamblers = true
        ~ outcome = "sat with the gamblers, rose richer, and earned a nod that will be worth more than the pennies."
    -   The dice run cold and your stake runs out. The innkeep covers your last call and writes it down without being asked.
        ~ wealth = wealth - 1
        ~ flag_owes_the_innkeep = true
        ~ outcome = "lost to the gamblers and finished the night on the innkeep's slate, which everyone saw."
    }
    -> END
* [Work the taps for the innkeep]
    Six hours of pouring, mopping, and hearing every secret in the parish told twice at volume. The innkeep pays in coin and in the better currency of taking your side from now on.
    ~ strength = strength + 1
    ~ wealth = wealth + 1
    ~ outcome = "worked the tavern taps till closing and now hears about things in Hollowbrook before they happen."
    -> END
* {flag_friend_of_the_poor} [Take the seat the peasants saved you at the gamblers' table]
    Word has come up from the slums that you're good for it, and the gamblers deal you in on reputation alone — no stake asked.
    You play careful, win small, and learn how the table really works: who folds to whom, and why.
    ~ intelligence = intelligence + 1
    ~ flag_in_with_the_gamblers = true
    ~ outcome = "was dealt into the gamblers' table on the slums' word alone, and read the whole room while winning small."
    -> END
* {flag_owes_the_innkeep} [Work off the slate]
    The innkeep hands you an apron without a word. By closing time the line through your name is the most satisfying thing you've earned all week.
    ~ strength = strength + 1
    ~ will = will + 1
    ~ flag_owes_the_innkeep = false
    ~ outcome = "worked the slate clean at the tavern and earned the innkeep's rarest coin: a nod."
    -> END

// ---------------------------------------------------------------- MARKET
// NPCs: the Butcher, the Armourer, the stallholders.

=== storylet_market ===
{visits == 0: Market day never quite ends in fair week; half the stalls trade by lantern light. The butcher and the armourer hold the two best pitches and an old, loud rivalry. | The stallholders know your face now. Prices drop a penny when you approach, which is how you know they've gone up for everyone else.}
{event == "kings_levy": The levy men's arrival has every till in the market suddenly, theatrically empty. The real cashboxes went under floorboards an hour ago.}
{event == "fair_eve": Fair wagons line the square, and the armourer has polished every blade on the stall twice. Tomorrow's customers are tonight's gossip.}
* [Haul carcasses for the butcher]
    The butcher pays fair, swears constantly, and teaches you more about anatomy in one evening than a barber-surgeon learns in a year.
    ~ strength = strength + 1
    ~ wealth = wealth + 1
    ~ outcome = "hauled sides of beef for the butcher all evening and was paid in coin, sausage, and profanity."
    -> END
* [Mind the armourer's stall while he drinks # needs: craft 3]
    The armourer waves you at the stall and disappears toward the tavern. You sell two knives, turn away a man who holds a sword like a broom, and re-rivet a strap he'd have charged double for.
    ~ craft = craft + 1
    ~ wealth = wealth + 1
    ~ outcome = "ran the armourer's stall solo for a night and sold steel better than the armourer does sober."
    -> END
* [Work the stalls for gossip]
    You drift pitch to pitch, buying nothing, hearing everything. By midnight you know what the fair will charge, what the reeve is asking about, and which two stallholders are secretly one business.
    ~ intelligence = intelligence + 1
    ~ outcome = "spent the night trading gossip across the market stalls and now holds a map of who owes whom."
    -> END
* {night >= 4} [Commission something fine for fair day # needs: wealth 4]
    Real coin opens the armourer's back room: the good steel, the work he doesn't put on the stall. What you order makes him raise both eyebrows and start sketching.
    ~ wealth = wealth - 1
    ~ craft = craft + 1
    ~ flag_lords_eye = true
    ~ outcome = "commissioned a piece from the armourer's back room fine enough that word of it reached the castle by morning."
    -> END
* {flag_traders_friend} [Take first pick of the foreign goods]
    The traders' boy finds you before their crates even reach the stalls. What you buy at dockside prices, you could sell at fair prices — and everyone at the market knows it.
    ~ wealth = wealth + 1
    ~ intelligence = intelligence + 1
    ~ outcome = "bought foreign goods before they touched a stall and is suddenly a person the market is polite to."
    -> END

// ----------------------------------------------------------------- FARMS
// NPCs: the Shire Reeve and the peasant farmers.

=== storylet_farms ===
{visits == 0: The farms run to the river in long dark strips, and the harvest is in its last, aching week. The Shire Reeve walks the field edges with his ledger, counting what the lord is owed. | The farmers wave you in from the lane now. The reeve pretends not to notice you, which from the reeve is warmth.}
{event == "kings_levy": The reeve's rounds have doubled since the levy men arrived — every haystack in the parish is being counted twice tonight.}
* [Join the harvest line till dark # needs: strength 3]
    Scythe, sheaf, swing, repeat. The farmers sing the counting songs and you learn them by the third field. Honest coin, honest back-ache.
    ~ strength = strength + 1
    ~ wealth = wealth + 1
    ~ outcome = "swung a scythe in the harvest line till dark and got paid like a farmhand and fed like family."
    -> END
* [Help the reeve square his ledger]
    The reeve's arithmetic is sound but his handwriting fights back. You sit with him at the field-gate table and bring order to the lord's numbers.
    ~ intelligence = intelligence + 1
    ~ flag_reeves_favor = true
    ~ outcome = "spent the night squaring the Shire Reeve's harvest ledger and is now, officially, useful."
    -> END
* [Take a deer from the lord's wood # needs: agility 3]
    The lord's wood is full of the lord's deer, and the lord, notably, is not here. One clean shot, one quiet drag, one very good week of eating ahead.
    ~ agility = agility + 1
    ~ wealth = wealth + 1
    ~ flag_poacher = true
    ~ outcome = "took a deer from the lord's wood without a sound, and is now a poacher with excellent prospects."
    -> END
* {flag_blessed} [Bring the priest's word to the reeve]
    The priest's note is short, but the reeve reads it twice and looks at you differently. Whatever it says, the church's good word is the one currency the reeve doesn't discount.
    ~ will = will + 1
    ~ flag_reeves_favor = true
    ~ outcome = "arrived at the farms carrying the priest's word, and the Shire Reeve's ledger opened on a friendlier page."
    -> END

// ---------------------------------------------------------------- CASTLE
// NPC: the Lord. Nights 6–7 play the fair's-eve court instead.

=== storylet_castle ===
{night >= 6: -> storylet_castle_eve}
{visits == 0: The castle is small as castles go and knows it, which makes the gate guards twice as proud. Inside, the lord is preparing for the fair the way other men prepare for war. | The gate guards know you now and wave you through with only ceremonial reluctance.}
* [Serve at the lord's table]
    You carry, pour, and above all listen. Lords talk over servants like furniture, and tonight the furniture learns what the fair's taxes will be before the reeve does.
    ~ intelligence = intelligence + 1
    ~ outcome = "served at the lord's table and came away knowing the fair's tax terms a day before the village."
    -> END
* [Train in the yard with the garrison]
    The sergeant works you until your arms ring. At the end he grunts, which the other soldiers assure you is the highest honour the yard awards.
    ~ strength = strength + 1
    ~ will = will + 1
    ~ outcome = "trained with the castle garrison till the sergeant grunted approval, which is apparently a knighthood."
    -> END
* [Petition the lord directly # needs: will 3]
    The hall goes quiet the way halls do. You state your business plainly, without flowering it, and the lord — visibly braced for grovelling — leans forward instead.
    ~ will = will + 1
    ~ flag_lords_eye = true
    ~ outcome = "petitioned the lord to his face without flinching, and the lord has remembered the name."
    -> END
* {flag_reeves_favor} [Let the reeve present you at court]
    The Shire Reeve introduces you as "the useful one," which from the reeve is a eulogy. The lord asks your name and uses it twice. People at court notice whom the lord names.
    ~ will = will + 1
    ~ flag_lords_eye = true
    ~ outcome = "was presented at court by the Shire Reeve and got the lord to use their name twice in one evening."
    -> END

=== storylet_castle_eve ===
The castle on fair's eve is all torches and tally-clerks. Tomorrow the lord holds court at the fair; tonight the great hall is where the week's accounts are truly settled.
* [Stand the night watch on the walls # needs: will 4]
    The sergeant gives you the wall above the gate, the post he gives to men he trusts. You watch the fair fires come alight across the river, one by one, until dawn.
    ~ will = will + 1
    ~ outcome = "stood the fair's-eve night watch above the castle gate, trusted with the one post that matters."
    -> END
* [Help the clerks close the year's accounts]
    The hall's long table disappears under rolls and ribbons. By midnight you're the one the clerks pass the disputed entries to, and by dawn you know what the whole valley is worth.
    ~ intelligence = intelligence + 1
    ~ craft = craft + 1
    ~ outcome = "closed the year's accounts with the lord's clerks and now knows the worth of every field in the valley."
    -> END
* [Carry the lord's fair-day proclamation to the village # needs: agility 4]
    Seven stops, one night, no torch. You run the proclamation from the castle gate to every notice post in Hollowbrook and are back before the wax on the last seal is cool.
    ~ agility = agility + 1
    ~ will = will + 1
    ~ outcome = "ran the lord's proclamation to every post in the village in one night and beat the dawn home."
    -> END
* {flag_lords_eye} [Take the seat the lord offers you at the high table]
    The steward, very quietly, sets a place for you above the salt. The lord talks to you about the fair, the levy, and — once, briefly — what comes after. You answer honestly. It lands.
    ~ will = will + 1
    ~ wealth = wealth + 1
    ~ outcome = "dined above the salt at the lord's own invitation on fair's eve, and answered the lord like an equal."
    -> END

// ----------------------------------------------------------------- SLUMS
// NPCs: the peasants who hold the lanes together.

=== storylet_slums ===
{visits == 0: The slums lean against the town wall like they're holding it up, which in a sense they are. Nobody here pretends the fair will change anything, which makes it the most honest place in Hollowbrook. | The lanes open for you now. Somebody's child runs ahead shouting your name, which is the slums' version of a herald.}
* [Give what coin you can spare # needs: wealth 2]
    No speeches. You find the family whose roof came down and put coin in the mother's hand directly, the way it should be done. The lanes see everything; the lanes saw that.
    ~ wealth = wealth - 1
    ~ will = will + 1
    ~ flag_friend_of_the_poor = true
    ~ outcome = "gave coin where it was needed in the slums, quietly, and the lanes will not forget it."
    -> END
* [Mend roofs with the wall-side families]
    Half the lane's roofs are thatch over hope. You work until dark with borrowed tools, and the family whose ridge-pole you reset feeds you like a returning soldier.
    ~ craft = craft + 1
    ~ flag_friend_of_the_poor = true
    ~ outcome = "spent the night mending roofs in the slums and ate the best meal in Hollowbrook by way of wages."
    -> END
* [Sit and listen to the lanes # needs: intelligence 3]
    The slums know everything first: which merchant is ruined, which guard takes coin, what the levy men actually came for. You sit on the wall steps and let it all come to you.
    ~ intelligence = intelligence + 1
    ~ outcome = "sat on the wall steps all night and heard the version of Hollowbrook's week that turns out to be true."
    -> END
* {flag_lords_eye} [Hear the petition the lanes want carried to the lord]
    They know the lord knows your name; that's why they've queued. You take their case — the well, the wall tax, the bailiff with the heavy hands — and promise only what you can carry.
    ~ will = will + 1
    ~ intelligence = intelligence + 1
    ~ outcome = "took up the slums' petition to carry to the lord, and made no promise that can't be kept."
    -> END

// ----------------------------------------------------------------- DOCKS
// NPCs: the Foreign Traders and the dockworkers.

=== storylet_docks ===
{visits == 0: The docks work later than the law strictly imagines, and the foreign traders' ship sits low in the water with goods for the fair. The dockworkers move like men paid by the crate, because they are. | The dockworkers hail you by name down the quay. The foreign traders' factor remembers your face, which is his entire job.}
{event == "fair_eve": Everything must be off the ship before the fair opens, and the quay is bedlam — double pay, no questions, lanterns everywhere.}
* [Haul cargo till the tide turns # needs: strength 3]
    Crate after crate after crate. The dockworkers test you for one hour and then treat you as one of their own for the rest, which includes the second, unlisted pay packet.
    ~ strength = strength + 1
    ~ wealth = wealth + 1
    ~ outcome = "hauled fair cargo with the dockworkers till the tide turned and was paid once on the books and once off."
    -> END
* [Talk trade with the foreign factor # needs: intelligence 3]
    The factor speaks four languages and prices in all of them. You keep up. By the end he's showing you the manifest nobody at the fair will see, mostly for the pleasure of being followed.
    ~ intelligence = intelligence + 1
    ~ flag_traders_friend = true
    ~ outcome = "matched wits with the foreign traders' factor over a manifest and was adopted as a kindred spirit."
    -> END
* [Take the night-work nobody describes]
    Certain crates come off after the harbourmaster's lantern goes dark, and the crew is short a pair of quiet hands. You ask nothing. At the end, the foreman teaches you the knock on the boathouse door.
    ~ agility = agility + 1
    ~ wealth = wealth + 1
    ~ flag_dockside_password = true
    ~ outcome = "worked the docks' unlisted shift without one question and learned the boathouse knock for it."
    -> END
* {flag_dockside_password} [Use the boathouse knock]
    Two slow, three quick. Inside is the trade beneath the trade: fair goods that never see a toll, and men genuinely pleased to see you. You leave with coin and a standing invitation.
    ~ wealth = wealth + 1
    ~ agility = agility + 1
    ~ outcome = "answered the boathouse with the right knock and now stands inside Hollowbrook's other economy."
    -> END
* {night >= 5} [Stake coin in the traders' fair-day cargo # needs: wealth 4]
    The factor offers shares in the last shipment — fair-day prices, dockside risk. You count your coin twice and put it down.
    ~ wealth = wealth + 1
    ~ intelligence = intelligence + 1
    ~ flag_traders_friend = true
    ~ outcome = "staked real coin in the foreign traders' fair-day cargo and earned a merchant's handshake on the quay."
    -> END

// ---------------------------------------------------------------- FINALE
// The host runs this knot once with the party's AVERAGE stats and no flags.
// Three endings, picked from the week's overall shape. Choice-free by
// contract (the validator enforces it).

=== finale ===
Fair day. The lord's table goes up on the green at dawn, the foreign traders' stall draws a crowd by terce, and Hollowbrook — washed, mended, and rehearsed — presents the week it has had.
{
- wealth >= 3: -> finale_prosperity
- will >= 3: -> finale_steadfast
- else: -> finale_quiet
}

=== finale_prosperity ===
It has been a profitable week, and the fair knows it. The village's coin moves the market, the traders talk of coming back twice a year, and the lord's clerks record the best reckoning in a decade — with several of your names in the margins.
Money changes a village. By spring there will be glass in windows that had shutters, and the lanes will argue forever about whether that was the week Hollowbrook was made or sold.
THE FAIR MAKES HOLLOWBROOK RICH.
-> END

=== finale_steadfast ===
It has been a steady, unbending week, and fair day shows the shape of it. The reckoning is honest, the petitions get heard, and when the levy men try one last squeeze at the gate, the village answers with one voice and the lord — remarkably — backs it.
Nobody gets rich. But the well gets dug, the bailiff gets replaced, and Hollowbrook walks out of fair week owning itself a little more than it did.
THE VILLAGE STANDS ITS GROUND.
-> END

=== finale_quiet ===
It has been a quiet week, all told — work done, debts moved around, nothing that will make a ballad. The fair comes, dazzles, takes its coin, and folds away into wagons by the following dusk.
But quiet weeks are what villages are made of, and the ledger of small kindnesses and small grudges you've all written this week will still be open next Michaelmas.
THE WHEEL OF THE YEAR TURNS.
-> END
