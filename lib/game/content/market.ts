import type { LocationContent } from "./index";

// Authored by the content fan-out, validated against the contract.
export const market: LocationContent = {
  "activities": [
    {
      "id": "market_haggle",
      "location": "market",
      "name": "Work the stalls",
      "blurb": "Drift between the traders and see what your tongue can shave off a price."
    },
    {
      "id": "market_haul",
      "location": "market",
      "name": "Haul for the traders",
      "blurb": "Strong backs are short in fair week, and the carts won't shift themselves."
    },
    {
      "id": "market_stall",
      "location": "market",
      "name": "Mind a stall",
      "blurb": "Stand behind someone else's goods and learn what really sells."
    }
  ],
  "events": [
    {
      "id": "haggle_the_stalls",
      "location": "market",
      "activities": [
        "market_haggle"
      ],
      "weight": 3,
      "text": "A potter wants more for a glazed jug than it could ever be worth, and knows it. The trick is making him believe you'll walk.",
      "check": {
        "stat": "intelligence",
        "dc": 4
      },
      "pass": {
        "text": "You find the flaw in the glaze before he finds your purse, and talk him down by half while complimenting his work. He sells, scowling, and respects you for it.",
        "outcome": "haggled the potter down to half and left him grudgingly impressed.",
        "stats": {
          "intelligence": 1,
          "wealth": 1
        }
      },
      "fail": {
        "text": "He's heard every gambit twice over and lets you tire yourself out against them. You leave with the jug and a thinner purse, telling yourself it was a fair price.",
        "outcome": "lost a haggle to a potter and overpaid for a jug.",
        "stats": {
          "wealth": -1
        }
      }
    },
    {
      "id": "butcher_armourer_feud",
      "location": "market",
      "activities": [
        "market_haggle",
        "market_stall"
      ],
      "weight": 3,
      "text": "The butcher and the armourer have pitched their stalls side by side again, as they have for thirty years of mutual loathing. The armourer beckons you over, low and conspiratorial.",
      "effect": {
        "text": "He wants only that you tell the butcher his sausages have gone green, loudly, where the fair crowd can hear. You oblige. The butcher's takings sour for the day, and the armourer marks you down as a man he can use.",
        "outcome": "carried the armourer's poison to the butcher and earned the armourer's regard.",
        "stats": {
          "craft": 1
        },
        "flags": [
          "armourer_owes_you"
        ]
      }
    },
    {
      "id": "armourers_commission",
      "location": "market",
      "activities": [
        "market_haggle",
        "market_haul"
      ],
      "requires": [
        "armourer_owes_you"
      ],
      "weight": 4,
      "text": "The armourer remembers the favour. He has a commission: a set of fair-day blades that must reach a buyer across the square before the butcher's cousin can underbid him.",
      "check": {
        "stat": "craft",
        "dc": 5
      },
      "pass": {
        "text": "You broker it cleanly. The right buyer, the right price, the butcher's cousin left holding his cheaper steel and his temper. The armourer pays well and tells the other traders you can be trusted with coin.",
        "outcome": "brokered the armourer's commission and built a name among the traders.",
        "stats": {
          "craft": 1,
          "wealth": 2
        }
      },
      "fail": {
        "text": "The deal slips through your fingers at the last word and the cousin's blades sell first. The armourer is sour, but you wore his trust honestly trying, and that he remembers.",
        "outcome": "botched the armourer's commission but kept his trust by trying.",
        "stats": {
          "will": 1
        }
      }
    },
    {
      "id": "lift_the_load",
      "location": "market",
      "activities": [
        "market_haul"
      ],
      "weight": 3,
      "text": "A wool merchant's cart has thrown a wheel in the gateway and his whole consignment is blocking the fair. He'll pay anyone who can clear it before the bailiff fines him.",
      "check": {
        "stat": "strength",
        "dc": 5
      },
      "pass": {
        "text": "You shoulder bale after bale clear of the gate and heave the cart up while a carter slides the wheel home. The merchant pays in good coin and points you out to the other traders as a back worth hiring.",
        "outcome": "cleared a merchant's spilled cart single-handed and got paid for the muscle.",
        "stats": {
          "strength": 1,
          "wealth": 1
        }
      },
      "fail": {
        "text": "The bales are heavier than they look and damp through. You shift what you can before younger backs arrive to finish it, and split the merchant's thin gratitude three ways.",
        "outcome": "strained at a merchant's cart and split the coin three ways.",
        "stats": {
          "strength": 1
        }
      }
    },
    {
      "id": "porter_work",
      "location": "market",
      "activities": [
        "market_haul"
      ],
      "weight": 2,
      "text": "Fair week wants more porters than the parish can muster. A factor hires anyone upright and pays by the trip.",
      "effect": {
        "text": "You haul crates from the wharf-road to the square till your shoulders sing, and pocket honest coin for every load. By dusk you know which stalls hide what, and which factor shorts his men.",
        "outcome": "portered crates all day and learned which stalls hide what.",
        "stats": {
          "strength": 1,
          "wealth": 1,
          "intelligence": 1
        }
      }
    },
    {
      "id": "the_unlabelled_stall",
      "location": "market",
      "activities": [
        "market_haggle",
        "market_stall"
      ],
      "weight": 2,
      "text": "A stall with no name and no labels offers spice, silk, and a price too good to be lawful. The seller won't quite meet your eye, but the goods look real enough.",
      "choices": [
        {
          "label": "Buy a bundle to sell on",
          "effect": {
            "text": "You hand over the coin and tuck the bundle under your arm. Only later, by lamplight, do you start to wonder what exactly you've bought, and from whom.",
            "outcome": "bought a bundle of unlabelled goods from a nameless stall.",
            "stats": {
              "wealth": -1
            },
            "flags": [
              "bought_the_swindle"
            ]
          }
        },
        {
          "label": "Note the stall and walk on",
          "effect": {
            "text": "You memorise the seller's face and the gap in the row where he stands, and keep your coin. A bargain that good is a debt waiting to be called.",
            "outcome": "smelled a swindle at the nameless stall and kept their coin.",
            "stats": {
              "intelligence": 1
            }
          }
        }
      ]
    },
    {
      "id": "the_swindle_unwinds",
      "location": "market",
      "activities": [
        "market_haggle",
        "market_stall"
      ],
      "requires": [
        "bought_the_swindle"
      ],
      "weight": 4,
      "text": "The bundle was stolen goods, and the man you bought from is gone. The rightful owner's friends are working the square, asking after a buyer of just your description.",
      "check": {
        "stat": "agility",
        "dc": 5
      },
      "pass": {
        "text": "You spot them before they spot you, slip the bundle back onto a passing barrow, and are three stalls away and innocent-faced by the time the questions reach where you stood.",
        "outcome": "shed the stolen bundle and slipped the swindle's reckoning.",
        "stats": {
          "agility": 1,
          "intelligence": 1
        }
      },
      "fail": {
        "text": "They corner you against the fish stalls. It costs you the bundle, the coin you paid, and a promise of more to keep your name out of the bailiff's ear, a lesson in bargains too good to be true.",
        "outcome": "got cornered over the stolen bundle and paid twice to walk away clean.",
        "stats": {
          "wealth": -1,
          "will": 1
        }
      }
    },
    {
      "id": "fairday_gouge",
      "location": "market",
      "activities": [
        "market_stall"
      ],
      "requires": [
        "knows_the_tax"
      ],
      "weight": 2,
      "text": "The stallholder you're minding wants the fair-day prices doubled while the crowd is thick and desperate. He leaves the chalk-board in your hand and goes to dinner.",
      "choices": [
        {
          "label": "Double the prices as he asked",
          "effect": {
            "text": "You chalk up the gouge and the takings pour in. But you know the tax terms the lord will read out tomorrow, and the stallholder's greed will catch a fine. It won't be your name on the stall.",
            "outcome": "gouged the fair-day crowd on a stall that wasn't theirs.",
            "stats": {
              "wealth": 1,
              "craft": 1
            }
          }
        },
        {
          "label": "Hold the prices fair",
          "effect": {
            "text": "You keep the chalk honest. Knowing the lord means to make an example of the gougers tomorrow, you'd rather the crowd remember a fair hand than the bailiff remember this stall.",
            "outcome": "kept a borrowed stall's prices honest ahead of the lord's reckoning.",
            "stats": {
              "intelligence": 1,
              "will": 1
            }
          }
        }
      ]
    },
    {
      "id": "fence_the_swindle",
      "location": "market",
      "activities": [
        "market_stall",
        "market_haggle"
      ],
      "forbids": [
        "owes_innkeep"
      ],
      "weight": 2,
      "text": "A quiet woman at the back of the row deals in things that fell off carts. She'll cut you in on moving a few: no questions, decent coin, only nerve required.",
      "check": {
        "stat": "will",
        "dc": 5
      },
      "pass": {
        "text": "You keep your face flat and your patter dull, and nothing about you invites a second look. By close she's moved her stock through your hands and counted you reliable, a useful sort of friend in a place like this.",
        "outcome": "fenced a fence's goods without a flicker and earned her coin.",
        "stats": {
          "will": 1,
          "wealth": 1
        }
      },
      "fail": {
        "text": "Your nerve holds right up until a bailiff dawdles past, and your face does the rest. She waves the deal off and you slink away, lighter only in dignity.",
        "outcome": "lost their nerve fencing goods and slunk off empty-handed.",
        "stats": {
          "intelligence": 1
        }
      }
    },
    {
      "id": "lords_warrant",
      "location": "market",
      "activities": [
        "market_haggle",
        "market_stall"
      ],
      "requires": [
        "lords_eye"
      ],
      "weight": 3,
      "text": "Word that the lord knows your name has reached the square ahead of you. The market reeve, a careful man, asks quietly whether you'd vouch the fair's weights and measures true before the reckoning.",
      "effect": {
        "text": "You walk the row with him, testing scales and calling the short measures out by stall. The honest traders bless you and the crooked ones learn your face, but with the lord's eye on you, none dares cross it. The reeve will speak well of you at the castle.",
        "outcome": "vouched the fair's weights for the reeve under the lord's own eye.",
        "stats": {
          "craft": 1,
          "will": 1
        }
      }
    }
  ]
};
