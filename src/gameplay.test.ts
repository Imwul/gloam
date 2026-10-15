import { describe, expect, it } from "vitest";
import { cardEconomyValid, freshState, sanitizeV2, type GameState } from "./App";
import {
  addMapRow, armorCoversPart, assignCreationVocation, beginAlchemy, canBeginAlchemy, canClaimAlchemyDose,
  canDrawInitialWord, canPlayCombatCard, canUsePlayerArmor, claimAlchemyDose,
  type AlchemyPreparation,
} from "./gameplay";
import { cardId, evaluateTest } from "./rules";

const recipe: AlchemyPreparation = {
  ingredient: "트롤의 심장", concoction: "회복약", hasPart: true, hasPot: true, hasKnowledge: true, hasVessel: true,
};
const successfulBrew = (): GameState => {
  const prepared = beginAlchemy(freshState(), recipe);
  const card = prepared.playerDeck.find(item => item.rank === "King" && item.suit === "cups")!;
  return { ...prepared, playerDeck: prepared.playerDeck.filter(item => cardId(item) !== cardId(card)),
    playerDiscard: [card], test: { ...prepared.test, firstCard: card,
      result: evaluateTest({ card, stat: prepared.character.stats.wands, testSuit: "wands" }) } };
};

describe("rulebook p. 25–27: armor protects its own body part and requires Swords", () => {
  it("does not let a helmet protect a torso or a left gauntlet protect the right arm", () => {
    expect(armorCoversPart("helmet", "head")).toBe(true);
    expect(armorCoversPart("helmet", "torso")).toBe(false);
    expect(armorCoversPart("leftGauntlet", "leftArm")).toBe(true);
    expect(armorCoversPart("leftGauntlet", "rightArm")).toBe(false);
    expect(armorCoversPart("rightGreave", "leftLeg")).toBe(false);
  });
  it("allows a shield to receive an ordinary blow at any body part", () => {
    for (const part of ["head", "torso", "leftArm", "rightArm", "leftLeg", "rightLeg"] as const) {
      expect(canUsePlayerArmor("shield", part, 1)).toBe(true);
    }
  });
  it("enforces the printed Swords threshold without blocking lighter armor", () => {
    expect(canUsePlayerArmor("cuirass", "torso", 2)).toBe(false);
    expect(canUsePlayerArmor("cuirass", "torso", 3)).toBe(true);
    expect(canUsePlayerArmor("gambeson", "torso", 1)).toBe(true);
    expect(canUsePlayerArmor("leftGauntlet", "leftArm", 1)).toBe(false);
  });
});

describe("rulebook p. 14–16: Vocation and one primary starting Talent", () => {
  it("replaces the previous primary starting Talent instead of collecting free starting Talents", () => {
    const state = freshState();
    state.character.vocation = "Mystic";
    state.character.talents = ["Magick", "Academic", "Nimble"];
    state.character.soloTalent = "Nimble";
    state.character.stats = { cups: 4, wands: 3, swords: 2, coins: 1 };
    const next = assignCreationVocation(state);
    expect(next.character.vocation).toBe("Herald");
    expect(next.character.talents).toEqual(["Academic", "Nimble", "Disarming Presence"]);
    expect(assignCreationVocation(next).character.talents).toEqual(next.character.talents);
  });
  it("preserves a solo bonus even when it is another Vocation's starting Talent", () => {
    const state = freshState();
    state.character.talents = ["Magick", "Sally Forth"];
    state.character.soloTalent = "Magick";
    expect(assignCreationVocation(state).character.talents).toEqual(["Magick", "Nimble"]);
  });
  it("leaves advanced or invalid stat arrays untouched by the creation shortcut", () => {
    const state = freshState();
    state.character.stats.coins = 5;
    expect(assignCreationVocation(state)).toBe(state);
    state.character.stats.coins = 3;
    expect(assignCreationVocation(state)).toBe(state);
  });
});

describe("rulebook p. 20, 38: initial spell words and later quest rewards", () => {
  it("grants the initial pair only to a character with Magick, including a solo bonus", () => {
    const state = freshState();
    expect(canDrawInitialWord(state, "minor")).toBe(false);
    state.character.talents = ["Magick"];
    expect(canDrawInitialWord(state, "minor")).toBe(true);
    expect(canDrawInitialWord(state, "major")).toBe(true);
    state.character.knownMinorWords.push({ suit: "Cups", key: "A" });
    expect(canDrawInitialWord(state, "minor")).toBe(false);
    expect(canDrawInitialWord(state, "major")).toBe(true);
    state.character.knownMajorWords.push({ key: "I", reversed: false });
    const restored = sanitizeV2(JSON.parse(JSON.stringify(state)));
    expect(canDrawInitialWord(restored, "minor")).toBe(false);
    expect(canDrawInitialWord(restored, "major")).toBe(false);
  });
  it("does not give a migrated spellbook another free first pair", () => {
    const state = freshState(); state.character.talents = ["Magick"];
    state.character.spells = [{ id: "old", name: "기존 주문", effectNote: "" }];
    expect(canDrawInitialWord(state, "minor")).toBe(false);
  });
  it("does not begin the first spell while fighting or incapacitated", () => {
    const state = freshState(); state.character.talents = ["Magick"];
    state.combat.active = true; expect(canDrawInitialWord(state, "major")).toBe(false);
    state.combat.active = false; state.character.wounds.head = true;
    expect(canDrawInitialWord(state, "major")).toBe(false);
  });
});

