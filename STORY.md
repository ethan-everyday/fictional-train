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

---

## Characters

Each player picks one **Role** and one **Background** (floor of 1 in every stat, plus these).

### Roles
- **Landless Knight** — A sword that fled a lost field on the continent. Doors still open to steel. —  (+3 Strength, +2 Will)
- **Physician** — Trained at a plague-struck university. You know how a sickness moves. —  (+3 Intelligence, +2 Craft)
- **Ruined Merchant** — You got out with a strongbox and little else. Coin still talks. —  (+3 Wealth, +2 Intelligence)
- **Deserter** — You slipped away from an army already dead on its feet. Quick hands, quicker exits. —  (+3 Agility, +2 Will)
- **Friar** — You fled a burning monastery with your faith intact. The Church's word still carries. —  (+3 Will, +2 Intelligence)
- **Journeyman Smith** — Your workshop is ash; your hands and your craft remain. —  (+3 Craft, +2 Strength)

### Backgrounds
- **Fallen Noble** — Your house was sacked, but the name still turns a head and the purse still has weight. —  (+2 Wealth, +1 Will)  {starts with: noble_born}
- **Runaway Villein** — A serf who ran when the lord's lands burned. Strong back, longer memory. —  (+2 Strength, +1 Craft)
- **Far-Traveller** — From distant lands — you read a strange town faster than its own folk do. —  (+1 Intelligence, +1 Agility, +1 Wealth)  {starts with: outsider}
- **Plague-Orphan** — It took everyone but you. Light-footed, and very hard to rattle. —  (+2 Agility, +1 Will)
- **Guild Journeyman** — Apprenticed young — a trade in your hands and an ear for a town's gossip. —  (+2 Craft, +1 Intelligence)
- **Camp-Follower** — Raised among armies: handy, watchful, and used to the very worst. —  (+1 Strength, +1 Will, +1 Agility)

---

## The Seven Weeks

The title-card text shown at the start of each week:

1. Your ship makes the dock at St Sebastian. The town bustles, blissfully unaware of the devastation creeping closer day by day.
2. Whispers of a great destruction spread through the streets. The priest calls it God's wrath for sinners abroad; the lord says foreign wars are no concern of a town with strong walls and a stronger garrison.
3. Fewer traders come, and those who do are desperate to leave again. A plume of smoke stands on the horizon, and messengers ride at breakneck speed toward the castle.
4. The smoke has not lifted. In the markets and taverns they speak of a strange sickness taking the poor — and word of it has reached the great lord himself.
5. The first death: blood pouring from the eyes and mouth, an awful drowning death. A band of horsemen is sighted, their purpose unknown. The castle turns guests away. Panic sets in.
6. The dead are carted to pits beyond the walls, refugees wait at the gate, and the markets are bare. A great warband crawls over the horizon — a tattered mass of dying men, vicious and desperate. One last ship remains.
7. The warband is at the gate. The dead lie in the streets, the castle is shut, the last ship slips its moorings. Behind barred doors, St Sebastian steals a few more hours of calm before the dark washes over it.

**Drama events** — town-wide weeks triggered by the party's average stats (logic in constants.ts):
- **the_warband_nears** — from week 6, closes The Farms
    "Scouts ride in white-faced: the warband is a day closer than anyone hoped — a tattered mass of dying, desperate men who burn what they cannot eat. The roads belong to them now. The farms are no place to be this week."
- **the_castle_shuts** — from week 5 (party average Will below 3), closes The Castle
    "The lord has heard enough. The castle gates are barred from within, guests turned away at spear-point, the great hall gone dark. Whatever help was to come from that quarter is not coming this week."

---

## Locations

### The Church
*The priest preaches God's wrath; the dead need burying.*

**Activities**
- **Prayer and reflection** — Kneel in the cold of the nave, trade the priest a sin for a word in return, and listen for what answers.
- **Do repair work** — The roof leaks, the tower leans, and the undercroft has been walled up longer than living memory. God's house needs hands.
- **Talk to the flock** — Move among the frightened and the dying — carry water, close the eyes of the gone, and learn what the sickness is.

**Events**

#### church_wrath_sermon
*activity: Prayer and reflection, Talk to the flock · weeks 1–2 · weight 3*
Setup: "Father Anselm preaches to a near-empty nave, his voice cracking on the stone. The plague on the continent is God's scourge for a sinful age, he says, and St Sebastian will be spared only if it repents. You know better than he does how little repenting will save anyone."
Choice:
  • [Stand and say the wrath is already coming here]
    "You speak up from the back: the smoke on the sea-wind is no sermon, and it is sailing for them. The priest's face whitens; a few heads turn. You have made an enemy of his comfort, but a friend of the frightened."
      → warned the priest's flock that the wrath was already on its way.  (+1 Will)  {sets: church_warned}
  • [Hold your tongue and let him preach]
    "You let the old man have his comfort and the flock theirs. Better they kneel in peace tonight than learn from a stranger's mouth what is rowing toward their harbour."
      → kept silent while the priest preached false comfort.  (+1 Intelligence)

#### church_verger_rumour
*activity: Prayer and reflection, Do repair work · weeks 1–4 · weight 3*
Setup: "The verger, Gybe, cannot hold his tongue against a flask. Sweeping the chancel while you keep to your own business, he lets slip that the priest sits the night by the crypt steps now, guarding something the bishop himself sent here for hiding, and that he will not say its name even drunk."
Outcome: "You buy his thirst a little and let him talk himself dry. By the time the candle gutters you know there is a thing beneath the floor of this church worth a bishop's secrecy, and roughly where the stair to it lies."
    → wheedled a rumour of the crypt's secret out of the verger.  (+1 Intelligence)  {sets: relic_clue}

#### church_priest_counsel
*activity: Prayer and reflection · weight 2*
Setup: "Father Anselm is old and frightened and has heard every lie this coast can tell. He sits you in the confessional box not to scold but to take your measure, and the dark and his patience draw more truth from you than you meant to give."
Hidden check: Intelligence 4
  Pass: "You speak plainly of what you fled and what you have seen, and he listens like a man clutching a rope. He names you a soul he can trust in the dark days he feels coming, and in a dying parish that trust is a key to many doors."
    → won the frightened old priest's trust.  (+1 Intelligence, +1 Will)  {sets: priest_trusts}
  Fail: "You hedge and trim and try to seem holier than you are. He sees clean through it, but he is too tired to mind, and you leave with a penance and the sense of having been weighed and found slight."
    → tried to outwit the priest and was gently seen through.  (+1 Will)

#### church_open_undercroft
*activity: Do repair work · weeks 2–7 · weight 3*
Setup: "Below the nave, behind a wall of rubble the old masons left, lies the undercroft — a vaulted dark that has held nothing but rats since the church was young. Father Anselm turns the thought over like a coin: with the town filling up with the frightened and soon the sick, that buried stone could be worth more than gold. He puts the crowbar in your hands and lets you choose what it becomes."
Choice:
  • [Break it open as a refuge against what is coming]
    Hidden check: Craft 5
      Pass: "You clear the stair, sound the vaults, and shore the weak spans with ship's timber begged off the docks. By the end of the night there is a stone room under God's house that a warband would break its teeth on, with air and water and a door that will hold a hundred souls safe behind it."
        → opened the undercroft as a stone refuge against the warband.  (+1 Craft, +1 Strength)  [threats: -1 War]  {sets: church_refuge_open}
      Fail: "The stair comes clear but the first vault does not hold — a span lets go in a roar of dust and nearly takes a mason with it. You brace what you can and seal the worst of it off. There is shelter down there now, of a kind, for whoever is desperate enough to trust it."
        → half-opened the undercroft before a vault came down.  (+1 Craft)
  • [Fit it out as a clean ward for the sick]
    Hidden check: Craft 5
      Pass: "You scrub the vaults with vinegar, lay fresh rushes, and cut a vent through to the churchyard air. When the sick come — and they are coming — they will lie in cool stone apart from the sound, tended in a place the rot cannot easily leave. It is the first thing built in this town, you think, that admits the truth."
        → fitted the undercroft out as a clean ward for the sick.  (+1 Craft, +1 Intelligence)  [threats: -1 Plague]  {sets: church_ward_clean}
      Fail: "The damp defeats you. Whatever you scrub, the walls sweat it back, and the fresh rushes moulder in a night. You leave the undercroft a cleaner tomb than you found it and carry the smell of it home in your clothes."
        → could not make the sodden undercroft fit to hold the sick.  (+1 Craft)
  • [Dig into the blocked stair at the far end, alone]
    Weighted random:
      ~1 (weight 1): "Behind the fall of rubble your bar turns up a mason's cache: old coin and church plate wrapped in rotted wool, laid up against some forgotten trouble and never claimed. You are the only living soul who knows it was ever there, and by morning it is not there either."
        → dug alone in the undercroft and turned up a forgotten cache.  (+2 Wealth)
      ~2 (weight 2): "You dig half the night and are paid in rat bones, broken tile, and a cold that gets into your knuckles and stays. Whatever the old masons walled up down here, it was not treasure."
        → dug alone in the undercroft and found rat bones and cold.  (+1 Craft)
      ~3 (weight 1): "The rubble gives onto a crawl-space no chart of the church admits to, and the dark inside it is wrong — thicker than the dark you brought your candle into, and aware of you. You wall it back up with your bare hands, fast, and do not tell the priest what his church is standing on."
        → broke into a dark beneath the church that should have stayed shut.  (+1 Will)

#### church_rite_of_ward
*activity: Prayer and reflection, Talk to the flock · weeks 3–7 · weight 2*
Setup: "A weaver died at dawn with his eyes open, and what he said at the end has run through the parish like fire in thatch: that something red-eyed sat at the foot of his bed all night and counted him. Father Anselm has heard the same from three deathbeds now. He takes your arm at the altar rail, grey to the lips, and asks your help to ward God's house — salt on the sills, scripture on the doors, the old rites his own teachers were ashamed of."
Hidden check: Will 5
  Pass: "You keep the vigil with him from compline to dawn, salt and psalm and candle against the dark, and hold your voice steady even when every flame in the nave bends the same way in still air. When light comes the church feels swept — cleaner than stone and soap could make it. Whatever counted the weaver will not count souls easily here."
    → warded the church against the red-eyed dark.  (+1 Will)  [threats: -1 Devils]  {sets: church_wards_set}
  Fail: "You hold the vigil through, but your voice cracks on the psalms and the salt line at the north door scatters in a draught you never felt. By dawn the wards are up — crooked, patched, done — and you are certain past all argument that something sat out the whole night's work in the tower above you, listening, unimpressed."
    → raised the wards through a long bad night while something listened, unimpressed.  (+1 Will)  {sets: church_wards_set}

#### church_casting_out
*activity: Prayer and reflection · weeks 5–7 · weight 2*
**Requires:** church_wards_set
Setup: "The wards have shown the priest where the sickness of the soul pools thickest: not in the crypt but in the people — the widow who will not stop smiling, the gravedigger who whistles at his work, each with a red light far back in the eye when the candles gutter. Father Anselm means to cast it out of his parish before the end, by the old whole rite, and he is too frail to carry it alone. He needs a voice beside his that will not break."
Hidden check: Will 6
  Pass: "The rite takes the whole night and you feel every hour of it: name by name, psalm by psalm, drawing the thing that has been feeding on the parish out into the candlelight, where it thins like smoke. Near dawn something goes out of the church in a long, cheated silence, and the widow weeps like a woman waking. The dark has lost its deepest root in St Sebastian."
    → stood the whole rite through and cast the dark out of the parish.  (+2 Will)  [threats: -2 Devils]  {sets: church_dark_cast_out}
  Fail: "Halfway through the rite the candles go out together, all of them, like a breath drawn in — and in the black a voice that is almost your own suggests, reasonably, that you stop. Your nerve goes. By the time trembling hands strike a light, Father Anselm is on the floor and the thing you had half-drawn out has slipped back down into the parish like water into sand."
    → faltered in the casting-out and let the dark slip back into the parish.  (+1 Will)

#### church_organise_healers
*activity: Talk to the flock · weeks 4–7 · weight 2*
**Requires:** priest_trusts
Setup: "The first of the poor are coughing blood now, and Father Anselm has no plan but prayer. He begs your help: the few widows and almsfolk who will still touch the sick must be marshalled into something, or the whole quarter rots untended."
Hidden check: Will 5
  Pass: "You set the willing to boiling linen, parting the sick from the sound, and burying the worst rags deep. It is grim, stinking work, but by dawn there is order where there was only panic, and the sick are tended by hands that know what they are doing."
    → marshalled the church's almsfolk into a band of healers.  (+1 Will, +1 Intelligence)  [threats: -1 Plague]  {sets: healers_organized}
  Fail: "You try, but the widows quarrel and the able-bodied scatter at the first cough that brings up blood, and you spend the small hours holding one dying weaver's hand because there is no one else left to do even that. He weeps red into the rushlight and asks you to pray, and you do, and it does not help. Some good was done. Nowhere near enough."
    → could not hold the healers together as the sick poured in.  (+1 Will)

#### church_burn_the_dead
*activity: Talk to the flock, Do repair work · weeks 5–7 · weight 3*
Setup: "The churchyard is full and the dead keep coming, carted in faster than holy ground can take them. Father Anselm wrings his hands over consecrated burial; but the corpses are bleeding, and bleeding corpses spread the rot. Someone must decide."
Choice:
  • [Burn the bodies in a pit beyond the wall]
    "You dig the pit, stack the dead, and put the torch to them yourself while the priest weeps over the lack of rites. The stink clings to you for days, but the bleeding dead stop infecting the living, and the town breathes a fraction easier."
      → burned the plague dead in a pit to stop the spreading.  (+1 Will, +1 Strength)  [threats: -1 Plague]  {sets: dead_burned}
  • [Bury them whole in hallowed ground, as he wishes]
    "You give each their rites and a Christian grave, and the priest blesses you for it through his tears. But the churchyard mud runs pink under your boots, the rain carries the rot down into the well-springs, and by morning two of the gravediggers are bent double, coughing up the same dark blood they shovelled under all night."
      → buried the plague dead whole, rites and all, and the rot spread on.  (+1 Will)  [threats: +1 Plague]

#### church_descend_crypt
*activity: Prayer and reflection, Do repair work · weight 2*
**Requires:** relic_clue
Setup: "You know now where the stair lies. While the priest sleeps slumped at the altar rail, you take a candle down past the bone-shelves of dead clergy to a low iron door the bishop's own seal still guards. Whatever the town does not speak of, it is on the other side."
Hidden check: Craft 5
  Pass: "The lock yields to patience and a thin blade. Behind the door, in a casket of black wood, lies a thing that should not be here: a relic that drinks the candlelight rather than catching it, cold as the grave and humming faintly against your teeth. This is what the Herald's red eyes wanted you to find."
    → broke into the crypt and found the town's hidden secret.  (+1 Craft, +1 Intelligence)  {sets: secret_found}
  Fail: "The lock defeats you, and your candle gutters in a draught that has no business in a sealed crypt. In the half-dark you feel it through the iron: the thing behind the door turning slowly toward you, taking your measure as surely as you take its. You climb back up empty-handed, your hands shaking, and certain past all reason that you will come again."
    → failed the crypt lock but is sure of what waits behind it.  (+1 Will)

