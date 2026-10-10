import { Suspense, createContext, lazy, useContext, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ARCANE_MAJOR_WORDS,
  ARCANE_MINOR_WORDS,
  ARMOR,
  BESTIARY,
  CAROUSING_TABLE_KO,
  DUNGEON_EVENTS_KO,
  FOLK_ROAD,
  FOLK_ROAD_KO,
  LIFEPATH_EVENTS,
  MAGICK_ITEMS,
  MAGICK_ITEM_TEXT_KO,
  MAP_DUNGEON_KO,
  MAP_SETTLEMENT_KO,
  MAP_WILDERNESS_KO,
  ORACLE_SUBJECTS_KO,
  ORACLE_SUITS_KO,
  SETTLEMENT_EVENTS_KO,
  TRADE_GOODS,
  WEAPONS,
  WILDERNESS_EVENTS_KO,
} from "./gameData";
import PlayTable from "./play/PlayTable";
import QuickRules from "./play/QuickRules";
import {
  advanceGameTime,
  gainResolveBalances,
  spendResolveBalances,
  restoreMonsterInjury,
  MAJOR_RANKS,
  SUITS,
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
  isFatalHeadWound,
  normalizeCard,
  oracleSequenceToken,
  resolveArmor,
  tableKey,
  validateCardZones,
  woundedSpeed,
  yesNoResult,
  type Card,
  type Suit,
  type TestResult,
} from "./rules";

type Tab = "play" | "character" | "tests" | "magic" | "map" | "downtime" | "log";
const RulebookTransplant = lazy(() => import("./rulebook/RulebookTransplant"));
const RulebookOpenContext = createContext<(sectionId?: string) => void>(() => undefined);
type MapType = "wilderness" | "dungeon" | "settlement";
type WoundPart = "head" | "torso" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";
type ArmorKey = "helmet" | "cuirass" | "gambeson" | "chainmail" | "leftGauntlet" | "rightGauntlet" | "leftGreave" | "rightGreave" | "shield";

interface Goal {
  id: string;
  text: string;
  status: "active" | "completed" | "impossible" | "discarded";
  note: string;
}

interface Contact {
  id: string;
  name: string;
  location: string;
  connection: string;
  history: string[];
}

interface Hireling {
  id: string;
  name: string;
  notes: string;
  status: "active" | "resigned";
  paidThisWeek: boolean;
  history: string[];
}

interface InventoryItem {
  id: string;
  name: string;
  category: "weapon" | "armor" | "trade" | "magic" | "container" | "other";
  slots: 0 | 1;
  damaged: boolean;
  uses: number | null;
  notes: string;
  contents: string;
}

interface KnownMinorWord {
  suit: "Cups" | "Wands" | "Swords" | "Coins";
  key: string;
}

interface KnownMajorWord {
  key: string;
  reversed: boolean;
}

interface Spell {
  id: string;
  name: string;
  effectNote: string;
}

interface BoundMagic {
  id: string;
  object: string;
  spell: string;
  charges: number;
}

interface Character {
  name: string;
  age: number;
  vocation: string;
  portrait: string;
  notes: string;
  stats: Record<Suit, number>;
  resolve: number;
  xp: number;
  wounds: Record<WoundPart, boolean>;
  dead: boolean;
  armorNotches: Record<ArmorKey, number>;
  lifepath: string[];
  goals: Goal[];
  instincts: string[];
  friends: Contact[];
  foes: Contact[];
  npcs: Contact[];
  hirelings: Hireling[];
  talents: string[];
  inventory: InventoryItem[];
  knownMinorWords: KnownMinorWord[];
  knownMajorWords: KnownMajorWord[];
  spells: Spell[];
  boundMagic: BoundMagic[];
  soloTalent?: string;
}

interface LogEntry {
  id: string;
  at: string;
  day: number;
  watch: number;
  category: "character" | "test" | "combat" | "magic" | "oracle" | "event" | "map" | "downtime" | "save" | "note";
  text: string;
}

interface MapHistory {
  id: string;
  card: Card;
  type: MapType;
  label: string;
  at: string;
}

interface MapCell {
  x: number;
  y: number;
  card: Card | null;
  liveCard: boolean;
  type: MapType | null;
  label: string;
  extraCards: Card[];
  extraLabels: string[];
  visited: boolean;
  notes: string;
  history: MapHistory[];
}

interface EventRecord {
  id: string;
  card: Card;
  type: MapType;
  text: string;
  reversedInstruction: boolean;
  at: string;
}

interface OracleRecord {
  id: string;
  kind: "yes-no" | "amount" | "action-subject";
  cards: Card[];
  result: string;
  triggeredEvent: boolean;
  at: string;
}

interface RoadFolkRecord {
  card: Card;
  occupation: string;
  femaleName: string;
  maleName: string;
  personality: string;
}

interface MonsterInCombat {
  id: string;
  monsterId: number;
  name: string;
  woundsTaken: number;
  woundNotes: string[];
  armorNotches: Record<string, number>;
  hand: Card[];
  initiative: Card | null;
  initiativeRevealed: boolean;
  notes: string;
  wounds?: Partial<Record<WoundPart, boolean>>;
  dead?: boolean;
  attackWounds?: number;
}

interface CombatResult {
  id: string;
  actor: string;
  action: string;
  card: Card;
  total: number | null;
  target: number | null;
  status: string;
  greatSuccess: boolean;
  rawWounds: number;
  baseWounds?: number;
  targetId?: string;
}

interface TestTracker {
  purpose: string;
  suit: Suit;
  stat: number;
  modifier: number;
  help: number;
  opposedPenalty: number;
  firstCard: Card | null;
  pushedCard: Card | null;
  result: TestResult | null;
  resolveSpent: number;
  disarmingPresenceUsed?: boolean;
}

export interface GameState {
  version: 2;
  campaignName: string;
  day: number;
  watch: number;
  turns: number;
  rounds: number;
  sessionNumber: number;
  sessionStarted?: boolean;
  settledSession?: number;
  downtimePlan?: string;
  pendingDowntimeGoalResolve?: number;
  character: Character;
  refereeResolve: number;
  playerDeck: Card[];
  playerDiscard: Card[];
  refereeDeck: Card[];
  refereeDiscard: Card[];
  test: TestTracker;
  combat: {
    active: boolean;
    round: number;
    playerHand: Card[];
    playerInitiative: Card | null;
    playerInitiativeRevealed: boolean;
    foolPending: boolean;
    monsters: MonsterInCombat[];
    lastResult: CombatResult | null;
    objective?: string;
    sallyForthUsed?: boolean;
    dealtRound?: number;
  };
  mapType: MapType;
  mapCells: MapCell[];
  events: EventRecord[];
  oracles: OracleRecord[];
  lastOracleRank: string | null;
  roadFolk: RoadFolkRecord | null;
  logs: LogEntry[];
}

export interface SaveBundle {
  version: 2;
  state: GameState;
  undo: GameState[];
}

const STORAGE_KEY = "gloam_companion_v2";
const LEGACY_KEY = "gloam_rpg_state";
export const MAX_UNDO = 25;
const now = () => new Date().toLocaleString();
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const emptyTest = (): TestTracker => ({
  purpose: "",
  suit: "cups",
  stat: 1,
  modifier: 0,
  help: 0,
  opposedPenalty: 0,
  firstCard: null,
  pushedCard: null,
  result: null,
  resolveSpent: 0,
});

const emptyMap = (): MapCell[] => Array.from({ length: 16 }, (_, index) => ({
  x: index % 4,
  y: Math.floor(index / 4),
  card: null,
  liveCard: false,
  type: null,
  label: "",
  extraCards: [],
  extraLabels: [],
  visited: false,
  notes: "",
  history: [],
}));

const freshCharacter = (): Character => ({
  name: "",
  age: 0,
  vocation: "",
  portrait: "",
  notes: "",
  stats: { cups: 1, wands: 2, swords: 3, coins: 4 },
  resolve: 0,
  xp: 0,
  wounds: { head: false, torso: false, leftArm: false, rightArm: false, leftLeg: false, rightLeg: false },
  dead: false,
  armorNotches: {
    helmet: 0,
    cuirass: 0,
    gambeson: 0,
    chainmail: 0,
    leftGauntlet: 0,
    rightGauntlet: 0,
    leftGreave: 0,
    rightGreave: 0,
    shield: 0,
  },
  lifepath: [],
  goals: [],
  instincts: ["", "", ""],
  friends: [],
  foes: [],
  npcs: [],
  hirelings: [],
  talents: [],
  inventory: [],
  knownMinorWords: [],
  knownMajorWords: [],
  spells: [],
  boundMagic: [],
});

// eslint-disable-next-line react-refresh/only-export-components -- certification harness exercises the production state factory
export const freshState = (): GameState => ({
  version: 2,
  campaignName: "",
  day: 1,
  watch: 1,
  turns: 0,
  rounds: 0,
  sessionNumber: 0,
  sessionStarted: false,
  settledSession: 0,
  downtimePlan: "",
  character: freshCharacter(),
  refereeResolve: 0,
  playerDeck: createPlayerDeck(),
  playerDiscard: [],
  refereeDeck: createRefereeDeck(),
  refereeDiscard: [],
  test: emptyTest(),
  combat: {
    active: false,
    round: 1,
    playerHand: [],
    playerInitiative: null,
    playerInitiativeRevealed: false,
    foolPending: false,
    monsters: [],
    lastResult: null,
  },
  mapType: "wilderness",
  mapCells: emptyMap(),
  events: [],
  oracles: [],
  lastOracleRank: null,
  roadFolk: null,
  logs: [],
});

const logEntry = (state: GameState, category: LogEntry["category"], text: string): LogEntry => ({
  id: uid(),
  at: now(),
  day: state.day,
  watch: state.watch,
  category,
  text,
});

const advanceWatch = (state: GameState, watches = 1) => advanceGameTime(state, watches * 8 * 60 * 60);

const allRefereeLiveZones = (state: GameState): Card[][] => {
  const zones: Card[][] = [state.refereeDeck, state.refereeDiscard];
  for (const cell of state.mapCells) {
    if (cell.liveCard && cell.card) zones.push([cell.card, ...cell.extraCards]);
  }
  return zones;
};

// eslint-disable-next-line react-refresh/only-export-components -- shared with the release certification harness
export const cardEconomyValid = (state: GameState) => ({
  player: validateCardZones([
    state.playerDeck,
    state.playerDiscard,
    state.combat.playerHand,
    state.combat.playerInitiative ? [state.combat.playerInitiative] : [],
    ...state.combat.monsters.map((monster) => monster.hand),
    ...state.combat.monsters.filter((monster) => monster.initiative).map((monster) => [monster.initiative as Card]),
  ], createPlayerDeck(() => 0.5)),
  referee: validateCardZones(allRefereeLiveZones(state), createRefereeDeck(() => 0.5)),
});

const recallBothDecks = (state: GameState, reason: string): GameState => ({
  ...state,
  playerDeck: createPlayerDeck(),
  playerDiscard: [],
  refereeDeck: createRefereeDeck(),
  refereeDiscard: [],
  test: emptyTest(),
  mapCells: state.mapCells.map((cell) => ({ ...cell, liveCard: false })),
  combat: {
    ...state.combat,
    playerHand: [],
    playerInitiative: null,
    playerInitiativeRevealed: false,
    foolPending: false,
    monsters: state.combat.monsters.map((monster) => ({
      ...monster,
      hand: [],
      initiative: null,
      initiativeRevealed: false,
    })),
  },
  logs: [logEntry(state, "event", `[광대] ${reason}. 양쪽 덱의 모든 실물 카드를 거두어 다시 섞었습니다.`), ...state.logs],
});

const cleanCards = (value: unknown): Card[] => Array.isArray(value)
  ? value.map(normalizeCard).filter((card): card is Card => card !== null)
  : [];

const migrateLegacy = (legacy: Record<string, unknown>): GameState => {
  const next = freshState();
  const rawCharacter = legacy.character && typeof legacy.character === "object"
    ? legacy.character as Record<string, unknown>
    : {};
  const rawStats = rawCharacter.stats && typeof rawCharacter.stats === "object"
    ? rawCharacter.stats as Record<string, unknown>
    : {};
  const inventory = Array.isArray(rawCharacter.inventory) ? rawCharacter.inventory : [];
  next.character = {
    ...next.character,
    name: typeof rawCharacter.name === "string" ? rawCharacter.name : "",
    age: typeof rawCharacter.age === "number" ? rawCharacter.age : 0,
    vocation: typeof rawCharacter.vocation === "string" ? rawCharacter.vocation : "",
    portrait: typeof rawCharacter.portrait === "string" ? rawCharacter.portrait : "",
    notes: typeof rawCharacter.notes === "string" ? rawCharacter.notes : "",
    xp: typeof rawCharacter.xp === "number" ? clamp(rawCharacter.xp, 0, 999) : 0,
    resolve: typeof rawCharacter.resolve === "number" ? clamp(rawCharacter.resolve, 0, 10) : 0,
    stats: {
      cups: typeof rawStats.cups === "number" ? clamp(rawStats.cups, 1, 6) : 1,
      wands: typeof rawStats.wands === "number" ? clamp(rawStats.wands, 1, 6) : 2,
      swords: typeof rawStats.swords === "number" ? clamp(rawStats.swords, 1, 6) : 3,
      coins: typeof rawStats.coins === "number" ? clamp(rawStats.coins, 1, 6) : 4,
    },
    lifepath: Array.isArray(rawCharacter.lifepathLogs) ? rawCharacter.lifepathLogs.filter((item): item is string => typeof item === "string") : [],
    instincts: Array.isArray(rawCharacter.instincts)
      ? rawCharacter.instincts.filter((item): item is string => typeof item === "string").slice(0, 3)
      : ["", "", ""],
    inventory: inventory.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((name) => ({
      id: uid(),
      name,
      category: "other" as const,
      slots: 1 as const,
      damaged: false,
      uses: name.toLowerCase().includes("rations") || name.includes("식량") ? 7 : null,
      notes: "",
      contents: "",
    })),
    goals: Array.isArray(rawCharacter.goals) ? rawCharacter.goals.map((goal) => {
      if (typeof goal === "string") return { id: uid(), text: goal, status: "active" as const, note: "" };
      const raw = goal && typeof goal === "object" ? goal as Record<string, unknown> : {};
      const oldStatus = raw.status;
      return {
        id: typeof raw.id === "string" ? raw.id : uid(),
        text: typeof raw.text === "string" ? raw.text : "",
        status: oldStatus === "completed" ? "completed" as const : oldStatus === "abandoned" ? "discarded" as const : "active" as const,
        note: typeof raw.milestoneNote === "string" ? raw.milestoneNote : "",
      };
    }) : [],
    talents: Array.isArray(rawCharacter.unlockedTalents)
      ? rawCharacter.unlockedTalents.filter((item): item is string => typeof item === "string")
      : [],
    spells: Array.isArray(rawCharacter.spellbook)
      ? rawCharacter.spellbook.filter((item): item is string => typeof item === "string").map((name) => ({ id: uid(), name, effectNote: "" }))
      : [],
  };
  next.day = typeof legacy.day === "number" ? Math.max(1, legacy.day) : 1;
  next.watch = typeof legacy.watch === "number" ? clamp(legacy.watch, 1, 3) : 1;
  const legacyJournals = Array.isArray(legacy.journals) ? legacy.journals : [];
  next.logs = legacyJournals.map((entry) => {
    const raw = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
    return {
      id: typeof raw.id === "string" ? raw.id : uid(),
      at: typeof raw.date === "string" ? raw.date : now(),
      day: typeof raw.day === "number" ? raw.day : next.day,
      watch: typeof raw.watch === "number" ? raw.watch : next.watch,
      category: "note" as const,
      text: typeof raw.text === "string" ? raw.text : String(entry),
    };
  });
  next.logs.unshift(logEntry(next, "save", "기존 저장을 v2로 마이그레이션했습니다. 카드 경제는 중복 방지를 위해 정규 덱으로 복구했습니다."));
  return next;
};

// eslint-disable-next-line react-refresh/only-export-components -- shared with the release certification harness
export const sanitizeV2 = (candidate: GameState): GameState => {
  const base = freshState();
  const next: GameState = {
    ...base,
    ...candidate,
    version: 2,
    character: { ...base.character, ...candidate.character },
    test: { ...base.test, ...candidate.test },
    combat: { ...base.combat, ...candidate.combat },
    playerDeck: cleanCards(candidate.playerDeck),
    playerDiscard: cleanCards(candidate.playerDiscard),
    refereeDeck: cleanCards(candidate.refereeDeck),
    refereeDiscard: cleanCards(candidate.refereeDiscard),
    mapCells: Array.isArray(candidate.mapCells) && candidate.mapCells.length === 16
      ? candidate.mapCells.map((cell) => ({ ...cell, extraCards: cleanCards(cell.extraCards), extraLabels: Array.isArray(cell.extraLabels) ? cell.extraLabels : [] }))
      : emptyMap(),
    logs: Array.isArray(candidate.logs) ? candidate.logs : [],
    events: Array.isArray(candidate.events) ? candidate.events : [],
    oracles: Array.isArray(candidate.oracles) ? candidate.oracles : [],
  };
  next.combat.monsters = next.combat.monsters.map(monster => {
    const armorParts: Record<string, WoundPart> = { helmet: "head", cuirass: "torso", gambeson: "torso", chainmail: "torso", leftGauntlet: "leftArm", rightGauntlet: "rightArm", leftGreave: "leftLeg", rightGreave: "rightLeg" };
    const armorNotches = { ...monster.armorNotches };
    for (const [label, notches] of Object.entries(armorNotches)) if (!label.includes(":") && armorParts[label]) { armorNotches[`${armorParts[label]}:${label}`] ??= notches; delete armorNotches[label]; }
    const restored = restoreMonsterInjury(monster.woundNotes || [], monster.woundsTaken, BESTIARY.find(item => item.id === monster.monsterId)?.wounds ?? Infinity);
    return { ...monster, armorNotches, wounds: monster.wounds ?? restored.wounds, dead: monster.dead ?? restored.dead };
  });
  next.character.resolve = clamp(next.character.resolve, 0, 10);
  next.day = Math.max(1, next.day);
  next.watch = clamp(next.watch, 1, 3);
  const integrity = cardEconomyValid(next);
  if (!integrity.player || !integrity.referee) {
    const repaired = recallBothDecks(next, "저장 데이터의 카드 누락 또는 중복을 감지");
    repaired.logs.unshift(logEntry(repaired, "save", "불가능한 카드 상태를 감지해 카드 영역만 복구했습니다. 캠페인 기록과 지도 이력은 유지됩니다."));
    return repaired;
  }
  return next;
};

const loadBundle = (): SaveBundle => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SaveBundle;
      if (parsed.version === 2 && parsed.state) {
        return {
          version: 2,
          state: sanitizeV2(parsed.state),
          undo: Array.isArray(parsed.undo) ? parsed.undo.slice(-MAX_UNDO).map(sanitizeV2) : [],
        };
      }
    }
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) return { version: 2, state: migrateLegacy(JSON.parse(legacyRaw) as Record<string, unknown>), undo: [] };
  } catch {
    const state = freshState();
    state.logs.push(logEntry(state, "save", "손상된 저장 데이터를 읽지 못해 새 안전 저장을 시작했습니다."));
    return { version: 2, state, undo: [] };
  }
  return { version: 2, state: freshState(), undo: [] };
};

const mapTable = (type: MapType) => type === "wilderness" ? MAP_WILDERNESS_KO : type === "dungeon" ? MAP_DUNGEON_KO : MAP_SETTLEMENT_KO;
const eventTable = (type: MapType) => type === "wilderness" ? WILDERNESS_EVENTS_KO : type === "dungeon" ? DUNGEON_EVENTS_KO : SETTLEMENT_EVENTS_KO;

const vocationFromSuit: Record<Suit, string> = {
  cups: "Herald",
  swords: "Knight-Errant",
  wands: "Mystic",
  coins: "Cutpurse",
};

const TALENTS: Record<string, { name: string; textKo: string; starting?: boolean }[]> = {
  Herald: [
    { name: "Disarming Presence", textKo: "반응 판정에 +3을 더한다.", starting: true },
    { name: "Academic", textKo: "문화·제도·역사에 관한 사실 하나를 심판의 재량에 따라 기억해 낸다." },
    { name: "Duel of Wits", textKo: "청중이 보는 앞에서 논쟁에 이긴다. 상대의 마음까지 반드시 바뀌는 것은 아니다." },
    { name: "Inspire", textKo: "누군가의 판정에 +3을 준다. 판정 전에 선언해야 한다." },
    { name: "Parley", textKo: "말이 통하는 적대적 생물을 진정시킨다. 전투가 시작된 뒤에는 쓸 수 없다." },
    { name: "Verity & Guile", textKo: "거짓을 알아차리거나, 컵 판정으로 자신의 거짓을 믿게 한다." },
  ],
  "Knight-Errant": [
    { name: "Sally Forth", textKo: "전투 라운드마다 한 번, 전투 행동을 하나 더 한다.", starting: true },
    { name: "Geas", textKo: "단순한 임무를 명한다. 대상은 저항 판정을 하며, 한 번에 하나만 유지된다." },
    { name: "Itinerant Hospitality", textKo: "어느 장원이나 성에서든 숙소와 따뜻한 식사를 얻는다." },
    { name: "Martial Dominance", textKo: "자신의 사거리로 들어오거나 빠져나가는 생물을 대응으로 공격한다." },
    { name: "Oath-sworn", textKo: "맹세를 좇는 행동에 +3을 얻는다. 실패하면 서약 파기자로 낙인찍힌다." },
    { name: "Trial by Combat", textKo: "결투를 청한다. 거절한 상대는 위축되어 1차례 동안 사회 판정에 +3을 허용한다." },
  ],
  Mystic: [
    { name: "Magick", textKo: "두 단어로 된 비전 주문 하나를 알고 시작하며, 주문을 시전할 수 있다.", starting: true },
    { name: "Augury", textKo: "행동 방침을 물으면 심판이 길함, 흉함, 둘 다, 또는 어느 쪽도 아님으로 답한다." },
    { name: "Sixth Sense", textKo: "비술을 희미한 녹빛과 자줏빛 안개로 감지한다." },
    { name: "Familiar", textKo: "임프나 고양이 하나를 부른다. 부상 하나를 입으면 사라진다." },
    { name: "Undo Magick", textKo: "주문을 상쇄하거나 해제한다. 강력한 비술은 완드 판정이 필요할 수 있다." },
    { name: "Bind Magick", textKo: "주문을 물건에 봉한다. 결의 1점마다 충전 하나를 얻는다." },
  ],
  Cutpurse: [
    { name: "Nimble", textKo: "공격 대상이 된 뒤 손패 한 장과 선제권 카드를 맞바꾼다.", starting: true },
    { name: "One with the Shadows", textKo: "어둠 속에 숨지만 냄새까지 감출 수는 없다." },
    { name: "Sneak-Attack", textKo: "기습 근접 공격으로 갑옷을 무시한다." },
    { name: "Poisoner", textKo: "먹으면 한 시간 안에 죽는 치명적인 독을 만든다." },
    { name: "Impersonate", textKo: "인간의 모습·목소리·태도를 1경점 동안 모방한다." },
    { name: "Split", textKo: "자신과 동료들이 코인 판정 없이 달아난다." },
  ],
};

