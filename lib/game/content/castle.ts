import type { LocationContent } from "./index";

/**
 * THE CASTLE — the payoff end of the cross-location chain. Meet the steward
 * at the tavern (sets `met_steward`) and the gate opens; arrive without him
 * and you're turned away. The audience then sets `lords_eye`, which unlocks
 * a deeper second event here — a same-location chain.
 */
export const castle: LocationContent = {
  activities: [
    {
      id: "castle_gate",
      location: "castle",
      name: "Approach the gate",
      blurb: "Present yourself to the guards and ask to be let in.",
    },
    {
      id: "castle_yard",
      location: "castle",
      name: "Loiter in the yard",
      blurb: "Hang about the practice yard and the kitchens, and watch.",
    },
  ],
  events: [
    {
      id: "turned_away",
      location: "castle",
      activities: ["castle_gate"],
      forbids: ["met_steward", "lords_eye"],
      weight: 3,
      text: "The gate guards look you up, look you down, and find nothing that needs letting in.",
      effect: {
        text: "You spend the evening on the cold side of the portcullis, learning only that the castle is very good at saying no.",
        outcome: "was turned away at the castle gate, none the wiser.",
        stats: { will: 1 },
      },
    },
    {
      id: "audience_with_lord",
      location: "castle",
      activities: ["castle_gate"],
      requires: ["met_steward"],
      forbids: ["lords_eye"],
      weight: 5,
      text: "You give the steward's name at the gate and the guards' manner changes entirely. Within the hour you are bowing in the great hall, and the lord is actually looking at you.",
      check: { stat: "will", dc: 4 },
      pass: {
        text: "You state your business plainly, without grovelling, and the lord — braced for flattery — leans in instead. He uses your name twice before you go. People at court notice whom the lord names.",
        outcome: "won an audience with the lord and left with the lord's eye upon them.",
        stats: { will: 1, intelligence: 1 },
        flags: ["lords_eye"],
      },
      fail: {
        text: "Nerves get the better of you and the words come out as flattery after all. The lord's attention drifts; the steward winces. Still — you stood in the hall, and that is more than most.",
        outcome: "got their audience with the lord but fumbled it into flattery.",
        stats: { intelligence: 1 },
        flags: ["lords_eye"],
      },
    },
    {
      id: "lords_commission",
      location: "castle",
      activities: ["castle_gate"],
      requires: ["lords_eye"],
      weight: 4,
      text: "The steward meets you at the gate himself. The lord, he says, has a matter for someone he can name — and he named you.",
      choices: [
        {
          label: "Take the lord's commission",
          effect: {
            text: "It is delicate, and it pays in coin and standing both. By fair day your name will be one the whole valley knows.",
            outcome: "took a commission from the lord's own hand.",
            stats: { wealth: 2, will: 1 },
            flags: ["lords_man"],
          },
        },
        {
          label: "Beg leave and keep your hands clean",
          effect: {
            text: "You bow out gracefully. The lord respects a person who knows their depth, and the steward slips you coin for the courtesy of not making a mess.",
            outcome: "politely declined the lord's commission and kept their hands clean.",
            stats: { wealth: 1, intelligence: 1 },
          },
        },
      ],
    },
    {
      id: "yard_training",
      location: "castle",
      activities: ["castle_yard"],
      weight: 2,
      text: "The garrison sergeant is drilling recruits and short a sparring partner. He jerks his chin at you: in or out?",
      check: { stat: "strength", dc: 5 },
      pass: {
        text: "You hold your own and then some. At the end the sergeant grunts, which the other soldiers swear is the highest honour the yard awards.",
        outcome: "sparred with the castle garrison and earned the sergeant's grunt of respect.",
        stats: { strength: 1, will: 1 },
        flags: ["garrison_respect"],
      },
      fail: {
        text: "You're flat on your back inside a minute, twice. But you get up both times, and the sergeant notes that too.",
        outcome: "got flattened in the castle yard but kept getting up.",
        stats: { will: 1 },
      },
    },
    {
      id: "kitchen_gossip",
      location: "castle",
      activities: ["castle_yard"],
      text: "The castle kitchens never sleep in fair week. A scullion trades you a hot pie for news of the village, and talks the whole while.",
      effect: {
        text: "By the time the pie's gone you know the fair's tax terms a full day before the village will — and exactly which guard takes coin to look away.",
        outcome: "traded village gossip for a pie and the castle's own secrets.",
        stats: { intelligence: 1 },
        flags: ["knows_the_tax"],
      },
    },
  ],
};