#### church_red_eyes_speak
*activity: Prayer and reflection, Do repair work · weight 2*
**Requires:** secret_found
Setup: "Alone with the cold relic, the crypt darkens past what one candle can explain, and the dark itself seems to breathe. The pair of red eyes from the crossing open again in the black a hand's breadth from your face. THIS IS THE SECRET THING, the Herald says, and the words arrive without sound, scraped straight onto the inside of your skull. KEEP IT FROM THE OTHERS. SERVE ME, AND ST SEBASTIAN MAY YET STAND. THE CHOICE REMAINS THINE."
Choice:
  • [Kneel, and give the red eyes your word]
    "You kneel on the cold stone before the red eyes and give your word. The relic warms once against your chest, slow, like a thing turning over in its sleep, and the eyes close, satisfied. You have the Herald's favour now, and the weight of it settles behind your ribs and beats there like a second heart that is not your own. Somewhere above you, in the sleeping parish, the dark puts down another root."
      → knelt to the red eyes in the crypt and won the Herald's favour.  (+2 Will)  [threats: +1 Devils]  {sets: herald_favour}
  • [Refuse it, and climb back to the light]
    "You back up the stair with your candle guttering and the cold of the relic's regard between your shoulder blades. THE CHOICE REMAINS THINE, the dark says behind you, unhurried, and the worst of it is the patience. You come up into the nave gulping air like a man out of deep water, still your own — for whatever that is now worth."
      → refused the red eyes in the crypt and climbed back to the light.  (+1 Will, +1 Intelligence)

#### church_sell_the_secret
*activity: Prayer and reflection, Talk to the flock · weeks 6–7 · weight 2*
**Requires:** secret_found
Setup: "A grey-faced merchant has heard you went down into the crypt and lived. With the warband on the horizon and the last ship loading, he offers a year's passage and a purse for the bishop's relic, no questions, gone by the next tide. Father Anselm would never know who took it, or would die before he could."
Choice:
  • [Sell the relic and buy your way onto the last ship]
    "You hand over the casket and take the purse and the berth. The merchant's men are already at the gangplank; whatever the Herald wanted, whatever the town needed, it sails out of your reach tonight, and so, gladly, do you."
      → sold the church's secret and bought passage on the last ship.  (+2 Wealth, -1 Will)  {sets: passage_secured, turned_to_darkness}
  • [Refuse, and carry the relic back to the priest]
    "You turn the merchant out and bear the casket back down to the priest, telling him only that it is safer in his keeping than yours. He does not understand, but he weeps and blesses you, and you have kept faith with something — the town, the Herald, or only yourself."
      → refused to sell the relic and gave it back to the priest.  (+2 Will)

#### church_toll_the_warband
*activity: Do repair work · weeks 6–7 · weight 2*
Setup: "The tower scaffold puts you higher than any roof in St Sebastian, and from the top of it, in the failing light, you see them at last: a tattered column crawling toward the walls under a black banner, close enough now to count, close enough to see that half of them are dead on their feet and march anyway. The great bell hangs an arm's length from the scaffold, cold and dumb. You can haul on it and wake the whole town to the horror, or let them have one last quiet night before they learn what is coming for them."
Choice:
  • [Toll the great bell and rouse the town to its walls]
    "You haul the rope and the bronze voice rolls out over St Sebastian, dragging men from their beds to the gate and the wall. Some curse you for the panic. But the town that meets the warband awake is a town that might, just might, meet the dawn."
      → tolled the great bell and roused the town to face the warband.  (+1 Will, +1 Strength)  {sets: town_roused}
  • [Stay your hand and keep the watch alone]
    "You let the rope hang and keep the cold watch alone, granting the town one last unbroken night. You tell yourself there is nothing they could do in the dark that morning would not do better. Below you, the camp-fires of the dying bloom one by one in the black fields, and the bell hangs silent above a town that sleeps on, dreaming it is safe."
      → kept silent on the tower and let the town sleep on unwarned.  (+1 Will)

---

### The Tavern
*Panic, rumour, and deserters who can still hold a blade.*

**Activities**
- **Drink and listen** — Nurse a cup where every fear in the parish is said aloud, and twice over.
- **Gamble** — Dice and cards with deserters and dockhands, at a table where coin buys less every week and the pots grow reckless.
- **Work behind the bar** — Pour, mop, and hear every traveller's news before the lord on his hill ever does.

**Events**

#### tavern_first_cup
*activity: Drink and listen · weeks 1–2 · weight 3*
Setup: "You are strangers off a strange ship, and the room knows it. The innkeep sets down a cup unasked and asks, not unkindly, what you fled from. Half the parish leans in to hear how bad the world has got beyond their sea."
Outcome: "You give them a careful half of the truth and keep the red-eyed rest behind your teeth. By the dregs you have a name in the room and the measure of a town that does not yet know it is dying."
    → drank with the locals and earned a foreigner's welcome in St Sebastian.  (+1 Will)  {sets: tavern_known}

#### tavern_news_from_sea
*activity: Drink and listen, Work behind the bar · weeks 2–4 · weight 3*
Setup: "A trader fresh off the coast road drinks like a man trying to drown a memory. He has seen what is coming up out of the south, and for the price of his next cup he will tell it."
Hidden check: Intelligence 4
  Pass: "You keep him talking past sense and piece the truth from his ramblings: not one plague but three calamities braided together, and a road of emptied villages behind him. You know now how little time the town has left."
    → drew the road's true news from a frightened trader.  (+1 Intelligence, +1 Will)  {sets: knows_whats_coming}
  Fail: "He weeps into the ale before he makes any sense of himself, and the innkeep hauls him to a back bench to sleep it off. You are left with scraps: smoke, and the dead, and something worse walking behind them."
    → got only a drunk trader's scraps of the coming horror.  (+1 Will)

#### tavern_dice_night
*activity: Gamble · weight 3 · repeatable*
Setup: "The long table by the hearth belongs to the dice — deserters, dockhands, a fishwife who wins too often, a boy who should be home. Coin buys less every week the smoke stands on the horizon, and the pots have grown strange and reckless: a knife, a ring, a promise of passage. There is always a seat for a stranger."
Choice:
  • [Stake a coin and play the table]
    Weighted random:
      ~1 (weight 1): "The bones run kind. You play small and patient, let the drunk men chase their losses, and rise with a modest weight of copper while the fishwife gives you a professional's nod."
        → played the dice table small and came away ahead.  (+1 Wealth)
      ~2 (weight 1): "The bones run cold. Your stake crosses the table one throw at a time into a dockhand's fist, and he grins at you around three teeth. You tell yourself it bought a seat and the room's talk, and half believe it."
        → dropped a coin to the dockhands' dice and called it a lesson.  (-1 Wealth)
  • [Push the whole purse into the middle]
    Weighted random:
      ~1 (weight 2): "You throw like a soul with nothing left to fear, and the table breaks against you. Deserters mutter, the fishwife folds, and you drag home a pot heavy enough to hurt your pocket. Coin means little now; the look on their faces is worth more."
        → broke the dice table on one reckless night.  (+2 Wealth)
      ~2 (weight 3): "The pot swells, the room leans in, and the last throw betrays you. You watch a week's bread slide across the boards into other hands, and walk home lighter in every sense but one."
        → was stripped to the seams at the dice table.  (-2 Wealth, +1 Will)
      ~3 (weight 1): "You cannot lose. Seven passes running the bones fall your way, then an eighth, then the table stops laughing. An old soldier crosses himself, leaves his stake where it lies and will not meet your eye. Your shadow sits wrong on the wall tonight, and something behind your own eyes feels warm, and watchful, and pleased."
        → won seven passes running and left the table a marked soul.  (+2 Wealth)  [threats: +1 Devils]  {sets: tavern_devils_luck}
  • [Keep your purse shut and read the players]
    Hidden check: Intelligence 4
      Pass: "You nurse one cup and watch hands instead of faces. By midnight you know who palms the low die, who is desperate enough to be dangerous, and which quiet man was once a soldier and still sits facing the door. A room read right is worth more than its pot."
        → watched the dice all night and learned who cheats in St Sebastian.  (+1 Intelligence)
      Fail: "You watch till your eyes swim and learn nothing but the smell of spilled ale and the boy losing his mother's coin. Whatever game is truly being played at that table, it is played too deep for you tonight."
        → watched the dice all night and came away none the wiser.

#### tavern_deserter_sergeant
*activity: Drink and listen, Gamble · weeks 2–7 · weight 2*
Setup: "A broad man with a soldier's bearing and no soldier's badge drinks alone in the dark corner, rolling a single die against the wood and ignoring the game at the long table. The innkeep murmurs he was a sergeant of some lord's garrison until he walked off a losing field. Such a man knows how walls are held, and how they are lost."
Hidden check: Will 5
  Pass: "You sit without invitation and do not flinch from his stare. You speak of the fortress, the gate, the men who might still fight, and something in him that had gone to sleep stirs awake. He gives you a name worth finding again."
    → won the trust of a deserter sergeant in the tavern's dark corner.  (+1 Will, +1 Intelligence)  {sets: met_sergeant}
  Fail: "He hears you out and laughs without warmth. He has held walls before; he watched them fall anyway, and the men on them with them. He buys his own next cup with his back to you."
    → was laughed off by a sergeant who has already given up.  (+1 Will)

#### tavern_rally_garrison
*activity: Drink and listen · weeks 4–7 · weight 2*
**Requires:** met_sergeant
Setup: "The sergeant is back, and soberer, and he has found three more like him: old soldiers gone to drink in St Sebastian's worst week. He says the word, and they will stand the wall again. He waits to see if you will say it first."
Outcome: "You say it. The sergeant rises, and the drunks at his table rise with him, and for one moment they are a garrison again and not just men waiting to die. They will hold the fortress, or break upon it trying, and that is more than the town had this morning."
    → rallied a deserter sergeant and his men back to the fortress wall.  (+2 Will)  [threats: -1 War]  {sets: garrison_rallied}

#### tavern_court_sellswords
*activity: Gamble · weeks 3–7 · weight 2*
Setup: "A knot of sellswords, foreign and scarred and drifting ahead of the ruin as you once did, hold the far end of the dice table and win more than they lose. They will fight for whoever pays, and between throws they are weighing whether this dying town is worth the trouble of dying in."
Hidden check: Intelligence 5
  Pass: "You buy into their game and lose gracefully enough to be listened to. You do not promise them glory; you promise them coin and a wall to set their backs against, which is what such men truly want. Their scarred captain spits in her palm and tells you to come back when you have something worth arming them with."
    → diced with a band of sellswords and talked them into hearing an offer.  (+1 Intelligence, +1 Will)  {sets: sellswords_courted}
  Fail: "You misjudge them, pitch a doomed cause for a fool's wage, and the captain's smile thins to nothing. They will be on the road south by dawn, ahead of whatever is coming. Let them go."
    → lost a band of sellswords to a clumsy offer.  (+1 Will)

#### tavern_arm_the_militia
*activity: Drink and listen, Gamble · weeks 4–7 · weight 2*
**Requires:** sellswords_courted
Setup: "The scarred captain finds you at the tavern and holds you to your word. Steel, she says: get steel into willing hands and she will train the town's frightened men to use it before the worst week comes. The room is full of those willing hands; what they lack is anything to hold."
Hidden check: Craft 5
  Pass: "You scrape together billhooks and old swords, mended mail, whatever the parish has hidden in its thatch, and the captain sets her sellswords to drilling drovers and fishermen in the tavern yard. By week's end St Sebastian has something that could almost be called a militia."
    → armed the townsfolk into a rough militia under the sellswords' captain.  (+1 Craft, +1 Will)  [threats: -2 War]  {sets: militia_armed}
  Fail: "What you gather is rust and splinters, and the captain turns over a cracked blade with contempt. You can drill men all you like, she says, but you cannot arm them with prayers. The willing hands stay empty."
    → failed to find steel enough to arm the willing townsfolk.  (+1 Will)

#### tavern_lords_steward
*activity: Drink and listen · weeks 1–5 · weight 2*
Setup: "A narrow man in the lord's livery is slumming among the deserters, buying drinks and weighing faces — the steward himself, sent down to find blades for a garrison that is quietly bleeding men to the roads. His eye settles on you."
Hidden check: Will 4
  Pass: "You hold his gaze and talk like someone worth a wage. He does not smile, but he writes something small in a small book, and tells you the gate-guards will know your face. The castle, it seems, is no longer entirely shut to you."
    → caught the lord's steward's eye and won a hearing at the castle gate.  (+1 Will, +1 Intelligence)  {sets: met_steward}
  Fail: "You say a word too many and he loses interest mid-sentence, turning to a scarred sergeant instead. Whatever door he might have opened stays shut, and you are left nursing a cooling cup."
    → fumbled the lord's steward and lost a way into the castle.  (+1 Will)

#### tavern_innkeep_stores
*activity: Work behind the bar · weeks 3–7 · weight 2*
Setup: "Hauling casks up from the cellar, your lamp finds the false wall the innkeep thinks is her secret: salt fish in barrels, barley from two good years back, enough to feed a lane of hungry families for a month. She comes down the stair behind you, and her face goes very still."
Choice:
  • [Press her to open the cellar to the parish]
    Hidden check: Will 5
      Pass: "You speak of the bare market and the thin children in the lane, and you do not look away until she does. She is not a cruel woman, only a frightened one. By the week's end there is barley on the church steps with no name attached, and the innkeep stands a little straighter for having set the weight down."
        → talked the innkeep into opening her hidden stores to the hungry.  (+1 Will)  [threats: -1 Starvation]  {sets: tavern_stores_opened}
      Fail: "She hears you out, then names every neighbour who would have let her starve had the years run the other way, and she is not wrong about all of them. The false wall is mended within the week, and she counts the casks after your every shift."
        → failed to talk the innkeep out of her hoard.  (+1 Will)
  • [Hold your tongue and take her coin]
    "Neither of you says a word. At closing she presses a coin into your palm, and her eyes tell you plainly what it buys. You pocket it. A hungry town is full of secrets, and now you are keeping one of the heavier ones."
      → kept the innkeep's hidden hoard secret for a coin.  (+1 Wealth)  {sets: innkeep_owes}

#### tavern_panic_brawl
*activity: any activity · weeks 5–7 · weight 2*
Setup: "Word comes that the castle has shut its gates against the sick, and the room boils over. A farmhand swings at the innkeep for watering the ale, fists fly, and the whole panicked crowd is half a breath from a riot."
Hidden check: Strength 6
  Pass: "You wade in, crack two heads together, and put the farmhand on the floor before the riot can catch and spread. The room settles into sullen muttering. The innkeep slides you a cup and a long, grateful look; she will not soon forget who held her tavern together."
    → broke up a panic-riot and earned the innkeep's lasting debt.  (+1 Strength, +1 Will)  {sets: innkeep_owes}
  Fail: "The brawl is bigger than your two hands. You take an elbow to the eye and a bench to the shins, and crawl out the side door while crockery rains down behind you. The town's nerve is breaking, and tonight you could not hold it."
    → was knocked down trying to stop a tavern riot.  (+1 Will)

