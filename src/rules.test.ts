import { describe, expect, it } from "vitest";
import {
  ARCANE_MAJOR_WORDS,
  ARCANE_MINOR_WORDS,
  BESTIARY,
  CAROUSING_TABLE,
  DUNGEON_EVENTS,
  MAGICK_ITEMS,
  MAP_DUNGEON,
  MAP_SETTLEMENT,
  MAP_WILDERNESS,
  ORACLE_SUBJECTS,
  ORACLE_SUITS,
  SETTLEMENT_EVENTS,
  WILDERNESS_EVENTS,
} from "./gameData";
import {
  advanceGameTime,
  amountResult,
  cardId,
  cardValue,
  carryingCapacity,
  createPlayerDeck,
  createRefereeDeck,
  dealCombatCards,
  drawCard,
  effectiveArmorPoints,
  evaluateTest,
  gainResolveBalances,
  isFatalHeadWound,
  normalizeCard,
  oracleSequenceToken,
  resolveArmor,
  restoreMonsterInjury,
  spendResolveBalances,
  validateCardZones,
  woundedSpeed,
  yesNoResult,
  type Card,
} from "./rules";

const minor = (suit: Card["suit"], rank: string): Card => ({ type: "minor", suit, rank, reversed: false });

describe("Player and Referee decks", () => {
  it("creates exactly 57 and 21 unique live cards", () => {
    const player = createPlayerDeck(() => 0.5);
    const referee = createRefereeDeck(() => 0.5);
    expect(player).toHaveLength(57);
    expect(referee).toHaveLength(21);
    expect(new Set(player.map(cardId)).size).toBe(57);
    expect(new Set(referee.map(cardId)).size).toBe(21);
  });

  it("tracks a draw without duplicating a card and never auto-reshuffles an empty deck", () => {
    const player = createPlayerDeck(() => 0.5);
    const drawn = drawCard(player, () => 0.75);
    expect(drawn.card).not.toBeNull();
    expect(validateCardZones([drawn.deck, [drawn.card!]], createPlayerDeck(() => 0.5))).toBe(true);
    expect(drawCard([], () => 0.5)).toEqual({ card: null, deck: [] });
  });

  it("deals player and monster combat hands from the shared Player Deck", () => {
    const playerDeck = createPlayerDeck(() => 0.5);
    const refereeDeck = createRefereeDeck(() => 0.5);
    const dealt = dealCombatCards(playerDeck, [], [[]], () => 0.75);
    expect(dealt.playerHand).toHaveLength(4);
    expect(dealt.monsterHands[0]).toHaveLength(3);
    expect(dealt.deck).toHaveLength(50);
    expect(refereeDeck).toHaveLength(21);
    expect(dealt.monsterHands[0].every((card) => card.suit || card.rank === "0")).toBe(true);
    expect(validateCardZones([dealt.deck, dealt.playerHand, dealt.monsterHands[0]], createPlayerDeck(() => 0.5))).toBe(true);
  });

  it("retains unspent cards, refills PCs to four, and draws three additional cards for each NPC", () => {
    const fullDeck = createPlayerDeck(() => 0.5);
    const existingPlayer = fullDeck.slice(0, 3);
    const existingMonster = fullDeck.slice(3, 5);
    const dealt = dealCombatCards(fullDeck.slice(5), existingPlayer, [existingMonster], () => 0.75);
    expect(dealt.playerHand).toHaveLength(4);
    expect(dealt.monsterHands[0]).toHaveLength(5);
    expect(dealt.monsterHands[0].slice(0, 2)).toEqual(existingMonster);
    expect(dealt.deck).toHaveLength(48);
    expect(validateCardZones([dealt.deck, dealt.playerHand, dealt.monsterHands[0]], fullDeck)).toBe(true);
  });

  it("normalizes legacy card fields for save migration", () => {
    expect(normalizeCard({ type: "minor", suit: "cups", card: "Q", reversed: true })).toEqual({
      type: "minor", suit: "cups", rank: "Queen", reversed: true,
    });
    expect(normalizeCard({ type: "minor", suit: "stars", card: "Q" })).toBeNull();
    for (const [rank, value] of [["P", 11], ["Kn", 12], ["Q", 13], ["K", 14]] as const) {
      const card = normalizeCard({ type: "minor", suit: "swords", card: rank });
      expect(card).not.toBeNull();
      expect(cardValue(card!)).toBe(value);
    }
    expect(normalizeCard({ type: "major", card: "Fool" })?.rank).toBe("0");
    expect(normalizeCard({ type: "minor", suit: "cups", rank: "15" })).toBeNull();
    expect(normalizeCard({ type: "minor", suit: "cups", rank: "0" })).toBeNull();
    expect(normalizeCard({ type: "major", rank: "XXII" })).toBeNull();
  });
});

