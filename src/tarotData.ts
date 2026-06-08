export interface TarotCard {
  id: string;
  name: string;
  suit: 'Major' | 'Cups' | 'Swords' | 'Wands' | 'Pentacles';
  value: number;
  imageUrl: string;
  // Gloam specific attributes
  statAssociation?: string; // Cups = Care/Judgement, Swords = Strength/Combat, Wands = Will/Spirit, Pentacles/Coins = Agility/Wealth
  actionKeyword?: string;  // For Player Deck cards (Minor + Fool)
  subjectKeywordUpright?: string; // For Referee Deck cards (Major I-XXI)
  subjectKeywordReversed?: string; // For Referee Deck cards (Major I-XXI)
}

const ROMAN_NUMERALS = [
  "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"
];

const MAJOR_NAMES = [
  "The Fool",
  "The Magician",
  "The High Priestess",
  "The Empress",
  "The Emperor",
  "The Hierophant",
  "The Lovers",
  "The Chariot",
  "Strength",
  "The Hermit",
  "Wheel of Fortune",
  "Justice",
  "The Hanged Man",
  "Death",
  "Temperance",
  "The Devil",
  "The Tower",
  "The Star",
  "The Moon",
  "The Sun",
  "Judgement",
  "The World"
];

const SUITS: ('Cups' | 'Pentacles' | 'Swords' | 'Wands')[] = ['Cups', 'Pentacles', 'Swords', 'Wands'];

const SUIT_STAT_ASSOCIATIONS = {
  Cups: "Judgement, Learning, Medicine, Care, Patience, and Tools (Stat: Cups)",
  Swords: "Strength, Courage, Endurance, Vigor, and Combat (Stat: Swords)",
  Wands: "Will, Mysticism, Spirit, Passion, Occult knowledge (Stat: Wands)",
  Pentacles: "Agility, Stealth, Cunning, Manipulation, and Wealth (Stat: Coins)"
};

// Oracle keywords from Page 54 of Gloam RPG manual
export const ActionKeywords: Record<string, Record<number, string>> = {
  Cups: {
    1: "Accept", 2: "Unite", 3: "Gather", 4: "Contemplate", 5: "Despair",
    6: "Remember", 7: "Choose", 8: "Abandon", 9: "Release", 10: "Fulfill",
    11: "Sense", 12: "Follow", 13: "Heal", 14: "Balance"
  },
  Wands: {
    1: "Inspire", 2: "Plan", 3: "Expand", 4: "Commune", 5: "Fight",
    6: "Punish", 7: "Defend", 8: "Move", 9: "Resist", 10: "Accomplish",
    11: "Explore", 12: "Confront", 13: "Endure", 14: "Lead"
  },
  Swords: {
    1: "Sharpen", 2: "Hesitate", 3: "Suffer", 4: "Protect", 5: "Cheat",
    6: "Flee", 7: "Deceive", 8: "Imprison", 9: "Fear", 10: "Defeat",
    11: "Communicate", 12: "Assert", 13: "Perceive", 14: "Command"
  },
  Pentacles: {
    1: "Begin", 2: "Adapt", 3: "Build", 4: "Conserve", 5: "Isolate",
    6: "Share", 7: "Collect", 8: "Master", 9: "Reward", 10: "Stabilize",
    11: "Study", 12: "Await", 13: "Welcome", 14: "Provide"
  }
};

// Oracle keywords from Page 55 of Gloam RPG manual
export const SubjectKeywords: Record<number, { upright: string; reversed: string }> = {
  1: { upright: "Skill", reversed: "Trickery" },
  2: { upright: "Mystery", reversed: "Confusion" },
  3: { upright: "Nature", reversed: "Emptiness" },
  4: { upright: "Structure", reversed: "Tyranny" },
  5: { upright: "Tradition", reversed: "Rebellion" },
  6: { upright: "Partnership", reversed: "Conflict" },
  7: { upright: "Willpower", reversed: "Obstacle" },
  8: { upright: "Bravery", reversed: "Doubt" },
  9: { upright: "Guidance", reversed: "Loneliness" },
  10: { upright: "Fortune", reversed: "Control" },
  11: { upright: "Truth", reversed: "Dishonesty" },
  12: { upright: "Sacrifice", reversed: "Apathy" },
  13: { upright: "Change", reversed: "Decay" },
  14: { upright: "Patience", reversed: "Discord" },
  15: { upright: "Oppression", reversed: "Independence" },
  16: { upright: "Disaster", reversed: "Blessing" },
  17: { upright: "Hope", reversed: "Insecurity" },
  18: { upright: "Instinct", reversed: "Misunderstanding" },
  19: { upright: "Joy", reversed: "Sadness" },
  20: { upright: "Purpose", reversed: "Skepticism" },
  21: { upright: "Wholeness", reversed: "Brokenness" }
};

