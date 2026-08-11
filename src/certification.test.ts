import { describe, expect, it } from "vitest";
import {
  MAX_UNDO,
  cardEconomyValid,
  freshState,
  sanitizeV2,
  type GameState,
  type SaveBundle,
} from "./App";
import {
  createPlayerDeck,
  createRefereeDeck,
  dealCombatCards,
  drawCard,
  validateCardZones,
  type Card,
} from "./rules";

const clone = <T,>(value: T): T => structuredClone(value);

const assertZones = (state: GameState) => {
  const integrity = cardEconomyValid(state);
  expect(integrity.player).toBe(true);
  expect(integrity.referee).toBe(true);
};

const makeLog = (state: GameState, index: number, category: "combat" | "oracle" | "event" | "downtime" | "save") => ({
  id: `${category}-${index}`,
  at: `Session ${state.sessionNumber}`,
  day: state.day,
  watch: state.watch,
  category,
  text: `[Certification ${category}] campaign record ${index}; narrative remains referee-authored.`,
});

const recallForCertification = (state: GameState): GameState => ({
  ...state,
  playerDeck: createPlayerDeck(() => 0.5),
  playerDiscard: [],
  refereeDeck: createRefereeDeck(() => 0.5),
  refereeDiscard: [],
  combat: {
    ...state.combat,
    playerHand: [],
    playerInitiative: null,
    monsters: [],
  },
});

const runCombat = (initial: GameState, index: number): GameState => {
  let state = initial;
  const monsterId = `monster-${index}`;
  state = {
    ...state,
    combat: {
      ...state.combat,
      active: true,
      monsters: [{
        id: monsterId,
        monsterId: 1,
        name: "Certification foe",
        woundsTaken: 0,
        woundNotes: [],
        armorNotches: {},
        hand: [],
        initiative: null,
        initiativeRevealed: false,
        notes: "",
      }],
    },
  };

  const dealt = dealCombatCards(state.playerDeck, state.combat.playerHand, [[]], () => 0.75);
  state = {
    ...state,
    playerDeck: dealt.deck,
    combat: {
      ...state.combat,
      playerHand: dealt.playerHand,
      monsters: state.combat.monsters.map((monster) => ({ ...monster, hand: dealt.monsterHands[0] })),
    },
  };
  assertZones(state);

  if (dealt.foolDrawn) {
    const recalled = recallForCertification(state);
    return { ...recalled, logs: [makeLog(recalled, index, "combat"), ...recalled.logs] };
  }
  const playerHand = [...state.combat.playerHand];
  const playerInitiative = playerHand.shift() ?? null;
  const monsterHand = [...state.combat.monsters[0].hand];
  const monsterInitiative = monsterHand.shift() ?? null;
  state = {
    ...state,
    combat: {
      ...state.combat,
      playerHand,
      playerInitiative,
      monsters: [{ ...state.combat.monsters[0], hand: monsterHand, initiative: monsterInitiative }],
    },
  };
  assertZones(state);

  const played: Card[] = [];
  const reaction: Card[] = [];
  const boundCards: Card[] = [];
  const playerPlayed = state.combat.playerHand[0];
  const monsterReaction = state.combat.monsters[0].hand[0];
  if (playerPlayed) played.push(playerPlayed);
  if (monsterReaction) reaction.push(monsterReaction);
  const remainingPlayerHand = state.combat.playerHand.filter((card) => card !== playerPlayed);
  const remainingMonsterHand = state.combat.monsters[0].hand.filter((card) => card !== monsterReaction);
  expect(validateCardZones([
    state.playerDeck,
    state.playerDiscard,
    remainingPlayerHand,
    playerInitiative ? [playerInitiative] : [],
    remainingMonsterHand,
    monsterInitiative ? [monsterInitiative] : [],
    played,
    reaction,
    boundCards,
  ], createPlayerDeck(() => 0.5))).toBe(true);

  state = {
    ...state,
    playerDiscard: [
      ...state.playerDiscard,
      ...played,
      ...reaction,
      ...remainingMonsterHand,
      ...(monsterInitiative ? [monsterInitiative] : []),
      ...(playerInitiative ? [playerInitiative] : []),
    ],
    combat: {
      ...state.combat,
      active: false,
      playerHand: remainingPlayerHand,
      playerInitiative: null,
      monsters: [],
    },
    logs: [makeLog(state, index, "combat"), ...state.logs],
  };
  assertZones(state);
  return state;
};