describe("Character, Tests, and inventory math", () => {
  it("applies the printed capacity cap and leg Wound Speed penalties", () => {
    expect(carryingCapacity(4)).toBe(14);
    expect(carryingCapacity(6)).toBe(14);
    expect(woundedSpeed(4, 0)).toBe(4);
    expect(woundedSpeed(4, 1)).toBe(2);
    expect(woundedSpeed(4, 2)).toBe(0);
  });

  it("recognizes first-draw Great Success and pushed Great Failure", () => {
    const great = evaluateTest({ card: minor("swords", "10"), stat: 4, testSuit: "swords" });
    expect(great.status).toBe("great-success");
    const pushed = evaluateTest({ card: minor("cups", "2"), pushedCard: minor("wands", "3"), stat: 4, testSuit: "cups" });
    expect(pushed).toMatchObject({ total: 9, status: "great-failure", pushed: true });
    expect(evaluateTest({ card: { type: "major", rank: "0", reversed: false }, stat: 4, testSuit: "coins" })).toMatchObject({ total: 4, status: "failure" });
  });

  it("allows Help and Resolve before evaluating the first-card suit, but never grants Great Success after a Push", () => {
    expect(evaluateTest({ card: minor("cups", "7"), stat: 3, help: 4, testSuit: "cups" }).status).toBe("great-success");
    expect(evaluateTest({ card: minor("swords", "10"), stat: 3, modifier: 1, testSuit: "swords" }).status).toBe("great-success");
    expect(evaluateTest({ card: minor("cups", "7"), pushedCard: minor("cups", "7"), stat: 3, testSuit: "cups" })).toMatchObject({ total: 17, status: "success", greatSuccess: false });
  });

  it("subtracts the opponent Stat on Opposed Tests", () => {
    const result = evaluateTest({ card: minor("wands", "7"), stat: 3, opposedPenalty: 4, target: 7, testSuit: "swords" });
    expect(result).toMatchObject({ total: 6, status: "failure" });
  });
});

describe("Resolve economy (rulebook p. 34)", () => {
  it("mirrors actual player gains to the Referee while respecting the player's cap", () => {
    expect(gainResolveBalances(3, 12)).toEqual({ playerResolve: 4, refereeResolve: 13, gained: 1 });
    expect(gainResolveBalances(9, 4, 3)).toEqual({ playerResolve: 10, refereeResolve: 5, gained: 1 });
    expect(gainResolveBalances(10, 4)).toEqual({ playerResolve: 10, refereeResolve: 4, gained: 0 });
  });

  it("spends the player's points without increasing the Referee's balance", () => {
    expect(spendResolveBalances(5, 7, 3)).toEqual({ playerResolve: 2, refereeResolve: 7, spent: 3 });
    expect(spendResolveBalances(1, 7, 3)).toEqual({ playerResolve: 0, refereeResolve: 7, spent: 1 });
    expect(spendResolveBalances(0, 7)).toEqual({ playerResolve: 0, refereeResolve: 7, spent: 0 });
  });

  it("cannot turn negative amounts into reversed gains or spending", () => {
    expect(gainResolveBalances(5, 7, -2)).toEqual({ playerResolve: 5, refereeResolve: 7, gained: 0 });
    expect(spendResolveBalances(5, 7, -2)).toEqual({ playerResolve: 5, refereeResolve: 7, spent: 0 });
  });
});