const armorAp = (name: string) => {
  const armor = ARMOR.find((item) => item.name === name);
  if (!armor) throw new Error(`Missing canonical armor entry: ${name}`);
  return armor.ap;
};

const armorLimits: Record<ArmorKey, { label: string; ap: number }> = {
  helmet: { label: "투구", ap: armorAp("Helmet") },
  cuirass: { label: "흉갑", ap: armorAp("Cuirass") },
  gambeson: { label: "누비 갑옷", ap: armorAp("Gambeson") },
  chainmail: { label: "사슬 갑옷", ap: armorAp("Chainmail") },
  leftGauntlet: { label: "왼손 건틀릿", ap: armorAp("Gauntlet L") },
  rightGauntlet: { label: "오른손 건틀릿", ap: armorAp("Gauntlet R") },
  leftGreave: { label: "왼쪽 정강이받이", ap: armorAp("Greave L") },
  rightGreave: { label: "오른쪽 정강이받이", ap: armorAp("Greave R") },
  shield: { label: "방패", ap: armorAp("Shield") },
};

const woundLabels: Record<WoundPart, string> = {
  head: "머리 — 의식을 잃음, 다음 머리 부상은 치명적",
  torso: "몸통 — 모든 판정 −3",
  leftArm: "왼팔 — 든 물건을 놓치며 팔을 쓸 수 없음",
  rightArm: "오른팔 — 든 물건을 놓치며 팔을 쓸 수 없음",
  leftLeg: "왼다리 — 이동력 −2",
  rightLeg: "오른다리 — 이동력 −2",
};

const mapTypeKo: Record<MapType, string> = { wilderness: "야외", dungeon: "던전", settlement: "정착지" };
const combatActionKo: Record<string, string> = {
  Attack: "공격", "Cast a Spell": "주문 시전", "Draw/Sheathe": "무기 꺼내기·넣기", Flee: "도주",
  Grapple: "붙잡기", Move: "이동", Shove: "밀치기", Throw: "던지기", Dodge: "회피", Riposte: "반격",
  "Block Called Shot": "조준 공격 막기",
};
const combatActionLabel = (action: string) => action.endsWith(" (Called Shot)")
  ? `${combatActionKo[action.replace(" (Called Shot)", "")] || action} · 조준 공격`
  : combatActionKo[action] || ({ "Morale Test": "사기 판정" } as Record<string, string>)[action] || action;
const monsterSpeedKo = (speed: number | string) => speed;
const canonicalMonsterName = (monster: Pick<MonsterInCombat, "monsterId" | "name">) =>
  BESTIARY.find((entry) => entry.id === monster.monsterId)?.name || monster.name;
const inventoryCategoryKo: Record<InventoryItem["category"], string> = {
  weapon: "무기", armor: "갑옷", trade: "교역품", magic: "마법 물품", container: "용기", other: "그 밖의 물품",
};
const contactKindKo = { friends: "친구", foes: "적", npcs: "등장인물" } as const;
const goalStatusKo: Record<Goal["status"], string> = { active: "진행 중", completed: "완수", impossible: "불가능", discarded: "폐기" };

const focusPlayPanel = (selector: string) => {
  const panel = document.querySelector<HTMLElement>(selector);
  panel?.scrollIntoView({ block: "start", behavior: "instant" });
  panel?.querySelector<HTMLElement>("select, input, button")?.focus({ preventScroll: true });
};