#### tavern_join_the_looters
*activity: Drink and listen, Gamble · weeks 6–7 · weight 3*
Setup: "The sellswords who would not stay to fight have found a better trade. With the warband on the horizon and order gone, they mean to strip St Sebastian bare in its last days and ride out fat, and they want hands that know the town. The captain lays it out plainly over the dice: the place is dead already; only fools die in it."
Choice:
  • [Take a cut and help them strip the town]
    "You show them which doors hide silver and which widows hide grain, and you take your share in blood-warm coin. The Herald's red eyes watch from somewhere behind your own, and they are not displeased. Let the town burn; you will be rich in its ashes."
      → joined the looters and helped strip the dying town for a cut.  (+2 Wealth, -1 Will)  [threats: +1 War]  {sets: turned_to_darkness}
  • [Warn the innkeep and bar the door against them]
    "You go to the innkeep first, and together you bolt the cellar, hide what little there is, and put out the word down the lane. The looters curse your name and find easier streets to bleed. You have made enemies of armed men in the worst possible week, and kept one corner of the town honest."
      → turned on the looters and barred the tavern against them.  (+2 Will, -1 Wealth)  [threats: -1 War]

#### tavern_last_orders
*activity: any activity · weeks 7–7 · weight 3*
Setup: "The warband is at the gates and the dead are in the streets, and the innkeep keeps pouring because what else is there now to do. A handful of souls who chose to stay sit drinking the cellar dry, and they look to you, the foreigner who never ran, to say a word for the end of it all."
Outcome: "You raise the last cup and say something true and small, about how the world ends the same for kings and beggars and strangers off a ship. They drink to it. Outside, the gate groans on its hinges; inside, for one held breath, nobody is alone. Then the noise begins."
    → stood the last round in St Sebastian as the warband reached the gates.  (+1 Will)

---

### The Market
*Hoarders, bare stalls, and what little food is left.*

**Activities**
- **Talk to the traders** — What's left of the stalls, the grain-factor with his keys, and the men who buy food they never eat.
- **Watch the performers** — Mummers and a fire-eater play the square for a crowd that thins by the week.
- **Fight crime** — Cutpurses in the bread queue, hired muscle on the stalls, and a bailiff's justice that no longer reaches the square.

**Events**

#### market_thinning_rows
*activity: Talk to the traders · weeks 1–3 · weight 3*
Setup: "The stalls stand emptier than a town this size should allow, and what's left costs double what it did the day your ship made port. A widow weighs out a measure of barley with the care of a woman counting her last days on earth."
Hidden check: Intelligence 4
  Pass: "You read the rows like a ledger: who is selling out and fleeing, who is buying up against worse to come. By dusk you know which stalls will stand bare by next week, and whose sacks are being held back for the day hunger drives the price past reason."
    → read the dying market and learned who is hoarding against the famine.  (+1 Intelligence)  {sets: market_watched}
  Fail: "You pay the widow's price for a thin measure of barley and call it supper. The traders mark you for a foreigner who does not yet grasp how short the bread is going to get, nor how soon."
    → overpaid for a measure of barley and learned little.  (-1 Wealth)

#### market_factor_courted
*activity: Talk to the traders · weeks 1–4 · weight 3*
Setup: "The grain-factor keeps the granary keys on a ring at his belt and a smile he never spends. He weighs every stranger by what they might be worth to him. He will talk, if you can make yourself worth the talking to."
Hidden check: Intelligence 5
  Pass: "You match his arithmetic and feed his vanity in equal measure, and at last the smile reaches you. He lets slip that the granary stands fuller than the town believes, and that a clever foreigner might help him decide where all that grain should go."
    → won the grain-factor's confidence and a glimpse of the full granary.  (+1 Intelligence, +1 Will)  {sets: factor_marked}
  Fail: "He hears the accent, names you a beggar in better boots, and turns back to his ledger. The keys jingle as he goes, a small bright sound you will come to hate before the month is out."
    → was dismissed by the grain-factor as a foreign beggar.  (+1 Will)

#### market_open_the_granary
*activity: Talk to the traders · weeks 4–7 · weight 3*
**Requires:** factor_marked
Setup: "The sickness is in the poor quarters now, and the factor is frightened, which makes him pliable. The granary stands full while the town starves at its door. He will open it for the right argument, or the right threat."
Hidden check: Will 6
  Pass: "You press him hard: a dead town buys no grain, and a factor who fed the living will be remembered kindly when the reckoning comes. He hands you the spare key with his own shaking hand, and the queues form before the doors are full open. The town eats tonight."
    → pried the granary open and filled the town's empty bellies.  (+1 Will, +1 Craft)  [threats: -2 Starvation]  {sets: granary_filled}
  Fail: "He bolts the doors against you and your argument both, bawling for the bailiff. You walk away with the keys still on his belt and the hungry still in the street, and the patron's red eyes hang heavy on the back of your neck the whole way home."
    → failed to move the factor, and the granary stayed shut.  (+1 Will)

#### market_hired_muscle
*activity: Fight crime · weeks 2–7 · weight 3*
Setup: "The hoarders do not carry their own grain. They hire men for that — big, well-fed men who collect a stall-penny from traders too small to refuse, and walk beside carts that only move after dark. Tonight two of them are teaching a cheesemonger what happens when the penny comes late."
Hidden check: Strength 5
  Pass: "You put the first one over his own trestle and the second runs out of conviction halfway through swinging. The cheesemonger will not thank you aloud — his stall must stand here tomorrow — but his eyes flick to the night-cart creaking out of the square, and you follow it to a sealed cellar beneath a merchant's house, packed to the beams with grain waiting for a crueller price."
    → beat the hoarders' muscle off a cheesemonger and trailed their cart to a hidden hoard.  (+1 Strength, +1 Intelligence)  {sets: hoard_located}
  Fail: "The first one is bigger than he looked from across the square, and the second was never teaching the cheesemonger anything — he was watching for exactly you. They leave you in the mud between the trestles with your purse gone and the stall-penny doubled, as a lesson to the whole row."
    → was beaten into the mud by the hoarders' hired muscle.  (+1 Will, -1 Wealth)

#### market_break_the_hoarders
*activity: Talk to the traders, Fight crime · weeks 5–7 · weight 3*
**Requires:** hoard_located
Setup: "You know where the grain is hidden. The town is burying its first plague dead, and the starving have nothing left to lose. A word from you in the right ears and that cellar door will not hold an hour."
Choice:
  • [Lead the hungry to the cellar]
    "You point the way and stand well back. The door comes down, the dog flees, and the grain pours out into the lanes in aprons and caps and bare cupped hands. The hoarders scream for the bailiff to men who no longer fear the rope more than they fear the grave."
      → broke the hoarders' cellar and gave the grain to the starving.  (+1 Will, +1 Strength)  [threats: -1 Starvation]  {sets: hoarders_broken}
  • [Sell the cellar's location to its owner's rival]
    "You sell the secret to a second hoarder instead, who empties the cellar by night and stacks it with his own. Not one grain reaches a single starving mouth, but your purse hangs heavier, and you have made a friend among the men who mean to outlast this town."
      → sold the hoard to a rival and let the town starve a while longer.  (+2 Wealth)  [threats: +1 Starvation]  {sets: turned_to_darkness}

#### market_deserters_loot
*activity: Talk to the traders · weeks 3–7 · weight 2*
Setup: "A deserter from some broken company hawks his loot off a blanket on the cobbles: a dead man's boots, a chain of office, a reliquary prised from its church. He drinks while he deals, and the wine has loosened his tongue with all he saw on the roads."
Hidden check: Intelligence 5
  Pass: "You buy nothing, only ply him with questions, and between boasts he tells of a town a week south taken by the sickness in three days flat, and of a saint's bone he sold to a churchman here who paid far, far too much for it. That relic, he swears, crossing himself, was no ordinary trinket."
    → drew a deserter's tale of plague and a strangely prized relic.  (+1 Intelligence)  {sets: relic_clue}
  Fail: "He grows wary of a stranger who asks so much and buys nothing, sweeps his loot back into the blanket, and tells you to spend or be gone. You learn nothing but the look of a man who has done worse things than desert his banner."
    → pressed a deserter too hard and was waved off his blanket.  (+1 Will)