// Generate all 78 cards
export function generateTarotDeck(): TarotCard[] {
  const deck: TarotCard[] = [];

  // 1. Major Arcana (0 to 21)
  for (let i = 0; i <= 21; i++) {
    const roman = ROMAN_NUMERALS[i];
    const name = i === 0 ? "The Fool" : `${roman} - ${MAJOR_NAMES[i]}`;
    const card: TarotCard = {
      id: `Major_${i}`,
      name,
      suit: 'Major',
      value: i,
      imageUrl: `/tarot/Major_${i}.jpg`
    };

    if (i === 0) {
      card.actionKeyword = "Reshuffle Trigger / Chaos";
      card.statAssociation = "Reshuffle the Player & Referee Decks immediately.";
    } else {
      const subject = SubjectKeywords[i];
      if (subject) {
        card.subjectKeywordUpright = subject.upright;
        card.subjectKeywordReversed = subject.reversed;
      }
    }
    deck.push(card);
  }

  // 2. Minor Arcana (Cups, Swords, Wands, Pentacles)
  for (const suit of SUITS) {
    for (let value = 1; value <= 14; value++) {
      let name = "";
      let valStr = `${value}`;
      if (value === 1) {
        name = `Ace of ${suit}`;
      } else if (value === 11) {
        name = `Page of ${suit}`;
        valStr = "Page";
      } else if (value === 12) {
        name = `Knight of ${suit}`;
        valStr = "Knight";
      } else if (value === 13) {
        name = `Queen of ${suit}`;
        valStr = "Queen";
      } else if (value === 14) {
        name = `King of ${suit}`;
        valStr = "King";
      } else {
        name = `${value} of ${suit}`;
      }

      const card: TarotCard = {
        id: `${suit}_${valStr}`,
        name,
        suit,
        value,
        imageUrl: `/tarot/${suit}_${valStr}.jpg`,
        statAssociation: SUIT_STAT_ASSOCIATIONS[suit],
        actionKeyword: ActionKeywords[suit]?.[value] || ""
      };
      deck.push(card);
    }
  }

  return deck;
}

// Yes/No Oracle interpretation helper (Page 54)
export function getYesNoOutcome(card: TarotCard): { outcome: string; note: string } {
  // If The Fool is drawn
  if (card.suit === 'Major' && card.value === 0) {
    return { outcome: "Recall / Shuffle", note: "The Fool triggers an immediate reshuffle of the decks." };
  }

  const value = card.value;
  if (value === 1) {
    return { outcome: "Extreme Outcome", note: "Draw again for details, but the response is extreme." };
  } else if ([3, 5, 7, 9].includes(value)) {
    return { outcome: "No", note: "A clear negative response." };
  } else if ([2, 4, 6, 8, 10].includes(value)) {
    return { outcome: "Yes", note: "A clear positive response." };
  } else if ([11, 12].includes(value)) {
    return { outcome: "No, but...", note: "A negative response, but with a mitigating factor or minor opportunity." };
  } else if ([13, 14].includes(value)) {
    return { outcome: "Yes, but...", note: "A positive response, but with a minor complication or caveat." };
  }

  // Fallback for Major Arcana (using odd/even index rules as standard fallback)
  if (value % 2 === 1) {
    return { outcome: "No", note: "Odd value Major Arcana - interpreted as negative." };
  } else {
    return { outcome: "Yes", note: "Even value Major Arcana - interpreted as positive." };
  }
}

// Amount Oracle interpretation helper (Page 54)
export function getAmountOutcome(card: TarotCard): { outcome: string; note: string } {
  if (card.suit === 'Major' && card.value === 0) {
    return { outcome: "Unpredictable / Shuffle", note: "The Fool triggers an immediate reshuffle." };
  }

  const value = card.value;
  if (value === 1) {
    return { outcome: "Excessive", note: "An overwhelming or extreme amount." };
  } else if (value >= 2 && value <= 5) {
    return { outcome: "None", note: "Virtually zero or non-existent." };
  } else if (value >= 6 && value <= 10) {
    return { outcome: "Average", note: "A standard, normal, or moderate amount." };
  } else if (value >= 11 && value <= 14) {
    return { outcome: "Considerable", note: "A large, significant, or notable amount." };
  }

  // Fallback for Major Arcana (using numeric mappings)
  if (value < 6) return { outcome: "None", note: "Low value Major Arcana - minimal amount." };
  if (value < 12) return { outcome: "Average", note: "Mid value Major Arcana - moderate amount." };
  return { outcome: "Considerable", note: "High value Major Arcana - significant amount." };
}

// Arcane Magick Verbs from Page 38 of Gloam RPG manual
export const ArcaneMagickVerbs: Record<string, Record<number, string>> = {
  Cups: {
    1: "Fill", 2: "Attract", 3: "Delight", 4: "Protect from", 5: "Disintegrate",
    6: "Mend", 7: "Conjure", 8: "Weaken", 9: "Solidify/liquefy", 10: "Calm",
    11: "Speak with", 12: "Charm", 13: "Heal", 14: "Become"
  },
  Wands: {
    1: "Energize", 2: "Change", 3: "Grow", 4: "Gather", 5: "Enrage",
    6: "Conquer", 7: "Control", 8: "Quick", 9: "Toughen", 10: "Command",
    11: "Release", 12: "Incite", 13: "Heat", 14: "Create"
  },
  Swords: {
    1: "Explode", 2: "Hide", 3: "Afflict", 4: "Silence", 5: "Intimidate",
    6: "Teleport", 7: "Steal", 8: "Ensnare", 9: "Discourage", 10: "Defeat",
    11: "Transmute", 12: "Force", 13: "Detect", 14: "Comprehend"
  },
  Pentacles: { // Coins
    1: "Give", 2: "Balance", 3: "Combine", 4: "Take", 5: "Isolate",
    6: "Share", 7: "Harvest", 8: "Sculpt", 9: "Summon", 10: "Transcend",
    11: "Enthrall", 12: "Slow", 13: "Protect", 14: "Multiply"
  }
};