describe("rulebook p. 36: one dose for one successful brewing attempt", () => {
  it("requires the parts, pot, knowledge, vessel and a non-combat opportunity", () => {
    for (const field of ["hasPart", "hasPot", "hasKnowledge", "hasVessel"] as const) {
      const state = freshState(); expect(beginAlchemy(state, { ...recipe, [field]: false })).toBe(state);
    }
    const state = freshState(); state.combat.active = true;
    expect(canBeginAlchemy(state, recipe)).toBe(false);
    state.combat.active = false; expect(canBeginAlchemy(state, { ...recipe, concoction: " " })).toBe(false);
  });
  it("spends one Watch and binds a Wands Test to the submitted recipe", () => {
    const state = freshState(); state.watch = 3; state.turns = 2; state.rounds = 7;
    const draft = { ...recipe }; const next = beginAlchemy(state, draft); draft.concoction = "다른 물약";
    expect([next.day, next.watch, next.turns, next.rounds]).toEqual([2, 1, 2, 7]);
    expect(next.test).toMatchObject({ suit: "wands", stat: 2, firstCard: null,
      alchemy: { ingredient: "트롤의 심장", concoction: "회복약", doseRecorded: false } });
  });
  it("rejects an unrolled test, failure, and an old success merely named alchemy", () => {
    const pending = beginAlchemy(freshState(), recipe);
    expect(claimAlchemyDose(pending, "none")).toBe(pending);
    const failed = successfulBrew(); failed.test.result = { ...failed.test.result!, success: false, status: "failure" };
    expect(canClaimAlchemyDose(failed)).toBe(false);
    const old = successfulBrew(); delete old.test.alchemy;
    expect(canClaimAlchemyDose(old)).toBe(false);
  });
  it("records exactly one dose and prevents duplicate claims after save/reload", () => {
    const state = successfulBrew(); const next = claimAlchemyDose(state, "dose-1");
    expect(next.character.inventory).toEqual([expect.objectContaining({ id: "dose-1", name: "회복약 · 1회분", uses: 1, notes: "트롤의 심장에서 제조" })]);
    expect(cardEconomyValid(next)).toEqual({ player: true, referee: true });
    const restored = sanitizeV2(JSON.parse(JSON.stringify(next)));
    expect(claimAlchemyDose(restored, "dose-2")).toBe(restored);
    expect(restored.character.inventory).toHaveLength(1);
    expect(state.character.inventory).toHaveLength(0);
  });
  it("a new brewing attempt spends another Watch and needs another successful test", () => {
    const done = claimAlchemyDose(successfulBrew(), "dose-1");
    const next = beginAlchemy(done, { ...recipe, concoction: "다른 조제물" });
    expect(next.watch).toBe(done.watch + 1);
    expect(canClaimAlchemyDose(next)).toBe(false);
    expect(next.character.inventory).toHaveLength(1);
  });
});

describe("rulebook p. 30–31: Fool and discard actions", () => {
  it("allows any card, including the Fool, for Move, Draw/Sheathe and Throw", () => {
    for (const action of ["Move", "Draw/Sheathe", "Throw"]) expect(canPlayCombatCard("0", action)).toBe(true);
  });
  it("keeps the Fool out of ordinary combat Test cards", () => {
    for (const action of ["Attack", "Dodge", "Riposte", "Cast a Spell", "Grapple"]) {
      expect(canPlayCombatCard("0", action)).toBe(false);
      expect(canPlayCombatCard("2", action)).toBe(true);
    }
  });
});

describe("rulebook p. 40: maps can grow beyond sixteen areas", () => {
  it("adds new areas while preserving geography, notes, history and cards", () => {
    const state = freshState(); state.mapCells[0].notes = "강을 따라 길을 연결";
    const next = addMapRow(state);
    expect(next.mapCells).toHaveLength(20);
    expect(next.mapCells[0]).toBe(state.mapCells[0]);
    expect(next.mapCells[16]).toMatchObject({ x: 0, y: 4, card: null, notes: "" });
    expect(cardEconomyValid(next)).toEqual({ player: true, referee: true });
  });
  it("restores an expanded saved map instead of discarding its geography", () => {
    const state = addMapRow(addMapRow(freshState())); state.mapCells[23].notes = "다음 모험 장소";
    const restored = sanitizeV2(JSON.parse(JSON.stringify(state)));
    expect(restored.mapCells).toHaveLength(24); expect(restored.mapCells[23].notes).toBe("다음 모험 장소");
  });
});
