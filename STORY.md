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
  difficulty → Pass/Fail, the stat/number never shown), or a **Choice**.
- **Sets** adds a flag; **Requires**/**Forbids** gate on flags. Flags chain
  events across locations and weeks. **weeks N–M** limits when an event can fire.
- The town's fate is decided by SPINE flags the party sets across the week —
  Defence (walls_repaired, garrison_rallied, militia_armed, gate_secured),
  Plague (quarantine_set, dead_burned, healers_organized, plague_source_found),
  Food (granary_filled, hoarders_broken, forage_secured), the Herald's secret
  (relic_clue → secret_found → herald_favour), fleeing (passage_secured), and
  the dark (turned_to_darkness). See lib/game/finale.ts for the ending logic.

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
- **the_warband_nears** — from week 6, closes the The Farms
    "Scouts ride in white-faced: the warband is a day closer than anyone hoped — a tattered mass of dying, desperate men who burn what they cannot eat. The roads belong to them now. The farms are no place to be this week."
- **the_castle_shuts** — from week 5, closes the The Castle
    "The lord has heard enough. The castle gates are barred from within, guests turned away at spear-point, the great hall gone dark. Whatever help was to come from that quarter is not coming this week."

---

## Locations

### The Church
*The priest preaches God's wrath; the dead need burying.*

**Activities**
- **Kneel at the confessional** — Sit in the dark of the box and trade the priest a sin for a word in return.
- **Tend the dying and the dead** — Carry water to the fevered, close the eyes of the gone, and learn what the sickness is.
- **Go down into the crypt** — Beneath the nave, behind the bones of dead priests, the parish keeps what it does not speak of.
- **Stand the bell-tower watch** — Climb to the ropes and the cold, where the whole doomed town lies open below you.

**Events**

#### church_wrath_sermon
*activity: Kneel at the confessional, Stand the bell-tower watch · weeks 1–2 · weight 3*
Setup: "Father Anselm preaches to a near-empty nave, his voice cracking on the stone. The plague on the continent is God's scourge for a sinful age, he says, and St Sebastian will be spared only if it repents. You know better than he does how little repenting will save anyone."
Choice:
  • [Stand and say the wrath is already coming here]
    "You speak up from the back: the smoke on the sea-wind is no sermon, and it is sailing for them. The priest's face whitens; a few heads turn. You have made an enemy of his comfort, but a friend of the frightened."
    → warned the priest's flock that the wrath was already on its way.  (+1 Will)  {sets: church_warned}
  • [Hold your tongue and let him preach]
    "You let the old man have his comfort and the flock theirs. Better they kneel in peace tonight than learn from a stranger's mouth what is rowing toward their harbour."
    → kept silent while the priest preached false comfort.  (+1 Intelligence)

#### church_verger_rumour
*activity: Kneel at the confessional, Go down into the crypt · weeks 1–4 · weight 3*
Setup: "The verger, Gybe, cannot hold his tongue against a flask. Sweeping the chancel, he lets slip that the priest sits the night by the crypt steps now, guarding something the bishop himself sent here for hiding, and that he will not say its name even drunk."
Outcome: "You buy his thirst a little and let him talk himself dry. By the time the candle gutters you know there is a thing beneath the floor of this church worth a bishop's secrecy, and roughly where the stair to it lies."
    → wheedled a rumour of the crypt's secret out of the verger.  (+1 Intelligence)  {sets: relic_clue}

#### church_priest_counsel
*activity: Kneel at the confessional · weight 2*
Setup: "Father Anselm is old and frightened and has heard every lie this coast can tell. He sits you in the box not to scold but to take your measure, and the dark and his patience draw more truth from you than you meant to give."
Hidden check: Intelligence 4
  Pass: "You speak plainly of what you fled and what you have seen, and he listens like a man clutching a rope. He names you a soul he can trust in the dark days he feels coming, and in a dying parish that trust is a key to many doors."
    → won the frightened old priest's trust.  (+1 Intelligence, +1 Will)  {sets: priest_trusts}
  Fail: "You hedge and trim and try to seem holier than you are. He sees clean through it, but he is too tired to mind, and you leave with a penance and the sense of having been weighed and found slight."
    → tried to outwit the priest and was gently seen through.  (+1 Will)

#### church_organise_healers
*activity: Tend the dying and the dead · weeks 4–7 · weight 3*
**Requires:** priest_trusts
Setup: "The first of the poor are coughing blood now, and Father Anselm has no plan but prayer. He begs your help: the few widows and almsfolk who will still touch the sick must be marshalled into something, or the whole quarter rots untended."
Hidden check: Will 5
  Pass: "You set the willing to boiling linen, parting the sick from the sound, and burying the worst rags deep. It is grim, stinking work, but by dawn there is order where there was only panic, and the sick are tended by hands that know what they are doing."
    → marshalled the church's almsfolk into a band of healers.  (+1 Will, +1 Intelligence)  {sets: healers_organized}
  Fail: "You try, but the widows quarrel and the able-bodied scatter at the first cough that brings up blood, and you spend the small hours holding one dying weaver's hand because there is no one else left to do even that. He weeps red into the rushlight and asks you to pray, and you do, and it does not help. Some good was done. Nowhere near enough."
    → could not hold the healers together as the sick poured in.  (+1 Will)

#### church_burn_the_dead
*activity: Tend the dying and the dead, Go down into the crypt · weeks 5–7 · weight 3*
Setup: "The churchyard is full and the dead keep coming, carted in faster than holy ground can take them. Father Anselm wrings his hands over consecrated burial; but the corpses are bleeding, and bleeding corpses spread the rot. Someone must decide."
Choice:
  • [Burn the bodies in a pit beyond the wall]
    "You dig the pit, stack the dead, and put the torch to them yourself while the priest weeps over the lack of rites. The stink clings to you for days, but the bleeding dead stop infecting the living, and the town breathes a fraction easier."
    → burned the plague dead in a pit to stop the spreading.  (+1 Will, +1 Strength)  {sets: dead_burned}
  • [Bury them whole in hallowed ground, as he wishes]
    "You give each their rites and a Christian grave, and the priest blesses you for it through his tears. But the churchyard mud runs pink under your boots, the rain carries the rot down into the well-springs, and by morning two of the gravediggers are bent double, coughing up the same dark blood they shovelled under all night."
    → buried the plague dead whole, rites and all, and the rot spread on.  (+1 Will)

#### church_descend_crypt
*activity: Go down into the crypt · weight 3*
**Requires:** relic_clue
Setup: "You know now where the stair lies. While the priest sleeps slumped at the altar rail, you take a candle down past the bone-shelves of dead clergy to a low iron door the bishop's own seal still guards. Whatever the town does not speak of, it is on the other side."
Hidden check: Craft 5
  Pass: "The lock yields to patience and a thin blade. Behind the door, in a casket of black wood, lies a thing that should not be here: a relic that drinks the candlelight rather than catching it, cold as the grave and humming faintly against your teeth. This is what the Herald's red eyes wanted you to find."
    → broke into the crypt and found the town's hidden secret.  (+1 Craft, +1 Intelligence)  {sets: secret_found}
  Fail: "The lock defeats you, and your candle gutters in a draught that has no business in a sealed crypt. In the half-dark you feel it through the iron: the thing behind the door turning slowly toward you, taking your measure as surely as you take its. You climb back up empty-handed, your hands shaking, and certain past all reason that you will come again."
    → failed the crypt lock but is sure of what waits behind it.  (+1 Will)

#### church_red_eyes_speak
*activity: Go down into the crypt, Stand the bell-tower watch · weight 3*
**Requires:** secret_found
Setup: "Alone with the cold relic, the crypt darkens past what one candle can explain, and the dark itself seems to breathe. The pair of red eyes from the crossing open again in the black a hand's breadth from your face. THIS IS THE SECRET THING, the Herald says, and the words arrive without sound, scraped straight onto the inside of your skull. KEEP IT FROM THE OTHERS. SERVE ME, AND ST SEBASTIAN MAY YET STAND. THE CHOICE REMAINS THINE."
Outcome: "You kneel on the cold stone before the red eyes and give your word. The relic warms once against your chest, slow, like a thing turning over in its sleep, and the eyes close, satisfied. You have the Herald's favour now, and the weight of it settles behind your ribs and beats there like a second heart that is not your own."
    → knelt to the red eyes in the crypt and won the Herald's favour.  (+2 Will)  {sets: herald_favour}

#### church_offering_box
*activity: Stand the bell-tower watch, Tend the dying and the dead · weeks 5–7 · weight 2*
Setup: "The plague has stripped the nave of all but the desperate, who still light candles for the dying and feed the offering box beneath them out of terror. In an empty, reeking church at midnight, that box is fat and unwatched, and the dead have no use for coin."
Hidden check: Will 5
  Pass: "You weigh the box in your hand, think of the widows you set to tending the sick, and set it back down. Whatever comes for this town, you will not have robbed its dying to meet it. The choice costs you, and you feel it."
    → left the dying parish's offering box untouched.  (+2 Will)
  Fail: "You take it all, telling yourself the dead and the soon-dead won't miss it. The coin is heavy and slick with candle-grease, and as you carry it out the painted saints in the dark glass seem to lean after you, their gilded eyes following your back to the door and out into the reeking night. You do not sleep."
    → emptied the dying parish's offering box into their own purse.  (+2 Wealth, -1 Will)

#### church_sell_the_secret
*activity: Go down into the crypt, Kneel at the confessional · weeks 6–7 · weight 3*
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
*activity: Stand the bell-tower watch · weeks 6–7 · weight 2*
Setup: "From the bell-tower you see them at last: a tattered column crawling toward the walls under a black banner, close enough now to count, close enough to see that half of them are dead on their feet and march anyway. The bell-rope is cold and rough in your hands. You can haul on it and wake the whole town to the horror, or let them have one last quiet night before they learn what is coming for them."
Choice:
  • [Toll the great bell and rouse the town to its walls]
    "You haul the rope and the bronze voice rolls out over St Sebastian, dragging men from their beds to the gate and the wall. Some curse you for the panic. But the town that meets the warband awake is a town that might, just might, meet the dawn."
    → tolled the great bell and roused the town to face the warband.  (+1 Will, +1 Strength)  {sets: town_roused}
  • [Stay your hand and keep the watch alone]
    "You let the rope hang and keep the cold watch alone, granting the town one last unbroken night. You tell yourself there is nothing they could do in the dark that morning would not do better. Below you, the camp-fires of the dying bloom one by one in the black fields, and the bell hangs silent above a town that sleeps on, dreaming it is safe."
    → kept silent in the tower and let the town sleep on unwarned.  (+1 Will)

---

### The Tavern
*Panic, rumour, and deserters who can still hold a blade.*

**Activities**
- **Drink and listen** — Nurse a cup where every fear in the parish is said aloud, and twice over.
- **Sit with the hard men** — Deserters and sellswords brood in the dark corner; coin buys their swords, if you dare go near.
- **Work the taps** — Pour, mop, and hear every traveller's news before the lord on his hill ever does.

**Events**

#### tavern_first_cup
*activity: Drink and listen · weeks 1–2 · weight 3*
Setup: "You are strangers off a strange ship, and the room knows it. The innkeep sets down a cup unasked and asks, not unkindly, what you fled from. Half the parish leans in to hear how bad the world has got beyond their sea."
Outcome: "You give them a careful half of the truth and keep the red-eyed rest behind your teeth. By the dregs you have a name in the room and the measure of a town that does not yet know it is dying."
    → drank with the locals and earned a foreigner's welcome in St Sebastian.  (+1 Will)  {sets: tavern_known}

#### tavern_news_from_sea
*activity: Drink and listen, Work the taps · weeks 2–4 · weight 3*
Setup: "A trader fresh off the coast road drinks like a man trying to drown a memory. He has seen what is coming up out of the south, and for the price of his next cup he will tell it."
Hidden check: Intelligence 4
  Pass: "You keep him talking past sense and piece the truth from his ramblings: not one plague but three calamities braided together, and a road of emptied villages behind him. You know now how little time the town has left."
    → drew the road's true news from a frightened trader.  (+1 Intelligence, +1 Will)  {sets: knows_whats_coming}
  Fail: "He weeps into the ale before he makes any sense of himself, and the innkeep hauls him to a back bench to sleep it off. You are left with scraps: smoke, and the dead, and something worse walking behind them."
    → got only a drunk trader's scraps of the coming horror.  (+1 Will)

#### tavern_deserter_sergeant
*activity: Sit with the hard men · weeks 3–7 · weight 3*
Setup: "A broad man with a soldier's bearing and no soldier's badge drinks alone in the dark corner. The innkeep murmurs he was a sergeant of some lord's garrison until he walked off a losing field. Such a man knows how walls are held, and how they are lost."
Hidden check: Will 5
  Pass: "You sit without invitation and do not flinch from his stare. You speak of the fortress, the gate, the men who might still fight, and something in him that had gone to sleep stirs awake. He gives you a name worth finding again."
    → won the trust of a deserter sergeant in the tavern's dark corner.  (+1 Will, +1 Intelligence)  {sets: met_sergeant}
  Fail: "He hears you out and laughs without warmth. He has held walls before; he watched them fall anyway, and the men on them with them. He buys his own next cup with his back to you."
    → was laughed off by a sergeant who has already given up.  (+1 Will)

#### tavern_rally_garrison
*activity: Sit with the hard men · weeks 4–7 · weight 3*
**Requires:** met_sergeant
Setup: "The sergeant is back, and soberer, and he has found three more like him: old soldiers gone to drink in St Sebastian's worst week. He says the word, and they will stand the wall again. He waits to see if you will say it first."
Outcome: "You say it. The sergeant rises, and the drunks at his table rise with him, and for one moment they are a garrison again and not just men waiting to die. They will hold the fortress, or break upon it trying, and that is more than the town had this morning."
    → rallied a deserter sergeant and his men back to the fortress wall.  (+2 Will)  {sets: garrison_rallied}

#### tavern_court_sellswords
*activity: Sit with the hard men · weeks 3–7 · weight 2*
Setup: "A knot of sellswords, foreign and scarred and drifting ahead of the ruin as you once did, take the measure of the room for what it is worth. They will fight for whoever pays, and they are weighing whether this dying town is worth the trouble of dying in."
Hidden check: Intelligence 5
  Pass: "You do not promise them glory; you promise them coin and a wall to set their backs against, which is what such men truly want. Their scarred captain spits in her palm and tells you to come back when you have something worth arming them with."
    → talked a band of sellswords into hearing an offer.  (+1 Intelligence, +1 Will)  {sets: sellswords_courted}
  Fail: "You misjudge them, pitch a doomed cause for a fool's wage, and the captain's smile thins to nothing. They will be on the road south by dawn, ahead of whatever is coming. Let them go."
    → lost a band of sellswords to a clumsy offer.  (+1 Will)

#### tavern_arm_the_militia
*activity: Sit with the hard men, Work the taps · weeks 4–7 · weight 3*
**Requires:** sellswords_courted
Setup: "The scarred captain holds you to your word. Steel, she says: get steel into willing hands and she will train the town's frightened men to use it before the worst week comes. The tavern is full of those willing hands; what they lack is anything to hold."
Hidden check: Craft 5
  Pass: "You scrape together billhooks and old swords, mended mail, whatever the parish has hidden in its thatch, and the captain sets her sellswords to drilling drovers and fishermen in the tavern yard. By week's end St Sebastian has something that could almost be called a militia."
    → armed the townsfolk into a rough militia under the sellswords' captain.  (+1 Craft, +1 Will)  {sets: militia_armed}
  Fail: "What you gather is rust and splinters, and the captain turns over a cracked blade with contempt. You can drill men all you like, she says, but you cannot arm them with prayers. The willing hands stay empty."
    → failed to find steel enough to arm the willing townsfolk.  (+1 Will)

#### tavern_drink_to_forget
*activity: Drink and listen · weeks 4–7 · weight 2*
Setup: "The sickness is in the poor quarter now and everyone knows it. The room drinks the way people drink when they have decided there is no morning worth keeping themselves whole for. A cup is pressed into your hand. It would be so easy to set the whole weight down for one night."
Choice:
  • [Drink until the red eyes go quiet]
    "You drink with them and for a few blessed hours the vision lets go of you: no glowing stare, no city falling, no weight at all. You wake on the floor at first light with a skull full of broken glass and a day already lost. But you needed it."
    → drank the night black to silence the Herald's vision.  (+1 Will, -1 Wealth)
  • [Stay sober and keep watching]
    "You wet your lips and no more. While they drown, you listen: who is sick, who is hoarding, who has already packed a cart to run. A clear head is a lonely thing in this room, but it sees what the drunk ones let slip."
    → stayed sober among the drinkers and gathered what they let slip.  (+1 Intelligence)

#### tavern_panic_brawl
*activity: Drink and listen, Work the taps · weeks 5–7 · weight 2*
Setup: "Word comes that the castle has shut its gates against the sick, and the room boils over. A farmhand swings at the innkeep for watering the ale, fists fly, and the whole panicked crowd is half a breath from a riot."
Hidden check: Strength 6
  Pass: "You wade in, crack two heads together, and put the farmhand on the floor before the riot can catch and spread. The room settles into sullen muttering. The innkeep slides you a cup and a long, grateful look; she will not soon forget who held her tavern together."
    → broke up a panic-riot and earned the innkeep's lasting debt.  (+1 Strength, +1 Will)  {sets: innkeep_owes}
  Fail: "The brawl is bigger than your two hands. You take an elbow to the eye and a bench to the shins, and crawl out the side door while crockery rains down behind you. The town's nerve is breaking, and tonight you could not hold it."
    → was knocked down trying to stop a tavern riot.  (+1 Will)

#### tavern_join_the_looters
*activity: Sit with the hard men · weeks 6–7 · weight 4*
Setup: "The sellswords who would not stay to fight have found a better trade. With the warband on the horizon and order gone, they mean to strip St Sebastian bare in its last days and ride out fat, and they want hands that know the town. The captain lays it out plainly: the place is dead already; only fools die in it."
Choice:
  • [Take a cut and help them strip the town]
    "You show them which doors hide silver and which widows hide grain, and you take your share in blood-warm coin. The Herald's red eyes watch from somewhere behind your own, and they are not displeased. Let the town burn; you will be rich in its ashes."
    → joined the looters and helped strip the dying town for a cut.  (+2 Wealth, -1 Will)  {sets: turned_to_darkness}
  • [Warn the innkeep and bar the door against them]
    "You go to the innkeep first, and together you bolt the cellar, hide what little there is, and put out the word down the lane. The looters curse your name and find easier streets to bleed. You have made enemies of armed men in the worst possible week, and kept one corner of the town honest."
    → turned on the looters and barred the tavern against them.  (+2 Will, -1 Wealth)

#### tavern_last_orders
*activity: Drink and listen, Work the taps · weeks 7–7 · weight 3*
Setup: "The warband is at the gates and the dead are in the streets, and the innkeep keeps pouring because what else is there now to do. A handful of souls who chose to stay sit drinking the cellar dry, and they look to you, the foreigner who never ran, to say a word for the end of it all."
Outcome: "You raise the last cup and say something true and small, about how the world ends the same for kings and beggars and strangers off a ship. They drink to it. Outside, the gate groans on its hinges; inside, for one held breath, nobody is alone. Then the noise begins."
    → stood the last round in St Sebastian as the warband reached the gates.  (+1 Will)

#### tavern_lords_steward
*activity: Sit with the hard men · weeks 1–5 · weight 2*
Setup: "A narrow man in the lord's livery is slumming among the deserters, buying drinks and weighing faces — the steward himself, sent down to find blades for a garrison that is quietly bleeding men to the roads. His eye settles on you."
Hidden check: Will 4
  Pass: "You hold his gaze and talk like someone worth a wage. He does not smile, but he writes something small in a small book, and tells you the gate-guards will know your face. The castle, it seems, is no longer entirely shut to you."
    → caught the lord's steward's eye and won a hearing at the castle gate.  (+1 Will, +1 Intelligence)  {sets: met_steward}
  Fail: "You say a word too many and he loses interest mid-sentence, turning to a scarred sergeant instead. Whatever door he might have opened stays shut, and you are left nursing a cooling cup."
    → fumbled the lord's steward and lost a way into the castle.  (+1 Will)

---

### The Market
*Hoarders, bare stalls, and what little food is left.*

**Activities**
- **Pick over the stalls** — Comb the thinning rows for food worth buying and rumour worth more.
- **Deal with the grain-factor** — The man who holds the granary key holds the town's stomach. Get close to him.
- **Haul for the traders** — Fewer carts come each week, and the ones that do pay for a strong back.
- **Work the back row** — Where deserters sell their loot and no question is asked twice.

**Events**

#### market_thinning_rows
*activity: Pick over the stalls · weeks 1–3 · weight 3*
Setup: "The stalls stand emptier than a town this size should allow, and what's left costs double what it did the day your ship made port. A widow weighs out a measure of barley with the care of a woman counting her last days on earth."
Hidden check: Intelligence 4
  Pass: "You read the rows like a ledger: who is selling out and fleeing, who is buying up against worse to come. By dusk you know which stalls will stand bare by next week, and whose sacks are being held back for the day hunger drives the price past reason."
    → read the dying market and learned who is hoarding against the famine.  (+1 Intelligence)  {sets: market_watched}
  Fail: "You pay the widow's price for a thin measure of barley and call it supper. The traders mark you for a foreigner who does not yet grasp how short the bread is going to get, nor how soon."
    → overpaid for a measure of barley and learned little.  (-1 Wealth)

#### market_factor_courted
*activity: Deal with the grain-factor · weeks 1–4 · weight 3*
Setup: "The grain-factor keeps the granary keys on a ring at his belt and a smile he never spends. He weighs every stranger by what they might be worth to him. He will talk, if you can make yourself worth the talking to."
Hidden check: Intelligence 5
  Pass: "You match his arithmetic and feed his vanity in equal measure, and at last the smile reaches you. He lets slip that the granary stands fuller than the town believes, and that a clever foreigner might help him decide where all that grain should go."
    → won the grain-factor's confidence and a glimpse of the full granary.  (+1 Intelligence, +1 Will)  {sets: factor_marked}
  Fail: "He hears the accent, names you a beggar in better boots, and turns back to his ledger. The keys jingle as he goes, a small bright sound you will come to hate before the month is out."
    → was dismissed by the grain-factor as a foreign beggar.  (+1 Will)

#### market_open_the_granary
*activity: Deal with the grain-factor · weeks 4–7 · weight 4*
**Requires:** factor_marked
Setup: "The sickness is in the poor quarters now, and the factor is frightened, which makes him pliable. The granary stands full while the town starves at its door. He will open it for the right argument, or the right threat."
Hidden check: Will 6
  Pass: "You press him hard: a dead town buys no grain, and a factor who fed the living will be remembered kindly when the reckoning comes. He hands you the spare key with his own shaking hand, and the queues form before the doors are full open. The town eats tonight."
    → pried the granary open and filled the town's empty bellies.  (+1 Will, +1 Craft)  {sets: granary_filled}
  Fail: "He bolts the doors against you and your argument both, bawling for the bailiff. You walk away with the keys still on his belt and the hungry still in the street, and the patron's red eyes hang heavy on the back of your neck the whole way home."
    → failed to move the factor, and the granary stayed shut.  (+1 Will)

#### market_locate_the_hoard
*activity: Pick over the stalls, Work the back row · weeks 3–7 · weight 3*
**Requires:** market_watched
Setup: "You have marked the men who buy grain they never eat. Now you mean to find where they cache it. A boy who sweeps the back row will sell you the answer for a heel of bread and a promise to keep his name out of your mouth."
Hidden check: Agility 5
  Pass: "You follow the carts after dark to a sealed cellar beneath a merchant's house, packed to the beams with grain held back for the day the price is desperation itself. You memorise the door, the bar across it, and the dog that guards it."
    → tracked the hoarders' grain to a sealed cellar.  (+1 Agility, +1 Intelligence)  {sets: hoard_located}
  Fail: "A watchman with a hoarder's coin already in his purse catches you in the wrong lane and walks you back to the square by your collar. You learn nothing for your trouble, save that the hoard is well guarded by men who answer to silver."
    → was caught snooping and learned nothing of the hoard.  (+1 Will)

#### market_break_the_hoarders
*activity: Pick over the stalls, Haul for the traders · weeks 5–7 · weight 4*
**Requires:** hoard_located
Setup: "You know where the grain is hidden. The town is burying its first plague dead, and the starving have nothing left to lose. A word from you in the right ears and that cellar door will not hold an hour."
Choice:
  • [Lead the hungry to the cellar]
    "You point the way and stand well back. The door comes down, the dog flees, and the grain pours out into the lanes in aprons and caps and bare cupped hands. The hoarders scream for the bailiff to men who no longer fear the rope more than they fear the grave."
    → broke the hoarders' cellar and gave the grain to the starving.  (+1 Will, +1 Strength)  {sets: hoarders_broken}
  • [Sell the cellar's location to its owner's rival]
    "You sell the secret to a second hoarder instead, who empties the cellar by night and stacks it with his own. Not one grain reaches a single starving mouth, but your purse hangs heavier, and you have made a friend among the men who mean to outlast this town."
    → sold the hoard to a rival and let the town starve a while longer.  (+2 Wealth)  {sets: turned_to_darkness}

#### market_forage_party
*activity: Haul for the traders, Pick over the stalls · weeks 3–6 · weight 3*
Setup: "With the carts no longer coming, the market reeve is sending parties out to strip the hedgerows and abandoned farms of anything that can be eaten. He wants strong backs and a leader with sense. The roads, he allows, are not safe."
Hidden check: Strength 5
  Pass: "You lead the party out past the walls and back before dark, the handcarts heavy with roots, late berries, and a slaughtered pig nobody had left to mind. It is not plenty, but it is days of life, and the reeve marks you as a man worth feeding first."
    → led a forage party out and brought back days of food.  (+1 Strength, +1 Intelligence)  {sets: forage_secured}
  Fail: "The party scatters at the sight of riders on the ridge, and you stumble home with half a sack and one man fewer than you set out with. The hedgerows, it turns out, were stripped bare a week ago by people quicker to be hungry than you were."
    → lost a forage party to fear and brought back almost nothing.  (+1 Will)

#### market_haul_what_remains
*activity: Haul for the traders · weeks 1–4 · weight 2*
Setup: "One of the last honest carters still risks the road in, and his load wants shifting before the crowd that has gathered decides to take it for free. He will pay anyone who'll guard a crate as readily as carry one."
Outcome: "You haul and you glower, and the crowd stays a crowd rather than becoming a mob. The carter pays you in coin and in the last of his good cheese, and tells you, low, that he doubts he will chance the road again."
    → guarded a carter's last load and was paid in coin and cheese.  (+1 Strength, +1 Wealth)

#### market_deserters_loot
*activity: Work the back row · weeks 4–7 · weight 3*
Setup: "A deserter from some broken company hawks his loot off a blanket on the cobbles: a dead man's boots, a chain of office, a reliquary prised from its church. He drinks while he deals, and the wine has loosened his tongue with all he saw on the roads."
Hidden check: Intelligence 5
  Pass: "You buy nothing, only ply him with questions, and between boasts he tells of a town a week south taken by the sickness in three days flat, and of a saint's bone he sold to a churchman here who paid far, far too much for it. That relic, he swears, crossing himself, was no ordinary trinket."
    → drew a deserter's tale of plague and a strangely prized relic.  (+1 Intelligence)  {sets: relic_clue}
  Fail: "He grows wary of a stranger who asks so much and buys nothing, sweeps his loot back into the blanket, and tells you to spend or be gone. You learn nothing but the look of a man who has done worse things than desert his banner."
    → pressed a deserter too hard and was waved off his blanket.  (+1 Will)

#### market_fleeing_trader
*activity: Pick over the stalls, Work the back row · weeks 5–7 · weight 3*
Setup: "A trader is selling everything he owns at any price offered, his wagon already pointed at the docks. He has more grain in his store than he can carry, and a berth bought on a ship that sails while ships still sail. He looks at your foreign face and lowers his voice."
Choice:
  • [Buy his grain to share out in the lanes]
    "You take the lot at a fleeing man's price and spend the evening measuring it into the hollow-cheeked queue at your door. Your purse is gutted and your arms ache to the bone, but a hundred souls will wake tomorrow who might not have."
    → bought a fleeing trader's grain and shared it through the starving lanes.  (+2 Will, -2 Wealth)  {sets: forage_secured}
  • [Buy his ship's berth instead]
    "You let the grain rot where it sits and buy the berth out from under him, coin for a name on a manifest. He curses you to your face and you find you do not care. Whatever fate this town is owed, a place on a sailing ship will be no part of it."
    → bought a fleeing trader's berth and secured their own escape.  (-1 Wealth)  {sets: passage_secured}

#### market_bare_stalls
*activity: Pick over the stalls, Work the back row · weeks 6–7 · weight 4*
Setup: "There is no market now, only the memory of one: trestles overturned, a few wretches gnawing at things that were never food, and a smell hanging over it all that is not the smell of bread. A starving man offers you a fat dog on a rope, and will not say where the fat came from."
Hidden check: Will 6
  Pass: "You turn from the dog, and the man, and the thing you both know it has been fed on, and you keep your wits and your stomach together. In the wreck of a fishmonger's stall you turn up a forgotten cask of salt fish, enough to keep your own people breathing a few more days."
    → kept their nerve in the dead market and salvaged a cask of salt fish.  (+1 Will, +1 Intelligence)
  Fail: "Hunger argues louder than sense, and you take the dog. You do not ask a second time where the fat came from; some part of you already knows. The meat sits ill in you, and so does the bargain, long after the bowl is wiped clean."
    → took a starving man's dog in the dead market and asked no questions.  (+1 Strength, -1 Will)

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
    → salvaged a wagon of sound grain from the blighted fields.  (+1 Strength, +1 Wealth)  {sets: forage_secured}
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
    → filled and squared the town granary against the hunger to come.  (+1 Intelligence, +1 Will)  {sets: granary_filled}
  Fail: "The figures swim and the sacks blur, and somewhere in the dark you miscount a bin and leave the rot to spread unseen beneath the good. The reeve finds the spoilage at dawn and takes the keys back without a word, and a portion of the town's bread is lost before the hunger has even begun."
    → fumbled the granary count and let good grain spoil.  (+1 Craft)

#### farms_empty_lanes
*activity: Watch the Outer Roads · weeks 2–4 · weight 2*
Setup: "You walk the outer lanes where the carriers' carts used to rattle by daily. The road is silent now, the verges grown wild, and on the far hills a single thread of smoke stands where a village ought to be. The country is emptying, and it is emptying toward you."
Hidden check: Intelligence 4
  Pass: "You read the road the way a tracker reads a wood: ruts gone cold, milestones unswept, a child's shoe left in the ditch with no child anywhere near it. Whatever drove these people off is coming this way, and you mark the pace of it days before the town will let itself believe you."
    → read the empty roads and guessed the ruin coming toward St Sebastian.  (+1 Intelligence, +1 Will)  {sets: watching_the_roads}
  Fail: "You walk a long way and learn little that a frightened farmer could not have told you: the roads are empty, the smoke is real. You turn back at dusk no wiser than you set out, the dread sitting heavy in you with no shape you can give it and no name."
    → walked the empty roads and came back with only dread.  (+1 Will)

#### farms_take_the_scout
*activity: Watch the Outer Roads · weeks 3–6 · weight 2*
**Requires:** watching_the_roads
Setup: "A lone rider keeps to the treeline at the field's edge, counting the town's walls and gates with a soldier's eye, then wheeling his horse to ride back the way he came. A scout, plainly, for something far larger behind him. He has not yet seen you crouched low in the stubble."
Hidden check: Agility 6
  Pass: "You take him out of the saddle in the high barley before he can cry out, a knee on his chest and his own knife at his throat. He is half-starved under his mail, and terrified, and you have him bound and dragged to the byre before the light fails. He will talk."
    → ran down the warband's scout and took him alive.  (+1 Agility, +1 Strength)  {sets: scout_taken}
  Fail: "Your boot finds a dry furrow and the crack of it turns his head; he is spurring away before you have cleared the rows, low over the horse's neck and gone into the dusk. He knows the town keeps watch now, and worse, you know for certain the town is being watched."
    → lost the scout in the dusk and learned the town is being watched.  (+1 Agility)

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
    → forged the farmhands into an armed militia for the walls.  (+1 Craft, +1 Will)  {sets: militia_armed}
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
    "You break out the bread you laboured to store and the column falls upon it weeping into the dirt. The reeve does not stop you; perhaps he no longer can. You have spent the town's hard margin in one afternoon of mercy, and the lean weeks just grew leaner, but no child died at your locked door today."
    → opened the stores and fed the starving at the town's own cost.  (+2 Will, -1 Wealth)  {sets: fed_the_refugees}

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
- **Petition at the gate** — Stand before the portcullis and beg the lord an audience while there is still time to be heard.
- **Work the muster yard** — The garrison drills and the walls want mending. Idle hands are watched here, and remembered.
- **Slip into the lower halls** — Beneath the keep lie the lord's records, and the things he keeps from the light.

**Events**

#### castle_turned_away
*activity: Petition at the gate · weeks 1–3 · weight 3*
**Forbids:** castle_lord_audience, met_steward
Setup: "You give your name at the gate and the guards weigh your foreign cloth and your foreign face and find nothing in either worth raising the bar for. The town at your back sleeps. The smoke on the horizon is a rumour the castle has not yet chosen to believe."
Outcome: "You pass the evening on the cold side of the portcullis, learning only that the castle is very practised at saying no, and means to keep saying it until the screaming starts."
    → was turned away at the castle gate, none the wiser.  (+1 Will)

#### castle_lord_audience
*activity: Petition at the gate · weeks 2–5 · weight 5*
**Requires:** met_steward
**Forbids:** castle_lord_audience
Setup: "You give the steward's name and the gate grinds open at last. The hall is warm and the lord is unafraid; he has heard the whispers of distant ruin and judged them a beggar's lie told for a seat at his table. You have one breath to make him believe what is coming."
Hidden check: Will 5
  Pass: "You speak of the smoke, the silent roads, the dying you stepped over on the crossing, and you do not flinch from his contempt. Something in your certainty reaches him under the scorn. He does not thank you, but he names you to the steward as one to be heard again."
    → won the lord's ear and a standing welcome past the gate.  (+1 Will, +1 Intelligence)  {sets: castle_lord_audience}
  Fail: "The lord laughs you down before you are half done. Foreigners always arrive with an end of the world tucked under one arm, he says, the better to be fed. The steward walks you out, and does not look away when you speak of the dead."
    → was laughed out of the lord's hall but left a doubt behind.  (+1 Intelligence)  {sets: castle_lord_audience}

#### castle_rally_garrison
*activity: Petition at the gate, Work the muster yard · weeks 3–6 · weight 4*
**Requires:** castle_lord_audience
**Forbids:** garrison_rallied
Setup: "The lord will not stir, but the captain of the guard has seen what idle men become when fear arrives unled. Low, away from his master's hearing, he asks whether you will help him put backbone into a garrison that has not drawn steel in earnest in twenty years."
Hidden check: Strength 5
  Pass: "You drill at the captain's shoulder until the soft ones harden and the frightened ones find their feet. By week's end the garrison answers a horn instead of scattering at one. If the town is to be held, these are the hands that will hold it."
    → helped the captain forge a garrison fit to hold the walls.  (+1 Strength, +1 Will)  {sets: garrison_rallied}
  Fail: "Half the muster melts away the moment the captain turns his back, and you cannot be everywhere at once. You harden the few who stayed, but the captain looks at the thinning yard and you both reckon, silently, what that emptiness will cost when the warband comes."
    → could only steady a handful before the rest of the garrison drifted off.  (+1 Will)

#### castle_mend_walls
*activity: Work the muster yard · weeks 2–6 · weight 3*
**Forbids:** walls_repaired
Setup: "The old curtain wall is sound in the songs and rotten in fact: a breach above the postern stopped with brush and prayer, the mortar gone to sand. The mason is three weeks dead of the flux and his apprentices are children. What gets mended now, you mend."
Hidden check: Craft 5
  Pass: "You scaffold the breach and lay stone honestly, course on course, until the wall above the postern would turn a battering-ram. The captain walks the parapet, leans his whole weight against your work, and says nothing — which, from him, is a hymn of praise."
    → closed the breach in the curtain wall with honest stone.  (+1 Craft, +1 Strength)  {sets: walls_repaired}
  Fail: "You patch what you can reach before the light fails, and the bad mortar beats the rest. The breach is narrower than it was, but a determined man could still worm through it by dark — and determined men are precisely what is grinding toward the gate."
    → narrowed the breach but could not close it before dark.  (+1 Craft)

#### castle_bar_the_gate
*activity: Work the muster yard, Petition at the gate · weeks 5–7 · weight 4*
**Requires:** garrison_rallied
**Forbids:** gate_secured
Setup: "With the garrison standing to, the captain turns to the great gate itself. The portcullis chain is fouled, the drawbar split, and refugees crowd the approach so thick the iron could never drop clean in a rush. It must be made to shut, and shut fast, before the horsemen reach it."
Hidden check: Craft 6
  Pass: "You free the chain, fit a new oak drawbar, and rig the counterweights so the portcullis falls in a single heartbeat. When the captain tests it the iron comes down like a headsman's stroke and the crowd recoils from its shadow. The gate will answer now, the night it is asked."
    → set the great gate to fall fast and hold against the warband.  (+1 Craft, +1 Will)  {sets: gate_secured}
  Fail: "You clear the chain, but the new drawbar warps green and the counterweights catch. The gate will close, given men and minutes — neither of which a sudden assault will grant. The captain marks the fault, says nothing, and prays the warband is slow on the road."
    → got the gate working but not quick enough to trust.  (+1 Craft)

#### castle_vault_glimpse
*activity: Slip into the lower halls · weeks 2–6 · weight 3*
**Requires:** met_steward
**Forbids:** castle_vault_access
Setup: "The steward, harried and grey before his time, needs a quiet pair of hands in the lower halls and takes the Church's word on yours. He gives you a lamp and a key to the muniment room, where the lord keeps the deeds and reckonings of three hundred years — and one cabinet he tells you, flatly, never to open."
Outcome: "You sort the lord's papers by lamplight and let your eye drift, as the red-eyed thing on the crossing surely meant you to. The locked cabinet pulls at you. You note its iron, its hinges, the hour the steward climbs the stair to bed. You will come back when no one is counting heads."
    → won the run of the lord's muniment room and marked the cabinet none may open.  (+1 Intelligence, +1 Craft)  {sets: castle_vault_access}

#### castle_vault_records
*activity: Slip into the lower halls · weeks 3–7 · weight 3*
**Requires:** castle_vault_access
**Forbids:** relic_clue
Setup: "You come back to the muniment room in the dead hour and stand before the cabinet the steward forbade. The lock is old and proud, and the thing it guards has waited longer than the lord's line has held the keep. In the dark behind your eyes, the patron's red gaze seems to lean very close."
Hidden check: Intelligence 6
  Pass: "The lock yields and the cabinet gives up a sheaf of vellum older than the keep itself: a reckoning not of grain but of something buried beneath St Sebastian when the town was young, and the rite by which the founders kept it sleeping. This is what the eyes sent you here to find."
    → prised open the lord's secret cabinet and found the record of the thing beneath the town.  (+2 Intelligence)  {sets: relic_clue}
  Fail: "The lock holds, the lamp gutters, and a guard's tread on the stair drops you flat behind the shelving with your heart slamming against the boards. You leave knowing the shape of the secret without its substance: that the lord guards a thing the founders feared, and that fear has a smell, even on dry vellum centuries cold."
    → failed the cabinet's lock but caught the scent of what it hides.  (+1 Intelligence)

#### castle_steward_doubts
*activity: Slip into the lower halls, Petition at the gate · weeks 4–7 · weight 3*
**Requires:** relic_clue
**Forbids:** herald_favour
Setup: "The steward finds you with the founders' vellum spread before you and does not call the guard. He has read it himself, years past, and never managed to forget it. Quietly, he asks whether the foreigners' red-eyed dream and the thing beneath the town are one and the same — and whether anything at all can be done before the world ends at the gate."
Hidden check: Intelligence 6
  Pass: "You set the founders' rite beside what the eyes told you on the crossing, and the two halves close like a broken seal made whole. The steward goes white, then resolute, and pledges you the run of the keep and his silence with it. Somewhere far off, you feel the patron's regard settle on you like a cold hand at the nape."
    → matched the founders' rite to the Herald's vision and won the steward's secret aid.  (+1 Intelligence, +1 Will)  {sets: herald_favour, secret_found}
  Fail: "You cannot force the pieces to meet, not yet, and the steward's hope curdles to caution before your eyes. He folds the vellum back into his sleeve and bids you breathe no word of it to anyone, least of all the lord — who has lately begun to laugh at things that are not funny."
    → could not yet read the founders' rite and was sworn to silence.  (+1 Intelligence)

#### castle_lord_descends
*activity: Petition at the gate, Slip into the lower halls · weeks 6–7 · weight 4*
**Requires:** castle_lord_audience
Setup: "The lord has gone mad behind his walls. With the warband on the horizon and the dead piling in the streets, he has thrown his cellars open to a chosen few and barred them to the rest — and what turns on the spit in the great hall is not the venison the steward names it. He sends for you by name: sit at my table, foreigner, and you'll not be served upon it."
Choice:
  • [Take your place at the lord's table]
    "You sit, and you eat, and you do not ask. The lord laughs and calls you kin, and pledges you a place on the boat his men keep at the quay against the end of all things. Whatever crawls up from beneath the town tonight, you have chosen the side that means to outlast it."
    → sat at the lord's cannibal table and bought a place on his boat.  (+1 Wealth, -1 Will)  {sets: turned_to_darkness, passage_secured}
  • [Turn the captain against the lord]
    "You carry what you saw to the captain and the steward both, and between the three of you the mad lord is put under guard in his own befouled hall before he can do worse. It costs you blood and two of the captain's men, and the keep is yours to defend now — leaderless, lit by a burning hall, but human still."
    → broke the lord's mad feast and took the leaderless keep for the living.  (+2 Will, +1 Strength)  {sets: garrison_rallied}

#### castle_last_stand
*activity: Work the muster yard, Petition at the gate · weeks 7–7 · weight 4*
**Requires:** garrison_rallied, gate_secured
Setup: "The warband breaks against the wall: a tide of dying men with nothing left to lose and a fury in their ruined faces that frightens even the captain. But the gate is barred fast, the breach is stone, and the garrison stands where you taught them to stand. This is the night everything you mended is asked the one question that has ever mattered."
Hidden check: Strength 7
  Pass: "They dash themselves on St Sebastian like the sea on a cliff. The fast gate drops on the first rush; the mended wall turns the second; the rallied garrison holds the third until there is no fourth left to throw. By dawn the warband is carrion in the ditch and the town at your back still breathes. You did this."
    → held the wall through the warband's last assault and saved the town.  (+1 Strength, +2 Will)  {sets: town_held}
  Fail: "You hold — but it takes everything. The gate jams half-down, men you trained die in the gap, and you fight in the breach by torchlight until your arms hang like lead and the stone runs slick beneath your boots. The warband is thrown back at the last, but the grey dawn shows you faces among the dead you knew by name."
    → threw back the warband at the wall, but the cost was carved into the dawn.  (+2 Will)

---

### The Slums
*Where the sickness strikes first and the desperate gather.*

**Activities**
- **Tend the wall-side families** — Bring water, splint a limb, sit with the sick the rest of the town won't touch.
- **Walk the lanes** — The crowded ways hear of every death and every grudge before the bailiff does.
- **Stand with the bailiff's watch** — One failing man and a few cudgels against a quarter that is coming apart.

**Events**

#### slums_first_night
*activity: Tend the wall-side families, Walk the lanes · weeks 1–2 · weight 3*
Setup: "The wall-side families take you for what you are at a glance: another mouth blown in off the sea with nothing. Still, a woman with a swollen ankle lets you near enough to bind it, and her neighbours stop pretending not to watch."
Outcome: "You splint the ankle with a barrel-stave and a strip of your own shirt. It is poor work and it holds. By dark you have a corner out of the wind and the wary half-trust of people who own nothing worth the stealing."
    → won a foothold among the wall-side poor by binding a stranger's ankle.  (+1 Craft, +1 Will)  {sets: slums_trusted}

#### slums_bailiff_failing
*activity: Stand with the bailiff's watch, Walk the lanes · weeks 1–4 · weight 3*
Setup: "The bailiff is a heavy, frightened man with too few cudgels and too much quarter to hold. He is hauling a thief off a bread-cart while three more empty it behind his back. He sees you see it, and something in him sags."
Hidden check: Strength 4
  Pass: "You wade in, crack two heads together, and put your back to the cart until the rest scatter into the lanes. The bailiff looks at you the way a drowning man looks at a thrown rope, and tells you his name as though it were a confession."
    → saved the bailiff's bread-cart and earned a drowning man's gratitude.  (+1 Strength, +1 Will)  {sets: slums_bailiff_broken}
  Fail: "You grab for a wrist and a fist finds your mouth, and by the time you have your feet under you the cart is bare boards. The bailiff helps you up out of the muck. We are losing this, he says quietly, as though you had not noticed."
    → lost the bread-cart with the bailiff and tasted how far gone the quarter is.  (+1 Will)  {sets: slums_bailiff_broken}

#### slums_red_eyes_alley
*activity: Walk the lanes · weeks 1–3 · weight 2*
Setup: "Down a lane too narrow for two abreast, a beggar with a clouded eye grips your sleeve and will not let go. He says he has seen them too, the red eyes, watching the wall-side from the dark and waiting to see what you will do with these people. He asks if you are the one come to save them, or to sell them."
Outcome: "You give him no answer, for you have none. He laughs, a wet rattling thing, and tells you the patron's hidden things lie where the sickness will dig them up, and that you will know the place by its stink. Then he is only a beggar again, holding out his hand for bread."
    → was named by a beggar who has also seen the red eyes in the dark.  (+1 Intelligence, +1 Will)  {sets: slums_omen_heard}

#### slums_first_blood
*activity: Tend the wall-side families · weeks 5–7 · weight 4*
Setup: "A carter's boy lies on a pallet of rags, and his nose has bled since noon and will not stop. There is blood at the corners of his eyes now too, a thin red weeping, and his mother prays to a saint who has plainly stopped his ears. No one in the lane has seen the like. You have heard what it means."
Hidden check: Will 5
  Pass: "You do not run. You wash the blood away as fast as it comes, hold the others back at the threshold, and stay until the small breaths stop near dawn. You have seen the first of it now, plainly, with your own eyes, and you know in your gut it will not be the last."
    → sat with the first plague death in the lanes and did not look away.  (+2 Will)  {sets: slums_plague_seen}
  Fail: "Your nerve goes before the boy does. You back out into the lane and stand shaking against the wall while his mother wails behind you. You have seen what is coming for them all, and the seeing has emptied something out of you that will not soon fill again."
    → fled the lanes' first plague death with the screaming still in their ears.  (+1 Intelligence)  {sets: slums_plague_seen}

#### slums_trace_the_fever
*activity: Walk the lanes, Tend the wall-side families · weeks 5–7 · weight 3*
**Requires:** slums_plague_seen
Setup: "Every house that has buried someone backs onto the same fouled ditch at the foot of the wall, where the lane's filth and a black, sweet-rotten standing water meet. The beggar said you would know the place by its stink. You know it now."
Hidden check: Intelligence 5
  Pass: "You walk the deaths back one by one and they all run to the ditch like rain downhill. Something lies buried in that muck the patron wants found, and whatever it is kills the poor first and nearest. You mark the spot in your mind and tell no one yet."
    → traced every plague death to the fouled ditch beneath the wall.  (+1 Intelligence, +1 Will)  {sets: slums_fever_traced}
  Fail: "You half-see the shape of it and then lose it in the sheer crush of the dying. There are too many now to count cleanly, and the ditch keeps its secret a while longer while you go on burying your dead."
    → groped after the plague's source and lost the thread among the dead.  (+1 Will)

#### slums_seal_the_lane
*activity: Tend the wall-side families, Stand with the bailiff's watch · weeks 6–7 · weight 4*
**Requires:** slums_fever_traced
Setup: "You have the source now: the ditch, and a thing rotting in it that has no business there. The sickness creeps from the wall-side outward, lane by lane. You can dam the ditch, drag the stricken houses behind a rope, and seal this quarter off from the rest of St Sebastian. But the families behind the rope will know they have been shut in to die together."
Choice:
  • [Seal the quarter and dam the source]
    "You drive stakes, sling a rope, and tell the wall-side families the plain truth: the rest of the town lives only if they stay inside it. Most of them do. You dam the black ditch and dig out what fouls it, and beneath the muck your fingers close on something cold and carved that the patron has wanted from the first."
    → sealed the plague quarter, dammed the source, and pulled the patron's relic from the muck.  (+1 Will, +1 Craft)  {sets: quarantine_set, plague_source_found, relic_clue}
  • [Leave the rope coiled and let them scatter]
    "You cannot bring yourself to fence the dying in to die. The rope stays coiled in your hands and the wall-side families scatter into the town with the sickness riding on them. You learn the source too late for it to matter, and what is buried there stays buried in the dark."
    → refused to seal the lanes and let the plague run loose into St Sebastian.  (+1 Will)  {sets: plague_source_found}

#### slums_bailiff_recruits
*activity: Stand with the bailiff's watch · weeks 5–7 · weight 3*
**Requires:** slums_bailiff_broken
Setup: "The bailiff cannot hold the quarter with cudgels and prayer. He has coin from somewhere and a notion that the wall-side men, hard and desperate and with nothing left to lose, would arm well if one they trusted asked it of them. He looks at you. They will follow you, he says, where they will never follow me."
Hidden check: Will 5
  Pass: "You go door to door and put the case plain: take up arms now, or be butchered for the last of your bread when the worst comes down the road. By dusk you have two score men with billhooks and fish-knives drilling badly in a dead market square. It is no garrison. It will have to serve."
    → raised an armed militia from the wall-side men the bailiff could not reach.  (+1 Will, +1 Strength)  {sets: militia_armed}
  Fail: "Too many doors stay barred. The men are too sick, too frightened, or too far past caring to take up arms for a town that never spared them a crust. You raise a ragged handful and know in your bones it is not enough for what is coming."
    → tried to arm the wall-side men and raised only a frightened handful.  (+1 Will)

#### slums_the_mob
*activity: Walk the lanes, Stand with the bailiff's watch · weeks 6–7 · weight 4*
Setup: "Hunger and fever have finished what fear began. A mob has gathered in the wall-side dark, torches and cleavers, and they mean to break the few houses still holding food and take it, and to drag out the sick and put the quarter to the torch the clean way, the way you burn a plague ship at anchor. They have seen you stand with the bailiff. They want to know whose side you are on, and there is no third answer they will take."
Choice:
  • [Lead them, take the food, burn the sick out]
    "You put yourself at the front and let the worst of it off the leash. You break the hoarders' doors and haul the grain into the street, and when the torches go to the fever-houses you do not stay their hands. The screaming does not last long. By morning you are fed, and feared, and something in you has gone as cold and red as the eyes that watch from the dark."
    → led the mob, seized the food, and burned the plague-sick out of their homes.  (+1 Strength, +1 Wealth, -1 Will)  {sets: turned_to_darkness, hoarders_broken}
  • [Stand in the lane's mouth and turn them back]
    "You plant yourself in the lane's mouth with the bailiff at your shoulder and will not be moved. You take a cleaver's edge across the arm and a thrown cobble to the brow, but you talk and you bleed and you shame them until the torches gutter and the worst of them slink home. The sick keep another night. So, barely, do you."
    → stood alone against the mob and turned them back from the fever-houses, bleeding.  (+2 Will)  {sets: slums_held_the_line}

#### slums_burn_the_dead
*activity: Tend the wall-side families, Stand with the bailiff's watch · weeks 6–7 · weight 3*
**Requires:** quarantine_set
Setup: "Behind the rope the dead are past the counting, and the ground at the wall's foot is too hard and too shallow to take so many. The pit you dug yesterday is already full and brimming. The bailiff says the thing no one will say first: they must be burned, all of them, tonight, or the living behind the rope are next into the pit."
Outcome: "You build the fire with your own hands and you tend it through the long night, naming each one you can as the flames take them, because someone should. The smoke hangs over the wall-side until dawn, and the whole town wakes to the smell of it and knows. It is the worst thing your hands have ever done, and it saves the few lanes that are left."
    → burned the plague-dead through the night so the living behind the rope might last.  (+1 Will, +1 Strength)  {sets: dead_burned}

#### slums_last_offer
*activity: Walk the lanes, Tend the wall-side families · weeks 6–7 · weight 3*
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
- **Walk the crowded quay** — Where the gangplanks groan, the desperate gather, and the last hulls still take coin for a place at the rail.
- **Meet the incoming boats** — Every tide lands more refugees, and more of them carried ashore already burning.
- **Work the torchlit wharf** — A nameless hull, an unlisted shift, grain and worse run ashore in the dark.
- **Deal with the harbourmaster** — He keeps the tally of every keel, and knows which ones should never have docked.

**Events**

#### docks_first_footing
*activity: Walk the crowded quay · weeks 1–2 · weight 3*
Setup: "This is the very stone you stepped onto off the boat — foreign and friendless, the red-eyed thing's words still ringing behind your teeth. The harbour is loud and blind to all of it: gulls, ropes, the ordinary clamour of a town that does not yet know it is already dead."
Outcome: "You find your land-legs in the press and let no man read your face. Better they take you for one more sea-sick stranger than for the thing the vision named you. You learn the shape of the quay — which gates, which hulls, which way out if it comes to running. It will."
    → got their footing on St Sebastian's quay and marked every way out.  (+1 Agility, +1 Will)

#### docks_news_from_sea
*activity: Walk the crowded quay, Meet the incoming boats · weeks 3–7 · weight 3*
Setup: "A coaster limps in undercrewed, her master grey as ash and her rail scorched black. Once he starts he cannot stop: ports burned to the waterline down the coast, and a column of armed and dying men coming overland behind the smoke, taking what the plague has not. The quay pretends not to hear. You hang on every word."
Hidden check: Intelligence 4
  Pass: "You sift the panic from the substance — their road, their pace, the rivers they must ford. By the time he is hauled off to drink himself quiet, you know roughly when the warband reaches St Sebastian's walls, and from which side. Knowledge the castle would pay dearly for, if the castle would only listen."
    → wrung the warband's road and pace out of a burned-out ship's master.  (+1 Intelligence, +1 Will)  {sets: warband_sighted}
  Fail: "He raves faster than you can hold, looping fire and corpses and the names of dead ports until it is all one long howl. You catch the shape of it — something terrible, coming, soon — but never the when or the where. Cold comfort, and cold all the way down."
    → heard a ruined sailor's warning but could not pin the warband down.  (+1 Will)  {sets: warband_sighted}

#### docks_grain_contact
*activity: Work the torchlit wharf, Walk the crowded quay · weeks 3–7 · weight 2*
Setup: "A hard woman with a riverman's hands works a corner where no torch reaches. She has grain, she says low — real grain, sacks of it, run past the harbourmaster's tally off a hull that was never here. The town will starve before the month is out, and she sells only to those who can keep a shut mouth."
Hidden check: Will 4
  Pass: "You meet her eye and give nothing away, and she decides you'll do. She'll find you again, she says, when there is a real run to make. Remember the corner. Forget her face."
    → won a smuggler's trust and a road to grain the town will soon kill for.  (+1 Will, +1 Intelligence)  {sets: grain_contact}
  Fail: "You ask one question too many and her hand drifts to something under her coat. She melts back into the black between the warehouses and is simply gone, grain and all. The corner is empty stone when you look again."
    → spooked a grain smuggler and lost the corner.  (+1 Agility)

#### docks_run_the_grain
*activity: Work the torchlit wharf · weeks 4–7 · weight 3*
**Requires:** grain_contact
Setup: "The smuggler-woman is good to her word. A low hull waits on the black tide, holds heavy with grain the harbourmaster's ledger swears does not exist. She needs strong backs and silent ones to land it before the tide and the watch both turn. In the lanes above, the town is already going to bed hungry."
Hidden check: Strength 5
  Pass: "You haul sack after sack up the slick boards in the hooded lamplight, lungs afire, saying nothing. By the turn of the tide a winter's worth of grain lies hidden above the high-water line — enough to keep bread in St Sebastian when the markets go to bare boards. No ledger will ever know it landed."
    → ran a hull of smuggled grain ashore to feed the town in secret.  (+1 Strength, +1 Wealth)  {sets: forage_secured}
  Fail: "A sack splits on the boards and the rest comes too slow; the tide turns against you and a watch-lantern swings down the quay. You save perhaps half before the hull must slip its line and run for open water. Half is better than starving — but it is only half, and you will count it again come the hungry weeks."
    → saved half a smuggled grain run before the tide and the watch closed in.  (+1 Will)  {sets: forage_secured}

#### docks_harbourmaster_tally
*activity: Deal with the harbourmaster · weight 2*
Setup: "The harbourmaster sits in his draughty counting-house, a ledger of every keel open before him and a settled squint of suspicion for foreigners. He will trade words with you — but he weighs each one, and a stranger off a refugee boat has a deal of weighing to live through."
Hidden check: Intelligence 5
  Pass: "You answer his questions before he can put them, and show a head for tallies and tides that a counting-man respects in spite of himself. By the end he lets slip which hulls he trusts, which he watches, and which one he has never once been able to explain. A wary sort of friend, kept behind the ledger."
    → won the harbourmaster's wary trust across his own ledger.  (+1 Intelligence, +1 Will)  {sets: harbourmaster_trust}
  Fail: "He catches you stumbling over a tide-table no honest sailor would muddle, and the squint hardens to flint. He gives you nothing but the door and a long look that promises he will remember your foreign face the next time something goes missing off his quay."
    → failed the harbourmaster's scrutiny and earned his suspicion.  (+1 Will)

#### docks_unexplained_hull
*activity: Deal with the harbourmaster, Walk the crowded quay · weight 2*
**Requires:** harbourmaster_trust
Setup: "The harbourmaster draws you aside, uneasy as a man at a graveside. There is a hull in his ledger he cannot account for — came in years back, never left, manifest sealed under the lord's own mark. The crew that brought her are dead or long scattered. Whatever she carried into St Sebastian, he says, it never came off as cargo. The red eyes of your vision spoke of secret things this town keeps buried. Something in you goes very still."
Outcome: "He lets you read the sealed entry by lamplight. A name, a date, a weight no honest freight would match, and the lord's mark pressed deep enough to scar the page. Whatever your patron wants hidden in this town, its trail begins here — the first true thread of the secret you were sent to pull. You commit it to memory and let him seal the book again."
    → found the first thread of the town's buried secret in the harbour ledger.  (+1 Intelligence, +1 Will)  {sets: relic_clue}

#### docks_fever_off_the_boats
*activity: Meet the incoming boats · weeks 4–7 · weight 3*
Setup: "A skiff grinds onto the shingle packed with refugees, and three of them are past walking — slack-faced, shuddering, dark trickles dried at the corners of their eyes. The boatman wants them off his deck and gone. The other refugees press back from them as from open graves. No one will lay a hand on the sick ones."
Choice:
  • [Carry the sick ashore yourself]
    "You take them up under the arms, one by one, their fever soaking hot through your sleeves, and lay them where the air runs clean. It is, almost certainly, how the plague gets in past the gate. You do it anyway, because no one else will, and because the red-eyed thing never promised it would be easy to be good."
    → carried the dying off the boats with their own hands when no one else would.  (+2 Will, +1 Strength)  {sets: carried_the_sick}
  • [Force the boat to put back out]
    "You and a few hard men shove the skiff off the shingle with poles — the sick still aboard, the boatman cursing, the well refugees screaming to be let land. They drift back into the dark with the dying. You have kept the fever off St Sebastian's stones tonight, by condemning a boatful of strangers to the cold water. The eyes in your memory do not blink."
    → shoved a fever-boat back out to sea with the dying still aboard.  (+1 Will, +1 Wealth)  {sets: turned_to_darkness}

#### docks_refugee_mother
*activity: Meet the incoming boats, Walk the crowded quay · weeks 5–7 · weight 2*
**Requires:** carried_the_sick
Setup: "A woman who watched you carry her fevered husband up off the shingle finds you again on the quay. He died in the night — but he died ashore, in clean air, not on a boatman's deck, and she has not forgotten it. She presses something into your hand: a small sea-worn token, all she owns, and word that the refugees on the strand will do you a kindness if ever you need one."
Outcome: "You try to give the token back and she folds your fingers shut over it. Among the desperate on the strand, your name has quietly become one of the good ones — and in the weeks bearing down on this town, that may yet be worth more than coin or steel."
    → earned the refugees' trust for a mercy shown at the boats.  (+1 Will, +1 Intelligence)  {sets: refugees_trust}

#### docks_grasping_captain
*activity: Walk the crowded quay · weeks 5–6 · weight 2*
Setup: "A captain with a sound hull and a rotten soul is filling his hold with paying flesh while the prices are good and the panic still young. He will sell you a berth out now, ahead of the crush, for a year's wage — and he murmurs that for a little more, he could quietly strike a sick family from his list to make room for a healthy one."
Choice:
  • [Pay the extra to bump the sick aside]
    "Coin changes hands twice. A coughing family is scratched off his manifest with one stroke of the quill and ushered back down the gangplank into the throng, and your name goes on in their place, healthy and high on the list. You do not watch them go. You have your ship; let the town keep its mercy."
    → bought a sick family's berth out from under them for a place on the ship.  (-2 Wealth, +1 Agility)  {sets: passage_secured, turned_to_darkness}
  • [Buy an honest berth and leave the list be]
    "You pay the year's wage for your own place and nothing more, and tell him to leave the sick family standing where they are. He shrugs — coin is coin, by whatever name. You have your way off St Sebastian when the end comes, and you did not climb over anyone to take it."
    → bought an honest berth on the ship and left the sick their place.  (-1 Wealth, +1 Will)  {sets: passage_secured}
  • [Refuse him and walk away]
    "You leave his coin where it lies and his gangplank at your back. Whatever ship carries you out of this — if any ship does — it will not be his, and it will not be bought across the spines of the dying. The quay is loud and cold, and you have made it a shade colder for one grasping man."
    → turned down a grasping captain's berth and his cruelty both.  (+1 Will)

#### docks_last_ship
*activity: Walk the crowded quay · weeks 6–7 · weight 4*
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

- **carried_the_sick**
    · set by: docks_fever_off_the_boats
    · needed by: docks_refugee_mother
- **castle_lord_audience**
    · set by: castle_lord_audience
    · needed by: castle_rally_garrison, castle_lord_descends
    · blocks: castle_turned_away, castle_lord_audience
- **castle_vault_access**
    · set by: castle_vault_glimpse
    · needed by: castle_vault_records
    · blocks: castle_vault_glimpse
- **church_warned**
    · set by: church_wrath_sermon
    · (earned but nothing uses it yet — room for a follow-on event)
- **dead_burned**
    · set by: church_burn_the_dead, slums_burn_the_dead
    · (earned but nothing uses it yet — room for a follow-on event)
- **factor_marked**
    · set by: market_factor_courted
    · needed by: market_open_the_granary
- **farmhands_trusted**
    · set by: farms_byre_grievance
    · needed by: farms_arm_the_hands
- **fed_the_refugees**
    · set by: farms_refugees_at_the_gate
    · (earned but nothing uses it yet — room for a follow-on event)
- **forage_secured**
    · set by: market_forage_party, market_fleeing_trader, farms_blighted_harvest, docks_run_the_grain
    · needed by: farms_fill_the_granary
- **garrison_rallied**
    · set by: tavern_rally_garrison, castle_rally_garrison, castle_lord_descends
    · needed by: castle_bar_the_gate, castle_last_stand
    · blocks: castle_rally_garrison
- **gate_secured**
    · set by: castle_bar_the_gate
    · needed by: castle_last_stand
    · blocks: castle_bar_the_gate
- **grain_contact**
    · set by: docks_grain_contact
    · needed by: docks_run_the_grain
- **granary_filled**
    · set by: market_open_the_granary, farms_fill_the_granary
    · needed by: farms_refugees_at_the_gate
- **harbourmaster_trust**
    · set by: docks_harbourmaster_tally
    · needed by: docks_unexplained_hull
- **healers_organized**
    · set by: church_organise_healers
    · (earned but nothing uses it yet — room for a follow-on event)
- **herald_favour**
    · set by: castle_steward_doubts, church_red_eyes_speak
    · blocks: castle_steward_doubts
- **hoard_located**
    · set by: market_locate_the_hoard
    · needed by: market_break_the_hoarders
- **hoarders_broken**
    · set by: market_break_the_hoarders, slums_the_mob
    · (earned but nothing uses it yet — room for a follow-on event)
- **innkeep_owes**
    · set by: tavern_panic_brawl
    · (earned but nothing uses it yet — room for a follow-on event)
- **knows_whats_coming**
    · set by: tavern_news_from_sea
    · (earned but nothing uses it yet — room for a follow-on event)
- **market_watched**
    · set by: market_thinning_rows
    · needed by: market_locate_the_hoard
- **met_sergeant**
    · set by: tavern_deserter_sergeant
    · needed by: tavern_rally_garrison
- **met_steward**
    · set by: tavern_lords_steward
    · needed by: castle_lord_audience, castle_vault_glimpse
    · blocks: castle_turned_away
- **militia_armed**
    · set by: tavern_arm_the_militia, farms_arm_the_hands, slums_bailiff_recruits
    · (earned but nothing uses it yet — room for a follow-on event)
- **noble_born**
    · set by: Fallen Noble (character)
    · (earned but nothing uses it yet — room for a follow-on event)
- **outsider**
    · set by: Far-Traveller (character)
    · (earned but nothing uses it yet — room for a follow-on event)
- **passage_secured**
    · set by: castle_lord_descends, church_sell_the_secret, market_fleeing_trader, slums_last_offer, docks_grasping_captain, docks_last_ship
    · (earned but nothing uses it yet — room for a follow-on event)
- **plague_source_found**
    · set by: slums_seal_the_lane
    · (earned but nothing uses it yet — room for a follow-on event)
- **priest_trusts**
    · set by: church_priest_counsel
    · needed by: church_organise_healers
- **quarantine_set**
    · set by: slums_seal_the_lane
    · needed by: slums_burn_the_dead
- **reeve_trusts_you**
    · set by: farms_reeve_count
    · needed by: farms_fill_the_granary
- **refugees_trust**
    · set by: docks_refugee_mother
    · (earned but nothing uses it yet — room for a follow-on event)
- **relic_clue**
    · set by: castle_vault_records, church_verger_rumour, market_deserters_loot, farms_scout_speaks, slums_seal_the_lane, docks_unexplained_hull
    · needed by: castle_steward_doubts, church_descend_crypt
    · blocks: castle_vault_records
- **scout_taken**
    · set by: farms_take_the_scout
    · needed by: farms_scout_speaks
- **secret_found**
    · set by: castle_steward_doubts, church_descend_crypt
    · needed by: church_red_eyes_speak, church_sell_the_secret
- **sellswords_courted**
    · set by: tavern_court_sellswords
    · needed by: tavern_arm_the_militia
- **slums_bailiff_broken**
    · set by: slums_bailiff_failing
    · needed by: slums_bailiff_recruits
- **slums_fever_traced**
    · set by: slums_trace_the_fever
    · needed by: slums_seal_the_lane
- **slums_held_the_line**
    · set by: slums_the_mob
    · needed by: slums_last_offer
- **slums_omen_heard**
    · set by: slums_red_eyes_alley
    · (earned but nothing uses it yet — room for a follow-on event)
- **slums_plague_seen**
    · set by: slums_first_blood
    · needed by: slums_trace_the_fever
- **slums_trusted**
    · set by: slums_first_night
    · (earned but nothing uses it yet — room for a follow-on event)
- **tavern_known**
    · set by: tavern_first_cup
    · (earned but nothing uses it yet — room for a follow-on event)
- **town_held**
    · set by: castle_last_stand
    · (earned but nothing uses it yet — room for a follow-on event)
- **town_roused**
    · set by: church_toll_the_warband
    · (earned but nothing uses it yet — room for a follow-on event)
- **turned_to_darkness**
    · set by: tavern_join_the_looters, castle_lord_descends, church_sell_the_secret, market_break_the_hoarders, farms_refugees_at_the_gate, slums_the_mob, docks_fever_off_the_boats, docks_grasping_captain
    · (earned but nothing uses it yet — room for a follow-on event)
- **walls_repaired**
    · set by: castle_mend_walls
    · blocks: castle_mend_walls
- **warband_sighted**
    · set by: farms_scout_speaks, farms_scouts_on_the_roads, docks_news_from_sea
    · needed by: farms_scouts_on_the_roads
- **watching_the_roads**
    · set by: farms_empty_lanes
    · needed by: farms_take_the_scout