const runOracleAndEvent = (initial: GameState, index: number): GameState => {
  let state = initial;
  const player = drawCard(state.playerDeck, () => 0.75);
  if (!player.card || player.card.rank === "0") return recallForCertification({ ...state, playerDeck: player.deck });
  state = {
    ...state,
    playerDeck: player.deck,
    playerDiscard: [...state.playerDiscard, player.card],
    oracles: [{
      id: `oracle-${index}`,
      kind: "amount",
      cards: [player.card],
      result: "Printed table output",
      triggeredEvent: false,
      at: `Session ${state.sessionNumber}`,
    }, ...state.oracles],
    logs: [makeLog(state, index, "oracle"), ...state.logs],
  };
  assertZones(state);

  const referee = drawCard(state.refereeDeck, () => 0.25);
  if (!referee.card) return state;
  state = {
    ...state,
    refereeDeck: referee.deck,
    refereeDiscard: [...state.refereeDiscard, referee.card],
    events: [{
      id: `event-${index}`,
      card: referee.card,
      type: "wilderness",
      text: "Printed Event table output",
      reversedInstruction: referee.card.reversed,
      at: `Session ${state.sessionNumber}`,
    }, ...state.events],
    logs: [makeLog(state, index, "event"), ...state.logs],
  };
  assertZones(state);
  return state;
};