describe("Adventure time (rulebook p. 50)", () => {
  it("carries ninety ten-second Rounds into a fifteen-minute Turn", () => {
    expect(advanceGameTime({ day: 1, watch: 1, turns: 0, rounds: 89 }, 10)).toEqual({ day: 1, watch: 1, turns: 1, rounds: 0 });
    expect(advanceGameTime({ day: 1, watch: 1, turns: 0, rounds: 4 }, 900)).toEqual({ day: 1, watch: 1, turns: 1, rounds: 4 });
  });

  it("carries thirty-two Turns into a Watch and three Watches into the next day", () => {
    expect(advanceGameTime({ day: 1, watch: 2, turns: 31, rounds: 89 }, 10)).toEqual({ day: 1, watch: 3, turns: 0, rounds: 0 });
    expect(advanceGameTime({ day: 7, watch: 3, turns: 31, rounds: 89 }, 10)).toEqual({ day: 8, watch: 1, turns: 0, rounds: 0 });
    expect(advanceGameTime({ day: 2, watch: 3, turns: 2, rounds: 7 }, 28800)).toEqual({ day: 3, watch: 1, turns: 2, rounds: 7 });
  });

  it("normalizes prior overflow and supports multi-day elapsed time without discarding smaller units", () => {
    expect(advanceGameTime({ day: 1, watch: 4, turns: 32, rounds: 90 }, 0)).toEqual({ day: 2, watch: 2, turns: 1, rounds: 0 });
    expect(advanceGameTime({ day: 2, watch: 2, turns: 5, rounds: 8 }, 86400 * 2 + 40)).toEqual({ day: 4, watch: 2, turns: 5, rounds: 12 });
  });

  it("never reverses time and only records complete ten-second Rounds", () => {
    const time = { day: 1, watch: 1, turns: 0, rounds: 0 };
    expect(advanceGameTime(time, -10)).toEqual(time);
    expect(advanceGameTime(time, 19)).toEqual({ ...time, rounds: 1 });
    expect(advanceGameTime({ day: 0, watch: 0, turns: -1, rounds: -1 }, Number.NaN)).toEqual(time);
  });
});

