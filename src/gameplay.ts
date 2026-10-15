import type { GameState } from "./App";
import { ARMOR, TALENTS, VOCATION_FROM_SUIT } from "./gameData";
import { advanceGameTime, type Suit } from "./rules";

export type WoundPart = "head" | "torso" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

const armorNames = {
  helmet: "Helmet", cuirass: "Cuirass", gambeson: "Gambeson", chainmail: "Chainmail",
  leftGauntlet: "Gauntlet L", rightGauntlet: "Gauntlet R",
  leftGreave: "Greave L", rightGreave: "Greave R", shield: "Shield",
} as const;
export type ArmorKey = keyof typeof armorNames;
const armorParts: Record<WoundPart, string> = {
  head: "Head", torso: "Torso", leftArm: "L. Arm", rightArm: "R. Arm", leftLeg: "L. Leg", rightLeg: "R. Leg",
};

export const playerArmor = (key: ArmorKey) => ARMOR.find(item => item.name === armorNames[key])!;
export const armorCoversPart = (key: ArmorKey, part: WoundPart) =>
  key === "shield" || playerArmor(key).bodyPart === armorParts[part];
export const canUsePlayerArmor = (key: ArmorKey, part: WoundPart, swords: number) =>
  armorCoversPart(key, part) && swords >= playerArmor(key).swordsReq;

export const createTestTracker = (purpose = "", suit: Suit = "cups", stat = 1): GameState["test"] => ({
  purpose, suit, stat, modifier: 0, help: 0, opposedPenalty: 0,
  firstCard: null, pushedCard: null, result: null, resolveSpent: 0,
});

// p. 14–16: one primary Vocation and its starting Talent; solo bonus is separate.
export const assignCreationVocation = (state: GameState): GameState => {
  const stats = state.character.stats;
  if (Object.values(stats).sort((a, b) => a - b).join(",") !== "1,2,3,4") return state;
  const suit = (Object.keys(stats) as Suit[]).find(key => stats[key] === 4)!;
  const vocation = VOCATION_FROM_SUIT[suit];
  const starting = TALENTS[vocation].find(talent => talent.starting)!.name;
  const startingNames = new Set(Object.values(TALENTS).flat().filter(talent => talent.starting).map(talent => talent.name));
  const retained = state.character.talents.filter(name => !startingNames.has(name) || name === starting || name === state.character.soloTalent);
  return { ...state, character: { ...state.character, vocation, talents: [...new Set([...retained, starting])] } };
};

// p. 20, 38: the first spell grants one pair. Further words require quests.
export const canDrawInitialWord = (state: GameState, kind: "minor" | "major") =>
  state.character.talents.includes("Magick") && state.character.spells.length === 0
  && !state.combat.active && !state.character.dead && !state.character.wounds.head
  && (kind === "minor" ? state.character.knownMinorWords : state.character.knownMajorWords).length === 0;

export interface AlchemyRecipe { ingredient: string; concoction: string }
export interface AlchemyPreparation extends AlchemyRecipe {
  hasPart: boolean; hasPot: boolean; hasKnowledge: boolean; hasVessel: boolean;
}

export const canBeginAlchemy = (state: GameState, recipe: AlchemyPreparation) =>
  !state.combat.active && !state.character.dead && !state.character.wounds.head
  && !!recipe.ingredient.trim() && !!recipe.concoction.trim()
  && recipe.hasPart && recipe.hasPot && recipe.hasKnowledge && recipe.hasVessel;

// p. 36: one Watch and a Wands Test, bound to this recipe rather than the editable form.
export const beginAlchemy = (state: GameState, preparation: AlchemyPreparation): GameState => {
  if (!canBeginAlchemy(state, preparation)) return state;
  const recipe = { ingredient: preparation.ingredient.trim(), concoction: preparation.concoction.trim() };
  return {
    ...state, ...advanceGameTime(state, 8 * 60 * 60),
    test: { ...createTestTracker(`연금술 — ${recipe.concoction}; 재료: ${recipe.ingredient}; 1경점`, "wands", state.character.stats.wands), alchemy: { ...recipe, doseRecorded: false } },
  };
};

export const canClaimAlchemyDose = (state: GameState) =>
  !!state.test.alchemy && !state.test.alchemy.doseRecorded && state.test.suit === "wands"
  && !!state.test.firstCard && state.test.result?.success === true;

export const claimAlchemyDose = (state: GameState, itemId: string): GameState => {
  if (!canClaimAlchemyDose(state)) return state;
  const recipe = state.test.alchemy!;
  return {
    ...state, test: { ...state.test, alchemy: { ...recipe, doseRecorded: true } },
    character: { ...state.character, inventory: [...state.character.inventory, {
      id: itemId, name: `${recipe.concoction} · 1회분`, category: "other", slots: 1, damaged: false,
      uses: 1, notes: `${recipe.ingredient}에서 제조`, contents: "",
    }] },
  };
};

// p. 31: these actions discard any card. The Fool is not a normal Test card.
export const isCombatDiscardAction = (action: string) => ["Move", "Draw/Sheathe", "Throw"].includes(action);
export const canPlayCombatCard = (rank: string, action: string) => rank !== "0" || isCombatDiscardAction(action);

export const createMapCell = (x: number, y: number): GameState["mapCells"][number] => ({
  x, y, card: null, liveCard: false, type: null, label: "", extraCards: [], extraLabels: [],
  visited: false, notes: "", history: [],
});

// p. 40 has no 16-area limit. Additional rows keep existing geography and live cards.
export const addMapRow = (state: GameState): GameState => {
  const columns = Math.max(4, ...state.mapCells.map(cell => cell.x + 1));
  const y = Math.max(-1, ...state.mapCells.map(cell => cell.y)) + 1;
  return { ...state, mapCells: [...state.mapCells, ...Array.from({ length: columns }, (_, x) => createMapCell(x, y))] };
};