describe("Release 1.0 production certification", () => {
  it("keeps 57/21 intact through more than 100 combat, draw, oracle, and zone transitions", () => {
    let state = freshState();
    for (let index = 1; index <= 125; index += 1) {
      state = runCombat(state, index);
      state = runOracleAndEvent(state, index);
      if (state.playerDeck.length < 8 || state.refereeDeck.length < 2) state = recallForCertification(state);
      assertZones(state);
    }
    expect(state.logs.filter((entry) => entry.category === "combat")).toHaveLength(125);
    expect(state.oracles.length).toBeGreaterThan(100);
    expect(state.events.length).toBeGreaterThan(100);
  });

  it("round-trips one 100-session campaign with hundreds of records and 100 undo/save cycles", () => {
    let state = freshState();
    let undo: GameState[] = [];
    let largestSaveBytes = 0;
    let slowestSaveMs = 0;
    let slowestRestoreMs = 0;

    state = {
      ...state,
      campaignName: "Release 1.0 Certification",
      character: {
        ...state.character,
        name: "Aster Vale",
        age: 32,
        vocation: "Mystic",
        lifepath: ["Birth context", "Lifepath event", "Lifepath event"],
        goals: [{ id: "goal", text: "Complete the long campaign", status: "active", note: "Referee-authored" }],
        instincts: ["Protect the company", "Question strange magic", "Keep a road home"],
        friends: [{ id: "friend", name: "Mara", location: "Old road", connection: "Referee-authored bond", history: ["Session 1"] }],
        foes: [{ id: "foe", name: "The Ash Bailiff", location: "North gate", connection: "Referee-authored enmity", history: ["Session 2"] }],
        npcs: [{ id: "npc", name: "Brother Senn", location: "Abbey", connection: "Referee note", history: ["Session 3"] }],
        hirelings: [{ id: "hireling", name: "Toma", notes: "Referee record", status: "active", paidThisWeek: true, history: ["Session 4"] }],
        talents: ["Magick"],
        inventory: [
          { id: "weapon", name: "Longsword", category: "weapon", slots: 1, damaged: false, uses: null, notes: "Printed equipment", contents: "" },
          { id: "pack", name: "Backpack", category: "container", slots: 1, damaged: false, uses: null, notes: "", contents: "Rations" },
        ],
        knownMinorWords: [{ suit: "Wands", key: "3" }],
        knownMajorWords: [{ key: "IX", reversed: false }],
        spells: [{ id: "spell", name: "Printed words only", effectNote: "Referee decision" }],
        boundMagic: [{ id: "bound", object: "Lantern", spell: "Printed words only", charges: 2 }],
      },
    };

    for (let session = 1; session <= 100; session += 1) {
      undo = [...undo.slice(-(MAX_UNDO - 1)), clone(state)];
      state = {
        ...state,
        sessionNumber: session,
        day: state.day + 1,
        character: {
          ...state.character,
          xp: state.character.xp + 3,
          wounds: { ...state.character.wounds, torso: session % 2 === 0 },
        },
        logs: [makeLog(state, session, "downtime"), ...state.logs],
      };
      state = runCombat(state, session);
      state = runOracleAndEvent(state, session);
      state = runOracleAndEvent(state, session + 100);
      state = runOracleAndEvent(state, session + 200);
      if (state.playerDeck.length < 8 || state.refereeDeck.length < 4) state = recallForCertification(state);
      assertZones(state);

      const saveStarted = performance.now();
      const serialized = JSON.stringify({ version: 2, state, undo } satisfies SaveBundle);
      slowestSaveMs = Math.max(slowestSaveMs, performance.now() - saveStarted);
      largestSaveBytes = Math.max(largestSaveBytes, new TextEncoder().encode(serialized).byteLength);

      const restoreStarted = performance.now();
      const restored = JSON.parse(serialized) as SaveBundle;
      state = sanitizeV2(restored.state);
      undo = restored.undo.slice(-MAX_UNDO).map(sanitizeV2);
      slowestRestoreMs = Math.max(slowestRestoreMs, performance.now() - restoreStarted);
      assertZones(state);

      const previous = undo.pop();
      expect(previous).toBeDefined();
      if (previous) {
        const present = state;
        state = previous;
        assertZones(state);
        state = present;
      }
    }

    expect(state.sessionNumber).toBe(100);
    expect(state.events.length).toBeGreaterThanOrEqual(200);
    expect(state.oracles.length).toBeGreaterThanOrEqual(200);
    expect(state.logs.filter((entry) => entry.category === "combat")).toHaveLength(100);
    expect(state.character.boundMagic[0]).toMatchObject({ object: "Lantern", charges: 2 });
    expect(state.character.inventory.map((item) => item.name)).toEqual(["Longsword", "Backpack"]);
    expect(state.character.friends[0].name).toBe("Mara");
    expect(state.character.foes[0].name).toBe("The Ash Bailiff");
    expect(state.character.npcs[0].name).toBe("Brother Senn");
    expect(state.character.hirelings[0]).toMatchObject({ name: "Toma", paidThisWeek: true });
    expect(state.character.spells).toHaveLength(1);
    expect(state.character.knownMinorWords).toHaveLength(1);
    expect(state.character.knownMajorWords).toHaveLength(1);
    expect(largestSaveBytes).toBeLessThan(5_000_000);
    expect(slowestSaveMs).toBeLessThan(100);
    expect(slowestRestoreMs).toBeLessThan(250);
    console.info(`[release-certification] save=${largestSaveBytes}B serialize<=${slowestSaveMs.toFixed(2)}ms restore<=${slowestRestoreMs.toFixed(2)}ms`);
  });

  it("preserves known words, spellbook, bound charges, and Resolve through 100 long-use cycles", () => {
    let state = freshState();
    state = {
      ...state,
      character: {
        ...state.character,
        talents: ["Magick", "Bind Magick", "Undo Magick"],
        knownMinorWords: [{ suit: "Cups", key: "Queen" }],
        knownMajorWords: [{ key: "XIV", reversed: true }],
        spells: [{ id: "spell", name: "Known printed words", effectNote: "Effect remains a Referee decision" }],
        boundMagic: [{ id: "bound", object: "Ash staff", spell: "Known printed words", charges: 0 }],
      },
    };

    for (let cycle = 1; cycle <= 100; cycle += 1) {
      const gained = Math.min(10, state.character.resolve + 1);
      state = {
        ...state,
        refereeResolve: state.refereeResolve + 1,
        character: {
          ...state.character,
          resolve: gained - 1,
          boundMagic: state.character.boundMagic.map((bound) => ({ ...bound, charges: bound.charges + 1 })),
        },
        logs: [{
          id: `magic-${cycle}`,
          at: `Session ${cycle}`,
          day: cycle,
          watch: 1,
          category: "magic",
          text: `[Certification] Referee confirmed the Resolve gain; Bind Magick spent it. Undo Magick outcome remains manual.`,
        }, ...state.logs],
      };

      const exported = JSON.stringify({ version: 2, state, undo: [] } satisfies SaveBundle);
      const imported = JSON.parse(exported) as SaveBundle;
      state = sanitizeV2(imported.state);
      assertZones(state);
    }

    expect(state.character.resolve).toBe(0);
    expect(state.refereeResolve).toBe(100);
    expect(state.character.knownMinorWords).toEqual([{ suit: "Cups", key: "Queen" }]);
    expect(state.character.knownMajorWords).toEqual([{ key: "XIV", reversed: true }]);
    expect(state.character.spells).toHaveLength(1);
    expect(state.character.boundMagic).toEqual([{ id: "bound", object: "Ash staff", spell: "Known printed words", charges: 100 }]);
    expect(state.logs.filter((entry) => entry.category === "magic")).toHaveLength(100);
  });

  it("repairs a duplicated live card without discarding campaign history", () => {
    const state = freshState();
    const duplicate = state.playerDeck[0];
    const corrupted: GameState = { ...state, playerDiscard: [duplicate], logs: [makeLog(state, 1, "save")] };
    expect(cardEconomyValid(corrupted).player).toBe(false);
    const repaired = sanitizeV2(corrupted);
    expect(cardEconomyValid(repaired)).toEqual({ player: true, referee: true });
    expect(repaired.logs.some((entry) => entry.text.includes("campaign record 1"))).toBe(true);
  });
});