describe("Combat Example reproduction", () => {
  it("reproduces Lizzie, Oscar, Mabel, and Anna's totals", () => {
    expect(evaluateTest({ card: minor("wands", "7"), stat: 3, opposedPenalty: 4, target: 7, testSuit: "swords" }).total).toBe(6);
    expect(evaluateTest({ card: minor("wands", "7"), stat: 3, modifier: 1, opposedPenalty: 4, target: 7, testSuit: "swords" }).success).toBe(true);
    expect(evaluateTest({ card: minor("coins", "6"), stat: 4, target: 7, testSuit: "swords" }).total).toBe(10);
    expect(evaluateTest({ card: minor("swords", "Queen"), stat: 2, opposedPenalty: 4, target: 7, testSuit: "swords" })).toMatchObject({ total: 11, greatSuccess: true });
    expect(evaluateTest({ card: minor("wands", "3"), stat: 4, modifier: 4, opposedPenalty: 4, target: 7, testSuit: "swords" }).total).toBe(7);
  });

  it("reproduces armor absorption, notching, breaking, and Wounds", () => {
    expect(resolveArmor(3, 2)).toEqual({ incoming: 3, armorPoints: 2, wounds: 1, notchesArmor: true });
    expect(effectiveArmorPoints(2, 1)).toBe(2);
    expect(effectiveArmorPoints(2, 2)).toBe(0);
    expect(resolveArmor(3, effectiveArmorPoints(2, 2)).wounds).toBe(3);
    expect(isFatalHeadWound(false, 1)).toBe(false);
    expect(isFatalHeadWound(false, 2)).toBe(true);
    expect(isFatalHeadWound(true, 1)).toBe(true);
  });

  it("only notches intact armor when the blow exceeds its full AP", () => {
    expect(resolveArmor(2, 2)).toMatchObject({ wounds: 0, notchesArmor: false });
    expect(resolveArmor(1, 2)).toMatchObject({ wounds: 0, notchesArmor: false });
    expect(resolveArmor(3, 0)).toMatchObject({ wounds: 3, notchesArmor: false });
    expect(resolveArmor(3, effectiveArmorPoints(2, 2))).toMatchObject({ wounds: 3, notchesArmor: false });
    expect(resolveArmor(3, -1)).toMatchObject({ armorPoints: 0, wounds: 3, notchesArmor: false });
    expect(resolveArmor(-1, 2)).toMatchObject({ incoming: 0, wounds: 0, notchesArmor: false });
  });

  it("restores location effects from legacy monster damage notes without treating absorbed hits as Wounds", () => {
    expect(restoreMonsterInjury(["leftLeg: 1 Wound(s)", "torso: 2 Wound(s)", "head: 0 Wound(s)", "narrative note"], 3, 6)).toEqual({
      wounds: { leftLeg: true, torso: true }, dead: false,
    });
    expect(restoreMonsterInjury(["head: 1 Wound(s)", "head: 1 Wound(s)"], 2, 6)).toMatchObject({ wounds: { head: true }, dead: true });
    expect(restoreMonsterInjury(["head: 2 Wound(s)"], 2, 6).dead).toBe(true);
    expect(restoreMonsterInjury(["torso: 6 Wound(s)"], 6, 6).dead).toBe(true);
    expect(restoreMonsterInjury(["leftArm: -1 Wound(s)", "tail: 1 Wound(s)"], 0, 6)).toEqual({ wounds: {}, dead: false });
  });
});

describe("Magic, Oracles, Events, maps, and Bestiary references", () => {
  it("contains every printed Arcane word and card-indexed Magick item", () => {
    expect(Object.values(ARCANE_MINOR_WORDS).every((words) => Object.keys(words).length === 14)).toBe(true);
    expect(Object.keys(ARCANE_MAJOR_WORDS)).toHaveLength(22);
    expect(Object.values(MAGICK_ITEMS).every((items) => items.length === 14)).toBe(true);
  });

  it("implements the printed Yes/No and Amount oracle bands", () => {
    expect(["3", "5", "7", "9"].map(yesNoResult)).toEqual(["No", "No", "No", "No"]);
    expect(yesNoResult("King")).toBe("Yes, but...");
    expect(yesNoResult("A")).toBeNull();
    expect(amountResult("2")).toBe("None");
    expect(amountResult("10")).toBe("Average");
    expect(amountResult("Queen")).toBe("Considerable");
    expect(amountResult("A")).toBe("Excessive");
    expect(Object.values(ORACLE_SUITS).every((table) => Object.keys(table).length === 14)).toBe(true);
    expect(Object.keys(ORACLE_SUBJECTS)).toHaveLength(21);
    expect(oracleSequenceToken(minor("coins", "7"))).toBe(oracleSequenceToken({ type: "major", rank: "VII", reversed: false }));
    expect(oracleSequenceToken(minor("coins", "Page"))).not.toBe(oracleSequenceToken({ type: "major", rank: "XI", reversed: false }));
  });

  it("contains 21 entries for each Event, map, and Bestiary table", () => {
    for (const table of [WILDERNESS_EVENTS, DUNGEON_EVENTS, SETTLEMENT_EVENTS, MAP_WILDERNESS, MAP_DUNGEON, MAP_SETTLEMENT, BESTIARY]) {
      expect(table).toHaveLength(21);
    }
    expect(Object.keys(CAROUSING_TABLE)).toHaveLength(15);
    expect(CAROUSING_TABLE.K).toContain("1-14 days");
    expect(CAROUSING_TABLE.K).not.toContain("1d14");
  });
});