// Arcane Magick Nouns from Page 39 of Gloam RPG manual
export const ArcaneMagickNouns: Record<number, { upright: string; reversed: string }> = {
  0: { upright: "Self", reversed: "Distraction" },
  1: { upright: "Mind", reversed: "Illusion" },
  2: { upright: "Consciousness", reversed: "Voice" },
  3: { upright: "Beauty", reversed: "Ugliness" },
  4: { upright: "Authority", reversed: "Ice" },
  5: { upright: "Knowledge", reversed: "Ignorance" },
  6: { upright: "Temptation", reversed: "Conflict" },
  7: { upright: "Metal", reversed: "Barrier" },
  8: { upright: "Strength", reversed: "Weakness" },
  9: { upright: "Person", reversed: "Isolation" },
  10: { upright: "Fate", reversed: "Delay" },
  11: { upright: "Truth", reversed: "Blood" },
  12: { upright: "Flesh", reversed: "Emptiness" },
  13: { upright: "Death", reversed: "Life" },
  14: { upright: "Water", reversed: "Imbalance" },
  15: { upright: "Pain", reversed: "Control" },
  16: { upright: "Earth", reversed: "Chaos" },
  17: { upright: "Faith", reversed: "Time" },
  18: { upright: "Beast", reversed: "Secret" },
  19: { upright: "Light", reversed: "Sorrow" },
  20: { upright: "Undead", reversed: "Purpose" },
  21: { upright: "Fire", reversed: "Darkness" }
};

export interface FolkNPC {
  occupation: string;
  femaleName: string;
  maleName: string;
  personality: string;
}

// Folk you might meet on the road from Page 53 of Gloam RPG manual
export const FolkNPCTable: Record<number, FolkNPC> = {
  1: { occupation: "Alchemist", femaleName: "Alise", maleName: "Coalman", personality: "Sun: confident" },
  2: { occupation: "Record-Keeper", femaleName: "Brigid", maleName: "Connan", personality: "Sun: proud" },
  3: { occupation: "Herbalist", femaleName: "Catriona", maleName: "Egbert", personality: "Sun: leader" },
  4: { occupation: "Captain of the Guard", femaleName: "Dreda", maleName: "Edgar", personality: "Moon: nurturing" },
  5: { occupation: "Local Priest", femaleName: "Edie", maleName: "Faris", personality: "Moon: emotional" },
  6: { occupation: "Oath-Sworn Knight", femaleName: "Eleanor", maleName: "Garold", personality: "Moon: perceptive" },
  7: { occupation: "Tournament Hopeful", femaleName: "Gretel", maleName: "Hob", personality: "Mercury: clever" },
  8: { occupation: "Beast Handler", femaleName: "Iris", maleName: "Jack", personality: "Mercury: curious" },
  9: { occupation: "Reclusive Sage", femaleName: "Joan", maleName: "Jankin", personality: "Mercury: analytical" },
  10: { occupation: "Traveling Merchant", femaleName: "Laney", maleName: "Jory", personality: "Venus: charming" },
  11: { occupation: "Lawspeaker", femaleName: "Mabel", maleName: "Kagan", personality: "Venus: diplomatic" },
  12: { occupation: "Exile", femaleName: "Mardra", maleName: "Lewin", personality: "Venus: pleasure-seeking" },
  13: { occupation: "Assassin", femaleName: "Mira", maleName: "Lochlann", personality: "Mars: courageous" },
  14: { occupation: "Healer", femaleName: "Odda", maleName: "Mikhail", personality: "Mars: aggressive" },
  15: { occupation: "Vice Vendor", femaleName: "Orla", maleName: "Navir", personality: "Mars: competitive" },
  16: { occupation: "Ruin Delver", femaleName: "Rose", maleName: "Osrick", personality: "Jupiter: generous" },
  17: { occupation: "Astrologer", femaleName: "Rowan", maleName: "Ralph", personality: "Jupiter: wise" },
  18: { occupation: "Lycanthrope", femaleName: "Selene", maleName: "Steffon", personality: "Jupiter: philosophical" },
  19: { occupation: "Farmer", femaleName: "Winifred", maleName: "Temar", personality: "Saturn: disciplined" },
  20: { occupation: "Mayor", femaleName: "Willow", maleName: "Wat", personality: "Saturn: cautious" },
  21: { occupation: "Loremaster", femaleName: "Wynn", maleName: "Yoris", personality: "Saturn: patient" }
};