function App() {
  const [loaded] = useState<SaveBundle>(loadBundle);
  const [state, setState] = useState<GameState>(loaded.state);
  const undoRef = useRef<GameState[]>(loaded.undo);
  const [undoCount, setUndoCount] = useState(loaded.undo.length);
  const [tab, setTab] = useState<Tab>("play");
  const [quickRule, setQuickRule] = useState<string | null>(null);
  const [newLog, setNewLog] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const rulebookButtonRef = useRef<HTMLButtonElement>(null);
  const rulebookReturnFocusRef = useRef<HTMLElement | null>(null);
  const [rulebookOpen, setRulebookOpen] = useState(false);
  const [rulebookSectionId, setRulebookSectionId] = useState<string | undefined>();

  const [combatAction, setCombatAction] = useState({ action: "Attack", monsterId: "", cardId: "", modifier: 0, calledShot: false, useFool: false, rawWounds: 1, resolveCost: 1, spellSource: "", spellName: "" });
  const [damageForm, setDamageForm] = useState({ target: "player", part: "torso" as WoundPart, incoming: 1, armor: "none" as ArmorKey | "none", armorLabel: "", monsterArmored: false });
  const [spellForm, setSpellForm] = useState({ minor: "", major: "", effect: "", resolve: 1 });
  const [folkForm, setFolkForm] = useState({ charm: "", goal: "", use: "", suit: "cups" as Suit, modifier: 0 });
  const [alchemyForm, setAlchemyForm] = useState({ ingredient: "", concoction: "", hasPart: false, hasPot: false, hasKnowledge: false, hasVessel: false, doseRecorded: false });
  const [restForm, setRestForm] = useState({ part: "head" as WoundPart, placeConfirmed: false, mealConfirmed: false, rationId: "fiction" });
  const [contactDraft, setContactDraft] = useState({ name: "", location: "", connection: "" });
  const [inventoryDraft, setInventoryDraft] = useState({ name: "", category: "other" as InventoryItem["category"] });
  const [combatEndNote, setCombatEndNote] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const bundle: SaveBundle = { version: 2, state, undo: undoRef.current.slice(-MAX_UNDO) };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
        setSaveError("");
      } catch {
        setSaveError("자동 보존에 실패했습니다. JSON 장부를 내려받아 기록을 지켜 주세요.");
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (!rulebookOpen && rulebookReturnFocusRef.current?.isConnected) rulebookReturnFocusRef.current.focus();
  }, [rulebookOpen]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement;
      if (event.key === "/" && !element.closest("input, textarea, select, [contenteditable]") && !rulebookOpen) { event.preventDefault(); setQuickRule("tests"); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [rulebookOpen]);

  useEffect(() => {
    document.querySelector<HTMLDetailsElement>(".save-menu")?.removeAttribute("open");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);


  const update = (recipe: (previous: GameState) => GameState, keepUndo = true) => {
    setState((previous) => {
      const next = recipe(previous);
      if (next === previous) return previous;
      if (keepUndo) {
        undoRef.current = [...undoRef.current.slice(-(MAX_UNDO - 1)), previous];
        setUndoCount(undoRef.current.length);
      }
      return next;
    });
  };

  const undo = () => {
    const previous = undoRef.current.pop();
    if (!previous) return;
    setState(previous);
    setUndoCount(undoRef.current.length);
  };

  const addLog = (category: LogEntry["category"], text: string) => update((previous) => ({
    ...previous,
    logs: [logEntry(previous, category, text), ...previous.logs],
  }));

  const spendPlayerResolve = (previous: GameState, amount: number): GameState | null => {
    if (amount < 1 || previous.character.resolve < amount) return null;
    const balance = spendResolveBalances(previous.character.resolve, previous.refereeResolve, amount);
    return { ...previous, refereeResolve: balance.refereeResolve, character: { ...previous.character, resolve: balance.playerResolve } };
  };

  const gainResolve = (previous: GameState, amount = 1): GameState => {
    const balance = gainResolveBalances(previous.character.resolve, previous.refereeResolve, amount);
    return { ...previous, refereeResolve: balance.refereeResolve, character: { ...previous.character, resolve: balance.playerResolve } };
  };

  const startSession = () => update(previous => {
    if (previous.sessionStarted) return previous;
    const pending = previous.pendingDowntimeGoalResolve || 0;
    const next = gainResolve({ ...previous, pendingDowntimeGoalResolve: 0, sessionNumber: previous.sessionNumber + 1, sessionStarted: true }, 1 + pending);
    return { ...next, logs: [logEntry(next, "downtime", `세션 ${next.sessionNumber} 시작 · 플레이어와 심판 결의 +${next.character.resolve - previous.character.resolve}`), ...next.logs] };
  });

  const resolveGoal = (id: string, status: "completed" | "impossible") => update(previous => {
    const goal = previous.character.goals.find(item => item.id === id);
    if (!goal || goal.status !== "active") return previous;
    const deferred = status === "completed" && previous.sessionNumber > 0 && !previous.sessionStarted;
    const next = deferred ? { ...previous, pendingDowntimeGoalResolve: (previous.pendingDowntimeGoalResolve || 0) + 1 } : gainResolve(previous);
    return { ...next, character: { ...next.character, goals: next.character.goals.map(item => item.id === id ? { ...item, status } : item) }, logs: [logEntry(next, "character", `목표 ${status === "completed" ? "완수" : "불가능"}: ${goal.text} · ${deferred ? "막간에 완수한 목표의 결의는 다음 세션 시작에 얻습니다." : "결의를 얻었습니다."} 새 목표를 정하세요.`), ...next.logs] };
  });

  const activateTalent = (name: string) => {
    if (["Magick", "Bind Magick", "Undo Magick"].includes(name)) { setTab("magic"); return; }
    if (["Nimble", "Sally Forth"].includes(name)) { setTab("tests"); return; }
    if (name === "Disarming Presence") setTab("play");
    update(previous => {
      if (!previous.character.talents.includes(name) || previous.character.dead || previous.character.wounds.head || (name === "Parley" && previous.combat.active)) return previous;
      if (name === "Disarming Presence" && (previous.combat.active || previous.test.disarmingPresenceUsed)) return previous;
      const next = spendPlayerResolve(previous, 1); if (!next) return previous;
      if (name === "Disarming Presence") {
        const current = previous.test.purpose.includes("반응 판정") ? previous.test : { ...emptyTest(), purpose: "등장인물·괴수 반응 판정", suit: previous.test.suit, stat: previous.character.stats[previous.test.suit] };
        const test = { ...current, modifier: current.modifier + 3, disarmingPresenceUsed: true };
        if (test.firstCard) test.result = evaluateTest({ card: test.firstCard, pushedCard: test.pushedCard || undefined, stat: test.stat, testSuit: test.suit, modifier: test.modifier + test.resolveSpent, help: test.help, opposedPenalty: test.opposedPenalty, torsoPenalty: previous.character.wounds.torso ? -3 : 0 });
        return { ...next, test, logs: [logEntry(next, "character", "Disarming Presence · 결의 −1 · 반응 판정 +3"), ...next.logs] };
      }
      return { ...next, logs: [logEntry(next, "character", `${name} 발동 · 결의 −1. ${name === "Inspire" ? "다른 사람의 판정 전에 +3을 선언하세요." : "재능 효과를 적용하세요."}`), ...next.logs] };
    });
  };

  const settleSession = (criteria: { participated: boolean; goal: boolean; danger: boolean }) => update(previous => {
    if (!previous.sessionStarted || previous.settledSession === previous.sessionNumber) return previous;
    const xp = Number(criteria.participated) + Number(criteria.goal) + Number(criteria.danger);
    const next = { ...previous, sessionStarted: false, settledSession: previous.sessionNumber, character: { ...previous.character, xp: previous.character.xp + xp } };
    return { ...next, logs: [logEntry(next, "downtime", `세션 ${previous.sessionNumber} 정산 · 경험치 +${xp}. 막간 계획: ${previous.downtimePlan?.trim() || "미기록"}`), ...next.logs] };
  });

  const speed = woundedSpeed(state.character.stats.coins, Number(state.character.wounds.leftLeg) + Number(state.character.wounds.rightLeg));
  const capacity = carryingCapacity(state.character.stats.coins);
  const slotsUsed = state.character.inventory.reduce((total, item) => total + item.slots, 0);
  const integrity = useMemo(() => cardEconomyValid(state), [state]);

  const drawPlayerForImmediateUse = (previous: GameState): { state: GameState; card: Card | null; fool: boolean } => {
    const draw = drawCard(previous.playerDeck);
    if (!draw.card) return { state: previous, card: null, fool: false };
    if (draw.card.rank === "0") {
      if (previous.combat.active) {
        return {
          state: { ...previous, playerDeck: draw.deck, playerDiscard: [...previous.playerDiscard, draw.card], combat: { ...previous.combat, foolPending: true } },
          card: draw.card,
          fool: true,
        };
      }
      return { state: recallBothDecks({ ...previous, playerDeck: draw.deck }, "플레이어 덱에서 광대를 뽑음"), card: draw.card, fool: true };
    }
    return {
      state: { ...previous, playerDeck: draw.deck, playerDiscard: [...previous.playerDiscard, draw.card] },
      card: draw.card,
      fool: false,
    };
  };

  const drawRefereeToDiscard = (previous: GameState): { state: GameState; card: Card | null } => {
    const draw = drawCard(previous.refereeDeck);
    if (!draw.card) return { state: previous, card: null };
    return {
      state: { ...previous, refereeDeck: draw.deck, refereeDiscard: [...previous.refereeDiscard, draw.card] },
      card: draw.card,
    };
  };

  const startTest = (purpose: string, suit: Suit, modifier = 0, opposedPenalty = 0) => {
    setTab("play");
    update((previous) => ({
    ...previous,
    test: {
      ...emptyTest(),
      purpose,
      suit,
      stat: previous.character.stats[suit],
      modifier,
      opposedPenalty,
    },
  }));
  };

  const rollTest = () => update((previous) => {
    if (previous.test.firstCard || previous.combat.active || previous.character.dead || previous.character.wounds.head) return previous;
    const prepared = { ...previous, test: { ...previous.test, stat: previous.character.stats[previous.test.suit] } };
    const drawn = drawPlayerForImmediateUse(prepared);
    if (!drawn.card) return drawn.state;
    const torsoPenalty = drawn.state.character.wounds.torso ? -3 : 0;
    const result = evaluateTest({
      card: drawn.card,
      stat: prepared.test.stat,
      modifier: prepared.test.modifier,
      help: prepared.test.help,
      torsoPenalty,
      opposedPenalty: prepared.test.opposedPenalty,
      testSuit: prepared.test.suit,
    });
    const next = {
      ...drawn.state,
      test: { ...prepared.test, firstCard: drawn.card, result },
    };
    return {
      ...next,
      logs: [logEntry(next, "test", `[판정] ${next.test.purpose || "용도 미기록"}: ${cardDisplayKo(drawn.card)} + 능력치 ${next.test.stat}; 합계 ${result.total} → ${testStatusKo[result.status]}.`), ...next.logs],
    };
  });

  const pushTest = () => update((previous) => {
    if (previous.combat.active || !previous.test.firstCard || previous.test.result?.status !== "failure") return previous;
    const drawn = drawPlayerForImmediateUse(previous);
    if (!drawn.card) return drawn.state;
    const result = evaluateTest({
      card: previous.test.firstCard,
      pushedCard: drawn.card,
      stat: previous.test.stat,
      modifier: previous.test.modifier + previous.test.resolveSpent,
      help: previous.test.help,
      torsoPenalty: previous.character.wounds.torso ? -3 : 0,
      opposedPenalty: previous.test.opposedPenalty,
      testSuit: previous.test.suit,
    });
    let next: GameState = { ...drawn.state, test: { ...previous.test, pushedCard: drawn.card, result } };
    if (result.status === "great-failure") next = gainResolve(next);
    return {
      ...next,
      logs: [logEntry(next, "test", `[밀어붙이기] ${next.test.purpose || "용도 미기록"}: ${cardDisplayKo(drawn.card)}; 합계 ${result.total} → ${testStatusKo[result.status]}${result.status === "great-failure" ? "; 결의 +1" : ""}.`), ...next.logs],
    };
  });

  const spendResolveOnTest = () => update((previous) => {
    if (!previous.test.result) return previous;
    const spent = spendPlayerResolve(previous, 1);
    if (!spent) return previous;
    const result = evaluateTest({ card: previous.test.firstCard!, pushedCard: previous.test.pushedCard,
      stat: previous.test.stat, modifier: previous.test.modifier + previous.test.resolveSpent + 1,
      help: previous.test.help, torsoPenalty: previous.character.wounds.torso ? -3 : 0,
      opposedPenalty: previous.test.opposedPenalty, testSuit: previous.test.suit });
    const total = result.total;
    return {
      ...spent,
      test: { ...spent.test, result, resolveSpent: spent.test.resolveSpent + 1 },
      logs: [logEntry(spent, "test", `[결의] ${spent.test.purpose || "판정"}: 플레이어 결의 −1, 합계 ${total}.`), ...spent.logs],
    };
  });

  const manualFoolRecall = () => update((previous) => recallBothDecks(previous, "심판이 실물 덱에서 광대를 뽑았다고 기록"));

  const dealCombatRound = () => update((previous) => {
    if (previous.combat.dealtRound === previous.combat.round) return previous;
    let next = { ...previous, combat: { ...previous.combat, active: true } };
    const dealt = dealCombatCards(next.playerDeck, next.combat.playerHand, next.combat.monsters.map((monster) => monster.hand));
    const monsters = next.combat.monsters.map((monster, index) => ({ ...monster, hand: dealt.monsterHands[index] }));
    const foolPending = next.combat.foolPending || dealt.foolDrawn;
    next = {
      ...next,
      playerDeck: dealt.deck,
      combat: { ...next.combat, playerHand: dealt.playerHand, monsters, foolPending, dealtRound: next.combat.round },
    };
    return {
      ...next,
      logs: [logEntry(next, "combat", `[${next.combat.round}라운드] 손패 보충: 플레이어 ${dealt.playerHand.length}/4, 각 괴수 새 카드 3장 · ${monsters.map((monster) => `${canonicalMonsterName(monster)} 손패 ${monster.hand.length}장`).join(", ") || "없음"}. 모든 전투 손패는 공용 플레이어 덱에서 옮겼습니다.`), ...next.logs],
    };
  });

  const choosePlayerInitiative = (identity: string) => update((previous) => {
    if (previous.combat.playerInitiative) return previous;
    const index = previous.combat.playerHand.findIndex((card) => cardId(card) === identity);
    if (index < 0) return previous;
    const hand = [...previous.combat.playerHand];
    const [initiative] = hand.splice(index, 1);
    return { ...previous, combat: { ...previous.combat, playerHand: hand, playerInitiative: initiative, playerInitiativeRevealed: false } };
  });

  const chooseMonsterInitiative = (monsterId: string, identity: string) => update((previous) => ({
    ...previous,
    combat: {
      ...previous.combat,
      monsters: previous.combat.monsters.map((monster) => {
        if (monster.id !== monsterId || monster.initiative) return monster;
        const index = monster.hand.findIndex((card) => cardId(card) === identity);
        if (index < 0) return monster;
        const hand = [...monster.hand];
        const [initiative] = hand.splice(index, 1);
        return { ...monster, hand, initiative, initiativeRevealed: false };
      }),
    },
  }));

  const endCombatRound = () => update((previous) => {
    if (previous.combat.foolPending) {
      const recalled = recallBothDecks(previous, `전투 ${previous.combat.round}라운드에 광대가 드로우됨`);
      return { ...recalled, ...advanceGameTime(previous, 10), combat: { ...recalled.combat, active: true, round: previous.combat.round + 1, sallyForthUsed: false } };
    }
    const playerDiscard = previous.combat.playerInitiative
      ? [...previous.playerDiscard, previous.combat.playerInitiative]
      : previous.playerDiscard;
    const monsterInitiativeDiscards: Card[] = [];
    const monsters = previous.combat.monsters.map((monster) => {
      if (monster.initiative) monsterInitiativeDiscards.push(monster.initiative);
      return { ...monster, initiative: null, initiativeRevealed: false };
    });
    return {
      ...previous,
      ...advanceGameTime(previous, 10),
      playerDiscard: [...playerDiscard, ...monsterInitiativeDiscards],
      combat: {
        ...previous.combat,
        round: previous.combat.round + 1,
        sallyForthUsed: false,
        playerInitiative: null,
        playerInitiativeRevealed: false,
        monsters,
        lastResult: null,
      },
      logs: [logEntry(previous, "combat", `[${previous.combat.round}라운드] 종료. 남은 손패는 유지되며 원치 않는 카드는 직접 버릴 수 있습니다.`), ...previous.logs],
    };
  });

  const playCombatAction = () => update((previous) => {
    if (previous.character.dead || previous.character.wounds.head) return previous;
    const cardIndex = previous.combat.playerHand.findIndex((card) => cardId(card) === combatAction.cardId);
    if (cardIndex < 0) return previous;
    const targetMonster = previous.combat.monsters.find((monster) => monster.id === (combatAction.monsterId || (previous.combat.monsters.length === 1 ? previous.combat.monsters[0].id : "")));
    const freeDiscardActions = ["Move", "Draw/Sheathe", "Throw"];
    if (!freeDiscardActions.includes(combatAction.action) && (!targetMonster || !targetMonster.initiative)) return previous;
    let working = previous;
    if (combatAction.action === "Cast a Spell") {
      const bound = previous.character.boundMagic.find(item => item.id === combatAction.spellSource);
      const requiredTalent = combatAction.spellSource === "undo" ? "Undo Magick" : "Magick";
      if (combatAction.spellSource && combatAction.spellSource !== "undo" ? !bound || bound.charges < 1 : !previous.character.talents.includes(requiredTalent)) return previous;
      const spent = spendPlayerResolve(previous, Math.max(1, combatAction.resolveCost));
      if (!spent) return previous;
      working = bound ? { ...spent, character: { ...spent.character, boundMagic: spent.character.boundMagic.map(item => item.id === bound.id ? { ...item, charges: item.charges - 1 } : item) } } : spent;
    }
    const card = previous.combat.playerHand[cardIndex];
    if (card.rank === "0") return previous;
    const hand = [...previous.combat.playerHand];
    hand.splice(cardIndex, 1);
    let playerDiscard = [...previous.playerDiscard, card];
    let bonus = 0;
    if (combatAction.useFool) {
      const foolIndex = hand.findIndex((item) => item.rank === "0");
      if (foolIndex >= 0) {
        const [fool] = hand.splice(foolIndex, 1);
        playerDiscard = [...playerDiscard, fool];
        bonus = 3;
      }
    }
    let total: number | null = null;
    let target: number | null = null;
    let status = "카드 버림";
    let greatSuccess = false;
    if (!freeDiscardActions.includes(combatAction.action)) {
      target = targetMonster?.initiative ? cardValue(targetMonster.initiative) : 0;
      const opposed = (combatAction.calledShot && combatAction.action === "Attack") || ["Grapple", "Shove", "Dodge", "Riposte", "Flee", "Cast a Spell", "Block Called Shot"].includes(combatAction.action);
      const result = evaluateTest({
        card,
        stat: combatAction.action === "Flee" || combatAction.action === "Dodge" ? working.character.stats.coins : combatAction.action === "Cast a Spell" ? working.character.stats.wands : working.character.stats.swords,
        modifier: combatAction.modifier + bonus,
        torsoPenalty: working.character.wounds.torso ? -3 : 0,
        opposedPenalty: opposed ? (BESTIARY.find((monster) => monster.id === targetMonster?.monsterId)?.stat ?? 0) : 0,
        target,
        testSuit: combatAction.action === "Flee" || combatAction.action === "Dodge" ? "coins" : combatAction.action === "Cast a Spell" ? "wands" : "swords",
      });
      total = result.total;
      status = result.status;
      greatSuccess = result.greatSuccess;
    } else if (combatAction.action === "Throw") {
      total = cardValue(card) + working.character.stats.swords;
      status = `${total}칸`;
    } else if (combatAction.action === "Move") {
      total = speed;
      status = `${speed}칸`;
    }
    const resultRecord: CombatResult = {
      id: uid(),
      actor: working.character.name || "플레이어",
      baseWounds: combatAction.rawWounds,
      targetId: targetMonster?.id || combatAction.monsterId,
      action: combatAction.calledShot && combatAction.action === "Attack" ? `${combatAction.action} (Called Shot)` : combatAction.action,
      card,
      total,
      target,
      status,
      greatSuccess,
      rawWounds: combatAction.action === "Dodge" && greatSuccess ? 1
        : ["Attack", "Riposte", "Cast a Spell"].includes(combatAction.action) && ["success", "great-success"].includes(status)
          ? Math.max(0, combatAction.rawWounds + (greatSuccess && ["Attack", "Riposte"].includes(combatAction.action) ? 1 : 0)) : 0,
    };
    const next = { ...working, playerDiscard, combat: { ...working.combat, playerHand: hand, lastResult: resultRecord } };
    return {
      ...next,
      logs: [logEntry(next, "combat", `[${combatActionKo[resultRecord.action.replace(" (Called Shot)", "")] || resultRecord.action}] ${cardDisplayKo(card)}${bonus ? " + 광대 3" : ""}${combatAction.action === "Cast a Spell" ? `; 결의 ${Math.max(1, combatAction.resolveCost)} 소비` : ""}; ${total === null ? status : `합계 ${total} 대 ${target} → ${testStatusKo[status] || status}`}. 피해 적용과 서사 결과는 심판이 정합니다.`), ...next.logs],
    };
  });

  const discardPlayerCombatCard = (identity: string) => update((previous) => {
    const index = previous.combat.playerHand.findIndex((card) => cardId(card) === identity);
    if (index < 0) return previous;
    const hand = [...previous.combat.playerHand];
    const [card] = hand.splice(index, 1);
    return { ...previous, playerDiscard: [...previous.playerDiscard, card], combat: { ...previous.combat, playerHand: hand } };
  });

  const playMonsterCard = (monsterId: string, identity: string, asAttack: boolean) => update((previous) => {
    const monster = previous.combat.monsters.find((item) => item.id === monsterId);
    if (!monster || (asAttack && (!previous.combat.playerInitiative || monster.dead || monster.wounds?.head))) return previous;
    const index = monster.hand.findIndex((card) => cardId(card) === identity);
    if (index < 0 || (asAttack && monster.hand[index].rank === "0")) return previous;
    const hand = [...monster.hand];
    const [card] = hand.splice(index, 1);
    const template = BESTIARY.find((item) => item.id === monster.monsterId);
    const evaluated = asAttack ? evaluateTest({ card, stat: template?.stat ?? 0,
      torsoPenalty: monster.wounds?.torso ? -3 : 0, testSuit: "swords",
      target: previous.combat.playerInitiative ? cardValue(previous.combat.playerInitiative) : 0 }) : null;
    const total = evaluated?.total ?? null;
    const target = evaluated?.target ?? null;
    const status = evaluated?.status || "사용·버림";
    const baseWounds = monster.attackWounds ?? Number(template?.attacks.match(/(\d+)\s*\(/)?.[1] || 0);
    const resultRecord: CombatResult | null = asAttack ? {
      id: uid(), actor: canonicalMonsterName(monster), action: "Attack", card, total, target, status,
      greatSuccess: evaluated?.greatSuccess || false, baseWounds, targetId: "player",
      rawWounds: evaluated?.success ? baseWounds + (evaluated.greatSuccess ? 1 : 0) : 0,
    } : null;
    const next = {
      ...previous,
      playerDiscard: [...previous.playerDiscard, card],
      combat: {
        ...previous.combat,
        monsters: previous.combat.monsters.map((item) => item.id === monsterId ? { ...item, hand } : item),
        lastResult: resultRecord,
      },
    };
    return {
      ...next,
      logs: [logEntry(next, "combat", `[${canonicalMonsterName(monster)}] ${asAttack ? "공격" : "카드 사용"}: ${cardDisplayKo(card)}${total !== null ? ` + 능력치 ${template?.stat ?? 0} = ${total}${target !== null ? ` 대 ${target} → ${testStatusKo[status] || status}` : ""}` : ""}.`), ...next.logs],
    };
  });

  const boostLastWithFool = (owner: string) => update(previous => {
    const result = previous.combat.lastResult;
    if (!result || result.total === null || result.target === null) return previous;
    const hand = owner === "player" ? previous.combat.playerHand : previous.combat.monsters.find(monster => monster.id === owner)?.hand;
    const fool = hand?.find(card => card.rank === "0"); if (!fool) return previous;
    const total = result.total + 3; const success = total >= result.target;
    const action = result.action.replace(" (Called Shot)", "");
    const suit = ["Flee", "Dodge"].includes(action) ? "coins" : action === "Cast a Spell" ? "wands" : "swords";
    const greatSuccess = success && action !== "Morale Test" && result.card.suit === suit;
    const rawWounds = success && ["Attack", "Riposte", "Cast a Spell"].includes(action) ? (result.baseWounds || 0) + (greatSuccess && action !== "Cast a Spell" ? 1 : 0) : action === "Dodge" && greatSuccess ? 1 : 0;
    const next = { ...previous, playerDiscard: [...previous.playerDiscard, fool], combat: { ...previous.combat,
      playerHand: owner === "player" ? previous.combat.playerHand.filter(card => card.rank !== "0") : previous.combat.playerHand,
      monsters: previous.combat.monsters.map(monster => monster.id === owner ? { ...monster, hand: monster.hand.filter(card => card.rank !== "0") } : monster),
      lastResult: { ...result, total, status: greatSuccess ? "great-success" : success ? "success" : "failure", greatSuccess, rawWounds } } };
    return { ...next, logs: [logEntry(next, "combat", `광대 +3 · ${result.actor} 판정 ${total}/${result.target}`), ...next.logs] };
  });

  const spendPlayerResolveOnCombat = () => update(previous => {
    const result = previous.combat.lastResult;
    if (!result || result.actor !== (previous.character.name || "플레이어") || result.total === null || result.target === null || result.status === "great-success" || !["failure", "success"].includes(result.status)) return previous;
    const spent = spendPlayerResolve(previous, 1); if (!spent) return previous;
    const total = result.total + 1;
    const success = total >= result.target;
    const action = result.action.replace(" (Called Shot)", "");
    const suit = ["Flee", "Dodge"].includes(action) ? "coins" : action === "Cast a Spell" ? "wands" : "swords";
    const greatSuccess = success && result.card.suit === suit;
    const damaging = ["Attack", "Riposte", "Cast a Spell"].includes(action);
    const baseWounds = result.baseWounds ?? Math.max(0, result.rawWounds - (result.greatSuccess && action !== "Cast a Spell" ? 1 : 0));
    const rawWounds = success && damaging ? baseWounds + (greatSuccess && action !== "Cast a Spell" ? 1 : 0) : action === "Dodge" && greatSuccess ? 1 : 0;
    const next = { ...spent, combat: { ...spent.combat, lastResult: { ...result, total, status: greatSuccess ? "great-success" : success ? "success" : "failure", greatSuccess, rawWounds } } };
    return { ...next, logs: [logEntry(next, "combat", `전투 판정에 결의 1점 · 합계 ${total}/${result.target}`), ...next.logs] };
  });

  const swapNimble = (identity: string) => update(previous => {
    if (!previous.character.talents.includes("Nimble") || !previous.combat.playerInitiative) return previous;
    const index = previous.combat.playerHand.findIndex(card => cardId(card) === identity); if (index < 0) return previous;
    const spent = spendPlayerResolve(previous, 1); if (!spent) return previous;
    const hand = [...spent.combat.playerHand]; const nextInitiative = hand[index]; hand[index] = previous.combat.playerInitiative;
    return { ...spent, combat: { ...spent.combat, playerHand: hand, playerInitiative: nextInitiative }, logs: [logEntry(spent, "combat", "공격 대상이 되어 Nimble 발동 · 결의 −1 · 손패와 선제권 교체"), ...spent.logs] };
  });

  const activateSallyForth = () => update(previous => {
    if (!previous.combat.active || previous.combat.sallyForthUsed || !previous.character.talents.includes("Sally Forth")) return previous;
    const spent = spendPlayerResolve(previous, 1); if (!spent) return previous;
    return { ...spent, combat: { ...spent.combat, sallyForthUsed: true }, logs: [logEntry(spent, "combat", "Sally Forth · 결의 −1 · 이번 라운드의 추가 행동 1회. 행동의 내용과 필요한 판정은 심판과 확인하세요."), ...spent.logs] };
  });

  const moraleTest = (monsterId: number, combatId?: string, identity?: string) => update(previous => {
    const template = BESTIARY.find(item => item.id === monsterId); if (!template) return previous;
    let next: GameState; let card: Card;
    const actor = previous.combat.monsters.find(item => item.id === combatId);
    if (previous.combat.active) {
      if (!actor || actor.dead || actor.wounds?.head) return previous;
      const index = actor.hand.findIndex(item => cardId(item) === identity); if (index < 0) return previous;
      card = actor.hand[index];
      if (card.rank === "0") return previous;
      next = { ...previous, playerDiscard: [...previous.playerDiscard, card], combat: { ...previous.combat, monsters: previous.combat.monsters.map(item => item.id === actor.id ? { ...item, hand: item.hand.filter((_, i) => i !== index) } : item) } };
    } else { const drawn = drawPlayerForImmediateUse(previous); if (!drawn.card) return drawn.state; next = drawn.state; card = drawn.card; }
    const total = cardValue(card) + template.stat - (actor?.wounds?.torso ? 3 : 0);
    const result: CombatResult = { id: uid(), actor: template.name, action: "Morale Test", card, total, target: 14, status: total >= 14 ? "success" : "failure", greatSuccess: false, rawWounds: 0 };
    return { ...next, combat: { ...next.combat, lastResult: result }, logs: [logEntry(next, "combat", `${template.nameKo} 사기 판정 ${total}/14 · ${total >= 14 ? "계속 싸움" : "도주 또는 항복"}`), ...next.logs] };
  });

  const spendRefereeResolveOnLastTest = () => update((previous) => {
    const result = previous.combat.lastResult;
    if (!result || result.actor === (previous.character.name || "플레이어") || result.total === null || result.target === null || previous.refereeResolve < 1) return previous;
    const total = result.total + 1;
    const success = total >= result.target;
    const greatSuccess = success && result.action === "Attack" && result.card.suit === "swords";
    const status = greatSuccess ? "great-success" : success ? "success" : "failure";
    const rawWounds = success && result.action === "Attack" ? (result.baseWounds || 0) + (greatSuccess ? 1 : 0) : 0;
    const next = { ...previous, refereeResolve: previous.refereeResolve - 1,
      combat: { ...previous.combat, lastResult: { ...result, total, status, greatSuccess, rawWounds } },
    };
    return { ...next, logs: [logEntry(next, "combat", `[심판 결의] ${result.actor} ${combatActionLabel(result.action)}: +1, 합계 ${total} 대 ${result.target} → ${testStatusKo[status]}.`), ...next.logs] };
  });

  const applyDamage = () => update((previous) => {
    if (damageForm.target === "player") {
      const armorPoints = damageForm.armor === "none"
        ? 0
        : effectiveArmorPoints(armorLimits[damageForm.armor].ap, previous.character.armorNotches[damageForm.armor]);
      const outcome = resolveArmor(damageForm.incoming, armorPoints);
      const wasWounded = previous.character.wounds[damageForm.part];
      const fatalHead = damageForm.part === "head" && isFatalHeadWound(wasWounded, outcome.wounds);
      const armorNotches = { ...previous.character.armorNotches };
      if (damageForm.armor !== "none" && outcome.notchesArmor) {
        armorNotches[damageForm.armor] = clamp(armorNotches[damageForm.armor] + 1, 0, armorLimits[damageForm.armor].ap);
      }
      const next = {
        ...previous,
        character: {
          ...previous.character,
          dead: previous.character.dead || fatalHead,
          wounds: outcome.wounds > 0 ? { ...previous.character.wounds, [damageForm.part]: true } : previous.character.wounds,
          armorNotches,
        },
      };
      return {
        ...next,
        logs: [logEntry(next, "combat", `[피해 → 플레이어] 들어온 부상 ${damageForm.incoming}, AP ${armorPoints}, ${woundLabels[damageForm.part]}에 부상 ${outcome.wounds}점${outcome.notchesArmor ? "; 갑옷 흠집" : ""}${fatalHead ? "; 두 번째 머리 부상 — 사망" : ""}.`), ...next.logs],
      };
    }
    const monster = previous.combat.monsters.find((item) => item.id === damageForm.target);
    if (!monster) return previous;
    const label = damageForm.armorLabel.trim() || "갑옷";
    const armorKey = `${damageForm.part}:${label}`;
    const armorPoints = damageForm.monsterArmored
      ? effectiveArmorPoints(2, monster.armorNotches[armorKey] || 0)
      : 0;
    const outcome = resolveArmor(damageForm.incoming, armorPoints);
    const updated = {
      ...monster,
      woundsTaken: monster.woundsTaken + outcome.wounds,
      wounds: outcome.wounds > 0 ? { ...monster.wounds, [damageForm.part]: true } : monster.wounds,
      dead: monster.dead || (damageForm.part === "head" && isFatalHeadWound(Boolean(monster.wounds?.head), outcome.wounds)) || monster.woundsTaken + outcome.wounds >= (BESTIARY.find(item => item.id === monster.monsterId)?.wounds || Infinity),
      woundNotes: [...monster.woundNotes, `${damageForm.part}: ${outcome.wounds} Wound(s)`],
      armorNotches: outcome.notchesArmor ? { ...monster.armorNotches, [armorKey]: clamp((monster.armorNotches[armorKey] || 0) + 1, 0, 2) } : monster.armorNotches,
    };
    const next = { ...previous, combat: { ...previous.combat, monsters: previous.combat.monsters.map((item) => item.id === monster.id ? updated : item) } };
    return { ...next, logs: [logEntry(next, "combat", `[피해 → ${canonicalMonsterName(monster)}] 들어온 부상 ${damageForm.incoming}, AP ${armorPoints}, ${woundLabels[damageForm.part]}에 부상 ${outcome.wounds}점${outcome.notchesArmor ? `; ${label} 흠집` : ""}.`), ...next.logs] };
  });

  const endCombat = () => update((previous) => {
    const monsterCards: Card[] = [];
    for (const monster of previous.combat.monsters) {
      monsterCards.push(...monster.hand);
      if (monster.initiative) monsterCards.push(monster.initiative);
    }
    const playerDiscard = [...previous.playerDiscard, ...(previous.combat.playerInitiative ? [previous.combat.playerInitiative] : []), ...monsterCards];
    const participantNames = previous.combat.monsters.map(canonicalMonsterName).join(", ") || "없음";
    const next = {
      ...previous,
      playerDiscard,
      combat: { ...freshState().combat, playerHand: previous.combat.playerHand },
    };
    const settled = previous.combat.foolPending ? recallBothDecks(next, "광대가 나온 라운드 중 전투가 끝남") : next;
    return {
      ...settled,
      logs: [logEntry(previous, "combat", `[전투 종료] 목표: ${previous.combat.objective || "미기록"}. 참가자: ${participantNames}. 심판 기록: ${combatEndNote.trim() || "기록 없음"}. 장부는 결과를 추론하지 않았습니다.`), ...settled.logs],
    };
  });

  const addMonster = (monsterId: number) => update((previous) => {
    const template = BESTIARY.find((monster) => monster.id === monsterId);
    if (!template) return previous;
    const monster: MonsterInCombat = {
      id: uid(),
      monsterId: template.id,
      name: template.name,
      woundsTaken: 0,
      woundNotes: [],
      armorNotches: {},
      hand: [],
      initiative: null,
      initiativeRevealed: false,
      notes: "",
    };
    return { ...previous, combat: { ...previous.combat, active: true, monsters: [...previous.combat.monsters, monster] } };
  });

  const removeMonster = (monsterId: string) => update((previous) => {
    const monster = previous.combat.monsters.find((item) => item.id === monsterId);
    if (!monster) return previous;
    return {
      ...previous,
      playerDiscard: [...previous.playerDiscard, ...monster.hand, ...(monster.initiative ? [monster.initiative] : [])],
      combat: { ...previous.combat, monsters: previous.combat.monsters.filter((item) => item.id !== monsterId) },
    };
  });

  const drawMapCell = (index: number) => update((previous) => {
    const cell = previous.mapCells[index];
    if (!cell || cell.liveCard) return previous;
    const drawn = drawCard(previous.refereeDeck);
    if (!drawn.card) return previous;
    const majorIndex = MAJOR_RANKS.indexOf(drawn.card.rank as (typeof MAJOR_RANKS)[number]);
    const label = mapTable(previous.mapType)[majorIndex] || "참조표 항목 없음";
    const history: MapHistory = { id: uid(), card: drawn.card, type: previous.mapType, label, at: now() };
    const mapCells = previous.mapCells.map((item, itemIndex) => itemIndex === index ? {
      ...item,
      card: drawn.card,
      liveCard: true,
      type: previous.mapType,
      label,
      extraCards: [],
      extraLabels: [],
      history: [...item.history, history],
    } : item);
    const next = { ...previous, refereeDeck: drawn.deck, mapCells };
    return { ...next, logs: [logEntry(next, "map", `[지도 뽑기] (${cell.x + 1},${cell.y + 1}) ${cardDisplayKo(drawn.card)} → ${label}.`), ...next.logs] };
  });

  const drawWildernessTerrain = (index: number) => update((previous) => {
    const cell = previous.mapCells[index];
    if (!cell?.liveCard || cell.type !== "wilderness" || !cell.label.startsWith("정착지") || cell.extraCards.length > 0) return previous;
    const drawn = drawCard(previous.refereeDeck);
    if (!drawn.card) return previous;
    const majorIndex = MAJOR_RANKS.indexOf(drawn.card.rank as (typeof MAJOR_RANKS)[number]);
    const label = MAP_WILDERNESS_KO[majorIndex] || "참조표 항목 없음";
    const history: MapHistory = { id: uid(), card: drawn.card, type: "wilderness", label: `정착지 지형: ${label}`, at: now() };
    const mapCells = previous.mapCells.map((item, itemIndex) => itemIndex === index ? {
      ...item,
      extraCards: [...item.extraCards, drawn.card as Card],
      extraLabels: [...item.extraLabels, label],
      history: [...item.history, history],
    } : item);
    const next = { ...previous, refereeDeck: drawn.deck, mapCells };
    return { ...next, logs: [logEntry(next, "map", `[야외 정착지 지형] (${cell.x + 1},${cell.y + 1}) ${cardDisplayKo(drawn.card)} → ${label}.`), ...next.logs] };
  });

  const clearMap = () => update((previous) => {
    const liveCards = previous.mapCells.flatMap((cell) => cell.liveCard && cell.card ? [cell.card, ...cell.extraCards] : []);
    return {
      ...previous,
      refereeDiscard: [...previous.refereeDiscard, ...liveCards],
      mapCells: previous.mapCells.map((cell) => ({ ...cell, card: null, liveCard: false, type: null, label: "", extraCards: [], extraLabels: [], visited: false })),
      logs: [logEntry(previous, "map", `[지도 비움] 사용 중이던 심판 카드 ${liveCards.length}장을 버린 더미로 옮겼습니다. 칸의 기록과 카드 내력은 보존했습니다.`), ...previous.logs],
    };
  });

  const drawEvent = (reason = "직접 뽑기") => update((previous) => {
    const drawn = drawRefereeToDiscard(previous);
    if (!drawn.card) return previous;
    const index = MAJOR_RANKS.indexOf(drawn.card.rank as (typeof MAJOR_RANKS)[number]);
    const text = eventTable(previous.mapType)[index] || "참조표 항목 없음";
    const record: EventRecord = {
      id: uid(),
      card: drawn.card,
      type: previous.mapType,
      text,
      reversedInstruction: drawn.card.reversed,
      at: now(),
    };
    const next = { ...drawn.state, events: [record, ...drawn.state.events] };
    return { ...next, logs: [logEntry(next, "event", `[사건 덱 — ${reason}] ${cardDisplayKo(drawn.card)}: ${text}${drawn.card.reversed ? ". 선택 규칙: 반대 사건 또는 나쁜 일을 택하며 심판이 해석합니다." : ""}`), ...next.logs] };
  });

  const triggerEventInside = (previous: GameState, reason: string): GameState => {
    const drawn = drawRefereeToDiscard(previous);
    if (!drawn.card) return previous;
    const index = MAJOR_RANKS.indexOf(drawn.card.rank as (typeof MAJOR_RANKS)[number]);
    const text = eventTable(previous.mapType)[index] || "참조표 항목 없음";
    const record: EventRecord = { id: uid(), card: drawn.card, type: previous.mapType, text, reversedInstruction: drawn.card.reversed, at: now() };
    const next = { ...drawn.state, events: [record, ...drawn.state.events] };
    return { ...next, logs: [logEntry(next, "event", `[사건 덱 — ${reason}] ${cardDisplayKo(drawn.card)}: ${text}${drawn.card.reversed ? ". 역방향 해석은 심판에게 남겨 둡니다." : ""}`), ...next.logs] };
  };

  const oracleFoolResult = (previous: GameState, kind: OracleRecord["kind"], card: Card): GameState => ({
    ...previous, lastOracleRank: null,
    oracles: [{ id: uid(), kind, cards: [card], result: `광대 · 이 징조 표에는 결과가 없습니다. ${previous.combat.active ? "광대를 알리고 라운드 끝에 두 덱을 회수해 섞습니다." : "두 덱을 회수해 섞었습니다."} 상황을 해석하거나 다시 뽑으세요.`, triggeredEvent: false, at: now() }, ...previous.oracles],
  });

  const oracleYesNo = () => update((previous) => {
    let next = previous;
    const cards: Card[] = [];
    let extremeCount = 0;
    let answer: string | null = null;
    let triggeredEvent = false;
    while (!answer) {
      const drawn = drawPlayerForImmediateUse(next);
      next = drawn.state;
      if (!drawn.card) return next;
      if (drawn.fool) return oracleFoolResult(next, "yes-no", drawn.card);
      cards.push(drawn.card);
      const token = oracleSequenceToken(drawn.card);
      if (next.lastOracleRank === token) triggeredEvent = true;
      next = { ...next, lastOracleRank: token };
      if (drawn.card.rank === "A") {
        extremeCount += 1;
      } else {
        const printed = yesNoResult(drawn.card.rank);
        answer = printed ? ({ "No": "아니오", "Yes": "예", "No, but...": "아니오, 그러나…", "Yes, but...": "예, 하지만…" } as Record<string, string>)[printed] : null;
      }
      if (cards.length > 20) break;
    }
    const result = `${"극단적 — ".repeat(extremeCount)}${answer || "표 결과 없음"}`;
    const record: OracleRecord = { id: uid(), kind: "yes-no", cards, result, triggeredEvent, at: now() };
    next = { ...next, oracles: [record, ...next.oracles] };
    if (triggeredEvent) next = triggerEventInside(next, "같은 카드 값이 두 번 이어짐");
    return { ...next, logs: [logEntry(next, "oracle", `[예/아니오] ${cards.map(cardDisplayKo).join(" → ")} = ${result}${triggeredEvent ? "; 사건 덱 발동" : ""}.`), ...next.logs] };
  });

  const oracleAmount = () => update((previous) => {
    const drawn = drawPlayerForImmediateUse(previous);
    if (!drawn.card) return drawn.state;
    if (drawn.fool) return oracleFoolResult(drawn.state, "amount", drawn.card);
    const token = oracleSequenceToken(drawn.card);
    const triggeredEvent = previous.lastOracleRank === token;
    const printed = amountResult(drawn.card.rank);
    const result = printed ? ({ None: "없음", Average: "보통", Considerable: "상당함", Excessive: "과도함" } as Record<string, string>)[printed] : "표 결과 없음";
    const record: OracleRecord = { id: uid(), kind: "amount", cards: [drawn.card], result, triggeredEvent, at: now() };
    let next: GameState = { ...drawn.state, lastOracleRank: token, oracles: [record, ...drawn.state.oracles] };
    if (triggeredEvent) next = triggerEventInside(next, "같은 카드 값이 두 번 이어짐");
    return { ...next, logs: [logEntry(next, "oracle", `[양] ${cardDisplayKo(drawn.card)} = ${result}${triggeredEvent ? "; 사건 덱 발동" : ""}.`), ...next.logs] };
  });

  const oracleActionSubject = () => update((previous) => {
    const playerDraw = drawPlayerForImmediateUse(previous);
    if (!playerDraw.card) return playerDraw.state;
    if (playerDraw.fool) return oracleFoolResult(playerDraw.state, "action-subject", playerDraw.card);
    const refereeDraw = drawRefereeToDiscard(playerDraw.state);
    if (!refereeDraw.card || !playerDraw.card.suit) return playerDraw.state;
    const suitName = `${playerDraw.card.suit[0].toUpperCase()}${playerDraw.card.suit.slice(1)}` as keyof typeof ORACLE_SUITS_KO;
    const action = ORACLE_SUITS_KO[suitName]?.[tableKey(playerDraw.card) as keyof (typeof ORACLE_SUITS_KO)[typeof suitName]] || "참조표 항목 없음";
    const subjectInfo = ORACLE_SUBJECTS_KO[refereeDraw.card.rank];
    const subject = subjectInfo ? (refereeDraw.card.reversed ? subjectInfo.reversed : subjectInfo.meaning) : "참조표 항목 없음";
    const playerToken = oracleSequenceToken(playerDraw.card);
    const refereeToken = oracleSequenceToken(refereeDraw.card);
    const triggeredEvent = previous.lastOracleRank === playerToken || playerToken === refereeToken;
    const result = `${action} / ${subject}`;
    const record: OracleRecord = { id: uid(), kind: "action-subject", cards: [playerDraw.card, refereeDraw.card], result, triggeredEvent, at: now() };
    let next: GameState = { ...refereeDraw.state, lastOracleRank: refereeToken, oracles: [record, ...refereeDraw.state.oracles] };
    if (triggeredEvent) next = triggerEventInside(next, "같은 카드 값이 두 번 이어짐");
    return { ...next, logs: [logEntry(next, "oracle", `[행동/주제] ${cardDisplayKo(playerDraw.card)} + ${cardDisplayKo(refereeDraw.card)} = ${result}. 해석은 플레이 자리의 몫입니다.`), ...next.logs] };
  });

  const drawMinorWord = () => update((previous) => {
    const drawn = drawPlayerForImmediateUse(previous);
    if (!drawn.card || drawn.fool || !drawn.card.suit) return drawn.state;
    const suit = `${drawn.card.suit[0].toUpperCase()}${drawn.card.suit.slice(1)}` as KnownMinorWord["suit"];
    const key = tableKey(drawn.card);
    const word = ARCANE_MINOR_WORDS[suit]?.[key];
    if (!word) return drawn.state;
    const already = drawn.state.character.knownMinorWords.some((item) => item.suit === suit && item.key === key);
    const next = already ? drawn.state : { ...drawn.state, character: { ...drawn.state.character, knownMinorWords: [...drawn.state.character.knownMinorWords, { suit, key }] } };
    return { ...next, logs: [logEntry(next, "magic", `[첫 비전 단어] ${cardDisplayKo(drawn.card)} → ${word.en}${already ? " (이미 앎)" : " (아는 단어에 기록)"}. 인물 생성 뒤 새 단어를 배우려면 임무가 필요합니다.`), ...next.logs] };
  });

  const drawMajorWord = () => update((previous) => {
    const drawn = drawRefereeToDiscard(previous);
    if (!drawn.card) return previous;
    const info = ARCANE_MAJOR_WORDS[drawn.card.rank];
    if (!info) return drawn.state;
    const word: KnownMajorWord = { key: drawn.card.rank, reversed: drawn.card.reversed };
    const already = drawn.state.character.knownMajorWords.some((item) => item.key === word.key && item.reversed === word.reversed);
    const next = already ? drawn.state : { ...drawn.state, character: { ...drawn.state.character, knownMajorWords: [...drawn.state.character.knownMajorWords, word] } };
    return { ...next, logs: [logEntry(next, "magic", `[첫 비전 단어] ${cardDisplayKo(drawn.card)} → ${drawn.card.reversed ? info.revEn : info.en}${already ? " (이미 앎)" : " (아는 단어에 기록)"}. 인물 생성 뒤 새 단어를 배우려면 임무가 필요합니다.`), ...next.logs] };
  });

  const drawRoadFolk = () => update((previous) => {
    const drawn = drawRefereeToDiscard(previous);
    if (!drawn.card) return previous;
    const index = MAJOR_RANKS.indexOf(drawn.card.rank as (typeof MAJOR_RANKS)[number]);
    const roadFolk: RoadFolkRecord = {
      card: drawn.card,
      occupation: FOLK_ROAD_KO.occupations[index],
      femaleName: FOLK_ROAD.femaleNames[index],
      maleName: FOLK_ROAD.maleNames[index],
      personality: FOLK_ROAD_KO.personalities[index],
    };
    return { ...drawn.state, roadFolk, logs: [logEntry(drawn.state, "oracle", `[길 위의 사람] ${cardDisplayKo(drawn.card)}: ${roadFolk.occupation}; ${roadFolk.femaleName}/${roadFolk.maleName}; ${roadFolk.personality}.`), ...drawn.state.logs] };
  });

  const saveSpell = () => {
    const minor = state.character.knownMinorWords.find((item) => `${item.suit}:${item.key}` === spellForm.minor);
    const major = state.character.knownMajorWords.find((item) => `${item.key}:${item.reversed}` === spellForm.major);
    if (!minor || !major) return;
    const minorInfo = ARCANE_MINOR_WORDS[minor.suit]?.[minor.key];
    const majorInfo = ARCANE_MAJOR_WORDS[major.key];
    if (!minorInfo || !majorInfo) return;
    const name = `${minorInfo.en} ${major.reversed ? majorInfo.revEn : majorInfo.en}`;
    update((previous) => ({
      ...previous,
      character: { ...previous.character, spells: [...previous.character.spells, { id: uid(), name, effectNote: spellForm.effect.trim() }] },
      logs: [logEntry(previous, "magic", `[주문서] ${name} 기록. 효과 메모는 심판이 적은 그대로 보존됩니다.`), ...previous.logs],
    }));
  };

  const prepareCombatSpell = (name: string, cost: number, source = "") => {
    setCombatAction(draft => ({ ...draft, action: "Cast a Spell", cardId: "", calledShot: false, useFool: false, resolveCost: cost, rawWounds: source === "undo" ? 0 : cost, spellSource: source, spellName: name }));
    setTab("tests");
  };

  const castSpell = (spell: Spell, resolveCost: number) => {
    if (state.combat.active) { prepareCombatSpell(spell.name, Math.max(1, resolveCost)); return; }
    update(previous => {
      if (!previous.character.talents.includes("Magick") || previous.character.dead || previous.character.wounds.head) return previous;
      const spent = spendPlayerResolve(previous, Math.max(1, resolveCost)); if (!spent) return previous;
      return { ...spent, logs: [logEntry(spent, "magic", `[비전 주문 시전] ${spell.name}; 결의 ${Math.max(1, resolveCost)} 소비. 효과는 심판이 판정합니다.`), ...spent.logs] };
    });
  };

  const castBoundSpell = (binding: BoundMagic) => {
    if (state.combat.active) { prepareCombatSpell(`${binding.object} · ${binding.spell}`, 1, binding.id); return; }
    update(previous => {
      const item = previous.character.boundMagic.find(entry => entry.id === binding.id);
      if (!item || item.charges < 1 || previous.character.dead || previous.character.wounds.head) return previous;
      const spent = spendPlayerResolve(previous, 1); if (!spent) return previous;
      return { ...spent, character: { ...spent.character, boundMagic: spent.character.boundMagic.map(entry => entry.id === item.id ? { ...entry, charges: entry.charges - 1 } : entry) }, logs: [logEntry(spent, "magic", `[봉인 주문 시전] ${item.object}: ${item.spell}; 충전 1회와 결의 1점 소비.`), ...spent.logs] };
    });
  };

  const undoMagick = (testRequired: boolean) => {
    if (state.combat.active) { prepareCombatSpell("비술 해제", 1, "undo"); return; }
    update(previous => {
      if (!previous.character.talents.includes("Undo Magick") || previous.character.dead || previous.character.wounds.head) return previous;
      const spent = spendPlayerResolve(previous, 1); if (!spent) return previous;
      return { ...spent, logs: [logEntry(spent, "magic", `비술 해제 · 결의 −1.${testRequired ? " 강력한 비술의 완드 판정을 마련합니다." : " 효과는 심판이 판정합니다."}`), ...spent.logs] };
    });
    if (testRequired) startTest("비술 해제 — 강력한 비술", "wands");
  };

  const bindSpell = (spell: Spell) => {
    if (!state.character.talents.includes("Bind Magick")) return;
      const object = window.prompt("비술을 봉인할 물건:");
    if (!object) return;
      const raw = Number.parseInt(window.prompt("더할 충전 수(결의도 같은 수만큼 소비):", "1") || "0", 10);
    const charges = Math.max(1, raw || 1);
    update((previous) => {
      const spent = spendPlayerResolve(previous, charges);
      if (!spent) return previous;
      return {
        ...spent,
        character: { ...spent.character, boundMagic: [...spent.character.boundMagic, { id: uid(), object, spell: spell.name, charges }] },
        logs: [logEntry(spent, "magic", `[비술 봉인] ${object} ← ${spell.name}; 충전 ${charges}, 결의 ${charges} 소비.`), ...spent.logs],
      };
    });
  };

  const performRest = () => update((previous) => {
    const selectedPart = previous.character.wounds[restForm.part]
      ? restForm.part
      : (Object.keys(previous.character.wounds) as WoundPart[]).find((part) => previous.character.wounds[part]);
    if (previous.character.dead || !restForm.placeConfirmed || !restForm.mealConfirmed || !selectedPart) return previous;
    const inventory = previous.character.inventory.map((item) => {
      if (item.id !== restForm.rationId || item.uses === null) return item;
      return { ...item, uses: Math.max(0, item.uses - 1) };
    });
    const next = {
      ...previous,
      day: previous.day + 1,
      watch: 1,
      turns: 0,
      rounds: 0,
      character: {
        ...previous.character,
        inventory,
        wounds: { ...previous.character.wounds, [selectedPart]: false },
      },
    };
    return { ...next, logs: [logEntry(previous, "downtime", `[휴식] 야영지 또는 정착지에서 식사와 함께 밤을 온전히 보냈음을 확인했습니다. ${woundLabels[selectedPart]} 부상 하나를 치유했습니다.${restForm.rationId === "fiction" ? " 식사는 이야기 속에서 마련되었습니다." : " 기록한 식량 1회를 소비했습니다."}`), ...previous.logs] };
  });

  const carouse = () => update((previous) => {
    const drawn = drawPlayerForImmediateUse(previous);
    if (!drawn.card) return previous;
    const text = CAROUSING_TABLE_KO[tableKey(drawn.card) === "0" ? "Fool" : tableKey(drawn.card)] || "참조표 항목 없음";
    let next = gainResolve(drawn.state);
    next = { ...next, logs: [logEntry(next, "downtime", `[흥청망청 놀기] ${cardDisplayKo(drawn.card)}: ${text}. 결의 +1. 구체적인 결과는 플레이어와 심판이 기록합니다.`), ...next.logs] };
    return next;
  });

  const lifepathDraw = (birth: boolean) => update((previous) => {
    const drawn = drawPlayerForImmediateUse(previous);
    if (!drawn.card || drawn.fool || !drawn.card.suit) return drawn.state;
    const value = cardValue(drawn.card);
    let text: string;
    if (birth) {
      const contexts: Record<Suit, string> = {
        wands: "신비·영혼·기이함·비술",
        swords: "전쟁·갈등·여정·하급 귀족",
        cups: "학문·안전·교역·정치",
        coins: "거리·가난·천한 태생·떠돌이",
      };
      text = `출생 배경 — ${contexts[drawn.card.suit]}`;
    } else {
      const suit = `${drawn.card.suit[0].toUpperCase()}${drawn.card.suit.slice(1)}`;
      const key = ["A", "2"].includes(drawn.card.rank) ? "A-2"
        : ["3", "4"].includes(drawn.card.rank) ? "3-4"
        : ["5", "6"].includes(drawn.card.rank) ? "5-6"
        : ["7", "8"].includes(drawn.card.rank) ? "7-8"
        : ["9", "10"].includes(drawn.card.rank) ? "9-10"
        : tableKey(drawn.card);
      const event = LIFEPATH_EVENTS[suit]?.[key];
      text = event ? event.ko : "참조표 항목 없음";
    }
    const next = {
      ...drawn.state,
      character: {
        ...drawn.state.character,
        age: drawn.state.character.age + value,
        lifepath: [...drawn.state.character.lifepath, `${cardDisplayKo(drawn.card)} — ${text} (+${value}년). 해석: `],
      },
    };
    return { ...next, logs: [logEntry(next, "character", `[삶의 행로] ${cardDisplayKo(drawn.card)} — ${text}; 나이 +${value}.`), ...next.logs] };
  });

  const exportSave = () => {
    const blob = new Blob([JSON.stringify({ version: 2, state, undo: undoRef.current }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${state.campaignName || state.character.name || "gloam"}-save.json`.replace(/[^a-zA-Z0-9가-힣._-]/g, "-");
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importSave = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as SaveBundle;
      if (!parsed.state) throw new Error("저장 상태가 없습니다.");
      const imported = sanitizeV2(parsed.state);
      undoRef.current = [...undoRef.current.slice(-(MAX_UNDO - 1)), state];
      setUndoCount(undoRef.current.length);
      setState(imported);
    } catch {
      window.alert("유효한 Gloam v2 JSON 저장 파일이 아닙니다.");
    } finally {
      event.target.value = "";
    }
  };

  const resetAll = () => {
    if (!window.confirm("현재 연대기를 모두 비우고 새 여정을 시작할까요? 한 번은 되돌릴 수 있습니다.")) return;
    update(() => freshState());
  };

  const openRulebook = (sectionId?: string) => {
    rulebookReturnFocusRef.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body && !document.activeElement.closest(".quick-dialog")
      ? document.activeElement
      : rulebookButtonRef.current;
    setRulebookSectionId(sectionId);
    setRulebookOpen(true);
  };

  const closeRulebook = () => {
    const returnTarget = rulebookReturnFocusRef.current;
    setRulebookOpen(false);
    window.setTimeout(() => returnTarget?.focus({ preventScroll: true }), 0);
  };

  return (
    <RulebookOpenContext.Provider value={id => setQuickRule(id || "tests")}>
      <div className="app-shell">
      <a className="skip-link" href="#play-content">본문으로 건너뛰기</a>
      <header className="topbar">
        <div className="brand"><div className="brand-wordmark"><span className="brand-imprint">A FANTASY TAROT ROLEPLAYING GAME</span><h1 className="gloam-title">Gloam</h1><span className="brand-caption">모험의 곁에 두는 도구</span></div></div>
        <div className="top-actions">
          <button onClick={undo} disabled={undoCount === 0} aria-label={`되돌리기 · ${undoCount}개`}>↶ 되돌리기</button>
          <button ref={rulebookButtonRef} className="rules-trigger" onClick={() => setQuickRule("tests")}>규칙 찾기 <kbd>/</kbd></button>
          <details className="save-menu"><summary>저장 · 더보기</summary><div onClick={event => event.currentTarget.parentElement?.removeAttribute("open")}>
            <button onClick={exportSave}>저장 내려받기</button><button onClick={() => importRef.current?.click()}>저장 가져오기</button>
            <button onClick={() => setTab("log")}>모험 기록</button><button onClick={() => openRulebook()}>원문 룰북</button>
            <span className={`integrity ${integrity.player && integrity.referee ? "ok" : "bad"}`}>{integrity.player && integrity.referee ? "카드 57 / 21 · 정상" : "카드 상태 확인 필요"}</span>
            <button className="danger" onClick={resetAll}>새 모험 시작</button>
          </div></details>
          <input ref={importRef} type="file" accept="application/json" hidden onChange={importSave} />
        </div>
        {saveError && <p className="save-error" role="alert">{saveError}</p>}
      </header>
      <nav className="tabs" aria-label="플레이 도구">
        {([ ["play", "플레이"], ["tests", "전투"], ["character", "인물"], ["map", "탐사"], ["magic", "비술"], ["downtime", "휴식 · 정산"] ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} data-tab={key} className={tab === key ? "active" : ""} aria-current={tab === key ? "page" : undefined} onClick={() => { setTab(key); window.scrollTo({ top: 0, behavior: "instant" }); }}><span className="chapter-number" aria-hidden="true">{({ play: "I", tests: "II", character: "III", map: "IV", magic: "V", downtime: "VI" } as Record<string, string>)[key]}</span>{label}{key === "tests" && state.combat.active && <span className="nav-dot" aria-label="전투 진행 중" />}</button>
        ))}
      </nav>
      <div className="table-status" aria-label="현재 인물과 모험 상태">
        <div className="status-character"><strong>{state.character.name || "새 모험가"}</strong><span>{state.character.vocation || "천직 미정"}</span></div>
        <button className="status-resolve" onClick={() => setQuickRule("resolve")}><span>결의</span><strong>{state.character.resolve}<small>/10</small></strong><span>심판 {state.refereeResolve}</span></button>
        <button onClick={() => setQuickRule("wounds")}><span>이동력</span><strong>{speed}</strong><span>{state.character.dead ? "사망" : state.character.wounds.head ? "의식불명" : state.character.wounds.torso ? "모든 판정 −3" : Object.values(state.character.wounds).some(Boolean) ? "부상 있음" : "부상 없음"}</span></button>
        <button onClick={() => setQuickRule("time-downtime")}><span>{state.day}일째</span><strong>{state.watch}<small>/3 경점</small></strong><span>세션 {state.sessionNumber}</span></button>
        <span className="autosave" role="status">{saveError ? "저장 오류" : "● 자동 저장"}</span>
      </div>
      <main id="play-content" className={`chapter chapter-${tab}`}>
        <div className="chapter-heading"><div><span className="eyebrow">{state.campaignName || "THE ADVENTURER’S TABLE"}</span><span className="chapter-title" aria-hidden="true">{({ play: "Play", tests: "Combat", character: "Character", map: "Exploration", magic: "Magick", downtime: "Downtime", log: "Chronicle" } as Record<Tab, string>)[tab]}</span><h2>{({ play: "다음 행동을 이야기하세요", tests: "전투", character: "인물 기록", map: "탐사와 지도", magic: "비술", downtime: "휴식과 세션 정산", log: "모험 기록" } as Record<Tab, string>)[tab]}</h2></div><button className="text-button" onClick={() => setQuickRule(({ play: "tests", tests: "combat", character: "create-character", map: "generating-maps", magic: "arcane-magick", downtime: "resting", log: "goals" } as Record<Tab, string>)[tab])}>이 화면의 규칙 ↗</button></div>
        {tab === "play" && <PlayTable state={state} update={update} talents={Object.values(TALENTS).flat().filter(talent => state.character.talents.includes(talent.name))}
          onRollTest={rollTest} onPushTest={pushTest} onBoostTest={spendResolveOnTest}
          onNewTest={() => update(previous => ({ ...previous, test: { ...emptyTest(), suit: previous.test.suit, stat: previous.character.stats[previous.test.suit] } }))}
          onStartReaction={() => startTest("등장인물·괴수 반응 판정", state.test.suit)}
          onAdvanceWatch={() => update(previous => ({ ...previous, ...advanceWatch(previous) }))}
          onAdvanceTurn={() => update(previous => ({ ...previous, ...advanceGameTime(previous, 15 * 60) }))}
          onRecallFool={manualFoolRecall}
          onEvent={() => drawEvent()} onOracle={kind => ({ "yes-no": oracleYesNo, amount: oracleAmount, "action-subject": oracleActionSubject })[kind]()}
          onResolveGain={reason => update(previous => { const next = gainResolve(previous); return { ...next, logs: [logEntry(next, "character", `${reason} · 플레이어와 심판 결의 +${next.character.resolve - previous.character.resolve}`), ...next.logs] }; })}
          onResolveSpend={reason => update(previous => { const next = spendPlayerResolve(previous, 1); return next ? { ...next, logs: [logEntry(next, "character", `${reason} · 결의 −1`), ...next.logs] } : previous; })}
          onGoal={resolveGoal}
          onNavigate={setTab} onRule={setQuickRule}
          onTalent={activateTalent}
        />}
        {tab === "character" && (
          <CharacterTab
            state={state}
            update={update}
            speed={speed}
            capacity={capacity}
            slotsUsed={slotsUsed}
            contactDraft={contactDraft}
            setContactDraft={setContactDraft}
            inventoryDraft={inventoryDraft}
            setInventoryDraft={setInventoryDraft}
            onNavigate={setTab} onActivateTalent={activateTalent} onGoal={resolveGoal}
            lifepathDraw={lifepathDraw}
            gainResolve={gainResolve}
            spendPlayerResolve={spendPlayerResolve}
            startTest={startTest}
          />
        )}

        {tab === "tests" && (
          <TestsCombatTab
            state={state}
            update={update}
            speed={speed}
            rollTest={rollTest}
            pushTest={pushTest}
            spendResolveOnTest={spendResolveOnTest}
            startTest={startTest}
            dealCombatRound={dealCombatRound}
            choosePlayerInitiative={choosePlayerInitiative}
            chooseMonsterInitiative={chooseMonsterInitiative}
            endCombatRound={endCombatRound}
            playCombatAction={playCombatAction}
            discardPlayerCombatCard={discardPlayerCombatCard}
            playMonsterCard={playMonsterCard}
            addMonster={addMonster}
            removeMonster={removeMonster}
            combatAction={{ ...combatAction, monsterId: combatAction.monsterId || (state.combat.monsters.length === 1 ? state.combat.monsters[0].id : "") }}
            setCombatAction={setCombatAction}
            damageForm={damageForm}
            setDamageForm={setDamageForm}
            applyDamage={applyDamage}
            combatEndNote={combatEndNote}
            setCombatEndNote={setCombatEndNote}
            endCombat={endCombat}
            manualFoolRecall={manualFoolRecall}
            spendRefereeResolveOnLastTest={spendRefereeResolveOnLastTest}
            boostLastWithFool={boostLastWithFool}
            spendPlayerResolveOnCombat={spendPlayerResolveOnCombat} swapNimble={swapNimble} activateSallyForth={activateSallyForth} moraleTest={moraleTest}
          />
        )}

        {tab === "magic" && (
          <MagicOracleTab
            state={state}
            update={update}
            spellForm={spellForm}
            setSpellForm={setSpellForm}
            folkForm={folkForm}
            setFolkForm={setFolkForm}
            alchemyForm={alchemyForm}
            setAlchemyForm={setAlchemyForm}
            drawMinorWord={drawMinorWord}
            drawMajorWord={drawMajorWord}
            saveSpell={saveSpell}
            castSpell={castSpell} castBoundSpell={castBoundSpell} undoMagick={undoMagick}
            bindSpell={bindSpell}
            startTest={startTest}
            oracleYesNo={oracleYesNo}
            oracleAmount={oracleAmount}
            oracleActionSubject={oracleActionSubject}
          />
        )}

        {tab === "map" && (
          <MapEventsTab
            state={state}
            update={update}
            drawMapCell={drawMapCell}
            drawWildernessTerrain={drawWildernessTerrain}
            clearMap={clearMap}
            drawEvent={drawEvent}
          />
        )}

        {tab === "downtime" && (
          <DowntimeTab
            state={state}
            update={update}
            restForm={restForm}
            setRestForm={setRestForm}
            performRest={performRest}
            startSession={startSession} settleSession={settleSession}
            carouse={carouse}
            addMonster={addMonster}
            startTest={startTest}
            drawRefereeToDiscard={drawRefereeToDiscard}
            spendRefereeResolveOnLastTest={spendRefereeResolveOnLastTest}
            drawRoadFolk={drawRoadFolk}
          />
        )}

        {tab === "log" && (
          <LogTab
            state={state}
            update={update}
            newLog={newLog}
            setNewLog={setNewLog}
            addLog={addLog}
            exportSave={exportSave}
            integrity={integrity}
          />
        )}
      </main>
        {quickRule !== null && <QuickRules initialId={quickRule} onClose={() => setQuickRule(null)} onSource={id => { setQuickRule(null); openRulebook(id); }} />}
        {rulebookOpen && (
          <Suspense fallback={<div className="rulebook-loading-screen" role="status">통합 룰북을 펼치는 중입니다…</div>}>
            <RulebookTransplant
              initialSectionId={rulebookSectionId}
              currentTab={tab}
              onClose={closeRulebook}
              onOpenRuntime={(nextTab) => {
                setTab(nextTab);
                setRulebookOpen(false);
                window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`.tabs button[data-tab="${nextTab}"]`)?.focus());
              }}
            />
          </Suspense>
        )}
      </div>
    </RulebookOpenContext.Provider>
  );
}

type Update = (recipe: (previous: GameState) => GameState, keepUndo?: boolean) => void;

const PANEL_RULEBOOK_REFERENCE: Record<string, string> = {
  "인물 장부": "create-character",
  "삶의 행로": "lifepath",
  "목표와 본능": "goals",
  "친구·적·등장인물": "friend-foe",
  "재능과 성장": "talents",
  "소지품 장부": "equipment",
  "부상과 갑옷": "wounds",
  "일반 판정": "tests",
  "플레이어 행동과 대응": "combat",
  "부상과 갑옷 적용": "equipment-armor",
  "전투의 끝": "combat",
  "연금술": "alchemy",
  "민간 비술": "folk-magick",
  "비전 비술": "arcane-magick",
  "징조": "oracles",
  "지도 펼치기": "generating-maps",
  "사건 덱": "event-deck",
  "사건 연대기": "event-deck",
  "괴수 도감": "bestiary",
  "휴식과 회복": "resting",
  "시간과 회차": "time-downtime",
  "흥청망청 보내기": "carousing",
  "고용인": "hirelings",
  "길 위의 사람들": "road-folk",
  "마법 물품표": "magic-items-weapons",
  "두 덱의 보관함": "cards",
  "보존 무결성": "cards",
  "캠페인 연대기": "how-to-play",
  "임무와 인연의 현황": "goals",
};

function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  const openRulebook = useContext(RulebookOpenContext);
  const referenceId = PANEL_RULEBOOK_REFERENCE[title];
  return <section className={`panel ${className}`}><header className="panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{referenceId && <button className="panel-rulebook-link" onClick={() => openRulebook(referenceId)}>규칙 ↗</button>}</header>{children}</section>;
}

const suitKo: Record<Suit, string> = { cups: "Cups", wands: "Wands", swords: "Swords", coins: "Coins" };
const rankKo: Record<string, string> = { "0": "광대", A: "에이스", Page: "시종", Knight: "기사", Queen: "여왕", King: "왕" };
const tarotSuitFile: Record<Suit, string> = { cups: "Cups", wands: "Wands", swords: "Swords", coins: "Pentacles" };
const testStatusKo: Record<string, string> = { "great-success": "대성공", success: "성공", failure: "실패", "great-failure": "대실패" };
const categoryKo: Record<LogEntry["category"], string> = {
  character: "인물", test: "판정", combat: "전투", magic: "비술", oracle: "징조",
  event: "사건", map: "지도", downtime: "막간", save: "보존", note: "기록",
};

const cardDisplayKo = (card: Card) => {
  const direction = card.reversed ? " · 역방향" : "";
  if (card.rank === "0") return `광대${direction}`;
  if (card.type === "major") return `메이저 ${card.rank}${direction}`;
  return `${suitKo[card.suit as Suit]} ${rankKo[card.rank] || card.rank}${direction}`;
};

const cardImagePath = (card: Card) => {
  if (card.type === "major") {
    const number = card.rank === "0" ? 0 : MAJOR_RANKS.indexOf(card.rank as (typeof MAJOR_RANKS)[number]) + 1;
    return `/tarot/Major_${number}.jpg`;
  }
  const rank = card.rank === "A" ? "1" : card.rank;
  return `/tarot/${tarotSuitFile[card.suit as Suit]}_${rank}.jpg`;
};

const cardAccessibleName = (card: Card, hidden: boolean) => {
  if (hidden) return "뒷면으로 놓인 카드";
  const direction = card.reversed ? "역방향" : "정방향";
  if (card.rank === "0") return `${direction} 광대`;
  if (card.type === "major") return `${direction} 메이저 아르카나 ${card.rank}`;
  return `${direction} ${suitKo[card.suit as Suit]} ${rankKo[card.rank] || card.rank}`;
};

function CardView({ card, hidden = false }: { card: Card; hidden?: boolean }) {
  return <figure className={`playing-card ${hidden ? "hidden" : ""} ${card.reversed ? "reversed" : ""}`} role="img" aria-label={cardAccessibleName(card, hidden)}>
    <img src={hidden ? "/tarot/card-back.jpg" : cardImagePath(card)} alt="" loading="lazy" decoding="async" />
  </figure>;
}

function CharacterTab(props: {
  onNavigate: (tab: Tab) => void;
  onActivateTalent: (name: string) => void;
  onGoal: (id: string, status: "completed" | "impossible") => void;
  state: GameState;
  update: Update;
  speed: number;
  capacity: number;
  slotsUsed: number;
  contactDraft: { name: string; location: string; connection: string };
  setContactDraft: React.Dispatch<React.SetStateAction<{ name: string; location: string; connection: string }>>;
  inventoryDraft: { name: string; category: InventoryItem["category"] };
  setInventoryDraft: React.Dispatch<React.SetStateAction<{ name: string; category: InventoryItem["category"] }>>;
  lifepathDraw: (birth: boolean) => void;
  gainResolve: (previous: GameState, amount?: number) => GameState;
  spendPlayerResolve: (previous: GameState, amount: number) => GameState | null;
  startTest: (purpose: string, suit: Suit, modifier?: number, opposedPenalty?: number) => void;
}) {
  const { state, update, speed, capacity, slotsUsed } = props;
  const [section, setSection] = useState(props.state.character.name || props.state.character.age >= 18 ? "overview" : "lifepath");
  const [extraTalent, setExtraTalent] = useState("");
  const character = state.character;
  const statsValid = [...Object.values(character.stats)].sort((a, b) => a - b).join(",") === "1,2,3,4";
  const ownVocation = character.vocation;
  const activeGoals = character.goals.filter((goal) => goal.status === "active").length;
  const addContact = (kind: "friends" | "foes" | "npcs") => {
    if (!props.contactDraft.name.trim()) return;
    update((previous) => ({
      ...previous,
      character: {
        ...previous.character,
        [kind]: [...previous.character[kind], { id: uid(), name: props.contactDraft.name.trim(), location: props.contactDraft.location.trim(), connection: props.contactDraft.connection.trim(), history: [] }],
      },
      logs: [logEntry(previous, "character", `[${contactKindKo[kind]}] ${props.contactDraft.name.trim()} 기록.`), ...previous.logs],
    }));
    props.setContactDraft({ name: "", location: "", connection: "" });
  };
  const addInventory = (name = props.inventoryDraft.name, category = props.inventoryDraft.category, uses: number | null = null) => {
    if (!name.trim()) return;
    update((previous) => ({
      ...previous,
      character: { ...previous.character, inventory: [...previous.character.inventory, { id: uid(), name: name.trim(), category, slots: 1, damaged: false, uses, notes: "", contents: "" }] },
    }));
    props.setInventoryDraft({ name: "", category: "other" });
  };
  const preparePurchase = (name: string, coins: string) => props.startTest(`${name} 구입`, "coins", coins === "-" ? 0 : Number(coins));
  return <>
    <div className="creation-note"><strong>새 인물의 순서</strong> · 행로 → 능력치와 천직 → 목표·본능 → 친구·적 → 무료 장비 다섯 개. 나이는 최소 18세입니다.</div>
    <nav className="character-nav" aria-label="인물 기록 항목">{[["lifepath", "1 행로"], ["overview", "2 능력치·천직"], ["goals", "3 목표·본능"], ["contacts", "4 인연"], ["inventory", "5 장비"], ["wounds", "부상·갑옷"], ["talents", "재능·성장"]].map(([key, text]) => <button key={key} className={section === key ? "active" : ""} aria-current={section === key ? "step" : undefined} onClick={() => setSection(key)}>{text}</button>)}</nav>
    <div className="page-grid character-page">
    {section === "overview" && <Panel title="인물 장부" subtitle="공식 인물지의 모든 항목을 적고 오래 보존합니다." className="span-2">
      <div className="form-grid four">
        <label>이름<input value={character.name} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, name: event.target.value } }))} /></label>
        <label>나이<input type="number" min={0} value={character.age} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, age: Math.max(0, Number(event.target.value)) } }))} /></label>
        <label>천직<select value={character.vocation} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, vocation: event.target.value } }))}><option value="">고르기</option>{Object.keys(TALENTS).map((vocation) => <option key={vocation} value={vocation}>{vocation}</option>)}</select></label>
        <label>초상화 주소<input value={character.portrait} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, portrait: event.target.value } }))} /></label>
      </div>
      <div className="stats-row">
        {SUITS.map((suit) => <label key={suit} className="stat-box"><span>{suitKo[suit]}</span><input type="number" min={1} max={6} value={character.stats[suit]} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, stats: { ...previous.character.stats, [suit]: clamp(Number(event.target.value), 1, 6) } } }))} /></label>)}
        <div className="metric"><span>이동력</span><strong>{speed}</strong></div><div className="metric"><span>결의</span><strong>{character.resolve}/10</strong></div><div className="metric"><span>경험치</span><strong>{character.xp}</strong></div>
      </div>
      <div className={`notice ${statsValid || Object.values(character.stats).some(stat => stat > 4) ? "ok" : "warn"}`}>생성 확인: 능력치가 {statsValid ? "1·2·3·4로 올바르게 배분되었습니다" : "성장 전에는 1·2·3·4로 배분하세요"}. 성장한 인물은 6까지 높일 수 있으므로 초기 배분 확인을 건너뜁니다.</div>
      <div className="button-row">
        <button onClick={() => {
          const suit = SUITS.find((key) => character.stats[key] === 4);
          if (suit && statsValid) update((previous) => { const vocation = vocationFromSuit[suit]; const starting = TALENTS[vocation].find(item => item.starting)!.name; return { ...previous, character: { ...previous.character, vocation, talents: previous.character.talents.includes(starting) ? previous.character.talents : [...previous.character.talents, starting] } }; });
        }} disabled={!statsValid}>천직 · 시작 재능 설정</button>
        <button onClick={() => update((previous) => props.gainResolve(previous))}>결의 +1 · 규칙 사건 확인</button>
        <button onClick={() => update((previous) => props.spendPlayerResolve(previous, 1) || previous)}>결의 1 쓰기</button>
        <button onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, xp: previous.character.xp + 1 } }))}>경험치 +1 · 기록 바로잡기</button>
      </div>
      <details><summary>혼자 / 심판과 일대일 플레이 · 추가 재능</summary><p className="reference-note">어느 천직에서든 재능 하나를 추가로 얻습니다.</p>{character.soloTalent ? <p>추가 재능: {character.soloTalent}</p> : <div className="button-row"><select aria-label="솔로 추가 재능" value={extraTalent} onChange={event => setExtraTalent(event.target.value)}><option value="">고르기</option>{Object.entries(TALENTS).flatMap(([vocation, talents]) => talents.filter(talent => !character.talents.includes(talent.name)).map(talent => <option key={talent.name} value={talent.name}>{vocation} · {talent.name}</option>))}</select><button disabled={!extraTalent} onClick={() => update(previous => ({ ...previous, character: { ...previous.character, soloTalent: extraTalent, talents: [...previous.character.talents, extraTalent] } }))}>추가 재능 기록</button></div>}</details>
      <label>인물 기록<textarea value={character.notes} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, notes: event.target.value } }))} /></label>
    </Panel>}

    {section === "lifepath" && <Panel title="삶의 행로" subtitle="인쇄된 표의 결과만 뽑아 적습니다. 그 뜻은 플레이 자리에 남겨 둡니다.">
      <div className="button-row"><button onClick={() => props.lifepathDraw(true)}>출생 배경 뽑기</button><button onClick={() => props.lifepathDraw(false)}>지난 사건 뽑기</button></div>
      <div className={`notice ${character.age >= 18 ? "ok" : "warn"}`}>최소 나이 18세 · 현재 {character.age}세.</div>
      <ol className="record-list">{character.lifepath.map((entry, index) => <li key={`${entry}-${index}`}><textarea aria-label={`삶의 행로 ${index + 1}`} value={entry} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, lifepath: previous.character.lifepath.map((item, itemIndex) => itemIndex === index ? event.target.value : item) } }))} /><button className="icon danger" aria-label={`삶의 행로 ${index + 1} 지우기`} onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, lifepath: previous.character.lifepath.filter((_, itemIndex) => itemIndex !== index) } }))}>×</button></li>)}</ol>
    </Panel>}

    {section === "goals" && <Panel title="목표와 본능" subtitle="목표 완수·불가능, 본능이 문제를 일으키거나 이야기를 형성하면 결의 1점을 얻습니다.">
      <div className={`notice ${activeGoals === 3 ? "ok" : "warn"}`}>진행 중인 목표: {activeGoals}/3.</div><div className="button-row"><button disabled={activeGoals >= 3} onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, goals: [...previous.character.goals, { id: uid(), text: "", status: "active", note: "" }] } }))}>목표 새기기</button></div>
      {character.goals.map((goal) => <div className="goal-row" key={goal.id}><input aria-label="목표 내용" value={goal.text} disabled={goal.status !== "active"} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, goals: previous.character.goals.map((item) => item.id === goal.id ? { ...item, text: event.target.value } : item) } }))} /><input placeholder="목표의 사연 또는 결말 기록" value={goal.note} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, goals: previous.character.goals.map((item) => item.id === goal.id ? { ...item, note: event.target.value } : item) } }))} /><span>{goalStatusKo[goal.status]}</span>{goal.status === "active" && <><button disabled={!goal.text.trim()} onClick={() => props.onGoal(goal.id, "completed")}>완수</button><button disabled={!goal.text.trim()} onClick={() => props.onGoal(goal.id, "impossible")}>불가능</button><button onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, goals: previous.character.goals.map((item) => item.id === goal.id ? { ...item, status: "discarded" } : item) } }))}>폐기</button></>}</div>)}
      <h3>본능</h3>
      {character.instincts.map((instinct, index) => <div className="goal-row" key={index}><input aria-label={`본능 ${index + 1}`} value={instinct} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, instincts: previous.character.instincts.map((item, itemIndex) => itemIndex === index ? event.target.value : item) } }))} /><button disabled={!instinct.trim()} onClick={() => update((previous) => { const gained = props.gainResolve(previous); return { ...gained, logs: [logEntry(gained, "character", `[본능 발동] ${instinct}; 결의 +1. 자세한 사연은 연대기에 남깁니다.`), ...gained.logs] }; })}>이야기 변화 · 결의 +1</button></div>)}
    </Panel>}

    {section === "wounds" && <Panel title="부상과 갑옷" subtitle="부상 효과와 갑옷의 흠집만 기록하며 서사를 대신 정하지 않습니다." className="span-2">
      <div className="wound-grid">{(Object.keys(woundLabels) as WoundPart[]).map((part) => <label key={part} className={character.wounds[part] ? "wound active" : "wound"}><input type="checkbox" checked={character.wounds[part]} onChange={() => update((previous) => ({ ...previous, character: { ...previous.character, wounds: { ...previous.character.wounds, [part]: !previous.character.wounds[part] } } }))} />{woundLabels[part]}</label>)}</div>
      {character.dead && <div className="notice bad" role="alert">두 번째 머리 부상이 기록되어 인물이 사망 상태가 되었습니다. 되돌리거나 직접 바로잡을 수 있습니다.</div>}
      {character.dead && <button onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, dead: false } }))}>기록 바로잡기 · 사망 지우기</button>}
      <div className="armor-grid">{(Object.keys(armorLimits) as ArmorKey[]).map((key) => <label key={key}><span>{armorLimits[key].label} · AP {armorLimits[key].ap}</span><input type="number" min={0} max={armorLimits[key].ap} value={character.armorNotches[key]} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, armorNotches: { ...previous.character.armorNotches, [key]: clamp(Number(event.target.value), 0, armorLimits[key].ap) } } }))} /><small>{character.armorNotches[key] >= armorLimits[key].ap ? "수리할 때까지 파손" : "흠집"}</small></label>)}</div>
    </Panel>}

    {section === "inventory" && <Panel title="소지품 장부" subtitle={`사용한 칸 ${slotsUsed}/${capacity}. 착용한 갑옷도 한 칸을 쓰며, 0칸 예외는 인쇄된 물품에만 적용합니다.`}>
      <p className="reference-note">새 인물은 물품 다섯 개를 값없이 고릅니다. 목록의 ‘소유로 기록’은 소지만 적으며, 구입은 곁의 코인 수정치 판정을 씁니다.</p>
      <div className="form-grid"><input placeholder="물품 이름" value={props.inventoryDraft.name} onChange={(event) => props.setInventoryDraft((draft) => ({ ...draft, name: event.target.value }))} /><select aria-label="물품 종류" value={props.inventoryDraft.category} onChange={(event) => props.setInventoryDraft((draft) => ({ ...draft, category: event.target.value as InventoryItem["category"] }))}>{(["weapon", "armor", "trade", "magic", "container", "other"] as InventoryItem["category"][]).map((category) => <option key={category} value={category}>{inventoryCategoryKo[category]}</option>)}</select><button onClick={() => addInventory()}>물품 기록</button></div>
      <div className="inventory-list">{character.inventory.map((item) => <article key={item.id} className={item.damaged ? "inventory-item damaged" : "inventory-item"}><input aria-label="물품 이름" value={item.name} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, inventory: previous.character.inventory.map((entry) => entry.id === item.id ? { ...entry, name: event.target.value } : entry) } }))} /><select aria-label={`${item.name} 종류`} value={item.category} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, inventory: previous.character.inventory.map((entry) => entry.id === item.id ? { ...entry, category: event.target.value as InventoryItem["category"] } : entry) } }))}>{(["weapon", "armor", "trade", "magic", "container", "other"] as InventoryItem["category"][]).map((category) => <option key={category} value={category}>{inventoryCategoryKo[category]}</option>)}</select><label>차지하는 칸<select value={item.slots} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, inventory: previous.character.inventory.map((entry) => entry.id === item.id ? { ...entry, slots: Number(event.target.value) as 0 | 1 } : entry) } }))}><option value={1}>1칸</option><option value={0}>0칸 · 인쇄된 예외</option></select></label><label><input type="checkbox" checked={item.damaged} onChange={() => update((previous) => ({ ...previous, character: { ...previous.character, inventory: previous.character.inventory.map((entry) => entry.id === item.id ? { ...entry, damaged: !entry.damaged } : entry) } }))} /> 파손</label><input type="number" placeholder="남은 사용 횟수" value={item.uses ?? ""} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, inventory: previous.character.inventory.map((entry) => entry.id === item.id ? { ...entry, uses: event.target.value === "" ? null : Math.max(0, Number(event.target.value)) } : entry) } }))} /><input placeholder="용기 안의 내용물" value={item.contents} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, inventory: previous.character.inventory.map((entry) => entry.id === item.id ? { ...entry, contents: event.target.value } : entry) } }))} /><input placeholder="파손 또는 물품 기록" value={item.notes} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, inventory: previous.character.inventory.map((entry) => entry.id === item.id ? { ...entry, notes: event.target.value } : entry) } }))} /><button className="icon danger" aria-label={`${item.name} 지우기`} onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, inventory: previous.character.inventory.filter((entry) => entry.id !== item.id) } }))}>×</button></article>)}</div>
      <details><summary>인쇄된 장비 목록</summary><div className="catalog">{WEAPONS.map((item) => <article className="catalog-item" key={item.name}><span>{item.nameKo} · 부상/사거리 {item.wounds}/{item.range} · 코인 {item.coins}</span><button onClick={() => preparePurchase(item.nameKo, item.coins)}>코인 판정 준비</button><button onClick={() => addInventory(item.nameKo, "weapon")}>소유로 기록</button></article>)}{ARMOR.map((item) => <article className="catalog-item" key={item.name}><span>{item.nameKo} · AP {item.ap} · 코인 {item.coins}</span><button onClick={() => preparePurchase(item.nameKo, item.coins)}>코인 판정 준비</button><button onClick={() => addInventory(item.nameKo, "armor")}>소유로 기록</button></article>)}{TRADE_GOODS.map((item) => <article className="catalog-item" key={item.name}><span>{item.nameKo} · 코인 {item.coins}</span><button onClick={() => preparePurchase(item.nameKo, item.coins)}>코인 판정 준비</button><button onClick={() => addInventory(item.nameKo, item.name.toLowerCase().includes("chest") || item.name.toLowerCase().includes("sack") || item.name.toLowerCase().includes("bottle") ? "container" : "trade", item.name === "Rations (7)" ? 7 : null)}>소유로 기록</button></article>)}</div></details>
    </Panel>}

    {section === "contacts" && <Panel title="친구·적·등장인물" subtitle="이름과 위치, 인연과 내력만 적습니다. 없는 보너스나 불이익은 만들지 않습니다." className="span-2">
      <div className="form-grid four"><input placeholder="이름" value={props.contactDraft.name} onChange={(event) => props.setContactDraft((draft) => ({ ...draft, name: event.target.value }))} /><input placeholder="머무는 곳" value={props.contactDraft.location} onChange={(event) => props.setContactDraft((draft) => ({ ...draft, location: event.target.value }))} /><input placeholder="인연 또는 기록" value={props.contactDraft.connection} onChange={(event) => props.setContactDraft((draft) => ({ ...draft, connection: event.target.value }))} /><div className="button-row"><button onClick={() => addContact("friends")}>친구</button><button onClick={() => addContact("foes")}>적</button><button onClick={() => addContact("npcs")}>등장인물</button></div></div>
      <div className="three-columns">{(["friends", "foes", "npcs"] as const).map((kind) => <div key={kind}><h3>{contactKindKo[kind]}</h3>{character[kind].map((contact) => <article className="compact-card" key={contact.id}><strong>{contact.name}</strong><span>{contact.location}</span><p>{contact.connection}</p><textarea placeholder="한 줄마다 내력 하나" value={contact.history.join("\n")} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, [kind]: previous.character[kind].map((item) => item.id === contact.id ? { ...item, history: event.target.value.split("\n") } : item) } }))} /><div className="button-row">{kind === "friends" && <button disabled={character.resolve < 1} onClick={() => update((previous) => { const spent = props.spendPlayerResolve(previous, 1); if (!spent) return previous; return { ...spent, logs: [logEntry(spent, "character", `[친구의 도움 요청] ${contact.name}; 결의 −1. 가능한 도움의 내용은 심판에게 남겨 둡니다.`), ...spent.logs] }; })}>도움 청하기 · 결의 1</button>}<button className="danger" onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, [kind]: previous.character[kind].filter((item) => item.id !== contact.id) } }))}>지우기</button></div></article>)}</div>)}</div>
    </Panel>}

    {section === "talents" && <Panel title="재능과 성장" subtitle="자기 천직 재능은 경험치 5, 다른 천직은 10입니다. 다른 천직의 시작 재능은 배울 수 없으며 경험치 1마다 하루를 수련합니다." className="span-2">
      <div className="talent-grid">{Object.entries(TALENTS).map(([vocation, talents]) => <div key={vocation}><h3>{vocation}</h3>{talents.map((talent) => { const unlocked = character.talents.includes(talent.name); const own = vocation === ownVocation; const cost = own ? 5 : 10; const blocked = talent.starting && !own; const dedicatedMagicWorkflow = ["Magick", "Bind Magick", "Undo Magick"].includes(talent.name); const dedicatedCombatWorkflow = ["Nimble", "Sally Forth"].includes(talent.name); return <article key={talent.name} className="talent"><div><strong>{talent.starting ? "◆" : "◇"} {talent.name}</strong><p>{talent.textKo}</p></div>{unlocked ? dedicatedMagicWorkflow || dedicatedCombatWorkflow ? <button onClick={() => props.onNavigate(dedicatedMagicWorkflow ? "magic" : "tests")}>{dedicatedMagicWorkflow ? "비술에서 사용 →" : "전투에서 사용 →"}</button> : <button disabled={character.resolve < 1} onClick={() => props.onActivateTalent(talent.name)}>발동 · 결의 1</button> : talent.starting && own ? <button onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, talents: [...previous.character.talents, talent.name] } }))}>시작 Talent 기록</button> : <button disabled={blocked || character.xp < cost} onClick={() => update((previous) => ({ ...previous, ...advanceGameTime(previous, cost * 24 * 60 * 60), character: { ...previous.character, xp: previous.character.xp - cost, talents: [...previous.character.talents, talent.name] }, logs: [logEntry(previous, "character", `[성장] ${talent.name}; 경험치 ${cost}, 수련 ${cost}일.`), ...previous.logs] }))}>{blocked ? "다른 천직의 시작 Talent" : `배우기 · 경험치 ${cost}`}</button>}</article>; })}</div>)}</div>
      <div className="button-row">{SUITS.map((suit) => <button key={suit} disabled={character.xp < 10 || character.stats[suit] >= 6} onClick={() => update((previous) => ({ ...previous, ...advanceGameTime(previous, 10 * 24 * 60 * 60), character: { ...previous.character, xp: previous.character.xp - 10, stats: { ...previous.character.stats, [suit]: previous.character.stats[suit] + 1 } }, logs: [logEntry(previous, "character", `[성장] ${suitKo[suit]} +1; 경험치 10, 수련 10일.`), ...previous.logs] }))}>{suitKo[suit]} 올리기 · 경험치 10</button>)}</div>
    </Panel>}
  </div>
  <div className="button-row"><button onClick={() => { const sequence = ["lifepath", "overview", "goals", "contacts", "inventory"]; const index = sequence.indexOf(section); setSection(sequence[Math.min(index + 1, sequence.length - 1)] || "overview"); }} disabled={!["lifepath", "overview", "goals", "contacts"].includes(section)}>다음 생성 단계 →</button></div>
  </>;
}

function TestsCombatTab(props: {
  state: GameState; update: Update; speed: number; rollTest: () => void; pushTest: () => void; spendResolveOnTest: () => void;
  startTest: (purpose: string, suit: Suit, modifier?: number, opposedPenalty?: number) => void; dealCombatRound: () => void;
  choosePlayerInitiative: (identity: string) => void; chooseMonsterInitiative: (monsterId: string, identity: string) => void;
  endCombatRound: () => void; playCombatAction: () => void; discardPlayerCombatCard: (identity: string) => void;
  playMonsterCard: (monsterId: string, identity: string, attack: boolean) => void; addMonster: (monsterId: number) => void;
  removeMonster: (monsterId: string) => void;
  combatAction: { action: string; monsterId: string; cardId: string; modifier: number; calledShot: boolean; useFool: boolean; rawWounds: number; resolveCost: number; spellSource: string; spellName: string };
  setCombatAction: React.Dispatch<React.SetStateAction<{ action: string; monsterId: string; cardId: string; modifier: number; calledShot: boolean; useFool: boolean; rawWounds: number; resolveCost: number; spellSource: string; spellName: string }>>;
  damageForm: { target: string; part: WoundPart; incoming: number; armor: ArmorKey | "none"; armorLabel: string; monsterArmored: boolean };
  setDamageForm: React.Dispatch<React.SetStateAction<{ target: string; part: WoundPart; incoming: number; armor: ArmorKey | "none"; armorLabel: string; monsterArmored: boolean }>>;
  applyDamage: () => void; combatEndNote: string; setCombatEndNote: React.Dispatch<React.SetStateAction<string>>; endCombat: () => void;
  manualFoolRecall: () => void; spendRefereeResolveOnLastTest: () => void;
  boostLastWithFool: (owner: string) => void;
  spendPlayerResolveOnCombat: () => void; swapNimble: (identity: string) => void; activateSallyForth: () => void;
  moraleTest: (monsterId: number, combatId?: string, identity?: string) => void;
}) {
  const { update } = props;
  const state = useMemo(() => ({
    ...props.state,
    combat: {
      ...props.state.combat,
      monsters: props.state.combat.monsters.map((monster) => ({ ...monster, name: canonicalMonsterName(monster) })),
    },
  }), [props.state]);
  const [monsterChoice, setMonsterChoice] = useState(BESTIARY[0]?.id || 1);
  const [reactionSuit, setReactionSuit] = useState<Suit>("cups");
  const [monsterQuery, setMonsterQuery] = useState("");
  return <div className="page-grid">
    <Panel title={`전투 흐름 · ${state.combat.round}라운드`} subtitle="손패와 선제권을 준비하고 낮은 값부터 행동합니다. 전투에는 단순 살상 외의 목표를 정하세요." className="span-2 combat-hands-panel">
      <label className="combat-objective">이번 전투에서 이루려는 일<input placeholder="예: 마을 사람들이 도망칠 때까지 다리를 지킨다" value={state.combat.objective || ""} onChange={event => update(previous => ({ ...previous, combat: { ...previous.combat, objective: event.target.value } }))} /></label>
      <ol className="combat-steps"><li>손패 보충</li><li>선제권 감추기</li><li>낮은 값부터 공개</li><li>행동 · 대응</li></ol>
      <nav className="combat-jumps" aria-label="전투 절차 바로 이동"><button onClick={() => focusPlayPanel(".combat-action-panel")}>행동 · 대응 ↓</button><button onClick={() => focusPlayPanel(".combat-damage-panel")}>피해 적용 ↓</button></nav>
      <div className="button-row"><button disabled={state.combat.dealtRound === state.combat.round} onClick={props.dealCombatRound}>플레이어 4장까지 · 괴수마다 3장</button><select aria-label="괴수 도감 선택" value={monsterChoice} onChange={(event) => setMonsterChoice(Number(event.target.value))}>{BESTIARY.map((monster) => <option value={monster.id} key={monster.id}>{monster.name} · 능력치 {monster.stat}</option>)}</select><button onClick={() => props.addMonster(monsterChoice)}>괴수 들이기</button><button onClick={props.endCombatRound} disabled={!state.combat.active}>라운드 끝내기</button></div>
      {state.combat.foolPending && <div className="notice warn" role="status">이번 라운드에 광대가 나왔습니다. 라운드 끝에 사용 중인 모든 카드를 거두고 두 덱을 다시 섞습니다.</div>}
      <div className="initiative-grid"><div><h3>플레이어 손패 · {state.combat.playerHand.length}/4</h3><div className="card-row">{state.combat.playerHand.map((card) => <div key={cardId(card)}><CardView card={card} /><div className="mini-actions"><button disabled={Boolean(state.combat.playerInitiative)} onClick={() => props.choosePlayerInitiative(cardId(card))}>선제권</button>{card.rank === "0" && <button disabled={state.combat.lastResult?.total == null} onClick={() => props.boostLastWithFool("player")}>마지막 판정 +3</button>}{card.rank !== "0" && <button onClick={() => { props.setCombatAction(draft => ({ ...draft, cardId: cardId(card) })); focusPlayPanel(".combat-action-panel"); }}>행동 선택</button>}<button onClick={() => props.discardPlayerCombatCard(cardId(card))}>버리기</button>{state.character.talents.includes("Nimble") && state.combat.playerInitiative && <button disabled={state.character.resolve < 1} onClick={() => props.swapNimble(cardId(card))}>Nimble · 교체</button>}</div></div>)}</div><div className="initiative-slot"><strong>선제권:</strong>{state.combat.playerInitiative ? <><CardView card={state.combat.playerInitiative} hidden={!state.combat.playerInitiativeRevealed} /><button onClick={() => update((previous) => ({ ...previous, combat: { ...previous.combat, playerInitiativeRevealed: !previous.combat.playerInitiativeRevealed } }))}>{state.combat.playerInitiativeRevealed ? "감추기" : "공개하기"}</button></> : <span>고르지 않음</span>}</div></div>
        <div><h3>행동 차례</h3><ol>{[
          ...(state.combat.playerInitiative ? [{ name: state.character.name || "플레이어", value: cardValue(state.combat.playerInitiative), revealed: state.combat.playerInitiativeRevealed }] : []),
          ...state.combat.monsters.filter((monster) => monster.initiative).map((monster) => ({ name: canonicalMonsterName(monster), value: cardValue(monster.initiative as Card), revealed: monster.initiativeRevealed })),
        ].sort((a, b) => a.revealed && b.revealed ? a.value - b.value : a.revealed ? -1 : b.revealed ? 1 : 0).map((actor) => <li key={actor.name}>{actor.revealed ? `${actor.value} — ${actor.name}` : `? — ${actor.name}`}</li>)}</ol></div></div>
      <div className="monster-grid">{state.combat.monsters.map((monster) => { const template = BESTIARY.find((item) => item.id === monster.monsterId); return <article className="monster-card" key={monster.id}><header><div><h3>{canonicalMonsterName(monster)}</h3><p>능력치 {template?.stat} · 부상 {monster.woundsTaken}/{template?.wounds} · 이동력 {typeof template?.speed === "number" ? woundedSpeed(template.speed, Number(Boolean(monster.wounds?.leftLeg)) + Number(Boolean(monster.wounds?.rightLeg))) : template?.speed}</p>{(monster.dead || monster.wounds?.head || monster.wounds?.torso) && <strong>{monster.dead ? "사망" : monster.wounds?.head ? "의식불명" : "몸통 부상 · 모든 판정 −3"}</strong>}</div><button className="danger" onClick={() => props.removeMonster(monster.id)}>내보내기</button></header><p>갑옷: {template?.armorKo} · 약점: {template?.weaknessKo || "기재 없음"}</p><p>공격: {template?.attacksKo}</p><label>이 공격의 기본 부상<input type="number" min={0} value={monster.attackWounds ?? Number(template?.attacks.match(/(\d+)\s*\(/)?.[1] || 0)} onChange={event => update(previous => ({ ...previous, combat: { ...previous.combat, monsters: previous.combat.monsters.map(item => item.id === monster.id ? { ...item, attackWounds: Math.max(0, Number(event.target.value)) } : item) } }))} /></label><details className="monster-armor-record"><summary>갑옷 흠집 확인 · 부위마다 AP 2</summary>{Object.entries(monster.armorNotches).length ? Object.entries(monster.armorNotches).map(([key, notches]) => <label key={key}>{key.includes(":") ? `${woundLabels[key.split(":")[0] as WoundPart]?.split(" — ")[0]} · ${key.split(":").slice(1).join(":")}` : `${key} · 부위 확인 필요`}<input type="number" min={0} max={2} value={notches} onChange={event => update(previous => ({ ...previous, combat: { ...previous.combat, monsters: previous.combat.monsters.map(item => item.id === monster.id ? { ...item, armorNotches: { ...item.armorNotches, [key]: clamp(Number(event.target.value), 0, 2) } } : item) } }))} />{!key.includes(":") && <select aria-label={`${key} 갑옷 부위 확인`} value="" onChange={event => update(previous => ({ ...previous, combat: { ...previous.combat, monsters: previous.combat.monsters.map(item => { if (item.id !== monster.id) return item; const records = { ...item.armorNotches, [`${event.target.value}:${key}`]: notches }; delete records[key]; return { ...item, armorNotches: records }; }) } }))}><option value="">부위 선택</option>{(Object.keys(woundLabels) as WoundPart[]).map(part => <option key={part} value={part}>{woundLabels[part].split(" — ")[0]}</option>)}</select>}</label>) : <p>기록된 흠집이 없습니다.</p>}</details><details><summary>심판 손패 · {monster.hand.length}장</summary><div className="card-row">{monster.hand.map((card) => <div key={cardId(card)}><CardView card={card} /><div className="mini-actions"><button disabled={Boolean(monster.initiative)} onClick={() => props.chooseMonsterInitiative(monster.id, cardId(card))}>선제권</button><button disabled={card.rank === "0" || !state.combat.playerInitiative || monster.dead || monster.wounds?.head} onClick={() => props.playMonsterCard(monster.id, cardId(card), true)}>공격</button>{card.rank === "0" && <button disabled={state.combat.lastResult?.total == null} onClick={() => props.boostLastWithFool(monster.id)}>마지막 판정 +3</button>}<button onClick={() => props.playMonsterCard(monster.id, cardId(card), false)}>사용·버리기</button><button disabled={card.rank === "0" || monster.dead || monster.wounds?.head} onClick={() => props.moraleTest(monster.monsterId, monster.id, cardId(card))}>사기</button></div></div>)}</div></details><div className="initiative-slot"><strong>선제권:</strong>{monster.initiative ? <><CardView card={monster.initiative} hidden={!monster.initiativeRevealed} /><button onClick={() => update((previous) => ({ ...previous, combat: { ...previous.combat, monsters: previous.combat.monsters.map((item) => item.id === monster.id ? { ...item, initiativeRevealed: !item.initiativeRevealed } : item) } }))}>{monster.initiativeRevealed ? "감추기" : "공개하기"}</button></> : <span>고르지 않음</span>}</div><textarea placeholder="붙잡힘·사기·갑옷·위치·심판 기록" value={monster.notes} onChange={(event) => update((previous) => ({ ...previous, combat: { ...previous.combat, monsters: previous.combat.monsters.map((item) => item.id === monster.id ? { ...item, notes: event.target.value } : item) } }))} />{monster.woundNotes.length > 0 && <ul>{monster.woundNotes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}</ul>}</article>; })}</div>
    </Panel>

    <Panel title="플레이어 행동과 대응" className="combat-action-panel" subtitle="전투 판정은 손패와 대상의 선제권을 쓰며 밀어붙일 수 없습니다. 대항 행동은 상대 능력치를 뺍니다.">
      {props.combatAction.action === "Cast a Spell" && props.combatAction.spellName && <p className="notice">{props.combatAction.spellName} · 손패 카드를 고르고 대항 완드 판정을 합니다. 결의{props.combatAction.spellSource && props.combatAction.spellSource !== "undo" ? "와 충전" : ""}는 카드를 사용할 때 소비됩니다.</p>}
      <div className="form-grid"><label>행동<select value={props.combatAction.action} onChange={(event) => props.setCombatAction((draft) => ({ ...draft, action: event.target.value, ...(event.target.value !== "Cast a Spell" ? { spellSource: "", spellName: "" } : {}) }))}>{["Attack", "Cast a Spell", "Draw/Sheathe", "Flee", "Grapple", "Move", "Shove", "Throw", "Dodge", "Riposte", "Block Called Shot"].map((action) => <option key={action} value={action}>{combatActionKo[action]}</option>)}</select></label><label>대상<select value={props.combatAction.monsterId} onChange={(event) => props.setCombatAction((draft) => ({ ...draft, monsterId: event.target.value }))}><option value="">고르기</option>{state.combat.monsters.map((monster) => <option key={monster.id} value={monster.id}>{monster.name}</option>)}</select></label><label>카드<select value={props.combatAction.cardId} onChange={(event) => props.setCombatAction((draft) => ({ ...draft, cardId: event.target.value }))}><option value="">고르기</option>{state.combat.playerHand.filter((card) => card.rank !== "0").map((card) => <option key={cardId(card)} value={cardId(card)}>{cardDisplayKo(card)}</option>)}</select></label><label>수정치<input type="number" value={props.combatAction.modifier} onChange={(event) => props.setCombatAction((draft) => ({ ...draft, modifier: Number(event.target.value) }))} /></label><label>무기 부상<input type="number" min={0} value={props.combatAction.rawWounds} onChange={(event) => props.setCombatAction((draft) => ({ ...draft, rawWounds: Number(event.target.value) }))} /></label>{props.combatAction.action === "Cast a Spell" && <label>쓸 결의<input type="number" min={1} disabled={Boolean(props.combatAction.spellSource)} value={props.combatAction.resolveCost} onChange={(event) => props.setCombatAction((draft) => ({ ...draft, resolveCost: Math.max(1, Number(event.target.value)) }))} /></label>}<label><input type="checkbox" disabled={props.combatAction.action !== "Attack"} checked={props.combatAction.calledShot && props.combatAction.action === "Attack"} onChange={(event) => props.setCombatAction((draft) => ({ ...draft, calledShot: event.target.checked }))} /> 조준 공격 · 상대 능력치 차감</label><label><input type="checkbox" checked={props.combatAction.useFool} disabled={!state.combat.playerHand.some((card) => card.rank === "0")} onChange={(event) => props.setCombatAction((draft) => ({ ...draft, useFool: event.target.checked }))} /> 광대 +3</label></div>
      <div className="button-row">{state.character.talents.includes("Sally Forth") && <button disabled={!state.combat.active || state.combat.sallyForthUsed || state.character.resolve < 1} onClick={props.activateSallyForth}>{state.combat.sallyForthUsed ? "추가 행동 사용함" : "Sally Forth · 추가 행동 · 결의1"}</button>}<button onClick={props.playCombatAction} disabled={!props.combatAction.cardId || (!["Move", "Draw/Sheathe", "Throw"].includes(props.combatAction.action) && !state.combat.monsters.find((monster) => monster.id === props.combatAction.monsterId)?.initiative) || (props.combatAction.action === "Cast a Spell" && ((props.combatAction.spellSource === "undo" ? !state.character.talents.includes("Undo Magick") : props.combatAction.spellSource ? !state.character.boundMagic.some(item => item.id === props.combatAction.spellSource && item.charges > 0) : !state.character.talents.includes("Magick")) || state.character.resolve < props.combatAction.resolveCost))}>행동 카드 사용</button><button onClick={props.spendRefereeResolveOnLastTest} disabled={!state.combat.lastResult || state.combat.lastResult.actor === (state.character.name || "플레이어") || state.refereeResolve < 1}>심판 결의 1점 · 판정 +1</button><button onClick={props.spendPlayerResolveOnCombat} disabled={!state.combat.lastResult || state.combat.lastResult.actor !== (state.character.name || "플레이어") || state.character.resolve < 1 || state.combat.lastResult.total === null}>플레이어 결의 1점 · 판정 +1</button></div>
      {state.combat.lastResult && <div className="notice" aria-live="polite"><strong>{state.combat.lastResult.actor} · {combatActionLabel(state.combat.lastResult.action)}: {testStatusKo[state.combat.lastResult.status] || state.combat.lastResult.status}</strong><br />{state.combat.lastResult.total !== null && <>합계 {state.combat.lastResult.total} 대 {state.combat.lastResult.target}. </>}부상: {state.combat.lastResult.rawWounds}. <button disabled={state.combat.lastResult.rawWounds < 1} onClick={() => { props.setDamageForm(draft => ({ ...draft, incoming: state.combat.lastResult!.rawWounds, target: state.combat.lastResult!.actor === (state.character.name || "플레이어") ? state.combat.lastResult!.targetId || props.combatAction.monsterId : "player" })); focusPlayPanel(".combat-damage-panel"); }}>이 결과로 피해 준비 →</button></div>}
    </Panel>

    <Panel title="부상과 갑옷 적용" className="combat-damage-panel" subtitle="갑옷 AP를 빼고, 타격이 AP를 넘으면 갑옷에 흠집을 냅니다. 신체 부위는 직접 고릅니다.">
      <div className="form-grid"><label>대상<select value={props.damageForm.target} onChange={(event) => props.setDamageForm((draft) => ({ ...draft, target: event.target.value }))}><option value="player">플레이어</option>{state.combat.monsters.map((monster) => <option key={monster.id} value={monster.id}>{monster.name}</option>)}</select></label><label>신체 부위<select value={props.damageForm.part} onChange={(event) => props.setDamageForm((draft) => ({ ...draft, part: event.target.value as WoundPart }))}>{(Object.keys(woundLabels) as WoundPart[]).map((part) => <option key={part} value={part}>{woundLabels[part].split(" — ")[0]}</option>)}</select></label><label>들어온 부상<input type="number" min={0} value={props.damageForm.incoming} onChange={(event) => props.setDamageForm((draft) => ({ ...draft, incoming: Number(event.target.value) }))} /></label>{props.damageForm.target === "player" && <label>플레이어 갑옷<select value={props.damageForm.armor} onChange={(event) => props.setDamageForm((draft) => ({ ...draft, armor: event.target.value as ArmorKey | "none" }))}><option value="none">없음 · AP 0</option>{Object.entries(armorLimits).map(([key, armor]) => <option key={key} value={key}>{armor.label} · AP {armor.ap}</option>)}</select></label>}{props.damageForm.target !== "player" && <><label><input type="checkbox" checked={props.damageForm.monsterArmored} onChange={(event) => props.setDamageForm((draft) => ({ ...draft, monsterArmored: event.target.checked }))} /> 괴수 갑옷 적용 · AP 2</label><label>괴수 갑옷 이름<input value={props.damageForm.armorLabel} onChange={(event) => props.setDamageForm((draft) => ({ ...draft, armorLabel: event.target.value }))} /></label></>}</div><button onClick={props.applyDamage}>피해 적용</button>
    </Panel>

    <Panel title="전투의 끝" subtitle="전투 목표의 결과와 다음 장면을 기록하세요.">
      <textarea placeholder="심판의 결말 기록 · 선택 사항" value={props.combatEndNote} onChange={(event) => props.setCombatEndNote(event.target.value)} /><button className="danger" onClick={props.endCombat} disabled={!state.combat.active}>전투 끝내기</button>
      <details><summary>인쇄된 전투 행동 빠른 참조</summary><ul className="reference-list"><li>공격: 선제권을 목표로 소드 판정. 대성공이면 부상 +1.</li><li>주문 시전: 결의를 쓰며, 적에게 영향을 주면 대항 완드 판정.</li><li>무기 꺼내기·넣기, 이동, 던지기: 카드 한 장을 버림. 이동·도약은 이동력만큼, 던지는 거리는 카드 값 + 소드.</li><li>도주: 대항 코인 판정.</li><li>붙잡기·밀치기: 대항 소드 판정. 붙잡으면 움직이지 못하며 이동력 절반만큼 끌 수 있음. 밀치는 거리는 소드만큼.</li><li>회피: 대항 코인 대응. 대성공이면 고른 부위에 부상 1점.</li><li>반격: 빗나간 근접 공격 뒤 카드 한 장으로 대항 근접 공격.</li><li>조준 공격: 대항 소드 판정. 막는 것 또한 대항 소드 판정.</li></ul></details>
    </Panel>
    <details className="bestiary-library span-2"><summary>괴수 도감 · 21종 · 반응과 사기</summary><Panel title="괴수 도감" subtitle="인쇄된 능력 자료만 싣습니다. 갑옷 한 부위는 AP 2이며, 약점을 이용했는지는 심판이 판정합니다." className="span-2">
      <div className="notice">심판 결의: {state.refereeResolve}. {state.combat.lastResult?.actor && <>마지막 등장인물 판정: {state.combat.lastResult.actor} {combatActionLabel(state.combat.lastResult.action)} · {state.combat.lastResult.total}/{state.combat.lastResult.target} · {testStatusKo[state.combat.lastResult.status] || state.combat.lastResult.status}.</>} <button disabled={!state.combat.lastResult || state.combat.lastResult.actor === (state.character.name || "플레이어") || state.refereeResolve < 1} onClick={props.spendRefereeResolveOnLastTest}>결의 1점 · 마지막 등장인물 판정 +1</button></div>
      <div className="form-grid"><label>플레이 자리가 고른 반응 판정 문양<select value={reactionSuit} onChange={(event) => setReactionSuit(event.target.value as Suit)}>{SUITS.map((suit) => <option key={suit} value={suit}>{suitKo[suit]}</option>)}</select></label><button onClick={() => props.startTest("등장인물·괴수 반응 판정", reactionSuit)}>반응 판정 마련</button></div>
      <label>괴수 찾기<input value={monsterQuery} onChange={event => setMonsterQuery(event.target.value)} placeholder="이름 · 특징" /></label>
      <div className="bestiary-grid">{BESTIARY.filter(monster => `${monster.name} ${monster.nameKo} ${monster.descriptionKo}`.toLocaleLowerCase().includes(monsterQuery.toLocaleLowerCase())).map((monster) => <article key={monster.id} className="bestiary-card"><header><h3>{monster.name}</h3><button onClick={() => props.addMonster(monster.id)}>전투에 들이기</button></header><p>{monster.descriptionKo}</p><dl><div><dt>능력치</dt><dd>{monster.stat}</dd></div><div><dt>부상</dt><dd>{monster.wounds}</dd></div><div><dt>이동력</dt><dd>{monsterSpeedKo(monster.speed)}</dd></div></dl><p><strong>공격:</strong> {monster.attacksKo}</p><p><strong>갑옷:</strong> {monster.armorKo}</p><p><strong>약점:</strong> {monster.weaknessKo || "기재 없음"}</p><p><strong>Talents:</strong> {monster.talents.join(", ") || "없음"}</p><div className="button-row"><button disabled={state.combat.active} onClick={() => props.moraleTest(monster.id)}>전투 밖 사기 판정</button><button disabled={state.refereeResolve < 1} onClick={() => update((previous) => ({ ...previous, refereeResolve: Math.max(0, previous.refereeResolve - 1), logs: [logEntry(previous, "combat", `[Monster Talent] ${monster.name}; 심판 결의 −1. 인쇄된 Talent의 선택과 해석은 심판에게 남습니다.`), ...previous.logs] }))}>Talent에 심판 결의 쓰기</button></div></article>)}</div>
    </Panel></details>
  </div>;
}

function MagicOracleTab(props: {
  state: GameState; update: Update;
  spellForm: { minor: string; major: string; effect: string; resolve: number };
  setSpellForm: React.Dispatch<React.SetStateAction<{ minor: string; major: string; effect: string; resolve: number }>>;
  folkForm: { charm: string; goal: string; use: string; suit: Suit; modifier: number };
  setFolkForm: React.Dispatch<React.SetStateAction<{ charm: string; goal: string; use: string; suit: Suit; modifier: number }>>;
  alchemyForm: { ingredient: string; concoction: string; hasPart: boolean; hasPot: boolean; hasKnowledge: boolean; hasVessel: boolean; doseRecorded: boolean };
  setAlchemyForm: React.Dispatch<React.SetStateAction<{ ingredient: string; concoction: string; hasPart: boolean; hasPot: boolean; hasKnowledge: boolean; hasVessel: boolean; doseRecorded: boolean }>>;
  castBoundSpell: (binding: BoundMagic) => void; undoMagick: (testRequired: boolean) => void;
  drawMinorWord: () => void; drawMajorWord: () => void; saveSpell: () => void; castSpell: (spell: Spell, cost: number) => void; bindSpell: (spell: Spell) => void;
  startTest: (purpose: string, suit: Suit, modifier?: number, opposedPenalty?: number) => void;
  oracleYesNo: () => void; oracleAmount: () => void; oracleActionSubject: () => void;
}) {
  const { state, update } = props;
  const [knownMinorDraft, setKnownMinorDraft] = useState("Cups:A");
  const [knownMajorDraft, setKnownMajorDraft] = useState("0:false");
  const minorOptions = state.character.knownMinorWords.map((word) => ({ value: `${word.suit}:${word.key}`, label: `${ARCANE_MINOR_WORDS[word.suit]?.[word.key]?.en || "?"} · ${word.suit} ${word.key}` }));
  const majorOptions = state.character.knownMajorWords.map((word) => { const info = ARCANE_MAJOR_WORDS[word.key]; return { value: `${word.key}:${word.reversed}`, label: `${word.reversed ? info?.revEn : info?.en} · ${word.key}${word.reversed ? " · 역방향" : ""}` }; });
  const addKnownMinor = () => {
    const [suit, key] = knownMinorDraft.split(":") as [KnownMinorWord["suit"], string];
    if (!ARCANE_MINOR_WORDS[suit]?.[key]) return;
    update((previous) => previous.character.knownMinorWords.some((word) => word.suit === suit && word.key === key) ? previous : ({ ...previous, character: { ...previous.character, knownMinorWords: [...previous.character.knownMinorWords, { suit, key }] }, logs: [logEntry(previous, "magic", `[임무로 배운 단어] ${ARCANE_MINOR_WORDS[suit][key].en}.`), ...previous.logs] }));
  };
  const addKnownMajor = () => {
    const [key, reversedText] = knownMajorDraft.split(":");
    const reversed = reversedText === "true";
    if (!ARCANE_MAJOR_WORDS[key]) return;
    update((previous) => previous.character.knownMajorWords.some((word) => word.key === key && word.reversed === reversed) ? previous : ({ ...previous, character: { ...previous.character, knownMajorWords: [...previous.character.knownMajorWords, { key, reversed }] }, logs: [logEntry(previous, "magic", `[임무로 배운 단어] ${reversed ? ARCANE_MAJOR_WORDS[key].revEn : ARCANE_MAJOR_WORDS[key].en}.`), ...previous.logs] }));
  };
  const drawFromKnownWords = () => {
    if (!minorOptions.length || !majorOptions.length) return;
    const minor = minorOptions[Math.floor(Math.random() * minorOptions.length)];
    const major = majorOptions[Math.floor(Math.random() * majorOptions.length)];
    props.setSpellForm((draft) => ({ ...draft, minor: minor.value, major: major.value }));
  };

  return <div className="page-grid">
    <Panel title="민간 비술" subtitle="부적과 바람, 쓰는 방법을 적습니다. 판정 문양과 수정치는 표와 심판이 정합니다. 민간 비술은 부상을 입힐 수 없습니다.">
      <div className="form-grid"><label>부적<input value={props.folkForm.charm} onChange={(event) => props.setFolkForm((draft) => ({ ...draft, charm: event.target.value }))} /></label><label>바라는 일<input value={props.folkForm.goal} onChange={(event) => props.setFolkForm((draft) => ({ ...draft, goal: event.target.value }))} /></label><label>부적을 쓰는 법<input value={props.folkForm.use} onChange={(event) => props.setFolkForm((draft) => ({ ...draft, use: event.target.value }))} /></label><label>심판이 고른 문양<select value={props.folkForm.suit} onChange={(event) => props.setFolkForm((draft) => ({ ...draft, suit: event.target.value as Suit }))}>{SUITS.map((suit) => <option key={suit} value={suit}>{suitKo[suit]}</option>)}</select></label><label>수정치<input type="number" value={props.folkForm.modifier} onChange={(event) => props.setFolkForm((draft) => ({ ...draft, modifier: Number(event.target.value) }))} /></label></div><button disabled={!props.folkForm.charm || !props.folkForm.goal || !props.folkForm.use} onClick={() => props.startTest(`민간 비술 — 바람: ${props.folkForm.goal}; 부적: ${props.folkForm.charm}; 쓰는 법: ${props.folkForm.use}`, props.folkForm.suit, props.folkForm.modifier)}>판정 마련하기</button>
    </Panel>

    <Panel title="비전 비술" subtitle="첫 주문의 두 단어는 카드로 뽑습니다. 그 뒤의 단어는 임무를 마친 뒤에만 기록합니다. 주문 효과의 해석은 심판에게 남습니다.">
      {!state.character.talents.includes("Magick") && <div className="notice warn">주문 시전에는 비술사의 시작 재능 ‘비술’이 필요합니다.</div>}
      <div className="button-row"><button onClick={props.drawMinorWord}>첫 준비 · 소 아르카나 단어 뽑기</button><button onClick={props.drawMajorWord}>첫 준비 · 대 아르카나 단어 뽑기</button><button disabled={!minorOptions.length || !majorOptions.length} onClick={drawFromKnownWords}>아는 단어에서 뽑기</button></div>
      <details><summary>아는 단어 · 표로 확인한 임무 뒤에만 더하기</summary><div className="form-grid"><label>소 아르카나 단어<select value={knownMinorDraft} onChange={(event) => setKnownMinorDraft(event.target.value)}>{Object.entries(ARCANE_MINOR_WORDS).flatMap(([suit, words]) => Object.entries(words).map(([key, word]) => <option key={`${suit}:${key}`} value={`${suit}:${key}`}>{suit} {key} · {word.en}</option>))}</select></label><button onClick={addKnownMinor}>아는 단어로 기록</button><label>대 아르카나 단어<select value={knownMajorDraft} onChange={(event) => setKnownMajorDraft(event.target.value)}>{Object.entries(ARCANE_MAJOR_WORDS).flatMap(([key, word]) => [<option key={`${key}:false`} value={`${key}:false`}>{key} · {word.en}</option>, <option key={`${key}:true`} value={`${key}:true`}>{key} 역방향 · {word.revEn}</option>])}</select></label><button onClick={addKnownMajor}>아는 단어로 기록</button></div><ul className="history-list">{minorOptions.map((word) => <li key={word.value}>{word.label}</li>)}{majorOptions.map((word) => <li key={word.value}>{word.label}</li>)}</ul></details>
      <div className="form-grid"><label>아는 소 아르카나 단어<select value={props.spellForm.minor} onChange={(event) => props.setSpellForm((draft) => ({ ...draft, minor: event.target.value }))}><option value="">고르기</option>{minorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>아는 대 아르카나 단어<select value={props.spellForm.major} onChange={(event) => props.setSpellForm((draft) => ({ ...draft, major: event.target.value }))}><option value="">고르기</option>{majorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="span-2">심판의 효과 기록<textarea value={props.spellForm.effect} onChange={(event) => props.setSpellForm((draft) => ({ ...draft, effect: event.target.value }))} placeholder="해석은 직접 기록합니다" /></label></div><button onClick={props.saveSpell} disabled={!props.spellForm.minor || !props.spellForm.major}>주문서에 새기기</button>
      <div className="record-list">{state.character.spells.map((spell) => <article className="compact-card" key={spell.id}><strong>{spell.name}</strong><p>{spell.effectNote || "효과 기록 없음 — 심판의 해석을 기다립니다"}</p><div className="button-row"><label>결의<input aria-label={`${spell.name}에 쓸 결의`} type="number" min={1} value={props.spellForm.resolve} onChange={(event) => props.setSpellForm((draft) => ({ ...draft, resolve: Math.max(1, Number(event.target.value)) }))} /></label><button disabled={!state.character.talents.includes("Magick") || state.character.resolve < props.spellForm.resolve} onClick={() => props.castSpell(spell, props.spellForm.resolve)}>{state.combat.active ? "전투 손패로 시전 →" : "시전 · 결의 쓰기"}</button><button disabled={!state.character.talents.includes("Bind Magick")} onClick={() => props.bindSpell(spell)}>물건에 봉인</button><button className="danger" aria-label={`${spell.name} 주문 지우기`} onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, spells: previous.character.spells.filter((item) => item.id !== spell.id) } }))}>×</button></div></article>)}</div>
      <div className="bound-list">{state.character.boundMagic.map((binding) => <article key={binding.id}><strong>{binding.object}</strong><span>{binding.spell}</span><label>충전<input type="number" min={0} value={binding.charges} onChange={(event) => update((previous) => ({ ...previous, character: { ...previous.character, boundMagic: previous.character.boundMagic.map((item) => item.id === binding.id ? { ...item, charges: Math.max(0, Number(event.target.value)) } : item) } }))} /></label><button disabled={binding.charges < 1 || state.character.resolve < 1} onClick={() => props.castBoundSpell(binding)}>{state.combat.active ? "전투 손패로 시전 →" : "봉인 주문 시전"}</button><button className="danger" aria-label={`${binding.object} 봉인 기록 지우기`} onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, boundMagic: previous.character.boundMagic.filter((item) => item.id !== binding.id) } }))}>지우기</button></article>)}</div>
      <div className="button-row"><button disabled={!state.character.talents.includes("Undo Magick") || state.character.resolve < 1} onClick={() => props.undoMagick(false)}>비술 해제 · 결의 1점</button><button disabled={!state.character.talents.includes("Undo Magick") || state.character.resolve < 1} onClick={() => props.undoMagick(true)}>비술 해제 · 결의 1점과 완드 판정</button></div>
    </Panel>

    <Panel title="연금술" subtitle="괴수의 일부나 정수, 끓일 솥, 실용 지식과 담을 그릇이 필요합니다. 제조에는 1경점이 걸리며, 원하는 조제물은 플레이어와 심판이 적습니다.">
      <div className="form-grid"><label>괴수의 일부·정수<input value={props.alchemyForm.ingredient} onChange={(event) => props.setAlchemyForm((draft) => ({ ...draft, ingredient: event.target.value, doseRecorded: false }))} /></label><label>원하는 조제물<input value={props.alchemyForm.concoction} onChange={(event) => props.setAlchemyForm((draft) => ({ ...draft, concoction: event.target.value, doseRecorded: false }))} /></label><label><input type="checkbox" checked={props.alchemyForm.hasPart} onChange={(event) => props.setAlchemyForm((draft) => ({ ...draft, hasPart: event.target.checked }))} /> 일부·정수 확인</label><label><input type="checkbox" checked={props.alchemyForm.hasPot} onChange={(event) => props.setAlchemyForm((draft) => ({ ...draft, hasPot: event.target.checked }))} /> 끓일 솥 확인</label><label><input type="checkbox" checked={props.alchemyForm.hasKnowledge} onChange={(event) => props.setAlchemyForm((draft) => ({ ...draft, hasKnowledge: event.target.checked }))} /> 실용 지식 확인</label><label><input type="checkbox" checked={props.alchemyForm.hasVessel} onChange={(event) => props.setAlchemyForm((draft) => ({ ...draft, hasVessel: event.target.checked }))} /> 병·그릇 확인</label></div><div className="button-row"><button disabled={!props.alchemyForm.ingredient || !props.alchemyForm.concoction || !props.alchemyForm.hasPart || !props.alchemyForm.hasPot || !props.alchemyForm.hasKnowledge || !props.alchemyForm.hasVessel} onClick={() => { props.setAlchemyForm((draft) => ({ ...draft, doseRecorded: false })); props.startTest(`연금술 — ${props.alchemyForm.concoction}; 재료: ${props.alchemyForm.ingredient}; 1경점`, "wands"); update((previous) => ({ ...previous, ...advanceWatch(previous), logs: [logEntry(previous, "downtime", `[연금술 시작] ${props.alchemyForm.concoction}; 1경점이 지났습니다. 재료와 그릇의 소비는 소지품 장부에 남깁니다.`), ...previous.logs] })); }}>완드 판정 마련 · 1경점 보내기</button><button disabled={props.alchemyForm.doseRecorded || !state.test.purpose.startsWith("연금술 —") || !state.test.result?.success} onClick={() => { update((previous) => ({ ...previous, character: { ...previous.character, inventory: [...previous.character.inventory, { id: uid(), name: `${props.alchemyForm.concoction} · 1회분`, category: "other", slots: 1, damaged: false, uses: 1, notes: `${props.alchemyForm.ingredient}에서 제조`, contents: "" }] }, logs: [logEntry(previous, "magic", `[연금술 성공] ${props.alchemyForm.concoction} 1회분을 기록했습니다. 효과는 확인한 표와 심판의 해석으로 남습니다.`), ...previous.logs] })); props.setAlchemyForm((draft) => ({ ...draft, doseRecorded: true })); }}>성공 뒤 1회분 기록</button></div>
    </Panel>

    <Panel title="마법 물품표" subtitle="참조와 카드 찾기만 돕습니다. 물품의 발동과 해석은 직접 처리합니다." className="span-2">
      <div className="four-columns">{Object.entries(MAGICK_ITEMS).map(([suit, items]) => <details key={suit}><summary>{suit}</summary>{items.map((item, index) => <article className="compact-card" key={item.key}><strong>{item.key} · {item.name}</strong><p>{MAGICK_ITEM_TEXT_KO[suit as keyof typeof MAGICK_ITEM_TEXT_KO][index]}</p></article>)}</details>)}</div>
    </Panel>
  </div>;
}

function MapEventsTab(props: { state: GameState; update: Update; drawMapCell: (index: number) => void; drawWildernessTerrain: (index: number) => void; clearMap: () => void; drawEvent: (reason?: string) => void }) {
  const { state, update } = props;
  return <div className="page-grid">
    <p className="section-note span-2">새 장소로 이동하면 플레이 화면에서 사건을 확인하세요. 인접한 야외 구역으로 여행할 때는 1경점이 걸립니다. 지도는 심판 카드로 장소를 배치합니다.</p>
    <Panel title="지도 펼치기" subtitle="야외 한 구역은 5마일, 이웃 구역 이동은 1경점입니다. 정착지는 지형 카드를 추가합니다." className="span-2">
      <div className="button-row"><select aria-label="지도 종류" value={state.mapType} onChange={(event) => update((previous) => ({ ...previous, mapType: event.target.value as MapType }))}><option value="wilderness">야외 · 5마일 구역 · 이웃 구역 이동 1경점</option><option value="dungeon">던전 · 복도와 방</option><option value="settlement">정착지 · 건물과 눈여겨볼 곳</option></select><button className="danger" onClick={props.clearMap}>지도 비우기 · 카드 거두기</button></div>
      <div className="map-grid">{state.mapCells.map((cell, index) => <article key={`${cell.x}-${cell.y}`} className={cell.visited ? "map-cell visited" : "map-cell"}><header><span>{cell.x + 1},{cell.y + 1}</span><label><input type="checkbox" checked={cell.visited} onChange={() => update((previous) => ({ ...previous, mapCells: previous.mapCells.map((item, itemIndex) => itemIndex === index ? { ...item, visited: !item.visited } : item) }))} /> 다녀간 곳</label></header>{cell.card ? <><CardView card={cell.card} /><strong>{cell.label}</strong>{cell.extraCards.map((card, extraIndex) => <div className="map-extra" key={cardId(card)}><CardView card={card} /><span>정착지 지형: {cell.extraLabels[extraIndex]}</span></div>)}{cell.liveCard && cell.type === "wilderness" && cell.label.startsWith("정착지") && cell.extraCards.length === 0 && <button onClick={() => props.drawWildernessTerrain(index)}>필요한 지형 카드 뽑기</button>}{!cell.liveCard && <small>지난 카드 · 덱으로 돌아감</small>}</> : <button onClick={() => props.drawMapCell(index)}>심판 카드 뽑기</button>}<textarea aria-label={`${cell.x + 1},${cell.y + 1} 심판 기록`} placeholder="심판 기록" value={cell.notes} onChange={(event) => update((previous) => ({ ...previous, mapCells: previous.mapCells.map((item, itemIndex) => itemIndex === index ? { ...item, notes: event.target.value } : item) }))} /><details><summary>카드 내력 · {cell.history.length}</summary><ul>{cell.history.map((record) => <li key={record.id}>{record.at} · {mapTypeKo[record.type]} · {cardDisplayKo(record.card)} · {record.label}</li>)}</ul></details></article>)}</div>
    </Panel>


  </div>;
}

function DowntimeTab(props: {
  state: GameState; update: Update; restForm: { part: WoundPart; placeConfirmed: boolean; mealConfirmed: boolean; rationId: string };
  setRestForm: React.Dispatch<React.SetStateAction<{ part: WoundPart; placeConfirmed: boolean; mealConfirmed: boolean; rationId: string }>>;
  startSession: () => void; settleSession: (criteria: { participated: boolean; goal: boolean; danger: boolean }) => void;
  performRest: () => void; carouse: () => void; addMonster: (id: number) => void;
  startTest: (purpose: string, suit: Suit, modifier?: number, opposedPenalty?: number) => void;
  drawRefereeToDiscard: (previous: GameState) => { state: GameState; card: Card | null };
  spendRefereeResolveOnLastTest: () => void;
  drawRoadFolk: () => void;
}) {
  const { state, update } = props;
  const [xpCriteria, setXpCriteria] = useState({ participated: true, goal: false, danger: false });
  const [hirelingDraft, setHirelingDraft] = useState({ name: "", notes: "" });

  const woundedParts = (Object.keys(woundLabels) as WoundPart[]).filter((part) => state.character.wounds[part]);
  const selectedRestPart = woundedParts.includes(props.restForm.part) ? props.restForm.part : (woundedParts[0] || props.restForm.part);
  return <div className="page-grid">
    <Panel title="시간과 회차" subtitle="세션 시작의 결의와 종료의 경험치를 한 번씩 기록합니다.">
      <div className="time-display"><strong>{state.day}일째 · {state.watch}/3경점</strong><strong>세션 {state.sessionNumber} · {state.sessionStarted ? "진행 중" : "시작 전 / 정산 완료"}</strong></div>
      <button disabled={Boolean(state.sessionStarted)} onClick={() => { setXpCriteria({ participated: true, goal: false, danger: false }); props.startSession(); }}>세션 시작 · 결의 +1</button>
      {Boolean(state.pendingDowntimeGoalResolve) && <p className="notice">막간에 완수한 목표의 결의 {state.pendingDowntimeGoalResolve}점을 다음 세션 시작에 받습니다.</p>}
      <div className="session-xp"><h3>세션을 마쳤나요?</h3><p className="reference-note">각 조건을 한 번씩 세어 경험치 1–3점을 얻습니다.</p>
        <label><input type="checkbox" checked={xpCriteria.participated} onChange={event => setXpCriteria(draft => ({ ...draft, participated: event.target.checked }))} /> 이번 세션에 참여했다 · XP 1</label>
        <label><input type="checkbox" checked={xpCriteria.goal} onChange={event => setXpCriteria(draft => ({ ...draft, goal: event.target.checked }))} /> 목표를 하나 이상 완수했다 · XP 1</label>
        <label><input type="checkbox" checked={xpCriteria.danger} onChange={event => setXpCriteria(draft => ({ ...draft, danger: event.target.checked }))} /> 생명을 위협하는 상황을 겪었다 · XP 1</label>
        <label>막간에 하려는 일<textarea value={state.downtimePlan || ""} placeholder="수련, 조사, 휴식, 고용… 심판에게 선언할 계획" onChange={event => update(previous => ({ ...previous, downtimePlan: event.target.value }))} /></label>
        <button disabled={!state.sessionStarted || !xpCriteria.participated} onClick={() => props.settleSession(xpCriteria)}>세션 정산 · XP {Number(xpCriteria.participated) + Number(xpCriteria.goal) + Number(xpCriteria.danger)}</button>
        {state.settledSession === state.sessionNumber && state.sessionNumber > 0 && <p className="reference-note">이 세션의 경험치를 기록했습니다. 다음 세션을 시작하세요.</p>}
      </div>
    </Panel>

    <Panel title="휴식과 회복" subtitle="야영지나 정착지에서 식사와 함께 밤을 온전히 보내면 부상 하나를 회복합니다. 두 조건은 플레이 자리에서 확인합니다.">
      <div className="form-grid"><label>부상<select value={selectedRestPart} onChange={(event) => props.setRestForm((draft) => ({ ...draft, part: event.target.value as WoundPart }))}>{woundedParts.map((part) => <option key={part} value={part}>{woundLabels[part].split(" — ")[0]}</option>)}</select></label><label><input type="checkbox" checked={props.restForm.placeConfirmed} onChange={(event) => props.setRestForm((draft) => ({ ...draft, placeConfirmed: event.target.checked }))} /> 야영지·정착지 확인</label><label><input type="checkbox" checked={props.restForm.mealConfirmed} onChange={(event) => props.setRestForm((draft) => ({ ...draft, mealConfirmed: event.target.checked }))} /> 식사 확인</label><label>식사 출처<select value={props.restForm.rationId} onChange={(event) => props.setRestForm((draft) => ({ ...draft, rationId: event.target.value }))}><option value="fiction">극 중에서 제공 · 소지품 소모 없음</option>{state.character.inventory.filter((item) => item.uses !== null && item.uses > 0).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.uses}회</option>)}</select></label></div><button disabled={state.character.dead || !woundedParts.length || !props.restForm.placeConfirmed || !props.restForm.mealConfirmed} onClick={props.performRest}>다음 날 아침 · 부상 하나 회복</button>
    </Panel>

    <Panel title="흥청망청 보내기" subtitle="흥청망청 표를 뽑으면 결의를 얻습니다. 인쇄된 결과만 적으며 서사적 세부를 만들거나 저절로 적용하지 않습니다."><button onClick={props.carouse}>플레이어 카드 뽑기 · 결의 +1</button><p className="reference-note">소지품 손실, 친구와 적, 구금 기간과 그 밖의 극 중 결과는 표를 해석한 뒤에만 직접 적용합니다.</p></Panel>

    <Panel title="고용인" subtitle="정착지에서 컵 판정으로 후보를 찾고 코인 판정으로 고용합니다. 활동 중인 고용인은 컵 수치를 넘을 수 없으며, 주급 코인 판정에 실패하면 떠납니다.">
      <div className="button-row"><button onClick={() => props.startTest("정착지에서 고용인 찾기", "cups")}>컵 찾기 판정 마련</button><button onClick={() => props.startTest("고용 계약", "coins")}>코인 고용 판정 마련</button></div>
      <div className="form-grid"><input aria-label="고용 후보 이름" placeholder="후보 이름" value={hirelingDraft.name} onChange={(event) => setHirelingDraft((draft) => ({ ...draft, name: event.target.value }))} /><input aria-label="고용 후보 기록" placeholder="기록" value={hirelingDraft.notes} onChange={(event) => setHirelingDraft((draft) => ({ ...draft, notes: event.target.value }))} /><button disabled={!hirelingDraft.name || state.character.hirelings.filter((hireling) => hireling.status === "active").length >= state.character.stats.cups} onClick={() => { update((previous) => ({ ...previous, character: { ...previous.character, hirelings: [...previous.character.hirelings, { id: uid(), name: hirelingDraft.name, notes: hirelingDraft.notes, status: "active", paidThisWeek: false, history: [] }] }, logs: [logEntry(previous, "downtime", `[표로 확인한 판정 뒤 고용] ${hirelingDraft.name}.`), ...previous.logs] })); setHirelingDraft({ name: "", notes: "" }); }}>성공한 판정 뒤 더하기</button></div>
      {state.character.hirelings.map((hireling) => <article className="hireling" key={hireling.id}><div><strong>{hireling.name}</strong><span>{hireling.status === "active" ? "활동 중" : "떠남"} · {hireling.notes}</span>{hireling.history.length > 0 && <small>{hireling.history.join(" · ")}</small>}</div><label><input type="checkbox" checked={hireling.paidThisWeek} onChange={() => update((previous) => ({ ...previous, character: { ...previous.character, hirelings: previous.character.hirelings.map((item) => item.id === hireling.id ? { ...item, paidThisWeek: !item.paidThisWeek } : item) } }))} /> 이번 주 주급 지급</label><button disabled={hireling.status !== "active"} onClick={() => props.startTest(`주급 지급 — ${hireling.name}`, "coins")}>주급 코인 판정</button><button disabled={hireling.status !== "active"} onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, hirelings: previous.character.hirelings.map((item) => item.id === hireling.id ? { ...item, status: "resigned", history: [...item.history, `${previous.day}일째: 주급 판정 실패·불만족 뒤 떠남`] } : item) }, logs: [logEntry(previous, "downtime", `[고용인 떠남] ${hireling.name}.`), ...previous.logs] }))}>주급 실패 적용 · 떠남</button></article>)}
    </Panel>

    <Panel title="길 위의 사람들" subtitle="심판 카드 한 장으로 인쇄된 생업과 두 이름, 성격을 찾습니다. 장부는 등장인물을 고르거나 지어내지 않습니다."><button onClick={props.drawRoadFolk}>심판 카드 뽑기</button>{state.roadFolk && <div className="oracle-result"><CardView card={state.roadFolk.card} /><p><strong>{state.roadFolk.occupation}</strong></p><p>{state.roadFolk.femaleName} / {state.roadFolk.maleName}</p><p>{state.roadFolk.personality}</p><div className="button-row"><button onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, npcs: [...previous.character.npcs, { id: uid(), name: state.roadFolk?.femaleName || "", location: "", connection: `${state.roadFolk?.occupation}; ${state.roadFolk?.personality}`, history: [] }] } }))}>첫 이름으로 등장인물 기록</button><button onClick={() => update((previous) => ({ ...previous, character: { ...previous.character, npcs: [...previous.character.npcs, { id: uid(), name: state.roadFolk?.maleName || "", location: "", connection: `${state.roadFolk?.occupation}; ${state.roadFolk?.personality}`, history: [] }] } }))}>둘째 이름으로 등장인물 기록</button></div></div>}</Panel>


  </div>;
}

function LogTab(props: { state: GameState; update: Update; newLog: string; setNewLog: React.Dispatch<React.SetStateAction<string>>; addLog: (category: LogEntry["category"], text: string) => void; exportSave: () => void; integrity: { player: boolean; referee: boolean } }) {
  const { state, update } = props;
  return <div className="page-grid">
    <Panel title="캠페인 연대기" subtitle="목표와 본능, 결의, 인연, 등장인물, 비술 단어, 임무, 전투와 막간을 한 장부에 이어 적습니다." className="span-2">
      <div className="form-grid"><label>캠페인 이름<input value={state.campaignName} onChange={(event) => update((previous) => ({ ...previous, campaignName: event.target.value }))} /></label><input aria-label="연대기에 적을 기록" placeholder="직접 쓰는 기록 · 장부는 이야기를 만들지 않습니다" value={props.newLog} onChange={(event) => props.setNewLog(event.target.value)} /><button onClick={() => { if (props.newLog.trim()) props.addLog("note", props.newLog.trim()); props.setNewLog(""); }}>기록 더하기</button></div>
      <div className="log-list">{state.logs.map((entry) => <article key={entry.id}><header><strong>{categoryKo[entry.category]}</strong><span>{entry.day}일째 · {entry.watch}경점 · {entry.at}</span><button className="icon danger" aria-label="연대기 기록 지우기" onClick={() => update((previous) => ({ ...previous, logs: previous.logs.filter((item) => item.id !== entry.id) }))}>×</button></header><p>{entry.text}</p></article>)}</div>
    </Panel>
    <Panel title="임무와 인연의 현황"><h3>이어 가는 목표</h3><ul>{state.character.goals.filter((goal) => goal.status === "active").map((goal) => <li key={goal.id}>{goal.text}</li>)}</ul><h3>친구</h3><p>{state.character.friends.map((contact) => contact.name).join(", ") || "없음"}</p><h3>적</h3><p>{state.character.foes.map((contact) => contact.name).join(", ") || "없음"}</p><h3>등장인물</h3><p>{state.character.npcs.map((contact) => contact.name).join(", ") || "없음"}</p><h3>아는 비술 단어</h3><p>소 아르카나 {state.character.knownMinorWords.length} · 대 아르카나 {state.character.knownMajorWords.length}</p></Panel>
    <Panel title="보존 무결성" subtitle="자동 보존에는 캠페인 상태와 되돌리기 내력이 함께 듭니다. 가져올 때 불가능한 카드 수는 고치되, 서사 기록은 보존합니다."><div className={`notice ${props.integrity.player && props.integrity.referee ? "ok" : "bad"}`}>플레이어 덱: {props.integrity.player ? "통과 · 사용 중인 고유 카드 57장" : "실패"}<br />심판 덱: {props.integrity.referee ? "통과 · 사용 중인 고유 카드 21장" : "실패"}</div><button onClick={props.exportSave}>온전한 JSON 장부 내려받기</button><p className="reference-note">연대기, 지도 내력, 사건 내력, 징조 내력의 카드는 지난 상태를 적은 표본이므로 사용 중인 덱 수에 넣지 않습니다.</p></Panel>
  </div>;
}

export default App;