#### market_fleeing_trader
*activity: Talk to the traders · weeks 5–7 · weight 3*
Setup: "A trader is selling everything he owns at any price offered, his wagon already pointed at the docks. He has more grain in his store than he can carry, and a berth bought on a ship that sails while ships still sail. He looks at your foreign face and lowers his voice."
Choice:
  • [Buy his grain to share out in the lanes]
    "You take the lot at a fleeing man's price and spend the evening measuring it into the hollow-cheeked queue at your door. Your purse is gutted and your arms ache to the bone, but a hundred souls will wake tomorrow who might not have."
      → bought a fleeing trader's grain and shared it through the starving lanes.  (+2 Will, -2 Wealth)  [threats: -1 Starvation]  {sets: forage_secured}
  • [Buy his ship's berth instead]
    "You let the grain rot where it sits and buy the berth out from under him, coin for a name on a manifest. He curses you to your face and you find you do not care. Whatever fate this town is owed, a place on a sailing ship will be no part of it."
      → bought a fleeing trader's berth and secured their own escape.  (-1 Wealth)  {sets: passage_secured}

#### market_players_dance
*activity: Watch the performers · weeks 1–5 · weight 3*
Setup: "A troupe of mummers has the corner of the square, playing the old Dance of Death to a crowd of forty where a month ago there would have been two hundred. Death is a lean man in a hood of sacking, and between the verses the players sing the news — who has fled, who is buried, whose cellar door was heard creaking in the night — for a town that has stopped trusting its criers."
Choice:
  • [Throw the players your coin]
    "You pay them what a starving town cannot, and the lean man in the hood bows to you alone. For half an hour the square forgets itself: the crowd laughs in the right places and weeps in the wrong ones, and a woman beside you says it is the first singing she has heard since the smoke rose. It is worth the coin. It is worth rather more than the coin."
      → paid the mummers and bought the square half an hour of forgetting.  (-1 Wealth, +1 Will)
  • [Watch the crowd instead of the play]
    "You keep to the back and read faces while Death capers. The ones who laugh loudest are the ones with flour on their sleeves and no queue outside their doors — men eating well in a town that is not. By the last verse you have their names, their houses, and a fair guess at what their cellars are holding."
      → watched the crowd instead of the play and marked who in this town still eats well.  (+1 Intelligence)  {sets: market_watched}

#### market_fire_eater
*activity: Watch the performers · weight 2 · repeatable*
Setup: "The fire-eater works alone at the fountain steps, a gaunt Gascon with no eyebrows left to speak of, swallowing flame for a crowd that has seen too much smoke on the horizon to love it the way it used to. Between mouthfuls he calls for a volunteer, and his eye finds the foreign face in the crowd — yours."
Choice:
  • [Take the torch]
    Weighted random:
      ~1 (weight 1): "You tip your head back the way he shows you, and the flame goes down like a swallowed sunset. The crowd — what there is of it — roars, and for one heartbeat St Sebastian sounds like a living town again. Coppers rain into the Gascon's hat and he splits them with you, solemn as a churchwarden."
        → swallowed fire before the crowd and split the hat with the Gascon.  (+1 Will, +1 Wealth)
      ~2 (weight 2): "The trick, it turns out, is in the tilt of the head, and yours is wrong. You cough flame like a wet chimney, scorch your lip, and sit down hard on the fountain steps while the square enjoys its first honest laugh in a fortnight. The Gascon hauls you up and keeps the whole hat, which under the circumstances seems fair."
        → botched the fire-eater's trick and gave the square its first laugh in a fortnight.  (-1 Will)
      ~3 (weight 1): "You manage half the trick — enough to earn the hat's respect — and afterwards the Gascon shares his sour wine and his sourer opinion of this town. He has played plague towns before, he says. He knows the order in which the trades die, and he tells you plainly which of the market men are lying about what they have left."
        → earned the fire-eater's wine and his cold reading of the market's lies.  (+1 Intelligence, +1 Will)  {sets: market_watched}
  • [Stay in the crowd]
    "You keep your place as a butcher's apprentice takes the torch instead and fares badly, to great applause. The Gascon closes with a trick where the flame dies out in his bare hand, and tells the square that fire, like everything else in this world, only devours what is fed to it. You think about that longer than you mean to."
      → watched the flame die in the Gascon's bare hand and thought about it after.  (+1 Will)

#### market_masque_red_eyes
*activity: Watch the performers · weeks 3–7 · weight 2*
**Requires:** devil_rumour
Setup: "The mummers have a new scene tonight, one you have never seen in any Dance of Death: a figure in a black domino with two discs of red glass for eyes, who does not dance but stands at the stage's edge and takes what the dying leave behind. The crowd laughs, uneasily. The old woman who sings the verses is not laughing at all, and when the scene ends she watches you watch her."
Hidden check: Will 5
  Pass: "You find her after, and she does not pretend. She has sung in eleven towns the sickness took, she says, and in three of them she saw what you have heard whispered at the docks — the red eyes at the edge of the lamplight, patient as a creditor. It is drawn to bargains, she says. It cannot take what is not sold to it. Then she names the house in this town where she has seen it standing, and tells you to decide quickly what you are."
    → learned from the mummers' singer where the red-eyed thing has been seen standing.  (+1 Intelligence, +1 Will)  {sets: market_masque_truth}
  Fail: "You ask your questions too loudly, in the wrong company, and the singer's face closes like a door. The troupe strikes its stage in silence, and the black domino goes into the costume chest last of all — and though you watch a long while, you never do see who takes it off."
    → pressed the mummers' singer too openly and watched the red-eyed masque vanish into its chest.  (+1 Will)

#### market_cutpurse_queue
*activity: Fight crime · weight 3*
Setup: "The bread queue is where the cutpurses do their harvest now — hungry people stand still for hours and think of nothing but the door. You mark a boy working the line like a gleaner, two purses gone already, and the crowd so brittle that one shout of thief would turn the whole queue into a riot with loaves for prizes."
Hidden check: Agility 5
  Pass: "You take him by the collar quietly, between one theft and the next, and walk him out of the crush before the queue ever learns it was robbed. The purses go back with nobody trampled, and the bailiff's man on the corner — who saw none of it — is given the credit, which buys his friendship cheap. The queue holds. Tonight, in this town, that is a victory."
    → plucked a cutpurse out of the bread queue quietly and kept the peace.  (+1 Agility, +1 Will)  [threats: -1 War]
  Fail: "He is quicker than you, and worse, he is loud — he screams thief at YOU as he goes, and the queue turns with its hundred hungry eyes. You are foreign, well-fed by their measure, and holding somebody's purse you had only just picked up off the cobbles. You leave at a dead run with half a street's worth of curses on your back, and the boy keeps his harvest."
    → was named a thief by the cutpurse and chased out of the bread queue.  (+1 Will)

#### market_frisian_heist
*activity: Talk to the traders, Fight crime · weeks 3–7 · weight 3*
**Requires:** frisian_job
Setup: "The Frisians' coin is in your purse and their grievance is now yours to settle: the Lombard trader who undercut them wharf-side keeps his strong-store behind his stall, in the market's blind corner, and tonight his men are drinking his health somewhere else. You have the dark, the bar-hook they gave you, and one long moment in which you are still an honest stranger."
Choice:
  • [Prise the strong-store open]
    Hidden check: Agility 6
      Pass: "The bar-hook does its work in the dark, and the strong-store gives up the Lombard's coin, his pepper, his good Rhenish cloth — a season of trade gone in one quiet hour. The Frisians pay what they promised and drink your health in their harsh sailors' Latin. In the morning the Lombard's stall stands empty, and the queue that relied on his grain contract stands in front of it anyway, not yet understanding. You count your coin, and try not to."
        → robbed the Lombard's strong-store for the Frisians and was paid in full.  (+2 Wealth, +1 Agility)  [threats: +1 Starvation]  {sets: market_frisian_done}
      Fail: "The bar slips, the hook screams across the iron, and a watchman's lantern swings toward you out of the blind corner's dark. You get away with your skin and nothing else — but he saw the foreign face, and by morning the market men speak behind their hands when you pass, and weigh their keys. The Frisians pay nothing for almost."
        → botched the Frisians' robbery and was marked for it by the market men.  (+1 Will)  {sets: market_marked_thief}
  • [Put the bar-hook down and walk away]
    "You stand in the dark a long moment, an honest stranger still, and then you leave the hook on the Lombard's step like a warning he will never understand. The Frisians want their coin back and you return most of it; they name you soft in two languages and go looking for other hands. Whatever else this town takes from you before the end, it will not have this."
      → walked away from the Frisians' robbery at the strong-store door.  (+1 Will, -1 Wealth)  {sets: market_frisian_refused}

---

### The Farms
*A failing harvest and the roads the warband will come down.*

**Activities**
- **Work the Failing Fields** — The barley came up blighted and thin. Whatever can still be cut is cut, and a hungry town counts every sheaf.
- **Stand at the Reeve's Ledger** — The manor reeve guards the granary with his great book and a tally of who has eaten and who has not.
- **Watch the Outer Roads** — Beyond the last field the lanes run empty toward the burning country. Whatever comes for St Sebastian comes by these roads first.
- **Sit with the Farmhands** — In the cattle byre the cottars share what little there is and say aloud what the town will not. Hungry men, and angry ones.

**Events**

#### farms_blighted_harvest
*activity: Work the Failing Fields · weeks 1–3 · weight 3*
Setup: "The reeve sets you among the rows with a sickle and a grim instruction: take everything that is not yet rotted, and say nothing the priest might overhear. Half the ears crumble to black dust in your fist before they ever reach the basket."
Hidden check: Strength 4
  Pass: "You work the rows till your palms split, sorting the sound grain from the spoiled with a patience the others have lost. By dusk there is a wagon's worth saved where there might have been nothing, and the reeve marks it down without quite bringing himself to thank you."
    → salvaged a wagon of sound grain from the blighted fields.  (+1 Strength, +1 Wealth)  [threats: -1 Starvation]  {sets: forage_secured}
  Fail: "The blight has gone deeper than the husk; for every basket you fill, half is fit only for swine, and the reek of it follows you down the rows. You bring in what you can. It is a thin offering, and the reeve's silence says he expected no better, of the harvest or of you."
    → brought in a thin, blighted share and little else.  (+1 Strength)

#### farms_reeve_count
*activity: Stand at the Reeve's Ledger · weeks 1–4 · weight 3*
Setup: "The reeve runs a cracked nail down his ledger: so many mouths, so many bushels, and the two columns no longer meet however he adds them. He looks up at you, a stranger off the foreign ship, and asks plainly whether you have come to eat his stores or to help fill them."
Choice:
  • [Offer to help bring the granary up]
    "You pledge your back to the gleaning and your wits to the count, and something in the old man unclenches. He shows you the empty bins and the full, and where a careful hand might yet make the difference between a fed town and a starved one."
      → won the reeve's trust and a hand in the granary.  (+1 Will)  {sets: reeve_trusts_you}
  • [Ask what a stranger gets for the trouble]
    "You name your price before you have lifted a finger, and the reeve's face shutters like a barn door against the wind. He gives you a day's bread and not a crumb more, and you feel his eyes follow you out, counting you now among the mouths and not the hands."
      → haggled with the reeve and was counted a burden, not a help.  (+1 Wealth)

#### farms_fill_the_granary
*activity: Stand at the Reeve's Ledger, Work the Failing Fields · weeks 1–5 · weight 2*
**Requires:** reeve_trusts_you, forage_secured
Setup: "The reeve hands you the granary keys for one night and a hard task to go with them: every sack of salvaged grain weighed, sorted, and stored against the lean weeks the red-eyed thing in your dreams keeps promising. Get it wrong and the whole town goes short when there is nothing left to spare."
Hidden check: Intelligence 6
  Pass: "You weigh and ledger through the small hours by a guttering lamp, rooting out the spoiled sacks before they can rot the sound, until the bins stand full and squared and counted twice over. When the lean weeks come, St Sebastian will eat a little longer for this one night's work."
    → filled and squared the town granary against the hunger to come.  (+1 Intelligence, +1 Will)  [threats: -2 Starvation]  {sets: granary_filled}
  Fail: "The figures swim and the sacks blur, and somewhere in the dark you miscount a bin and leave the rot to spread unseen beneath the good. The reeve finds the spoilage at dawn and takes the keys back without a word, and a portion of the town's bread is lost before the hunger has even begun."
    → fumbled the granary count and let good grain spoil.  (+1 Craft)  [threats: +1 Starvation]

#### farms_empty_lanes
*activity: Watch the Outer Roads · weeks 2–4 · weight 2*
Setup: "You walk the outer lanes where the carriers' carts used to rattle by daily. The road is silent now, the verges grown wild, and on the far hills a single thread of smoke stands where a village ought to be. The country is emptying, and it is emptying toward you."
Hidden check: Intelligence 4
  Pass: "You read the road the way a tracker reads a wood: ruts gone cold, milestones unswept, a child's shoe left in the ditch with no child anywhere near it. Whatever drove these people off is coming this way, and you mark the pace of it days before the town will let itself believe you — and days of warning are days to make the walls ready."
    → read the empty roads and guessed the ruin coming toward St Sebastian.  (+1 Intelligence, +1 Will)  [threats: -1 War]  {sets: watching_the_roads}
  Fail: "You walk a long way and learn little that a frightened farmer could not have told you: the roads are empty, the smoke is real. You turn back at dusk no wiser than you set out, the dread sitting heavy in you with no shape you can give it and no name."
    → walked the empty roads and came back with only dread.  (+1 Will)

#### farms_take_the_scout
*activity: Watch the Outer Roads · weeks 3–6 · weight 2*
**Requires:** watching_the_roads
Setup: "A lone rider keeps to the treeline at the field's edge, counting the town's walls and gates with a soldier's eye, then wheeling his horse to ride back the way he came. A scout, plainly, for something far larger behind him. He has not yet seen you crouched low in the stubble."
Hidden check: Agility 6
  Pass: "You take him out of the saddle in the high barley before he can cry out, a knee on his chest and his own knife at his throat. He is half-starved under his mail, and terrified, and you have him bound and dragged to the byre before the light fails. The warband has lost its eyes on the town. He will talk."
    → ran down the warband's scout and took him alive.  (+1 Agility, +1 Strength)  [threats: -1 War]  {sets: scout_taken}
  Fail: "Your boot finds a dry furrow and the crack of it turns his head; he is spurring away before you have cleared the rows, low over the horse's neck and gone into the dusk. He carries the count of the walls and gates back to his masters, and worse, you know for certain the town is being watched."
    → lost the scout and let the count of the walls ride back to the warband.  (+1 Agility)  [threats: +1 War]

#### farms_scout_speaks
*activity: Watch the Outer Roads, Sit with the Farmhands · weeks 4–7 · weight 3*
**Requires:** scout_taken
Setup: "The bound scout sweats in the byre's lamplight, the fever already bright behind his eyes. The farmhands want him hanged from the rafter where he sits; you want what he carries in his skull. He licks his cracked lips and offers to trade the truth for water and a clean death."
Choice:
  • [Give him water and hear him out]
    "He drinks, and then he talks: a warband of the dying, hundreds strong, sick men with nothing left to lose and nothing left to fear, marching on St Sebastian for its walls and its stores. He gives you their numbers, their road, their days of march. It is the warning the town has refused to hear, and now you carry it whole."
      → drew the truth from the scout and laid the warband bare.  (+1 Intelligence, +1 Will)  {sets: warband_sighted, relic_clue}
  • [Let the farmhands have their hanging]
    "You step back and the cottars do the rest, and the scout dies cursing in a tongue not one of you knows. The byre is grimly satisfied, and you have made yourself their man, but whatever he knew of the host at his back swings now from the rafter, gone past all asking."
      → let the farmhands hang the scout and lost what he knew.  (+1 Will)  {sets: warband_sighted}

#### farms_byre_grievance
*activity: Sit with the Farmhands · weeks 1–5 · weight 2*
Setup: "The farmhands pass a single loaf six ways and talk low about the castle hoarding grain behind its walls while the fields fail. They eye you sidelong, the foreigner who came in on the cursed ship, and an old ploughman asks whether you have come to lord it over them like the rest, or to stand at their shoulder."
Hidden check: Will 4
  Pass: "You take the smallest share of the loaf and lay out your own grievance plain, and by the second round of thin ale they have decided you are one of their own. These are hard hands and harder backs, and if it ever comes to defending the fields, they will look to you to lead them."
    → won the farmhands' trust over a shared loaf.  (+1 Will, +1 Strength)  {sets: farmhands_trusted}
  Fail: "You misjudge the room and put one word too soft on the lord, and the byre goes cold around you in an instant. The loaf passes from hand to hand without ever reaching yours, and the old ploughman turns his shoulder, and his talk, away from the stranger in their midst."
    → lost the byre's room with one wrong word.  (+1 Intelligence)

#### farms_arm_the_hands
*activity: Sit with the Farmhands · weeks 5–7 · weight 3*
**Requires:** farmhands_trusted
Setup: "With the warband's smoke now plain on the hills, you put it to the farmhands straight: scythes can be set straight on poles, billhooks ground sharp, hayforks turned to spears. They are not soldiers, and never will be, but they are many, and they are angry, and they have nowhere left in the world to run."
Hidden check: Craft 6
  Pass: "You spend two days between the smithy and the byre, lashing blades to shafts and drilling frightened men into something that holds a line. By the end they stand in rough ranks with edged tools and grim faces, a militia of farmhands ready to hold the fields. It is not much. It may be enough."
    → forged the farmhands into an armed militia for the walls.  (+1 Craft, +1 Will)  [threats: -1 War]  {sets: militia_armed}
  Fail: "The hafts split, the lashings slip, and the men handle the makeshift spears like the farm tools they have always been. You arm them after a fashion, but a fashion is all it is, and you both know that the first true charge will scatter them across the stubble like chaff."
    → armed the farmhands poorly and prayed it would not be tested.  (+1 Craft)

#### farms_refugees_at_the_gate
*activity: Stand at the Reeve's Ledger, Watch the Outer Roads · weeks 6–7 · weight 4*
**Requires:** granary_filled
Setup: "They come up the lanes you once walked empty: a column of refugees, gaunt and grey, with children who do not cry because they have not the strength left to cry. They can smell the granary on the wind. The reeve looks to you, the keys cold in his hand, and the whole hungry winter hangs on what you say next."
Choice:
  • [Bar the granary and turn them away]
    "You take the keys and turn the lock, and tell the column there is nothing here for them. There is, of course; it is behind the very door you have just barred against them. The grain will see St Sebastian through, and the strangers on the road are not St Sebastian's, you tell yourself, over and over, until you very nearly believe it."
      → barred the granary and turned the starving refugees away.  (+1 Will, +1 Wealth)  {sets: turned_to_darkness}
  • [Open the stores and feed them]
    "You break out the bread you laboured to store and the column falls upon it weeping into the dirt. The reeve does not stop you; perhaps he no longer can. You have spent the town's hard margin in one afternoon of mercy, but the hunger camped on St Sebastian's roads breaks like a fever, and no child died at your locked door today."
      → opened the stores and fed the starving at the town's own cost.  (+2 Will, -1 Wealth)  [threats: -1 Starvation]  {sets: fed_the_refugees}

#### farms_scouts_on_the_roads
*activity: Watch the Outer Roads, Sit with the Farmhands · weeks 6–7 · weight 3*
**Requires:** warband_sighted
Setup: "The warband's outriders no longer trouble to hide. They sit their horses openly on the rise above the fields at dawn, counting heads and weighing the walls, close enough now that you can see the plague rotting them in the saddle. Behind them the smoke is no longer a distant thread. The reckoning the red eyes foretold is days away, perhaps only hours."
Outcome: "You stand in the cold stubble and watch them watch the town, and feel the dream-vision settle at last over the waking world: the city will fall, as all cities have fallen. You carry the count of them back through the gates while the light still holds, and whatever St Sebastian does now, it does with its eyes open."
    → watched the warband's outriders gather and carried the warning in.  (+1 Intelligence, +1 Will)  {sets: warband_sighted}

---

### The Castle
*The lord behind his walls, if they'll let you in.*

**Activities**
- **Tilt in the yard** — The garrison drills at dusk and takes the measure of any hand that joins them. The yard remembers who stood in it.
- **Join the banquet** — The lord feasts nightly to prove there is nothing to fear. Sit low, eat carefully, and watch what the great pretend not to see.
- **Gossip with the staff** — The steward and the servants know every stone of the keep — and which doors the lord pretends are not there.

**Events**

#### castle_tilt_bouts
*activity: Tilt in the yard · weight 2 · repeatable*
Setup: "Each evening the captain runs bouts in the muster yard — quintain, staves, wrestling in the churned mud — to keep his garrison from thinking about the horizon. Strangers may try their arm. The men watch the way soldiers watch, keeping score of everything."
Choice:
  • [Ride at the quintain]
    Hidden check: Agility 4
      Pass: "You take the crossbar's swing on the turn and put the point true, three passes running. The yard gives you the low whistle it saves for its own, and the captain asks your name — and, more to the point, remembers it."
        → rode the quintain clean and won a name in the muster yard.  (+1 Agility, +1 Will)  {sets: castle_yard_name}
      Fail: "The sandbag takes you across the shoulders on the first pass and puts you in the mud on the second. The garrison laughs, but not unkindly — every man of them has eaten that same mud. You get up, and getting up counts for something here."
        → was dumped in the mud by the quintain, and got up again.  (+1 Agility)
  • [Wrestle the garrison's champion]
    Hidden check: Strength 5
      Pass: "He is a slab of a man with a neck like a gatepost, and you put him on his back in front of God and the whole yard. The silence lasts a heartbeat; then the garrison roars, and the champion himself hauls you up by the wrist and names you to his mates."
        → threw the garrison's champion in the muster yard.  (+1 Strength, +1 Will)  {sets: castle_yard_name}
      Fail: "He folds you in half and sets you down almost gently, the way a man puts away a chair. You breathe mud awhile. But you took three falls without quitting, and the yard marks that too, in its way."
        → took three falls from the garrison's champion and stayed for a fourth.  (+1 Strength)
  • [Wager on the bouts instead]
    Weighted random:
      ~1 (weight 2): "You read the form like scripture — the old soldier's economy against the young one's temper — and your coin comes home doubled. The losers pay up sourly. Soldiers always pay; it is the one law they keep."
        → read the bouts truly and doubled a wager in the yard.  (+1 Wealth)
      ~2 (weight 1): "Your man is winning right up until he steps in a wheel-rut, and the bout ends with his face in the mud and your coin in a pikeman's fist. The garrison agrees, cheerfully, that this is the funniest thing the week has yet produced."
        → lost a wager on the bouts to a wheel-rut and a laughing pikeman.  (-1 Wealth)

#### castle_mend_walls
*activity: Tilt in the yard · weeks 2–7 · weight 2*
**Forbids:** walls_repaired
Setup: "The bouts end early tonight: the captain has found the old curtain wall sound in the songs and rotten in fact — a breach above the postern stopped with brush and prayer, the mortar gone to sand. The mason is three weeks dead of the flux and his apprentices are children. What gets mended now, you mend."
Hidden check: Craft 5
  Pass: "You scaffold the breach and lay stone honestly, course on course, until the wall above the postern would turn a battering-ram. The captain walks the parapet, leans his whole weight against your work, and says nothing — which, from him, is a hymn of praise. The yard knows your name by morning."
    → closed the breach in the curtain wall with honest stone.  (+1 Craft, +1 Strength)  {sets: walls_repaired, castle_yard_name}
  Fail: "You patch what you can reach before the light fails, and the bad mortar beats the rest. The breach is narrower than it was, but a determined man could still worm through it by dark — and determined men are precisely what is grinding toward the gate."
    → narrowed the breach but could not close it before dark.  (+1 Craft)

#### castle_rally_garrison
*activity: Tilt in the yard · weeks 3–6 · weight 2*
**Requires:** castle_yard_name
**Forbids:** garrison_rallied
Setup: "The captain has watched you in the yard, and now he draws you aside, low, away from his master's hearing. Fear is coming up the road faster than any warband, he says, and he holds a garrison that has not drawn steel in earnest in twenty years. He asks whether you will help him put backbone into it before it is asked to die well."
Hidden check: Strength 5
  Pass: "You drill at the captain's shoulder until the soft ones harden and the frightened ones find their feet. By week's end the garrison answers a horn instead of scattering at one. If the town is to be held, these are the hands that will hold it."
    → helped the captain forge a garrison fit to hold the walls.  (+1 Strength, +1 Will)  [threats: -1 War]  {sets: garrison_rallied}
  Fail: "Half the muster melts away the moment the captain turns his back, and you cannot be everywhere at once. You harden the few who stayed, but the captain looks at the thinning yard and you both reckon, silently, what that emptiness will cost when the warband comes."
    → could only steady a handful before the rest of the garrison drifted off.  (+1 Will)

#### castle_bar_the_gate
*activity: Tilt in the yard · weeks 5–7 · weight 3*
**Requires:** walls_repaired
**Forbids:** gate_secured
Setup: "With the breach made stone again, the captain turns to the great gate itself. The portcullis chain is fouled, the drawbar split, and refugees crowd the approach so thick the iron could never drop clean in a rush. It must be made to shut, and shut fast, before the horsemen reach it."
Hidden check: Craft 6
  Pass: "You free the chain, fit a new oak drawbar, and rig the counterweights so the portcullis falls in a single heartbeat. When the captain tests it the iron comes down like a headsman's stroke and the crowd recoils from its shadow. The gate will answer now, the night it is asked."
    → set the great gate to fall fast and hold against the warband.  (+1 Craft, +1 Will)  {sets: gate_secured}
  Fail: "You clear the chain, but the new drawbar warps green and the counterweights catch. The gate will close, given men and minutes — neither of which a sudden assault will grant. The captain marks the fault, says nothing, and prays the warband is slow on the road."
    → got the gate working but not quick enough to trust.  (+1 Craft)

#### castle_last_stand
*activity: Tilt in the yard · weeks 7–7 · weight 4*
**Requires:** garrison_rallied, gate_secured
Setup: "The warband breaks against the wall: a tide of dying men with nothing left to lose and a fury in their ruined faces that frightens even the captain. But the gate is barred fast, the breach is stone, and the garrison stands where it was taught to stand. This is the night everything you mended is asked the one question that has ever mattered."
Hidden check: Strength 7
  Pass: "They dash themselves on St Sebastian like the sea on a cliff. The fast gate drops on the first rush; the mended wall turns the second; the rallied garrison holds the third until there is no fourth left to throw. By dawn the warband is carrion in the ditch and the town at your back still breathes. You did this."
    → held the wall through the warband's last assault and saved the town.  (+1 Strength, +2 Will)  [threats: -2 War]  {sets: town_held}
  Fail: "You hold — but it takes everything. The gate jams half-down, men you drilled die in the gap, and you fight in the breach by torchlight until your arms hang like lead and the stone runs slick beneath your boots. The warband is thrown back at the last, but the grey dawn shows you faces among the dead you knew by name."
    → threw back the warband at the wall, but the cost was carved into the dawn.  (+2 Will)

#### castle_low_table
*activity: Join the banquet, Gossip with the staff · weight 3 · repeatable*
Setup: "The lord feasts his household nightly now, to prove to the town that nothing is wrong — and a presentable stranger can always find a place at the low end of the table, between the chaplain's empty seat and the servants' door. Below stairs the kitchens sweat; above, the plate goes round and round while the market stalls stand bare."
Choice:
  • [Gorge yourself and pocket what you can]
    Weighted random:
      ~1 (weight 2): "You eat like a soldier before a march and go out with a goose leg in one sleeve and honeyed figs in the other, and no one marks you — the whole table is doing the same, only better dressed about it. Outside the gate, the queue for the almoner's scraps watches you pass. The keep eats; the town does not."
        → gorged at the lord's table and carried delicacies out past a starving town.  (+1 Wealth)  [threats: +1 Starvation]
      ~2 (weight 1): "The seneschal's hand closes on your wrist with a fig still in it. He does not call the guard — the lord dislikes scenes — but you are walked to the door between two servants like a naughty child, and the low table will be watching your hands from now on. The food you ate sits in you like shame. Outside, the queue for scraps has not moved."
        → was caught pocketing the lord's sweetmeats and marched out by the seneschal.  (-1 Will)  [threats: +1 Starvation]
  • [Eat sparingly and carry scraps to the gate]
    "You eat enough to pass and slide the rest into a cloth — bread, the heel of a cheese, half a fowl the lord's cousin waved away — and hand it through the postern to whoever is quickest. It is nothing, set against the town's hunger. It is also more than anyone else at that table did tonight."
      → ate sparingly at the banquet and carried the scraps out to the hungry.  (+1 Will)
  • [Keep your cup full and your ears open]
    "You drink slowly and listen hard, below the music: which knight has quietly sent his family inland, which granary door has a new lock, what the lord says when he thinks the hall too loud to be heard in. The keep talks over food the way the tavern talks over ale — it just lies better."
      → worked the lord's table and came away with the keep's quiet fears.  (+1 Intelligence)

#### castle_lord_audience
*activity: Join the banquet · weeks 2–5 · weight 3*
**Requires:** met_steward
**Forbids:** castle_lord_audience
Setup: "You give the steward's name at the door and are seated, to your own surprise, within the lord's hearing. He is warm, loud, entirely unafraid; he has heard the whispers of distant ruin and judged them a beggar's lie told for a seat at his table. Between the fish and the fowl, you have one breath to make him believe what is coming."
Hidden check: Will 5
  Pass: "You speak of the smoke, the silent roads, the dying you stepped over on the crossing, and you do not flinch from his contempt. Something in your certainty reaches him under the scorn. He does not thank you, but he names you to the steward as one to be heard again."
    → won the lord's ear at his own table and a standing welcome in the hall.  (+1 Will, +1 Intelligence)  {sets: castle_lord_audience}
  Fail: "The lord laughs you down before you are half done. Foreigners always arrive with an end of the world tucked under one arm, he says, the better to be fed. The steward walks you out, and does not look away when you speak of the dead."
    → was laughed down the lord's table but left a doubt behind.  (+1 Intelligence)  {sets: castle_lord_audience}

#### castle_banquet_stores
*activity: Join the banquet · weeks 3–7 · weight 3*
**Requires:** castle_lord_audience
**Forbids:** castle_stores_opened
Setup: "The lord's granaries are full — everyone at the table knows it, and no one says it, while bread is fought over down the hill and mothers boil nettles. Tonight he is in an expansive mood, boasting of his stores the way a dragon counts. If ever there is a moment to shame him into opening them, it is now, in front of every knight and cousin whose good opinion he feeds on."
Hidden check: Will 6
  Pass: "You rise with your cup and thank him — loudly, gracefully — for what you then describe: the lord's own grain, given to his town in its hour of need, a legend in the making. You lay your own coin on the cloth to start the subscription. He cannot unmake the story with the whole hall watching, and by morning the granary doors stand open under guard, and the queue outside is fed."
    → shamed the lord into opening his granaries before the whole hall.  (+1 Will, -1 Wealth)  [threats: -1 Starvation]  {sets: castle_stores_opened}
  Fail: "You misjudge the room by a hair. The lord takes your meaning before you are done dressing it, and his smile goes to glass. The table talks brightly over the silence where your toast died, and the steward will not meet your eye. The granaries stay locked, and the nettle-pots stay on the fires down the hill."
    → misplayed a toast and the lord's granaries stayed locked.  (+1 Intelligence)

#### castle_lord_descends
*activity: Join the banquet · weeks 6–7 · weight 4*
**Requires:** castle_lord_audience
Setup: "The lord has gone mad behind his walls. With the warband on the horizon and the dead piling in the streets, he has thrown his cellars open to a chosen few and barred them to the rest — and what turns on the spit in the great hall is not the venison the steward names it. He sends for you by name: sit at my table, foreigner, and you'll not be served upon it."
Choice:
  • [Take your place at the lord's table]
    "You sit, and you eat, and you do not ask. The lord laughs and calls you kin, and pledges you a place on the boat his men keep at the quay against the end of all things. Somewhere behind your eyes the red gaze warms with approval, and somewhere beneath the town, something turns over in its sleep. You have chosen the side that means to outlast the light."
      → sat at the lord's cannibal table and bought a place on his boat.  (+1 Wealth, -1 Will)  [threats: +1 Devils]  {sets: turned_to_darkness, passage_secured}
  • [Turn the captain against the lord]
    "You carry what you saw to the captain and the steward both, and between the three of you the mad lord is put under guard in his own befouled hall before he can do worse. It costs you blood and two of the captain's men, and the keep is yours to defend now — leaderless, lit by a burning hall, but human still."
      → broke the lord's mad feast and took the leaderless keep for the living.  (+2 Will, +1 Strength)  {sets: garrison_rallied}

#### castle_vault_glimpse
*activity: Gossip with the staff · weeks 2–6 · weight 3*
**Requires:** met_steward
**Forbids:** castle_vault_access
Setup: "The servants talk, and what they say reaches the steward: a stranger who listens more than they drink. Harried and grey before his time, he needs a quiet pair of hands in the lower halls and takes the household's word on yours. He gives you a lamp and a key to the muniment room, where the lord keeps the deeds and reckonings of three hundred years — and one cabinet he tells you, flatly, never to open."
Outcome: "You sort the lord's papers by lamplight and let your eye drift, as the red-eyed thing on the crossing surely meant you to. The locked cabinet pulls at you. You note its iron, its hinges, the hour the steward climbs the stair to bed. You will come back when no one is counting heads."
    → won the run of the lord's muniment room and marked the cabinet none may open.  (+1 Intelligence, +1 Craft)  {sets: castle_vault_access}

#### castle_vault_records
*activity: Gossip with the staff · weeks 3–7 · weight 3*
**Requires:** castle_vault_access
**Forbids:** relic_clue
Setup: "You come back to the muniment room in the dead hour and stand before the cabinet the steward forbade. The lock is old and proud, and the thing it guards has waited longer than the lord's line has held the keep. In the dark behind your eyes, the patron's red gaze seems to lean very close."
Hidden check: Intelligence 6
  Pass: "The lock yields and the cabinet gives up a sheaf of vellum older than the keep itself: a reckoning not of grain but of something buried beneath St Sebastian when the town was young, and the rite by which the founders kept it sleeping. This is what the eyes sent you here to find."
    → prised open the lord's secret cabinet and found the record of the thing beneath the town.  (+2 Intelligence)  {sets: relic_clue}
  Fail: "The lock holds, the lamp gutters, and a guard's tread on the stair drops you flat behind the shelving with your heart slamming against the boards. You leave knowing the shape of the secret without its substance: that the lord guards a thing the founders feared, and that fear has a smell, even on dry vellum centuries cold."
    → failed the cabinet's lock but caught the scent of what it hides.  (+1 Intelligence)

#### castle_steward_doubts
*activity: Gossip with the staff · weeks 4–7 · weight 3*
**Requires:** relic_clue
**Forbids:** herald_favour
Setup: "The steward finds you with the founders' vellum spread before you and does not call the guard. He has read it himself, years past, and never managed to forget it. Quietly, he asks whether the foreigners' red-eyed dream and the thing beneath the town are one and the same — and whether anything at all can be done before the world ends at the gate."
Hidden check: Intelligence 6
  Pass: "You set the founders' rite beside what the eyes told you on the crossing, and the two halves close like a broken seal made whole. The steward goes white, then resolute, and that same night the two of you say the old words over the seal in the under-croft, the way the founders said them. Something far beneath the town pulls back its hand — and somewhere behind your eyes, the red gaze narrows. You hold what St Sebastian truly guards, and it holds a little longer because of you."
    → matched the founders' rite to the Herald's vision and sealed the dark a while longer.  (+1 Intelligence, +1 Will)  [threats: -1 Devils]  {sets: herald_favour, secret_found}
  Fail: "You cannot force the pieces to meet, not yet, and the steward's hope curdles to caution before your eyes. He folds the vellum back into his sleeve and bids you breathe no word of it to anyone, least of all the lord — who has lately begun to laugh at things that are not funny."
    → could not yet read the founders' rite and was sworn to silence.  (+1 Intelligence)

---

### The Slums
*Where the sickness strikes first and the desperate gather.*

**Activities**
- **Give alms to the poor** — Bread, coin, and clean water for the wall-side families the rest of the town has written off.
- **Fight crime** — Stand with the bailiff's failing watch against a quarter that is coming apart.
- **Gamble in the streets** — Dice in doorways with the desperate, where the coin runs short and the whispers run long.

**Events**

#### slums_first_night
*activity: Give alms to the poor · weeks 1–2 · weight 3*
Setup: "The wall-side families take you for what you are at a glance: another mouth blown in off the sea with nothing. Still, when you come offering rather than asking, a woman with a swollen ankle lets you near enough to bind it, and her neighbours stop pretending not to watch."
Outcome: "You splint the ankle with a barrel-stave and a strip of your own shirt. It is poor work and it holds. By dark you have a corner out of the wind and the wary half-trust of people who own nothing worth the stealing."
    → won a foothold among the wall-side poor by binding a stranger's ankle.  (+1 Craft, +1 Will)  {sets: slums_trusted}

#### slums_feed_families
*activity: Give alms to the poor · weeks 3–7 · weight 3*
Setup: "The market carts stop coming to the wall-side first. The families here are boiling nettles and grinding bark into the last of the flour, and the children have stopped crying about it, which is worse. Your purse sits against your ribs like a stone."
Choice:
  • [Empty your purse into bread and salt fish]
    "You spend it all — the baker's last loaves, a cask of herring off a foreign deck, a sack of dried peas the huckster swore he did not have until he saw your coin. You go door to door until your hands are empty. It will not feed them to the end. It will feed them this week, and this week is what there is."
      → emptied their purse to put bread in the wall-side lanes.  (-2 Wealth, +1 Will)  [threats: -1 Starvation]  {sets: slums_bread_given}
  • [Spare a coin and keep the rest]
    "You press a coin into the thinnest hand you can find and walk on with the rest still heavy against your ribs. It buys one family one supper, and buys you a quiet that does not last past the next doorway of hungry eyes. You tell yourself hard sense is a kind of mercy. The lane does not agree."
      → gave a single coin to the wall-side and kept the rest.  (-1 Wealth, +1 Intelligence)

#### slums_bailiff_failing
*activity: Fight crime · weeks 1–4 · weight 3*
Setup: "The bailiff is a heavy, frightened man with too few cudgels and too much quarter to hold. He is hauling a thief off a bread-cart while three more empty it behind his back. He sees you see it, and something in him sags."
Hidden check: Strength 4
  Pass: "You wade in, crack two heads together, and put your back to the cart until the rest scatter into the lanes. The bailiff looks at you the way a drowning man looks at a thrown rope, and tells you his name as though it were a confession."
    → saved the bailiff's bread-cart and earned a drowning man's gratitude.  (+1 Strength, +1 Will)  {sets: slums_bailiff_broken}
  Fail: "You grab for a wrist and a fist finds your mouth, and by the time you have your feet under you the cart is bare boards. The bailiff helps you up out of the muck. We are losing this, he says quietly, as though you had not noticed."
    → lost the bread-cart with the bailiff and tasted how far gone the quarter is.  (+1 Will)  {sets: slums_bailiff_broken}

#### slums_dice_in_doorways
*activity: Gamble in the streets · weight 3 · repeatable*
Setup: "In the mouth of a boarded-up doorway three men throw bones by rushlight for coppers and the last of somebody's shoes. They make room for you without being asked — fresh coin is fresh coin. Between throws they talk, low and constant, the way frightened men do, and the talk keeps circling back to the thing with red eyes that watches the wall-side from the dark."
Choice:
  • [Stake deep and let the bones decide]
    Weighted random:
      ~1 (weight 2): "The bones run hot for you and will not cool. You sweep the blanket twice, three times, until the dice-men mutter and one spits between his fingers against luck like yours. You walk away heavier than you came, and try not to think about what kind of night smiles on a stranger."
        → ran the bones hot and gambled the dice-men out of their coppers.  (+2 Wealth)
      ~2 (weight 3): "The bones turn on you the way this town turns on everything. Throw by throw your coin crosses the blanket and does not come back, and the dice-men grow kinder as you grow lighter, which is its own lesson."
        → lost their coin to the dice-men in the wall-side doorways.  (-1 Wealth, +1 Will)
  • [Palm the bones and work the blanket]
    Hidden check: Agility 5
      Pass: "Your fingers are quicker than their rushlight. You turn the throws you need and lose just often enough to keep the blanket friendly, and you rise with their coppers and your good name both intact."
        → cheated the wall-side dice game clean and walked away richer.  (+2 Wealth, +1 Agility)
      Fail: "A dice-man's hand closes on your wrist mid-throw and the doorway goes very quiet. They take your stake as the price of keeping your fingers and put you out into the lane with a split lip for the lesson."
        → was caught palming the bones and beaten out of the doorway.  (-1 Wealth, +1 Will)
  • [Play light and listen to the whispers]
    "You lose small, on purpose, and let the talk come to you. The dice-men speak of the red eyes the way men speak of weather — a thing simply there now, watching from the dark past the rushlight. One of them says it hungers for what this town keeps buried, and that the sickness is how the ground gives its secrets up."
      → played for coppers and heard what the dice-men whisper of the red eyes.  (+1 Intelligence)  {sets: slums_omen_heard}

#### slums_red_eyes_wager
*activity: Gamble in the streets · weeks 4–7 · weight 2*
**Requires:** devil_rumour
Setup: "There is a new player in the doorway game tonight, a lean man in good boots that nobody heard arrive, and the dice-men have gone quiet around him the way birds go quiet before weather. He plays with dice of old yellowed bone and he has not lost a throw all night. When he lifts the cup toward you, the rushlight catches his eyes wrong — red, just for a blink, the way the dockside talk had it. The stake he names is more than coin."
Choice:
  • [Throw against him for the stake he names]
    "You throw, and you win — you were always going to win, you understand too late, because winning is how it takes you. His purse is heavy and real. But something of yours went across that blanket with the stake, and when he folds into the dark at the lane's end you feel the red eyes keep a piece of you for earnest."
      → won the red-eyed stranger's wager and paid a stake no purse can hold.  (+2 Wealth, -1 Will)  [threats: +1 Devils]  {sets: slums_dark_wager}
  • [Turn the cup, salt the stones, and name it what it is]
    Hidden check: Will 6
      Pass: "You tip the cup out unthrown, cast salt across the blanket, and say aloud — to it, to the dice-men, to the listening dark — exactly what has been sitting in that doorway all night. The rushlight leaps. When it steadies, the good boots are gone and the bone dice with them, and the dice-men breathe like men pulled out of deep water. You scratch a ward into the doorpost the way the old wives teach, and you mean it."
        → salted the blanket, named the red-eyed thing, and drove it from the doorway.  (+1 Will)  [threats: -1 Devils]  {sets: slums_ward_laid}
      Fail: "You reach for the cup to turn it and your hand will not close on it. The red eyes hold you — a long, patient, weighing look, the look a man gives a fruit not yet ripe — and then he simply gathers his bones and goes, and the doorway is only a doorway, and you cannot stop your hands shaking."
        → tried to face the red-eyed player down and was weighed instead.  (+1 Intelligence)
  • [Gather your coin and walk away]
    "You have heard enough dockside talk to know a game that cannot be won. You pick your coppers off the blanket slowly, so it does not look like flight, and you keep your eyes off his until you are out of the lane. Behind you, the bone dice rattle on for somebody else."
      → walked away from the red-eyed player's game with purse and soul still their own.  (+1 Will)

#### slums_first_blood
*activity: Give alms to the poor · weeks 4–7 · weight 3*
Setup: "A carter's boy lies on a pallet of rags, and his nose has bled since noon and will not stop. There is blood at the corners of his eyes now too, a thin red weeping, and his mother prays to a saint who has plainly stopped his ears. No one in the lane has seen the like. You have heard what it means."
Hidden check: Will 5
  Pass: "You do not run. You wash the blood away as fast as it comes, hold the others back at the threshold, and stay until the small breaths stop near dawn. You have seen the first of it now, plainly, with your own eyes, and you know in your gut it will not be the last."
    → sat with the first plague death in the lanes and did not look away.  (+2 Will)  {sets: slums_plague_seen}
  Fail: "Your nerve goes before the boy does. You back out into the lane and stand shaking against the wall while his mother wails behind you. You have seen what is coming for them all, and the seeing has emptied something out of you that will not soon fill again."
    → fled the lanes' first plague death with the screaming still in their ears.  (+1 Intelligence)  {sets: slums_plague_seen}

#### slums_trace_the_fever
*activity: Give alms to the poor · weeks 4–7 · weight 2*
**Requires:** slums_plague_seen
Setup: "Every house that has buried someone backs onto the same fouled ditch at the foot of the wall, where the lane's filth and a black, sweet-rotten standing water meet. You have carried bread past it all week with your sleeve across your mouth. Now you stand at its lip and make yourself look."
Hidden check: Intelligence 5
  Pass: "You walk the deaths back one by one and they all run to the ditch like rain downhill. Something lies buried in that muck the patron wants found, and whatever it is kills the poor first and nearest. You mark the spot in your mind and tell no one yet."
    → traced every plague death to the fouled ditch beneath the wall.  (+1 Intelligence, +1 Will)  {sets: slums_fever_traced}
  Fail: "You half-see the shape of it and then lose it in the sheer crush of the dying. There are too many now to count cleanly, and the ditch keeps its secret a while longer while you go on burying your dead."
    → groped after the plague's source and lost the thread among the dead.  (+1 Will)

#### slums_seal_the_lane
*activity: Give alms to the poor, Fight crime · weeks 5–7 · weight 2*
**Requires:** slums_fever_traced
Setup: "You have the source now: the ditch, and a thing rotting in it that has no business there. The sickness creeps from the wall-side outward, lane by lane. You can dam the ditch, drag the stricken houses behind a rope, and seal this quarter off from the rest of St Sebastian. But the families behind the rope will know they have been shut in to die together."
Choice:
  • [Seal the quarter and dam the source]
    "You drive stakes, sling a rope, and tell the wall-side families the plain truth: the rest of the town lives only if they stay inside it. Most of them do. You dam the black ditch and dig out what fouls it, and beneath the muck your fingers close on something cold and carved that the patron has wanted from the first."
      → sealed the plague quarter, dammed the source, and pulled the patron's relic from the muck.  (+1 Will, +1 Craft)  [threats: -2 Plague]  {sets: quarantine_set, plague_source_found, relic_clue}
  • [Leave the rope coiled and let them scatter]
    "You cannot bring yourself to fence the dying in to die. The rope stays coiled in your hands and the wall-side families scatter into the town with the sickness riding on them. You learn the source too late for it to matter, and what is buried there stays buried in the dark."
      → refused to seal the lanes and let the plague run loose into St Sebastian.  (+1 Will)  {sets: plague_source_found}

#### slums_bailiff_recruits
*activity: Fight crime · weeks 5–7 · weight 2*
**Requires:** slums_bailiff_broken
Setup: "The bailiff cannot hold the quarter with cudgels and prayer. He has coin from somewhere and a notion that the wall-side men, hard and desperate and with nothing left to lose, would arm well if one they trusted asked it of them. He looks at you. They will follow you, he says, where they will never follow me."
Hidden check: Will 5
  Pass: "You go door to door and put the case plain: take up arms now, or be butchered for the last of your bread when the worst comes down the road. By dusk you have two score men with billhooks and fish-knives drilling badly in a dead market square. It is no garrison. It will have to serve."
    → raised an armed militia from the wall-side men the bailiff could not reach.  (+1 Will, +1 Strength)  {sets: militia_armed}
  Fail: "Too many doors stay barred. The men are too sick, too frightened, or too far past caring to take up arms for a town that never spared them a crust. You raise a ragged handful and know in your bones it is not enough for what is coming."
    → tried to arm the wall-side men and raised only a frightened handful.  (+1 Will)

#### slums_the_mob
*activity: Fight crime · weeks 6–7 · weight 3*
Setup: "Hunger and fever have finished what fear began. A mob has gathered in the wall-side dark, torches and cleavers, and they mean to break the few houses still holding food and take it, and to drag out the sick and put the quarter to the torch the clean way, the way you burn a plague ship at anchor. They have seen you stand between them and worse before now. They want to know whose side you are on, and there is no third answer they will take."
Choice:
  • [Lead them, take the food, burn the sick out]
    "You put yourself at the front and let the worst of it off the leash. You break the hoarders' doors and haul the grain into the street, and when the torches go to the fever-houses you do not stay their hands. The screaming does not last long. By morning you are fed, and feared, and something in you has gone as cold and red as the eyes that watch from the dark."
      → led the mob, seized the food, and burned the plague-sick out of their homes.  (+1 Strength, +1 Wealth, -1 Will)  [threats: +1 Devils]  {sets: turned_to_darkness, hoarders_broken}
  • [Stand in the lane's mouth and turn them back]
    "You plant yourself in the lane's mouth with the bailiff at your shoulder and will not be moved. You take a cleaver's edge across the arm and a thrown cobble to the brow, but you talk and you bleed and you shame them until the torches gutter and the worst of them slink home. The sick keep another night. So, barely, does the town's last thread of order."
      → stood alone against the mob and turned them back from the fever-houses, bleeding.  (+2 Will)  [threats: -1 War]  {sets: slums_held_the_line}

#### slums_burn_the_dead
*activity: Give alms to the poor, Fight crime · weeks 6–7 · weight 2*
**Requires:** quarantine_set
Setup: "Behind the rope the dead are past the counting, and the ground at the wall's foot is too hard and too shallow to take so many. The pit you dug yesterday is already full and brimming. The bailiff says the thing no one will say first: they must be burned, all of them, tonight, or the living behind the rope are next into the pit."
Outcome: "You build the fire with your own hands and you tend it through the long night, naming each one you can as the flames take them, because someone should. The smoke hangs over the wall-side until dawn, and the whole town wakes to the smell of it and knows. It is the worst thing your hands have ever done, and it saves the few lanes that are left."
    → burned the plague-dead through the night so the living behind the rope might last.  (+1 Will, +1 Strength)  {sets: dead_burned}

#### slums_last_offer
*activity: Give alms to the poor, Fight crime · weeks 6–7 · weight 2*
**Requires:** slums_held_the_line
Setup: "The wall-side families know now what you stood in front of for their sake. An old woman who has buried all her own beckons you into the dark of a fever-house and presses a bundle into your hands: a child, sleeping, fever-cool at last, hers no longer to keep. Take the little one to the docks, she says. There is one place left on the last ship, and the poor will never be let aboard. You might."
Choice:
  • [Take the place, carry the child to the last ship]
    "You cannot save the town, but you can save this one small life, and your own with it. You carry the child down through the dying streets to the harbour, buy the passage with the bailiff's coin, and stand at the rail as the gangplank lifts away. The wall-side burns at your back. The child sleeps on, and does not see it."
      → took the last ship's place, carried a wall-side child aboard, and left the town to burn.  (+1 Agility, -1 Wealth)  {sets: passage_secured}
  • [Give the place to the child alone and stay]
    "You will not take a dying town's last seat for yourself. You find a fleeing family at the docks who will swear before God to raise the child as their own, and you put the little one into their arms and watch the ship pull away without you. Then you turn and walk back up into the lanes, toward whatever is coming, with empty hands and a clean name."
      → gave the last ship's place to a wall-side child and stayed to face the end.  (+2 Will)

---

### The Docks
*Refugees, the sick off the boats, and the last ship out.*

**Activities**
- **Talk to the traders** — Three foreign hulls still work the quay — Spanish grain, Frisian steel, and a Moorish ship no one from the town has ever boarded.
- **Haul cargo** — Honest coin for a strong back, and half the harbour's secrets talked over your head while you sweat.

**Events**

#### docks_spanish_provisions
*activity: Talk to the traders · weight 3 · repeatable*
Setup: "The Spanish carrack rides low at her mooring, holds heavy with grain, salt fish and good oil out of the south. Her master is no fool — he knows what a starving town will pay before it starves — but he deals fair, weighs true, and sells to any hand that shows him honest coin. The markets above the harbour are already going to bare boards."
Outcome: "You count out your coin and he counts out the sacks, fair as a churchwarden. You see the grain landed and carried up into the lanes where the need is worst, and for one more day the ovens of St Sebastian have something to bake. It is a bucket against a burning house — but every mouthful buys the town another hour on its feet."
    → bought Spanish grain and put bread within the town's reach.  (-1 Wealth)  [threats: -1 Starvation]

#### docks_spanish_stories
*activity: Talk to the traders · weight 2 · repeatable*
Setup: "The Spanish crew keep a brazier lit on the quayside, and their hospitality has outlived even this town's luck. They wave you into the circle — wine goes round, then dice, then stories: drowned saints, burning ports, the strange lights their steersman swears follow the ship on moonless nights."
Outcome: "You give them your best half-true tales and take theirs in trade, and somewhere past midnight the talk turns quiet and useful: which hulls are truly leaving, which masters are lying about it, what the fishermen have stopped saying out loud. You walk away warmer, and knowing more of this harbour than most men born to it."
    → traded stories at the Spanish brazier and came away the wiser.  (+1 Intelligence, +1 Will)  {sets: dock_rumours}

#### docks_spanish_protect
*activity: Talk to the traders · weight 2*
Setup: "The Spanish master stops you on the quay, grim under his courtesy. Thieves have marked his grain — he has watched them counting his hatches from the shadow of the warehouses — and tonight, on the black tide, he believes they will come for it. His crew is willing but few. He asks you to stand with them until first light."
Choice:
  • [Stand the gangplank with the crew]
    Hidden check: Strength 5
      Pass: "They come over the rail at the darkest turn of the tide and find you planted on the boards, boathook in hand. You put the first man into the harbour and the second into the crates behind him, and the rest melt back into the dark that sent them. By dawn the crew are pressing wine on you and calling you brother, and the master's grip on your arm says the word is meant."
        → held the Spanish gangplank against thieves and was made one of the crew.  (+1 Strength, +1 Will)  {sets: spanish_friends}
      Fail: "They come in numbers no one guessed and it is all shoulders and boathooks and cursing in the dark. You take a blow that puts you on the boards, but you get up, and you go on getting up until the tide turns and they give it over. The grain is safe. Your ribs will remember the price of it for a week."
        → took a beating keeping thieves off the Spanish grain.  (+1 Will)
  • [Hunt the thieves through the stacked cargo]
    Hidden check: Agility 5
      Pass: "You go over the crates soft as a cat while the crew make their noise at the gangplank, and find the thieves crouched at their little boat with muffled oars. You cut it adrift before they know you are there, and when they turn to run there is nowhere left to run to. The Spanish haul them up laughing, and the master swears in three tongues that his ship is yours."
        → caught the grain-thieves at their boat and won the Spanish crew's friendship.  (+1 Agility, +1 Intelligence)  {sets: spanish_friends}
      Fail: "You lose them in the black lanes between the warehouses — one moment three shadows, the next only rain and your own breathing. The crew keep the deck and lose nothing, but nothing is owed to you for it, and the master's thanks in the grey morning is courteous and cool."
        → chased the grain-thieves into the dark and lost them.  (+1 Agility)

#### docks_spanish_payoff
*activity: Talk to the traders · weight 2*
**Requires:** spanish_friends
Setup: "The Spanish master takes you below to the little cabin where he keeps his good wine, and pours like a man paying a debt. The talk goes where all harbour talk goes now — and lands on the Moorish ship. He has traded with her master for twenty years, he says, from Málaga to Alexandria. Those spears at her rail are not for men who come as friends of his."
Outcome: "He teaches it to you twice over: the master's name, spoken right; the greeting of his house; and the knot of red cord his friends wear at the wrist, which he ties on you with his own hands. Come to her rail with that word and that cord, he says, and no spear in this harbour will be lowered at you. He empties his cup to the health of both ships."
    → learned from the Spanish crew the word that opens the Moorish ship.  (+1 Intelligence, +1 Will)  {sets: moor_way_aboard}

#### docks_frisian_arms
*activity: Talk to the traders · weight 2*
Setup: "The Frisian cog is a chandlery of war — pikes racked like oars, axes in greased bundles, sword-blanks sweating oil in their crates. Her master sells without sentiment and without questions, and he is honest about why his prices are still sane: he means to sail soon, and steel weighs heavy in a hull that wants to run."
Outcome: "You pay the Frisian price and see the crates carried up the hill to men who can use what is in them — watchmen with cudgels who tonight have spears, prentices drilling in a yard with real steel in their fists at last. It will not make soldiers of them. It will make the warband's work slower and dearer, and that may be all the difference there is."
    → bought Frisian steel and put spears in the hands of the town's defenders.  (-2 Wealth)  [threats: -1 War]

#### docks_frisian_devil
*activity: Talk to the traders · weeks 2–7 · weight 2*
Setup: "You mark it before you understand it: the Frisians will not sleep ashore. Not one of them, not for beds or baths or company, though their master could buy the inn outright. When you ask why, the deck goes quiet, until the old bosun spits over the rail and says it plain: they have seen what walks this town after dark. Man-shaped, up on the rooftops, still as a weathervane — and its eyes, he says, glow like a banked fire."
Outcome: "He tells it flat, the way a man reports weather: three nights running, always at the turn of the watch, always watching the town and never the sea. The crew have hung hex-signs in the rigging and keep a lamp burning at every hatch until dawn. You keep your own counsel — you know of one red-eyed thing already, and the thought that it is not alone in St Sebastian settles into you like cold water."
    → heard from the Frisian crew what walks the rooftops of St Sebastian at night.  (+1 Intelligence, +1 Will)  {sets: devil_rumour}

#### docks_frisian_job
*activity: Talk to the traders · weeks 2–7 · weight 2*
**Forbids:** frisian_job, frisian_refused
Setup: "The Frisian master draws you in under the sterncastle, where no one idles by accident. There is a trader in the market, he says — a rival who bought his buyers out from under him with lies and a fatter purse. In that man's strongbox sits coin the Frisian calls his own. He is not asking you to judge the claim. He is asking whether you can open a strongbox, and what you would charge."
Choice:
  • [Take the Frisian's coin]
    "Half now, he says, counting it into your palm without ceremony, half when the box is empty. The rest is simple: the rival keeps his strongbox behind his stall in the market, and the market at night is only shadows and rats. You pocket the silver. Somewhere up the hill, a man you have never met has already been robbed — he just does not know it yet."
      → took Frisian silver to rob a rival trader in the market.  (+2 Wealth)  {sets: frisian_job}
  • [Refuse the work]
    "You set his coin back on the barrelhead and tell him to find another pair of hands. He shrugs, unoffended — in his trade a man hears no more often than yes. But walking back down the gangplank you carry something worth more than his silver: the knowledge of exactly what you will not yet do, even in a dying town."
      → refused Frisian silver and the dirty work that came with it.  (+1 Will)  {sets: frisian_refused}

#### docks_moorish_boarding
*activity: Talk to the traders · weight 2*
**Forbids:** moor_way_aboard
Setup: "The Moorish ship rides apart from all the rest, high-sided and beautiful, lamps burning at bow and stern the whole night through. Spearmen stand her rail in paired watches, and no one from the town has ever set foot on her deck — though everyone can tell you what she carries: physic and medicines, star-charts, silks, wonders. In a town this sick, that hold is worth more than the castle."
Choice:
  • [Talk your way up the gangplank]
    Hidden check: Will 6
      Pass: "You stand at the foot of the gangplank, open-handed, and speak to the spears as if they were men — plainly, of the sick in the lanes above, and of coin honestly offered. Something in your bearing decides them where words alone would not have. The ship's physician receives you like a colleague, hears the town's symptoms with a darkening face, and sells you a case of his own physic — herbs, syrups, instructions twice repeated. It will not save St Sebastian. It will save some of it."
        → talked their way aboard the Moorish ship and came away with physic for the sick.  (+1 Will, -1 Wealth)  [threats: -1 Plague]
      Fail: "The spears come down level before you have finished your second sentence, courteous and absolute as a closed door. No insult is offered and none is needed — you are of the plague-town, and the plague-town stays ashore. You walk back down the quay with their lamps burning at your back."
        → was turned away from the Moorish ship at spear-point.  (+1 Will)
  • [Slip aboard unseen]
    Hidden check: Agility 6
      Pass: "You go up the anchor-cable in the black hour between watches, over the rail and down into a hold that smells of cedar and camphor and other lives. Chests of silk, bolts of dyed cloth — and a chart-room aft where the sky itself has been written down in silver ink. You read until your eyes ache, pocket a trinket of worked silver for your trouble, and are back over the rail before the watch turns."
        → slipped aboard the Moorish ship unseen and read her star-charts by lamplight.  (+1 Intelligence, +1 Wealth)
      Fail: "A hand takes your collar at the rail — you never hear the man behind it — and the harbour comes up cold and black and total. They do not even trouble to beat you. You drag yourself out at the water-stair, coughing bilge, to find the spearmen already looking elsewhere, as if you had never been worth the interruption."
        → was caught boarding the Moorish ship and thrown in the harbour.  (+1 Will)

#### docks_moorish_welcome
*activity: Talk to the traders · weight 3*
**Requires:** moor_way_aboard
Setup: "You come down the quay to the Moorish ship wearing the knot of red cord at your wrist, and speak the master's name to the rail the way the Spanish taught you. The effect is like a word of power out of a story: the spears go up, the gangplank comes down, and a voice from the deck calls welcome in three languages to a friend of an old friend."
Outcome: "Coffee and dates in the sterncastle; talk that runs from Alexandria to the ice; and when the master learns why you keep asking after his physician, all trade stops. The ship's whole chest of physic is brought up — remedies for the fever's every stage, in the physician's own hand — sold at a friend's price and carried ashore before the tide turns. Somewhere in the lanes above, people will live who were already counted among the dead."
    → was welcomed aboard the Moorish ship and came away with a chest of true physic.  (+1 Intelligence, +1 Will, -1 Wealth)  [threats: -2 Plague]

#### docks_haul_shift
*activity: Haul cargo · weight 3 · repeatable*
Setup: "The quay wants backs and does not care whose. Grain inbound, panic-bought furniture outbound, steel and salt fish and worse, and the master stevedore bawling for hands by the crane — with pay in honest coin at the shift's end for any who last it. In a town where every other trade is dying, hauling has never been busier."
Choice:
  • [Put your back into it]
    Hidden check: Strength 5
      Pass: "You take the heavy end of everything all shift long and set a pace the regulars curse and then, grudgingly, match. The stevedore watches you carry double loads up the swaying boards without a slip, and at the shift's end he pays you double without being asked — and tells you there is work here any night you want it."
        → out-hauled every man on the quay and was paid double for it.  (+1 Strength, +2 Wealth)
      Fail: "The sacks are heavier than they look and the boards slicker, and by mid-shift your shoulders are one long ember. But you last it — that is the whole of the bargain — and the stevedore counts your wage into your palm the same as any man's. Nobody starves for want of trying. Not on the quay, at least."
        → sweated out a full shift on the quay and took an honest wage.  (+1 Wealth)
  • [Slack off in the shadow of the stacks]
    Weighted random:
      ~1 (weight 1): "You develop, over one long evening, a genuine craft: always a sack on the shoulder, never the same sack twice; always walking, never arriving. The stevedore's eye slides over you a dozen times and snags on nothing. At the shift's end you take your full wage with a straight face and shoulders as fresh as morning."
        → idled a whole shift unnoticed and was paid all the same.  (+1 Agility, +1 Wealth)
      ~2 (weight 2): "You are on your third slow circuit of the same crate when the stevedore's hand lands on your shoulder like a loading-hook. He does not shout. He simply walks you to the end of the quay, names every man waiting for a place, and lets the whole line watch you leave. There is no wage, and there will be a colder welcome next time."
        → was caught slacking on the quay and sent off unpaid.
      ~3 (weight 1): "You find the perfect spot — a gap in the stacks where a man with a sack on his shoulder looks busy from every side — and the perfect spot turns out to have ears. Sailors talk over the stacks all evening as if no one were there: which master is bribing the harbourmaster, what the fishermen netted that they threw back and would not name, whose warehouse holds grain that sits on no ledger. You collect your wage at the end like a man collecting winnings."
        → loafed among the stacks and came away paid, and better informed.  (+1 Intelligence, +1 Wealth)  {sets: dock_rumours}

#### docks_news_from_sea
*activity: Talk to the traders, Haul cargo · weeks 3–7 · weight 3*
Setup: "A coaster limps in undercrewed, her master grey as ash and her rail scorched black. Once he starts he cannot stop: ports burned to the waterline down the coast, and a column of armed and dying men coming overland behind the smoke, taking what the plague has not. The quay pretends not to hear. You hang on every word."
Hidden check: Intelligence 4
  Pass: "You sift the panic from the substance — their road, their pace, the rivers they must ford. By the time he is hauled off to drink himself quiet, you know roughly when the warband reaches St Sebastian's walls, and from which side. Knowledge the castle would pay dearly for, if the castle would only listen."
    → wrung the warband's road and pace out of a burned-out ship's master.  (+1 Intelligence, +1 Will)  {sets: warband_sighted}
  Fail: "He raves faster than you can hold, looping fire and corpses and the names of dead ports until it is all one long howl. You catch the shape of it — something terrible, coming, soon — but never the when or the where. Cold comfort, and cold all the way down."
    → heard a ruined sailor's warning but could not pin the warband down.  (+1 Will)  {sets: warband_sighted}

#### docks_sealed_hold
*activity: Haul cargo · weeks 2–7 · weight 1*
Setup: "The stevedore sends you out along the far mole to strip a derelict — an old hull that came in years back and never left, kept on the lord's own tally though no man works her. Below decks she is bare as a picked bone, except aft: a hold sealed under wax and lead, the lord's mark pressed deep into both, and the air around it strangely still."
Hidden check: Intelligence 5
  Pass: "You do not break the seal — you read it. The date worked into the wax, the shipwright's marks on the timbers, the manifest scratched faint on the hold's lintel and imperfectly burned away: a name, a weight no honest freight would match, and the lord's mark over all of it like a hand pressed on a mouth. Whatever your red-eyed patron wants unburied in this town, its trail begins in this cold hold. You leave everything exactly as you found it and carry the knowing ashore."
    → found the first thread of the town's buried secret in a sealed hold.  (+1 Intelligence, +1 Will)  {sets: relic_clue}
  Fail: "The seal keeps its counsel. Wax, lead, the lord's mark, a date too worn to read — you turn it every way you know and it comes to nothing but a prickle down your neck and a strong desire for daylight. You strip the hull of her fittings as you were sent to do, and leave the sealed hold sitting in the dark behind you, patient as a grave."
    → found a sealed hold under the lord's mark and could make nothing of it.  (+1 Will)

#### docks_fever_boats
*activity: Haul cargo · weeks 4–7 · weight 3*
Setup: "A skiff grinds onto the shingle packed with refugees, and three of them are past walking — slack-faced, shuddering, dark trickles dried at the corners of their eyes. The boatman wants them off his deck and gone. The other refugees press back from them as from open graves. No one will lay a hand on the sick ones."
Choice:
  • [Carry the sick ashore yourself]
    "You take them up under the arms, one by one, their fever soaking hot through your sleeves, and lay them where the air runs clean. It is, almost certainly, how the plague gets in past the gate. You do it anyway, because no one else will, and because the red-eyed thing never promised it would be easy to be good."
      → carried the dying off the boats with their own hands when no one else would.  (+2 Will, +1 Strength)  [threats: +1 Plague]  {sets: docks_carried_the_sick}
  • [Force the boat to put back out]
    "You and a few hard men shove the skiff off the shingle with poles — the sick still aboard, the boatman cursing, the well refugees screaming to be let land. They drift back into the dark with the dying. You have kept the fever off St Sebastian's stones tonight, by condemning a boatful of strangers to the cold water. The eyes in your memory do not blink."
      → shoved a fever-boat back out to sea with the dying still aboard.  (+1 Will, +1 Wealth)  {sets: turned_to_darkness}

#### docks_last_ship
*activity: Talk to the traders · weeks 6–7 · weight 4*
Setup: "The St Michael's Fortune is the last hull still taking passengers, and her captain asks a year's wage a head. The gangplank is a heaving crush of the desperate; behind you the town's smoke smudges the whole sky, and the warband is a day from the walls. This is the way out the vision left open to you. Take it, and St Sebastian's fate need not be yours."
Choice:
  • [Buy your passage and be gone]
    "You press the coin into his fist and find a sliver of space at the rail. Whatever becomes of the town, it will not become of you. The red eyes promised a reward for saving it and perishing with it both — but the eyes are not here on this deck, and the sea is wide and grey and open and away."
      → bought passage on the last ship and turned their back on St Sebastian.  (-2 Wealth)  {sets: passage_secured}
  • [Give your place to a sick child's mother]
    "She weeps; you wave it off and step back down onto the cold stone. The gangplank draws up without you, and the harbour goes very quiet, and very final. Whatever the Herald meant by the saving of this town, you mean to be standing here to see it through to the end."
      → gave up the last ship's place to a stranger and stayed to face the end.  (+2 Will)

---

## Flag index (the connections)

Every flag, what sets it, what needs it, what it blocks — the wiring of the week.

- **castle_lord_audience**
    · set by: castle_lord_audience
    · needed by: castle_banquet_stores, castle_lord_descends
    · blocks: castle_lord_audience
- **castle_stores_opened**
    · set by: castle_banquet_stores
    · blocks: castle_banquet_stores
- **castle_vault_access**
    · set by: castle_vault_glimpse
    · needed by: castle_vault_records
    · blocks: castle_vault_glimpse
- **castle_yard_name**
    · set by: castle_tilt_bouts, castle_mend_walls
    · needed by: castle_rally_garrison
- **church_dark_cast_out**
    · set by: church_casting_out
    · (earned but nothing gates on it yet — room for a follow-on event)
- **church_refuge_open**
    · set by: church_open_undercroft
    · (earned but nothing gates on it yet — room for a follow-on event)
- **church_ward_clean**
    · set by: church_open_undercroft
    · (earned but nothing gates on it yet — room for a follow-on event)
- **church_wards_set**
    · set by: church_rite_of_ward
    · needed by: church_casting_out
- **church_warned**
    · set by: church_wrath_sermon
    · (earned but nothing gates on it yet — room for a follow-on event)
- **dead_burned**
    · set by: church_burn_the_dead, slums_burn_the_dead
    · (earned but nothing gates on it yet — room for a follow-on event)
- **devil_rumour**
    · set by: docks_frisian_devil
    · needed by: market_masque_red_eyes, slums_red_eyes_wager
- **dock_rumours**
    · set by: docks_spanish_stories, docks_haul_shift
    · (earned but nothing gates on it yet — room for a follow-on event)
- **docks_carried_the_sick**
    · set by: docks_fever_boats
    · (earned but nothing gates on it yet — room for a follow-on event)
- **factor_marked**
    · set by: market_factor_courted
    · needed by: market_open_the_granary
- **farmhands_trusted**
    · set by: farms_byre_grievance
    · needed by: farms_arm_the_hands
- **fed_the_refugees**
    · set by: farms_refugees_at_the_gate
    · (earned but nothing gates on it yet — room for a follow-on event)
- **forage_secured**
    · set by: market_fleeing_trader, farms_blighted_harvest
    · needed by: farms_fill_the_granary
- **frisian_job**
    · set by: docks_frisian_job
    · needed by: market_frisian_heist
    · blocks: docks_frisian_job
- **frisian_refused**
    · set by: docks_frisian_job
    · blocks: docks_frisian_job
- **garrison_rallied**
    · set by: tavern_rally_garrison, castle_rally_garrison, castle_lord_descends
    · needed by: castle_last_stand
    · blocks: castle_rally_garrison
- **gate_secured**
    · set by: castle_bar_the_gate
    · needed by: castle_last_stand
    · blocks: castle_bar_the_gate
- **granary_filled**
    · set by: market_open_the_granary, farms_fill_the_granary
    · needed by: farms_refugees_at_the_gate
- **healers_organized**
    · set by: church_organise_healers
    · (earned but nothing gates on it yet — room for a follow-on event)
- **herald_favour**
    · set by: church_red_eyes_speak, castle_steward_doubts
    · blocks: castle_steward_doubts
- **hoard_located**
    · set by: market_hired_muscle
    · needed by: market_break_the_hoarders
- **hoarders_broken**
    · set by: market_break_the_hoarders, slums_the_mob
    · (earned but nothing gates on it yet — room for a follow-on event)
- **innkeep_owes**
    · set by: tavern_innkeep_stores, tavern_panic_brawl
    · (earned but nothing gates on it yet — room for a follow-on event)
- **knows_whats_coming**
    · set by: tavern_news_from_sea
    · (earned but nothing gates on it yet — room for a follow-on event)
- **market_frisian_done**
    · set by: market_frisian_heist
    · (earned but nothing gates on it yet — room for a follow-on event)
- **market_frisian_refused**
    · set by: market_frisian_heist
    · (earned but nothing gates on it yet — room for a follow-on event)
- **market_marked_thief**
    · set by: market_frisian_heist
    · (earned but nothing gates on it yet — room for a follow-on event)
- **market_masque_truth**
    · set by: market_masque_red_eyes
    · (earned but nothing gates on it yet — room for a follow-on event)
- **market_watched**
    · set by: market_thinning_rows, market_players_dance, market_fire_eater
    · (earned but nothing gates on it yet — room for a follow-on event)
- **met_sergeant**
    · set by: tavern_deserter_sergeant
    · needed by: tavern_rally_garrison
- **met_steward**
    · set by: tavern_lords_steward
    · needed by: castle_lord_audience, castle_vault_glimpse
- **militia_armed**
    · set by: tavern_arm_the_militia, farms_arm_the_hands, slums_bailiff_recruits
    · (earned but nothing gates on it yet — room for a follow-on event)
- **moor_way_aboard**
    · set by: docks_spanish_payoff
    · needed by: docks_moorish_welcome
    · blocks: docks_moorish_boarding
- **noble_born**
    · set by: Fallen Noble (character)
    · (earned but nothing gates on it yet — room for a follow-on event)
- **outsider**
    · set by: Far-Traveller (character)
    · (earned but nothing gates on it yet — room for a follow-on event)
- **passage_secured**
    · set by: church_sell_the_secret, market_fleeing_trader, castle_lord_descends, slums_last_offer, docks_last_ship
    · (earned but nothing gates on it yet — room for a follow-on event)
- **plague_source_found**
    · set by: slums_seal_the_lane
    · (earned but nothing gates on it yet — room for a follow-on event)
- **priest_trusts**
    · set by: church_priest_counsel
    · needed by: church_organise_healers
- **quarantine_set**
    · set by: slums_seal_the_lane
    · needed by: slums_burn_the_dead
- **reeve_trusts_you**
    · set by: farms_reeve_count
    · needed by: farms_fill_the_granary
- **relic_clue**
    · set by: church_verger_rumour, market_deserters_loot, farms_scout_speaks, castle_vault_records, slums_seal_the_lane, docks_sealed_hold
    · needed by: church_descend_crypt, castle_steward_doubts
    · blocks: castle_vault_records
- **scout_taken**
    · set by: farms_take_the_scout
    · needed by: farms_scout_speaks
- **secret_found**
    · set by: church_descend_crypt, castle_steward_doubts
    · needed by: church_red_eyes_speak, church_sell_the_secret
- **sellswords_courted**
    · set by: tavern_court_sellswords
    · needed by: tavern_arm_the_militia
- **slums_bailiff_broken**
    · set by: slums_bailiff_failing
    · needed by: slums_bailiff_recruits
- **slums_bread_given**
    · set by: slums_feed_families
    · (earned but nothing gates on it yet — room for a follow-on event)
- **slums_dark_wager**
    · set by: slums_red_eyes_wager
    · (earned but nothing gates on it yet — room for a follow-on event)
- **slums_fever_traced**
    · set by: slums_trace_the_fever
    · needed by: slums_seal_the_lane
- **slums_held_the_line**
    · set by: slums_the_mob
    · needed by: slums_last_offer
- **slums_omen_heard**
    · set by: slums_dice_in_doorways
    · (earned but nothing gates on it yet — room for a follow-on event)
- **slums_plague_seen**
    · set by: slums_first_blood
    · needed by: slums_trace_the_fever
- **slums_trusted**
    · set by: slums_first_night
    · (earned but nothing gates on it yet — room for a follow-on event)
- **slums_ward_laid**
    · set by: slums_red_eyes_wager
    · (earned but nothing gates on it yet — room for a follow-on event)
- **spanish_friends**
    · set by: docks_spanish_protect
    · needed by: docks_spanish_payoff
- **tavern_devils_luck**
    · set by: tavern_dice_night
    · (earned but nothing gates on it yet — room for a follow-on event)
- **tavern_known**
    · set by: tavern_first_cup
    · (earned but nothing gates on it yet — room for a follow-on event)
- **tavern_stores_opened**
    · set by: tavern_innkeep_stores
    · (earned but nothing gates on it yet — room for a follow-on event)
- **town_held**
    · set by: castle_last_stand
    · (earned but nothing gates on it yet — room for a follow-on event)
- **town_roused**
    · set by: church_toll_the_warband
    · (earned but nothing gates on it yet — room for a follow-on event)
- **turned_to_darkness**
    · set by: church_sell_the_secret, tavern_join_the_looters, market_break_the_hoarders, farms_refugees_at_the_gate, castle_lord_descends, slums_the_mob, docks_fever_boats
    · (earned but nothing gates on it yet — room for a follow-on event)
- **walls_repaired**
    · set by: castle_mend_walls
    · needed by: castle_bar_the_gate
    · blocks: castle_mend_walls
- **warband_sighted**
    · set by: farms_scout_speaks, farms_scouts_on_the_roads, docks_news_from_sea
    · needed by: farms_scouts_on_the_roads
- **watching_the_roads**
    · set by: farms_empty_lanes
    · needed by: farms_take_the_scout

---

## Threats (the town's four dooms)

Four dials decide St Sebastian's fate. They are the ONLY thing shown on the
host screen (stats stay hidden). Each climbs on its own as the weeks arrive;
the party's job is to read which one is running away and spend its weeks
pushing it back down. Any dial still at the cap when week seven ends lands its
doom in full, and the NUMBER of maxed dials sets the ending tier.

| Threat | What it is |
| --- | --- |
| **Plague** | The sick go untended, and the carts grow heavier by the week. |
| **Starvation** | No one has sorted the food, and the town's bellies know it. |
| **War** | The warband draws closer, and the town is not ready to meet it. |
| **Devils** | Something with red eyes is taking root in the dark of St Sebastian. |

**Tick schedule** — every dial rises by this much when the week *arrives*
(cap 10). Untouched, a dial runs 0, 1, 2, 4, 6, 9, 13 → clamps to
10: a slow first fortnight, then the world ends in a hurry. A dial needs net
−3 of relief across the game to stay under the cap.

| Week | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rise this week | 0 | 1 | 1 | 2 | 2 | 3 | 4 |
| Untouched total | 0 | 1 | 2 | 4 | 6 | 9 | 10 |

**Ending ladder** (townEnding, finale.ts) — tier = how many dials are maxed:
- **0 maxed** — full success (the town stands untouched; with the Herald's
  secret in hand it becomes a beacon in the long night).
- **1 maxed** — minor success (survives, carrying one scar).
- **2 maxed** — minor failure (endures, but not lucky).
- **3 maxed** — major failure (falls in all but name).
- **4 maxed** — utter failure (wiped from the map).
One vignette prints per maxed dial. Player flags only colour the edges:
`secret_found`/`herald_favour` turn a clean sweep into the beacon end, and a
soul `turned_to_darkness` darkens the devils' vignette. Each player also gets
a personal closing line from their own choices (playerEnding).

**Per-location levers** — where each doom is fed or relieved (threat deltas on
event outcomes; negative = relief):
- **The Church**: Plague (3 relieve, 1 feed); War (1 relieve); Devils (2 relieve, 1 feed)
- **The Tavern**: Starvation (1 relieve); War (3 relieve, 1 feed); Devils (1 feed)
- **The Market**: Starvation (3 relieve, 2 feed); War (1 relieve)
- **The Farms**: Starvation (3 relieve, 1 feed); War (3 relieve, 1 feed)
- **The Castle**: Starvation (1 relieve, 2 feed); War (2 relieve); Devils (1 relieve, 1 feed)
- **The Slums**: Plague (1 relieve); Starvation (1 relieve); War (1 relieve); Devils (1 relieve, 2 feed)
- **The Docks**: Plague (2 relieve, 1 feed); Starvation (1 relieve); War (1 relieve)
