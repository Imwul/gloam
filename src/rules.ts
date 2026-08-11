export const SUITS = ["cups", "wands", "swords", "coins"] as const;
export type Suit = (typeof SUITS)[number];

export const MINOR_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"] as const;
export type MinorRank = (typeof MINOR_RANKS)[number];

export const MAJOR_RANKS = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI",
  "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"
] as const;

export interface Card {
  type: "minor" | "major";
  suit?: Suit;
  rank: string;
  reversed: boolean;
}

export interface TestInput {
  card: Card;
  stat: number;
  modifier?: number;
  help?: number;
  torsoPenalty?: number;
  opposedPenalty?: number;
  target?: number;
  testSuit?: Suit | null;
  pushedCard?: Card | null;
}

export interface TestResult {
  total: number;
  target: number;
  status: "great-success" | "success" | "failure" | "great-failure";
  greatSuccess: boolean;
  success: boolean;
  pushed: boolean;
}

export interface ArmorResult {
  incoming: number;
  armorPoints: number;
  wounds: number;
  notchesArmor: boolean;
}

export const cardId = (card: Card): string =>
  card.type === "minor" ? `minor:${card.suit}:${card.rank}` : `major:${card.rank}`;

export const cardValue = (card: Card): number => {
  const values: Record<string, number> = {
    "0": 0,
    A: 1,
    Page: 11,
    Knight: 12,
    Queen: 13,
    King: 14,
  };
  return values[card.rank] ?? (Number.parseInt(card.rank, 10) || 0);
};

export const tableKey = (card: Card): string => ({
  Page: "P",
  Knight: "Kn",
  Queen: "Q",
  King: "K",
}[card.rank] ?? card.rank);

export const shuffle = <T,>(items: readonly T[], random: () => number = Math.random): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const orient = (card: Omit<Card, "reversed">, random: () => number): Card => ({
  ...card,
  reversed: random() < 0.5,
});

export const createPlayerDeck = (random: () => number = Math.random): Card[] => {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of MINOR_RANKS) {
      cards.push({ type: "minor", suit, rank, reversed: false });
    }
  }
  cards.push({ type: "major", rank: "0", reversed: false });
  return shuffle(cards, random);
};

export const createRefereeDeck = (random: () => number = Math.random): Card[] =>
  shuffle(MAJOR_RANKS.map((rank) => ({ type: "major" as const, rank, reversed: false })), random);

export const drawCard = (
  deck: readonly Card[],
  random: () => number = Math.random,
): { card: Card | null; deck: Card[] } => {
  if (deck.length === 0) return { card: null, deck: [] };
  const [first, ...rest] = deck;
  return {
    card: orient({ type: first.type, suit: first.suit, rank: first.rank }, random),
    deck: rest,
  };
};

export const dealCombatCards = (
  deck: readonly Card[],
  playerHand: readonly Card[],
  monsterHands: readonly (readonly Card[])[],
  random: () => number = Math.random,
): { deck: Card[]; playerHand: Card[]; monsterHands: Card[][]; foolDrawn: boolean } => {
  let remaining = [...deck];
  let foolDrawn = false;
  const fill = (existing: readonly Card[], limit: number): Card[] => {
    const hand = [...existing];
    while (hand.length < limit && remaining.length > 0) {
      const drawn = drawCard(remaining, random);
      remaining = drawn.deck;
      if (!drawn.card) break;
      hand.push(drawn.card);
      if (drawn.card.rank === "0") foolDrawn = true;
    }
    return hand;
  };
  const filledPlayerHand = fill(playerHand, 4);
  const filledMonsterHands = monsterHands.map((hand) => fill(hand, 3));
  return {
    deck: remaining,
    playerHand: filledPlayerHand,
    monsterHands: filledMonsterHands,
    foolDrawn,
  };
};

export const evaluateTest = ({
  card,
  stat,
  modifier = 0,
  help = 0,
  torsoPenalty = 0,
  opposedPenalty = 0,
  target = 14,
  testSuit = null,
  pushedCard = null,
}: TestInput): TestResult => {
  const firstTotal = cardValue(card) + stat + modifier + help + torsoPenalty - opposedPenalty;
  const total = firstTotal + (pushedCard ? cardValue(pushedCard) : 0);
  const pushed = Boolean(pushedCard);
  const success = total >= target;
  const greatSuccess = !pushed && firstTotal >= target && Boolean(testSuit) && card.suit === testSuit;
  return {
    total,
    target,
    status: greatSuccess ? "great-success" : success ? "success" : pushed ? "great-failure" : "failure",
    greatSuccess,
    success,
    pushed,
  };
};

export const resolveArmor = (incoming: number, armorPoints: number): ArmorResult => ({
  incoming: Math.max(0, incoming),
  armorPoints: Math.max(0, armorPoints),
  wounds: Math.max(0, incoming - armorPoints),
  notchesArmor: incoming > armorPoints,
});

export const effectiveArmorPoints = (printedArmorPoints: number, notches: number): number =>
  notches >= printedArmorPoints ? 0 : Math.max(0, printedArmorPoints);

export const carryingCapacity = (coins: number): number => Math.min(14, 10 + Math.max(0, coins));

export const woundedSpeed = (coins: number, woundedLegs: number): number =>
  Math.max(0, coins - Math.max(0, woundedLegs) * 2);

export const isFatalHeadWound = (alreadyWounded: boolean, woundsAfterArmor: number): boolean =>
  woundsAfterArmor > (alreadyWounded ? 0 : 1);

const romanValue = (rank: string): number => {
  const values: Record<string, number> = { I: 1, V: 5, X: 10 };
  let total = 0;
  let previous = 0;
  for (const symbol of [...rank].reverse()) {
    const value = values[symbol] || 0;
    total += value < previous ? -value : value;
    previous = Math.max(previous, value);
  }
  return total;
};

export const oracleSequenceToken = (card: Card): string => {
  if (card.type === "major") return `number:${card.rank === "0" ? 0 : romanValue(card.rank)}`;
  if (["Page", "Knight", "Queen", "King"].includes(card.rank)) return `court:${card.rank}`;
  return `number:${cardValue(card)}`;
};

export const yesNoResult = (rank: string): string | null => {
  if (["3", "5", "7", "9"].includes(rank)) return "No";
  if (["2", "4", "6", "8", "10"].includes(rank)) return "Yes";
  if (["Page", "Knight"].includes(rank)) return "No, but...";
  if (["Queen", "King"].includes(rank)) return "Yes, but...";
  return null;
};

export const amountResult = (rank: string): string | null => {
  if (["2", "3", "4", "5"].includes(rank)) return "None";
  if (["6", "7", "8", "9", "10"].includes(rank)) return "Average";
  if (["Page", "Knight", "Queen", "King"].includes(rank)) return "Considerable";
  if (rank === "A") return "Excessive";
  return null;
};

export const cardDisplay = (card: Card): string => {
  const suit = card.suit ? `${card.suit[0].toUpperCase()}${card.suit.slice(1)} ` : "";
  const orientation = card.reversed ? " · Reversed" : "";
  const name = card.rank === "0" ? "The Fool" : `${suit}${card.rank}`;
  return `${name}${orientation}`;
};

export const validateCardZones = (zones: readonly (readonly Card[])[], expected: readonly Card[]): boolean => {
  const expectedIds = new Set(expected.map(cardId));
  const seen = new Set<string>();
  for (const zone of zones) {
    for (const card of zone) {
      const identity = cardId(card);
      if (!expectedIds.has(identity) || seen.has(identity)) return false;
      seen.add(identity);
    }
  }
  return seen.size === expectedIds.size;
};

export const normalizeCard = (value: unknown): Card | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const type = raw.type;
  const rank = typeof raw.rank === "string" ? raw.rank : typeof raw.card === "string" ? raw.card : null;
  if ((type !== "minor" && type !== "major") || !rank) return null;
  const suit = raw.suit;
  if (type === "minor" && !SUITS.includes(suit as Suit)) return null;
  return {
    type,
    rank,
    suit: type === "minor" ? suit as Suit : undefined,
    reversed: Boolean(raw.reversed),
  };
};
