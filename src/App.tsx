import { useState, useEffect } from "react";
import { db, isFirebaseConfigured, auth, googleProvider } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { 
  WEAPONS, 
  ARMOR, 
  TRADE_GOODS,
  BESTIARY, 
  WILDERNESS_EVENTS, 
  DUNGEON_EVENTS, 
  SETTLEMENT_EVENTS,
  MAP_WILDERNESS, 
  MAP_DUNGEON, 
  MAP_SETTLEMENT, 
  ORACLE_SUITS, 
  ORACLE_SUBJECTS,
  CAROUSING_TABLE,
  FOLK_ROAD,
  MAGICK_ITEMS,
  ARCANE_MINOR_WORDS,
  ARCANE_MAJOR_WORDS
} from "./gameData";
import { 
  BookOpen, 
  User as UserIcon, 
  Compass, 
  Sparkles, 
  Map as MapIcon,
  LogOut, 
  LogIn, 
  Upload, 
  RotateCcw
} from "lucide-react";

// =================================================================
// 1. SYNC & STORAGE SYSTEM
// =================================================================
const withTimeout = (promise: Promise<any>, ms: number = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
  ]);
};

const store = {
  set: async (key: string, value: any) => {
    const jsonString = JSON.stringify(value);
    if (isFirebaseConfigured && db) {
      try {
        const currentUser = auth?.currentUser;
        if (currentUser) {
          const docRef = doc(db, "saves", `gloam_${currentUser.uid}`);
          await withTimeout(setDoc(docRef, { [key]: jsonString }, { merge: true }));
        }
      } catch (e) {
        console.error("Firebase save error:", e);
      }
    }
    try {
      localStorage.setItem(key, jsonString);
    } catch (e) {}
  },
  load: async (key: string, fallback: any) => {
    if (isFirebaseConfigured && db) {
      try {
        const currentUser = auth?.currentUser;
        if (currentUser) {
          const docRef = doc(db, "saves", `gloam_${currentUser.uid}`);
          const snap = await withTimeout(getDoc(docRef));
          if (snap.exists() && snap.data()[key]) {
            return JSON.parse(snap.data()[key]);
          }
        }
      } catch (e) {
        console.error("Firebase load error:", e);
      }
    }
    try {
      const r = localStorage.getItem(key);
      if (r) return JSON.parse(r);
    } catch {}
    return fallback;
  }
};

// =================================================================
// 2. INTERFACES & INITIAL STATE
// =================================================================
export interface Card {
  type: "minor" | "major";
  suit?: "cups" | "wands" | "swords" | "coins";
  card: string; // "A", "2"-"10", "Page", "Knight", "Queen", "King" / Roman numbers for Major
  reversed?: boolean;
}

export interface Friend {
  name: string;
  info: string;
  relationship?: "Devoted" | "Friendly" | "Neutral" | "Wary" | "Hostile";
  memoryLogs?: string[];
}

export interface Foe {
  name: string;
  info: string;
  relationship?: "Devoted" | "Friendly" | "Neutral" | "Wary" | "Hostile";
  memoryLogs?: string[];
}

export interface Hireling {
  name: string;
  info: string;
  woundsTaken?: number;
  maxWounds?: number;
  paidThisWeek?: boolean;
  loyalty?: number;
  memoryLogs?: string[];
  deceased?: boolean;
  deathDay?: number;
  deathCell?: { x: number; y: number };
}

export interface JournalEntry {
  id: string;
  text: string;
  date: string;
  day?: number;
  watch?: number;
  x?: number | null;
  y?: number | null;
  pinned?: boolean;
  isThematic?: boolean;
  systemLog?: string;
  systemGenerated?: boolean;
  chronicle?: boolean;
  chronicleCategory?: string;
  chronicleIcon?: string;
}

export interface Goal {
  id: string;
  text: string;
  status: "active" | "completed" | "abandoned";
  createdDate: string;
  completedDate?: string;
  milestoneNote?: string;
  linkedJournalId?: string;
}

export interface InstinctTrigger {
  id: string;
  instinctText: string;
  date: string;
  narrativeNote: string;
  linkedJournalId?: string;
}

export interface InjuryLog {
  id: string;
  location: "head" | "torso" | "lArm" | "rArm" | "lLeg" | "rLeg";
  injuryText: string;
  dateAcquired: string;
  healed: boolean;
  dateHealed?: string;
  scarsNotes?: string;
}

export interface ChronicleChapter {
  id: string;
  title: string;
  summary: string;
  dateRange: string;
}

export interface Character {
  name: string;
  vocation: string;
  age: number;
  portrait: string;
  xp: number;
  resolve: number;
  stats: {
    cups: number;
    wands: number;
    swords: number;
    coins: number;
  };
  wounds: {
    head: boolean;
    torso: boolean;
    lArm: boolean;
    rArm: boolean;
    lLeg: boolean;
    rLeg: boolean;
  };
  armorNotches: {
    helmet: number;
    cuirass: number;
    gambeson: number;
    chainmail: number;
    gauntletL: number;
    gauntletR: number;
    greaveL: number;
    greaveR: number;
    shield: number;
  };
  inventory: string[];
  instincts: string[];
  goals: Goal[];
  friends: Friend[];
  foes: Foe[];
  hirelings: Hireling[];
  unlockedTalents: string[];
  lifepathLogs: string[];
  spellbook: string[]; // Arcane spells known by the character
  instinctTriggers: InstinctTrigger[];
  injuryLogs: InjuryLog[];
  chronicleChapters: ChronicleChapter[];
  epilogue: string;
}

export interface MapCell {
  x: number;
  y: number;
  card?: Card;
  type?: "wilderness" | "dungeon" | "settlement";
  description?: string;
}

export interface CombatMonster {
  id: string;
  monsterId: number;
  name: string;
  woundsTaken: number;
  initiativeCard?: Card;
}

export interface SessionRewardRecord {
  id: string;
  date: string;
  day: number;
  watch: number;
  xp: number;
  resolve: number;
  reasons: string[];
}

export interface ActiveTest {
  stat: "cups" | "swords" | "coins" | "wands" | "none";
  statUsed: number;
  modifier: number;
  opposedMonsterId: number | null; // null if not opposed, 0 if custom, or monsterId
  opposedPenalty: number;
  helpStat: number;
  cardsDrawn: Card[];
  total: number;
  success: boolean;
  greatSuccess: boolean;
  pushed: boolean;
  greatFailure: boolean;
  purpose: string;
}

export interface GameState {
  character: Character;
  playerDeck: Card[];
  playerDiscard: Card[];
  refereeDeck: Card[];
  refereeDiscard: Card[];
  hand: Card[];
  mapGrid: MapCell[];
  journals: JournalEntry[];
  combatMonsters: CombatMonster[];
  combatRound: number;
  mapType: "wilderness" | "dungeon" | "settlement";
  day: number;
  watch: number; // 1, 2, 3
  lastDrawnOracleCardValue: string | null;
  activeTest: ActiveTest | null;
  arcaneSpellResult: { minorCard: Card; majorCard: Card; spellName: string; ruleSummary: string } | null;
  alchemicalBrewResult: { success: boolean; potionName: string; ingredient: string; total: number; card: Card } | null;
  playerInitiativeCard: Card | null;

  // Transient UI states to persist
  drawnOracleCard: Card | null;
  oracleYesNo: string | null;
  oracleAmount: string | null;
  oracleActionSubject: { action: string; subject: string; card1: Card; card2: Card } | null;

  testCurrentTotal: number;
  testResolveSpent: number;
  testStat: "cups" | "swords" | "coins" | "wands" | "none";
  testMod: number;
  testOppMonsterId: string;
  testCustomOppPenalty: number;
  testHelpStat: number;
  testPurpose: string;
  testDrawnCards: Card[];
  testPushed: boolean;
  testStatus: "idle" | "rolled" | "success" | "failed" | "great_success" | "great_failure";

  selectedMapCellIdx: number | null;
  carousingResult: { card: Card; text: string } | null;
  folkNpcResult: { card: Card; femaleName: string; maleName: string; occupation: string; personality: string } | null;
  magickItemResult: { card: Card; suit: string; name: string; text: string } | null;
  currentSessionId: string;
  sessionRewardHistory: SessionRewardRecord[];
  activeFriendAid: { npcName: string; type: "bonus" | "resolve_discount" } | null;
  usedFriendAids: Record<string, number>;
  testFriendBonus: number;
}

const INITIAL_CHARACTER: Character = {
  name: "알릭 (Alaric)",
  vocation: "방랑기사 (Knight-Errant)",
  age: 18,
  portrait: "",
  xp: 0,
  resolve: 3,
  stats: {
    cups: 1,
    wands: 2,
    swords: 4,
    coins: 3
  },
  wounds: {
    head: false,
    torso: false,
    lArm: false,
    rArm: false,
    lLeg: false,
    rLeg: false
  },
  armorNotches: {
    helmet: 0,
    cuirass: 0,
    gambeson: 0,
    chainmail: 0,
    gauntletL: 0,
    gauntletR: 0,
    greaveL: 0,
    greaveR: 0,
    shield: 0
  },
  inventory: ["검 (Sword)", "흉갑 (Cuirass)", "방패 (Shield)", "침낭 (Bedroll)", "휴대 식량 (7일분)"],
  instincts: [
    "위험을 감지하면 무조건 아끼는 검을 빼 든다.",
    "돈을 요구하는 자를 만나면 일단 속내를 의심한다.",
    "밤이 되면 항상 은신처를 찾아 횃불을 끈다."
  ],
  goals: [
    { id: "g1", text: "어릴 적 고향을 파괴한 도적 두목을 추적해 처단한다.", status: "active", createdDate: "초기 설정" },
    { id: "g2", text: "잃어버린 가문의 명검 아스칼론을 폐허에서 찾아낸다.", status: "active", createdDate: "초기 설정" },
    { id: "g3", text: "황혼의 거점 성채에 갇힌 친구를 구출한다.", status: "active", createdDate: "초기 설정" }
  ],
  friends: [{ name: "아이리스 (Iris)", info: "마을 약초꾼. 다쳤을 때 안전한 잠자리를 제공해 줍니다." }],
  foes: [{ name: "마옌스 경 (Sir Mayence)", info: "기사 서약을 저버린 배역자 기사. 사사건건 도전을 걸어옵니다." }],
  hirelings: [],
  unlockedTalents: ["Sally Forth (과감한 돌격)"],
  lifepathLogs: [
    "출생: 검(Swords) 문양의 전시 상황 속에서 소수의 몰락 영지 기사의 가문에 태어났습니다.",
    "청년기: 믿었던 가장 가까운 동료 기사에게 배신당해 큰 마음의 상처를 입었습니다. (+9세)",
    "청년기: 고고학적이고 역사적인 고문헌을 밤낮으로 치열하게 탐구하며 지식을 마스터했습니다. (+14세)"
  ],
  spellbook: [],
  instinctTriggers: [],
  injuryLogs: [],
  chronicleChapters: [],
  epilogue: ""
};

const INITIAL_STATE: GameState = {
  character: INITIAL_CHARACTER,
  playerDeck: [],
  playerDiscard: [],
  refereeDeck: [],
  refereeDiscard: [],
  hand: [],
  mapGrid: Array.from({ length: 16 }, (_, i) => ({
    x: i % 4,
    y: Math.floor(i / 4)
  })),
  journals: [
    { id: "1", text: "세상이 황혼(Gloaming) 속으로 저물어 가고 있다. 타로 카드의 이끌림을 따라 나의 맹세를 지키기 위한 여정을 기록해 나간다. 오늘은 성 아래 여관에서 방랑자들과 술잔을 기울였다.", date: new Date().toLocaleString() }
  ],
  combatMonsters: [],
  combatRound: 1,
  mapType: "wilderness",
  day: 1,
  watch: 1,
  lastDrawnOracleCardValue: null,
  activeTest: null,
  arcaneSpellResult: null,
  alchemicalBrewResult: null,
  playerInitiativeCard: null,

  drawnOracleCard: null,
  oracleYesNo: null,
  oracleAmount: null,
  oracleActionSubject: null,

  testCurrentTotal: 0,
  testResolveSpent: 0,
  testStat: "none",
  testMod: 0,
  testOppMonsterId: "none",
  testCustomOppPenalty: 0,
  testHelpStat: 0,
  testPurpose: "",
  testDrawnCards: [],
  testPushed: false,
  testStatus: "idle",

  selectedMapCellIdx: null,
  carousingResult: null,
  folkNpcResult: null,
  magickItemResult: null,
  currentSessionId: "session-initial",
  sessionRewardHistory: [],
  activeFriendAid: null,
  usedFriendAids: {},
  testFriendBonus: 0
};

// =================================================================
// 3. TAROT CARD HELPERS
// =================================================================
const SUITS = ["cups", "wands", "swords", "coins"] as const;
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"];
const MAJORS = [
  "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", 
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"
];

// Returns the local image path for each card
const getCardImageUrl = (card: Card) => {
  if (card.type === "minor") {
    const suitFolder = card.suit === "wands" ? "Wands" :
                       card.suit === "cups" ? "Cups" :
                       card.suit === "swords" ? "Swords" :
                       card.suit === "coins" ? "Pentacles" : "";
    const valStr = card.card === "A" ? "1" : card.card;
    return `/tarot/${suitFolder}_${valStr}.jpg`;
  } else {
    const romanToNum: { [key: string]: number } = {
      "0": 0, "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10,
      "XI": 11, "XII": 12, "XIII": 13, "XIV": 14, "XV": 15, "XVI": 16, "XVII": 17, "XVIII": 18, "XIX": 19, "XX": 20, "XXI": 21
    };
    const majorNum = romanToNum[card.card] !== undefined ? romanToNum[card.card] : 0;
    return `/tarot/Major_${majorNum}.jpg`;
  }
};

// Preload all tarot images to memory for zero-lag drawing
const preloadAllTarotImages = () => {
  const urls: string[] = [];
  SUITS.forEach(suit => {
    VALUES.forEach(val => {
      urls.push(getCardImageUrl({ type: "minor", suit, card: val }));
    });
  });
  MAJORS.forEach(major => {
    urls.push(getCardImageUrl({ type: "major", card: major }));
  });

  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

const createPlayerDeck = (): Card[] => {
  const deck: Card[] = [];
  // 56 Minor cards
  SUITS.forEach(suit => {
    VALUES.forEach(card => {
      deck.push({ type: "minor", suit, card, reversed: false });
    });
  });
  // The Fool
  deck.push({ type: "major", card: "0", reversed: false });
  return shuffle(deck);
};

const createRefereeDeck = (): Card[] => {
  const deck: Card[] = [];
  // Major cards I to XXI
  MAJORS.filter(m => m !== "0").forEach(card => {
    deck.push({ type: "major", card, reversed: false });
  });
  return shuffle(deck);
};

const shuffle = (arr: Card[]): Card[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getCardNumericValue = (card: Card): number => {
  if (card.card === "A") return 1;
  if (card.card === "Page") return 11;
  if (card.card === "Knight") return 12;
  if (card.card === "Queen") return 13;
  if (card.card === "King") return 14;
  if (card.card === "0") return 0;
  return parseInt(card.card) || 0;
};

const getTableCardKey = (card: Card): string => {
  if (card.card === "Page") return "P";
  if (card.card === "Knight") return "Kn";
  if (card.card === "Queen") return "Q";
  if (card.card === "King") return "K";
  return card.card;
};

const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const pruneJournals = (journals: JournalEntry[]): JournalEntry[] => {
  let unpinnedCount = 0;
  return journals.filter(j => {
    if (j.pinned || j.chronicle) return true;
    if (unpinnedCount < 50) {
      unpinnedCount++;
      return true;
    }
    return false;
  });
};

const getRandomCandidate = () => {
  const idx = Math.floor(Math.random() * FOLK_ROAD.occupations.length);
  return {
    femaleName: FOLK_ROAD.femaleNames[idx] || "알 수 없음",
    maleName: FOLK_ROAD.maleNames[idx] || "알 수 없음",
    occupation: FOLK_ROAD.occupations[idx] || "일반인",
    personality: FOLK_ROAD.personalities[idx] || "평범한"
  };
};

const getCardIdentity = (card: Card): string => `${card.type}-${card.suit || ""}-${card.card}`;

const PLAYER_HAND_LIMIT = 4;

const getExpectedPlayerIdentities = () => new Set(createPlayerDeck().map(getCardIdentity));
const getExpectedRefereeIdentities = () => new Set(createRefereeDeck().map(getCardIdentity));

const isValidCardForSet = (card: any, expected: Set<string>): card is Card => {
  if (!card || typeof card !== "object") return false;
  const identity = getCardIdentity(card as Card);
  return expected.has(identity);
};

const cleanCard = (card: Card): Card => ({ ...card, reversed: !!card.reversed });

const cleanCardArray = (cards: any): Card[] => Array.isArray(cards)
  ? cards.filter((card): card is Card => card && typeof card === "object").map(cleanCard)
  : [];

const validateCardEconomy = (
  zones: Card[][],
  expected: Set<string>
): boolean => {
  const seen = new Set<string>();
  for (const zone of zones) {
    for (const card of zone) {
      if (!isValidCardForSet(card, expected)) return false;
      const identity = getCardIdentity(card);
      if (seen.has(identity)) return false;
      seen.add(identity);
    }
  }
  if (seen.size !== expected.size) return false;
  for (const identity of expected) {
    if (!seen.has(identity)) return false;
  }
  return true;
};

const sanitizeMapGrid = (loadedGrid: any): MapCell[] => {
  const refereeIdentities = getExpectedRefereeIdentities();
  const source = Array.isArray(loadedGrid) ? loadedGrid : [];
  return Array.from({ length: 16 }, (_, i) => {
    const raw = source[i] || {};
    const cell: MapCell = {
      x: typeof raw.x === "number" ? raw.x : i % 4,
      y: typeof raw.y === "number" ? raw.y : Math.floor(i / 4)
    };
    if (raw.type === "wilderness" || raw.type === "dungeon" || raw.type === "settlement") {
      cell.type = raw.type;
    }
    if (typeof raw.description === "string") {
      cell.description = raw.description;
    }
    if (isValidCardForSet(raw.card, refereeIdentities)) {
      cell.card = cleanCard(raw.card);
    }
    return cell;
  });
};

const appendUniqueCards = (cards: Card[], additions: Card[]): Card[] => {
  const seen = new Set(cards.map(getCardIdentity));
  const next = [...cards];
  additions.forEach(card => {
    const identity = getCardIdentity(card);
    if (!seen.has(identity)) {
      seen.add(identity);
      next.push(card);
    }
  });
  return next;
};

const sanitizeGameState = (loaded: any): GameState => {
  if (!loaded) return {
    ...INITIAL_STATE,
    playerDeck: createPlayerDeck(),
    refereeDeck: createRefereeDeck()
  };

  const character = { ...INITIAL_CHARACTER, ...loaded.character };
  
  character.stats = { ...INITIAL_CHARACTER.stats, ...loaded.character?.stats };
  character.wounds = { ...INITIAL_CHARACTER.wounds, ...loaded.character?.wounds };
  character.armorNotches = { ...INITIAL_CHARACTER.armorNotches, ...loaded.character?.armorNotches };
  
  character.inventory = Array.isArray(loaded.character?.inventory) ? loaded.character.inventory : [...INITIAL_CHARACTER.inventory];
  character.instincts = Array.isArray(loaded.character?.instincts) ? loaded.character.instincts : [...INITIAL_CHARACTER.instincts];
  
  const rawGoals = Array.isArray(loaded.character?.goals) ? loaded.character.goals : [...INITIAL_CHARACTER.goals];
  character.goals = rawGoals.map((g: any) => {
    if (typeof g === 'string') {
      return {
        id: generateUniqueId(),
        text: g,
        status: "active",
        createdDate: "초기 설정"
      };
    }
    return {
      id: g.id || generateUniqueId(),
      text: g.text || '',
      status: g.status || "active",
      createdDate: g.createdDate || "초기 설정",
      completedDate: g.completedDate || undefined,
      milestoneNote: g.milestoneNote || undefined,
      linkedJournalId: g.linkedJournalId || undefined
    };
  });
  
  const rawFriends = Array.isArray(loaded.character?.friends) ? loaded.character.friends : [...INITIAL_CHARACTER.friends];
  character.friends = rawFriends.map((f: any) => {
    if (typeof f === 'string') return { name: f, info: '', relationship: 'Neutral', memoryLogs: [] };
    return {
      name: f.name || '',
      info: f.info || '',
      relationship: f.relationship || 'Neutral',
      memoryLogs: Array.isArray(f.memoryLogs) ? f.memoryLogs : []
    };
  });

  const rawFoes = Array.isArray(loaded.character?.foes) ? loaded.character.foes : [...INITIAL_CHARACTER.foes];
  character.foes = rawFoes.map((f: any) => {
    if (typeof f === 'string') return { name: f, info: '', relationship: 'Neutral', memoryLogs: [] };
    return {
      name: f.name || '',
      info: f.info || '',
      relationship: f.relationship || 'Neutral',
      memoryLogs: Array.isArray(f.memoryLogs) ? f.memoryLogs : []
    };
  });

  const rawHirelings = Array.isArray(loaded.character?.hirelings) ? loaded.character.hirelings : [...INITIAL_CHARACTER.hirelings];
  character.hirelings = rawHirelings.map((h: any) => {
    if (typeof h === 'string') return { name: h, info: '', woundsTaken: 0, maxWounds: 2, paidThisWeek: false, loyalty: 5, memoryLogs: [] };
    return {
      name: h.name || '',
      info: h.info || '',
      woundsTaken: typeof h.woundsTaken === 'number' ? h.woundsTaken : 0,
      maxWounds: typeof h.maxWounds === 'number' ? h.maxWounds : 2,
      paidThisWeek: !!h.paidThisWeek,
      loyalty: typeof h.loyalty === 'number' ? h.loyalty : 5,
      memoryLogs: Array.isArray(h.memoryLogs) ? h.memoryLogs : []
    };
  });

  character.unlockedTalents = Array.isArray(loaded.character?.unlockedTalents) ? loaded.character.unlockedTalents : [...INITIAL_CHARACTER.unlockedTalents];
  character.lifepathLogs = Array.isArray(loaded.character?.lifepathLogs) ? loaded.character.lifepathLogs : [...INITIAL_CHARACTER.lifepathLogs];
  character.spellbook = Array.isArray(loaded.character?.spellbook) ? loaded.character.spellbook : [...INITIAL_CHARACTER.spellbook];

  character.instinctTriggers = Array.isArray(loaded.character?.instinctTriggers)
    ? loaded.character.instinctTriggers.map((t: any) => ({
        id: t.id || generateUniqueId(),
        instinctText: t.instinctText || '',
        date: t.date || '',
        narrativeNote: t.narrativeNote || '',
        linkedJournalId: t.linkedJournalId || undefined
      }))
    : [];

  character.injuryLogs = Array.isArray(loaded.character?.injuryLogs)
    ? loaded.character.injuryLogs.map((l: any) => ({
        id: l.id || generateUniqueId(),
        location: l.location,
        injuryText: l.injuryText || '',
        dateAcquired: l.dateAcquired || '',
        healed: !!l.healed,
        dateHealed: l.dateHealed || undefined,
        scarsNotes: l.scarsNotes || undefined
      }))
    : [];

  character.chronicleChapters = Array.isArray(loaded.character?.chronicleChapters)
    ? loaded.character.chronicleChapters.map((c: any) => ({
        id: c.id || generateUniqueId(),
        title: c.title || '',
        summary: c.summary || '',
        dateRange: c.dateRange || ''
      }))
    : [];

  character.epilogue = typeof loaded.character?.epilogue === 'string' ? loaded.character.epilogue : "";

  const repairWarnings: string[] = [];
  const mapGrid = sanitizeMapGrid(loaded.mapGrid);

  let playerDeck = cleanCardArray(loaded.playerDeck);
  let playerDiscard = cleanCardArray(loaded.playerDiscard);
  let hand = cleanCardArray(loaded.hand);
  let playerInitiativeCard = loaded.playerInitiativeCard !== undefined && loaded.playerInitiativeCard !== null
    ? cleanCard(loaded.playerInitiativeCard)
    : null;

  const playerExpected = getExpectedPlayerIdentities();
  const isPlayerEconomyValid =
    hand.length <= PLAYER_HAND_LIMIT &&
    validateCardEconomy(
      [playerDeck, playerDiscard, hand, playerInitiativeCard ? [playerInitiativeCard] : []],
      playerExpected
    );

  if (!isPlayerEconomyValid) {
    playerDeck = createPlayerDeck();
    playerDiscard = [];
    hand = [];
    playerInitiativeCard = null;
    repairWarnings.push("[저장 복구] 플레이어 덱/손패/선제권 카드 상태가 불가능하여 플레이어 카드 경제만 초기화했습니다.");
  }

  let refereeDeck = cleanCardArray(loaded.refereeDeck);
  let refereeDiscard = cleanCardArray(loaded.refereeDiscard);
  let combatMonsters: CombatMonster[] = Array.isArray(loaded.combatMonsters) ? loaded.combatMonsters : [];
  combatMonsters = combatMonsters.map((m: any) => ({
    id: m.id || generateUniqueId(),
    monsterId: typeof m.monsterId === "number" ? m.monsterId : 1,
    name: m.name || "Unknown",
    woundsTaken: typeof m.woundsTaken === "number" ? m.woundsTaken : 0,
    initiativeCard: m.initiativeCard ? cleanCard(m.initiativeCard) : undefined
  }));

  const refereeExpected = getExpectedRefereeIdentities();
  const monsterInitiatives = combatMonsters
    .map((m: CombatMonster) => m.initiativeCard)
    .filter((card): card is Card => !!card);
  const isRefereeEconomyValid = validateCardEconomy([refereeDeck, refereeDiscard, monsterInitiatives], refereeExpected);

  if (!isRefereeEconomyValid) {
    refereeDeck = createRefereeDeck();
    refereeDiscard = [];
    combatMonsters = combatMonsters.map((m: CombatMonster) => ({ ...m, initiativeCard: undefined }));
    repairWarnings.push("[저장 복구] 레프리 덱/몬스터 선제권 카드 상태가 불가능하여 레프리 카드 경제만 초기화했습니다.");
  }
  const rawJournals = Array.isArray(loaded.journals) ? loaded.journals : [];
  
  const journals = rawJournals.map((j: any) => {
    if (typeof j === 'string') return { id: generateUniqueId(), text: j, date: new Date().toLocaleString(), day: 1, watch: 1, x: null, y: null, pinned: false, isThematic: false, systemLog: j };
    return {
      id: j.id || generateUniqueId(),
      text: j.text || '',
      date: j.date || new Date().toLocaleString(),
      day: typeof j.day === 'number' ? j.day : 1,
      watch: typeof j.watch === 'number' ? j.watch : 1,
      x: typeof j.x === 'number' ? j.x : null,
      y: typeof j.y === 'number' ? j.y : null,
      pinned: !!j.pinned,
      isThematic: !!j.isThematic,
      systemLog: j.systemLog || j.text || '',
      systemGenerated: !!j.systemGenerated,
      chronicle: !!j.chronicle,
      chronicleCategory: typeof j.chronicleCategory === 'string' ? j.chronicleCategory : undefined,
      chronicleIcon: typeof j.chronicleIcon === 'string' ? j.chronicleIcon : undefined
    };
  });

  const repairJournals: JournalEntry[] = repairWarnings.map(text => ({
    id: generateUniqueId(),
    text,
    date: new Date().toLocaleString(),
    day: typeof loaded.day === 'number' ? loaded.day : 1,
    watch: typeof loaded.watch === 'number' ? loaded.watch : 1,
    pinned: false,
    isThematic: false,
    systemLog: text
  }));

  return {
    character,
    playerDeck,
    playerDiscard,
    refereeDeck,
    refereeDiscard,
    hand,
    mapGrid,
    journals: [...repairJournals, ...journals],
    combatMonsters,
    combatRound: typeof loaded.combatRound === 'number' ? loaded.combatRound : 1,
    mapType: loaded.mapType || "wilderness",
    day: typeof loaded.day === 'number' ? loaded.day : 1,
    watch: typeof loaded.watch === 'number' ? loaded.watch : 1,
    lastDrawnOracleCardValue: loaded.lastDrawnOracleCardValue !== undefined ? loaded.lastDrawnOracleCardValue : null,
    activeTest: loaded.activeTest !== undefined ? loaded.activeTest : null,
    arcaneSpellResult: loaded.arcaneSpellResult !== undefined ? loaded.arcaneSpellResult : null,
    alchemicalBrewResult: loaded.alchemicalBrewResult !== undefined ? loaded.alchemicalBrewResult : null,
    playerInitiativeCard,

    drawnOracleCard: loaded.drawnOracleCard !== undefined ? loaded.drawnOracleCard : null,
    oracleYesNo: loaded.oracleYesNo !== undefined ? loaded.oracleYesNo : null,
    oracleAmount: loaded.oracleAmount !== undefined ? loaded.oracleAmount : null,
    oracleActionSubject: loaded.oracleActionSubject !== undefined ? loaded.oracleActionSubject : null,

    testCurrentTotal: typeof loaded.testCurrentTotal === 'number' ? loaded.testCurrentTotal : 0,
    testResolveSpent: typeof loaded.testResolveSpent === 'number' ? loaded.testResolveSpent : 0,
    testStat: loaded.testStat !== undefined ? loaded.testStat : "none",
    testMod: typeof loaded.testMod === 'number' ? loaded.testMod : 0,
    testOppMonsterId: loaded.testOppMonsterId !== undefined ? loaded.testOppMonsterId : "none",
    testCustomOppPenalty: typeof loaded.testCustomOppPenalty === 'number' ? loaded.testCustomOppPenalty : 0,
    testHelpStat: typeof loaded.testHelpStat === 'number' ? loaded.testHelpStat : 0,
    testPurpose: loaded.testPurpose !== undefined ? loaded.testPurpose : "",
    testDrawnCards: Array.isArray(loaded.testDrawnCards) ? loaded.testDrawnCards : [],
    testPushed: typeof loaded.testPushed === 'boolean' ? loaded.testPushed : false,
    testStatus: loaded.testStatus !== undefined ? loaded.testStatus : "idle",

    selectedMapCellIdx: loaded.selectedMapCellIdx !== undefined ? loaded.selectedMapCellIdx : null,
    carousingResult: loaded.carousingResult !== undefined ? loaded.carousingResult : null,
    folkNpcResult: loaded.folkNpcResult !== undefined ? loaded.folkNpcResult : null,
    magickItemResult: loaded.magickItemResult !== undefined ? loaded.magickItemResult : null,
    currentSessionId: typeof loaded.currentSessionId === "string" && loaded.currentSessionId
      ? loaded.currentSessionId
      : `day-${typeof loaded.day === "number" ? loaded.day : 1}-watch-${typeof loaded.watch === "number" ? loaded.watch : 1}`,
    sessionRewardHistory: Array.isArray(loaded.sessionRewardHistory)
      ? loaded.sessionRewardHistory.map((r: any) => ({
          id: r.id || generateUniqueId(),
          date: r.date || new Date().toLocaleString(),
          day: typeof r.day === "number" ? r.day : 1,
          watch: typeof r.watch === "number" ? r.watch : 1,
          xp: typeof r.xp === "number" ? r.xp : 0,
          resolve: typeof r.resolve === "number" ? r.resolve : 0,
          reasons: Array.isArray(r.reasons) ? r.reasons.filter((x: any) => typeof x === "string") : []
        }))
      : [],
    activeFriendAid: loaded.activeFriendAid !== undefined ? loaded.activeFriendAid : null,
    usedFriendAids: loaded.usedFriendAids && typeof loaded.usedFriendAids === 'object' ? loaded.usedFriendAids : {},
    testFriendBonus: typeof loaded.testFriendBonus === 'number' ? loaded.testFriendBonus : 0,
  };
};

const GLOAM_RULES: Record<string, { page: string; title: string; content: string }> = {
  "판정": {
    page: "8",
    title: "판정 (Tests)",
    content: "결과가 불확실한 행동은 관련 스탯(Cups, Wands, Swords, Coins)을 정하고 플레이어 덱에서 카드 1장을 뽑아 카드값 + 스탯을 더합니다. 합계 14 이상이면 성공, 13 이하이면 실패입니다. 첫 카드로 성공했고 카드 수트가 판정 스탯과 일치하면 대성공(Great Success)입니다. 도움은 카드가 뽑히기 전에 선언하며, 한 명만 관련 스탯을 더할 수 있고 실패의 결과도 함께 나눕니다."
  },
  "선제권": {
    page: "30",
    title: "선제권 (Initiative)",
    content: "전투 라운드 시작 시 플레이어는 손패가 4장이 될 때까지 뽑고, 레프리는 NPC/몬스터마다 3장을 뽑습니다. 각 전투원은 손패에서 1장을 비공개로 선제권 카드로 내고, 0부터 14까지 낮은 수부터 차례대로 행동합니다. 선제권 카드는 적이 자신을 공격할 때 맞히기 위해 넘겨야 하는 목표값이기도 합니다. 낮은 수는 먼저 움직이지만 맞기 쉽고, 높은 수는 늦게 움직이지만 맞히기 어렵습니다."
  },
  "푸시": {
    page: "8",
    title: "푸시 (Pushing the Test)",
    content: "첫 카드 결과가 13 이하라면, 원할 때 푸시를 선언해 플레이어 덱에서 두 번째 카드를 뽑고 합계에 더할 수 있습니다. 푸시는 선택 사항입니다. 두 번째 카드까지 더해 14 이상이 되면 성공합니다. 푸시 후에도 실패하면 대실패(Great Failure)가 되며 상황이 크게 악화되지만 결의(Resolve)를 1점 얻습니다."
  },
  "대실패": {
    page: "8",
    title: "대실패 (Great Failure)",
    content: "판정을 푸시했는데도 최종 합계가 14 미만이면 대실패입니다. 목표 달성에 실패할 뿐 아니라 일이 훨씬 나쁘게 꼬입니다. 그 대신 캐릭터는 결의(Resolve)를 1점 얻습니다."
  },
  "장비": {
    page: "25",
    title: "장비와 구매 (Equipment)",
    content: "Gloam은 슬롯 기반 장비 추적을 사용합니다. 배낭은 10 + Coins 스탯만큼의 슬롯을 가지며, 착용 중인 방어구를 포함해 대부분의 아이템은 슬롯 1개를 차지합니다. 새 캐릭터는 무료 아이템 5개로 시작합니다. 물건을 사려면 아이템의 Coins 수정치를 적용한 Coins 판정을 합니다. 성공하면 획득하고, 실패하면 너무 비싸거나 품절인 등의 이유로 사지 못합니다. 구매 판정도 일반 판정처럼 푸시와 도움을 받을 수 있습니다."
  },
  "광대": {
    page: "30",
    title: "광대 (The Fool - Major 0)",
    content: "누군가 광대를 뽑으면 반드시 알립니다. 광대는 어떤 행동에든 +3 보너스로 낼 수 있으며, 다른 사람의 행동에도 보탤 수 있습니다. 선제권 0으로도 낼 수 있습니다. 광대가 뽑힌 라운드가 끝나면 플레이 중인 카드를 모두 버리고, 양쪽 버림 더미를 각자의 덱에 다시 섞습니다."
  },
  "민속 마법": {
    page: "37",
    title: "민속 마법 (Folk Magick)",
    content: "민속 마법은 누구나 사용할 수 있는 전승 주술입니다. 피해를 입히는 용도로는 사용할 수 없습니다. 시전하려면 천, 불꽃, 약초, 돌 같은 부적/매개물을 정하고, 목표를 정한 뒤, 그 매개물을 어울리는 방식으로 사용합니다. 마지막으로 레프리와 함께 어떤 수트의 판정이 맞는지 정하고 필요한 보너스나 페널티를 적용해 판정합니다."
  },
  "결의": {
    page: "34",
    title: "결의 (Resolve)",
    content: "결의는 캐릭터의 내면의 불꽃이자 의지입니다. 최대 10점까지 보유할 수 있습니다. 세션 시작, 목표 달성 또는 목표가 불가능해짐, 본능이 문제를 만들거나 이야기를 움직임, 대실패, Carousing 표 결과 등으로 얻습니다. 결의는 재능 활성화, 판정 결과를 본 뒤 1점당 판정 합계 +1, 결의가 필요한 아이템 발동에 사용할 수 있습니다."
  },
  "세션 종료 정산": {
    page: "35",
    title: "세션 종료 정산 (End of Session)",
    content: "세션이 끝나면 캐릭터는 아래 항목마다 XP 1점을 얻습니다:\n1. 세션에 참여했는가?\n2. 목표(Goal) 하나를 달성했는가?\n3. 생명이 위태로운 상황에 처했는가?\n목표 달성으로 인한 결의 획득은 결의 규칙(p.34)에 따로 포함됩니다. XP를 쓸 때는 새 직업 재능 5 XP, 다른 직업 재능 10 XP, 스탯 증가 10 XP가 필요하며, 쓴 XP 1점마다 학습에 하루가 걸립니다."
  },
  "용병 급여": {
    page: "52",
    title: "용병 및 고용 (Hirelings & Wages)",
    content: "정착지에 있을 때 Cups 판정에 성공하면 고용 후보를 찾고, 이어 Coins 판정에 성공하면 고용할 수 있습니다. 캐릭터가 고용할 수 있는 용병 수는 자신의 Cups 스탯과 같습니다. 용병은 합리적인 지시를 따르지만 직접적인 위험에 뛰어드는 일은 피합니다. 고용된 동안 매주 Coins 판정으로 급여를 지급합니다. 성공하면 계속 일하고, 실패하면 보수를 받지 못했거나 일이 너무 위험하다고 판단해 그만둡니다."
  }
};

const getThematicLogText = (actionType: string, details: any): string => {
  switch (actionType) {
    case "card_play":
      return `[전술: ${details.purpose}] 어둠 속에서 카드의 영험한 힘을 빌어 행동을 감행합니다. (${details.cardName} 제출)`;
    case "stat_up":
      return `[수련: ${details.statName}] 10일 동안 온 마음을 다해 단련하며 마침내 능력의 심연에 도달합니다. (${details.statName} ${details.prevVal} → ${details.prevVal + 1} 상승)`;
    case "talent_unlock":
      return `[재능 해금: ${details.talentName}] 황혼의 지혜를 마주하며 새로운 비범한 재능 '${details.talentName}'을 일깨웁니다.`;
    case "combat_initiative":
      return `[선제 전투 준비] 다가올 혈전을 직감하며 칼자루를 움켜쥐고 마음의 준비를 마칩니다. (선제권 카드: ${details.cardName})`;
    case "combat_initiative_draw":
      return `[돌발 전투 대처] 숨은 적의 살기를 느끼고 반사적으로 덱에서 선제권을 뽑아 듭니다. (드로우 선제권: ${details.cardName})`;
    case "morale_test":
      return details.success 
        ? `[사기 유지] 대적하는 ${details.monName}이(가) 광폭한 투지를 불태우며 아직 굴복하지 않았음을 과시합니다.`
        : `[전의 상실] 매서운 공격에 질린 ${details.monName}이(가) 비명을 지르며 후퇴하거나 자비를 구하기 시작합니다. (사기 꺾임)`;
    case "npc_reaction":
      return `[대화 교섭] 황혼의 눈빛을 마주하며 상대의 마음속 깊은 의도를 탐색합니다. (대화 결과: ${details.outcomeText})`;
    case "alchemical_brew":
      return details.success
        ? `[비약 조제] 보라색 안개 속에서 진귀한 연금술 영약 '${details.potionName}' 조제에 성공합니다.`
        : `[조제 실패] 불꽃 조절 실패로 가마솥이 폭발하며 찌꺼기만 남고 소중한 약초 재료를 잃고 맙니다.`;
    case "goal_complete":
      return `[맹세 이행] 황혼의 언약을 다짐하며 오랫동안 추적하던 목표 '${details.goal}'을 마침내 마침표 짓습니다. 결의 1점을 얻습니다.`;
    case "session_end":
      return `[장막의 세션 정산] 겪어온 위협과 극복한 도전들을 돌아보며 여정의 한 장을 넘깁니다. (XP +${details.addXp}, 결의 +${details.addResolve})`;
    case "test_resolve_spent":
      return `[결의의 굴절] 심장이 조여드는 위기 속에서 신념을 굳건히 하며 운명의 수레바퀴를 강제로 비틉니다. (결의 보정 적용)`;
    default:
      return details.text || "";
  }
};

const getCardDisplayName = (card: Card) => {
  const suitKo = card.suit === "cups" ? "컵" :
                 card.suit === "wands" ? "완드" :
                 card.suit === "swords" ? "소드" :
                 card.suit === "coins" ? "코인" : "";
  const valKo = card.card === "A" ? "에이스" : card.card;
  const orientation = card.reversed ? " (역방향)" : "";
  
  if (card.type === "major") {
    const majorInfo = ORACLE_SUBJECTS[card.card];
    return `${majorInfo ? majorInfo.name : "메이저"} ${card.card}${orientation}`;
  }
  return `${suitKo} ${valKo}${orientation}`;
};

const getRelationshipColor = (rel: string) => {
  switch (rel) {
    case "Devoted": return "#85bb65";
    case "Friendly": return "#4caf50";
    case "Neutral": return "#bbb";
    case "Wary": return "#ff9800";
    case "Hostile": return "#f44336";
    default: return "#bbb";
  }
};

const renderTextWithRules = (text: string, showRule: (key: string) => void) => {
  if (!text) return "";
  const parts = text.split(/(\(p\.\d+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/\(p\.(\d+)\)/);
    if (match) {
      const pageNum = match[1];
      let ruleKey = "";
      if (pageNum === "30") ruleKey = "선제권";
      else if (pageNum === "8") ruleKey = "판정";
      else if (pageNum === "25") ruleKey = "장비";
      else if (pageNum === "34") ruleKey = "결의";
      else if (pageNum === "37") ruleKey = "민속 마법";
      else if (pageNum === "35") ruleKey = "세션 종료 정산";
      else if (pageNum === "52") ruleKey = "용병 급여";
      
      if (ruleKey) {
        return (
          <button 
            key={i} 
            className="rule-citation-link" 
            onClick={(e) => {
              e.stopPropagation();
              showRule(ruleKey);
            }}
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "var(--color-gold)", 
              textDecoration: "underline", 
              cursor: "pointer", 
              padding: 0,
              fontFamily: "inherit",
              fontSize: "inherit"
            }}
          >
            {part}
          </button>
        );
      }
    }
    return part;
  });
};

const TALENT_DESCRIPTIONS: { [key: string]: string } = {
  "Disarming Presence (무장 해제)": "Reaction(반응) 판정 보정 +3 (p.18)",
  "Academic (학술 지성)": "문화, 제도, 역사에 대한 지식을 떠올립니다 (레프리 재량, p.18)",
  "Duel of Wits (언쟁 달인)": "청중 앞에서 논쟁에서 승리합니다. 상대가 묵인하도록 강제할 수 있습니다 (p.18)",
  "Inspire (격려 연설)": "동료가 판정하기 전에 격려의 말로 +3 보너스를 부여합니다 (p.18)",
  "Parley (평화 교섭)": "언어가 통하는 적대적인 크리처를 진정시키고 협상합니다 (전투 전만 가능, p.18)",
  "Verity & Guile (진실과 기만)": "상대의 거짓말을 간파하거나, 아군의 거짓말을 믿게 만듭니다 (Cups 판정 vs 14, p.18)",

  "Sally Forth (과감한 돌격)": "전투 라운드당 한 번, 추가 전투 행동(Combat Action)을 수행합니다 (p.19)",
  "Geas (맹세 명령)": "생명체에게 간단한 과업을 명령합니다 (저항 실패 시 완수까지 단일 목적 몰두, 한 번에 1개 제한, p.19)",
  "Itinerant Hospitality (기사 환대)": "어느 성채나 저택에서든 자신과 동료들을 위한 공짜 숙식 대접을 받습니다 (p.19)",
  "Martial Dominance (전투 지배)": "사거리 내로 진입하거나 나가는 모든 크리처를 반응(Response)으로 즉시 공격합니다 (p.19)",
  "Oath-sworn (피의 맹세)": "서약을 선포합니다. 서약에 부합하는 모든 행동 판정에 +3 보너스. 실패 시 서약 파괴자가 됨 (p.19)",
  "Trial by Combat (결투 대결)": "갈등 해결을 위한 결투를 신청합니다. 상대가 거절 시 겁을 먹어 1턴간 대상을 향한 사교 판정에 +3 보너스 (p.19)",

  "Magick (비술 각성)": "Minor 1개 + Major 1개 아르카나 단어로 이루어진 주문 1개로 시작하며 주문을 시전합니다 (p.20)",
  "Augury (징조 읽기)": "앞날을 읽어 특정 행동 방향에 대해 Weal(길), Woe(흉), 또는 둘 다/없음의 계시를 얻습니다 (p.20)",
  "Sixth Sense (영적 감지)": "인물, 사물, 장소에 깃든 마법적 징조를 감지합니다. 연두-보랏빛 안개로 보임 (p.20)",
  "Familiar (사역마 소환)": "명령을 따르는 임프나 고양이를 소환합니다 (부상 1개에 소멸, 1마리 제한, p.20)",
  "Undo Magick (마법 해제)": "다른 주문을 카운터하거나 Dispelling 합니다. 강력한 마법은 Wands 판정 필요 (p.20)",
  "Bind Magick (마법 부여)": "아이템에 주문을 부여합니다. 결의 1점마다 1충전. 누구나 결의를 써서 발동 가능 (p.20)",

  "Nimble (민첩 대처)": "공격 대상이 되었을 때, 자신의 선제권(Initiative) 카드를 손패의 다른 카드와 교체합니다 (p.21)",
  "One with the Shadows (그림자 동화)": "어두운 곳에 매우 뛰어나게 숨어 투명화 수준이 됩니다. 냄새는 남음 (p.21)",
  "Sneak-Attack (급소 암습)": "아머(AP)를 완전히 무시하여 우회하는 기습 근접 공격을 감행합니다 (p.21)",
  "Poisoner (독약 제조)": "섭취 후 1시간 이내에 삼킨 대상을 즉사시키는 치명적인 독약을 제조합니다 (p.21)",
  "Impersonate (변장 모사)": "인간의 겉모습, 목소리, 태도를 1 Watch(8시간) 동안 기막히게 복제/가장합니다 (p.21)",
  "Split (신속 퇴각)": "Coins 판정 없이 자신과 동료들을 즉시 조우 상황에서 탈출시켜 도망칩니다 (p.21)"
};

// =================================================================
// 4. MAIN APP COMPONENT
// =================================================================
export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "character" | "oracles" | "map" | "journal">("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals / Temporary states
  const [newJournalText, setNewJournalText] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterSummary, setNewChapterSummary] = useState("");
  const [newChapterDateRange, setNewChapterDateRange] = useState("");
  const [buyCatalogItem, setBuyCatalogItem] = useState<{ name: string; nameKo: string; coinsMod: string; swordsReq?: number } | null>(null);
  const [buyTestResult, setBuyTestResult] = useState<{ success: boolean; total: number; card: Card; statUsed: number } | null>(null);

  // Oracle drawn states
  const drawnOracleCard = state?.drawnOracleCard ?? null;
  const setDrawnOracleCard = (val: Card | null | ((prev: Card | null) => Card | null)) => {
    updateState(s => ({ ...s, drawnOracleCard: typeof val === "function" ? val(s.drawnOracleCard) : val }));
  };

  const oracleYesNo = state?.oracleYesNo ?? null;
  const setOracleYesNo = (val: string | null | ((prev: string | null) => string | null)) => {
    updateState(s => ({ ...s, oracleYesNo: typeof val === "function" ? val(s.oracleYesNo) : val }));
  };

  const oracleAmount = state?.oracleAmount ?? null;
  const setOracleAmount = (val: string | null | ((prev: string | null) => string | null)) => {
    updateState(s => ({ ...s, oracleAmount: typeof val === "function" ? val(s.oracleAmount) : val }));
  };

  const oracleActionSubject = state?.oracleActionSubject ?? null;
  const setOracleActionSubject = (val: any | null | ((prev: any | null) => any | null)) => {
    updateState(s => ({ ...s, oracleActionSubject: typeof val === "function" ? val(s.oracleActionSubject) : val }));
  };

  // Combat States
  const [selectedMonsterToSpawn, setSelectedMonsterToSpawn] = useState<number>(1);

  // Downtime & Special Tables States
  const carousingResult = state?.carousingResult ?? null;
  const setCarousingResult = (val: any | null | ((prev: any | null) => any | null)) => {
    updateState(s => ({ ...s, carousingResult: typeof val === "function" ? val(s.carousingResult) : val }));
  };

  const folkNpcResult = state?.folkNpcResult ?? null;
  const setFolkNpcResult = (val: any | null | ((prev: any | null) => any | null)) => {
    updateState(s => ({ ...s, folkNpcResult: typeof val === "function" ? val(s.folkNpcResult) : val }));
  };

  const [selectedMagickSuit, setSelectedMagickSuit] = useState<"Swords" | "Coins" | "Cups" | "Wands">("Swords");
  
  const magickItemResult = state?.magickItemResult ?? null;
  const setMagickItemResult = (val: any | null | ((prev: any | null) => any | null)) => {
    updateState(s => ({ ...s, magickItemResult: typeof val === "function" ? val(s.magickItemResult) : val }));
  };

  // Shop Tab State
  const [shopTab, setShopTab] = useState<"weapons" | "armor" | "trade">("weapons");
  const [tradeGoodsSearch, setTradeGoodsSearch] = useState("");

  // Combat Quick Reference toggle
  const [showCombatRef, setShowCombatRef] = useState(false);

  // General Test Resolve spending state
  const testCurrentTotal = state?.testCurrentTotal ?? 0;
  const setTestCurrentTotal = (val: number | ((prev: number) => number)) => {
    updateState(s => ({ ...s, testCurrentTotal: typeof val === "function" ? val(s.testCurrentTotal) : val }));
  };

  const testResolveSpent = state?.testResolveSpent ?? 0;
  const setTestResolveSpent = (val: number | ((prev: number) => number)) => {
    updateState(s => ({ ...s, testResolveSpent: typeof val === "function" ? val(s.testResolveSpent) : val }));
  };

  const testStat = state?.testStat ?? "none";
  const setTestStat = (val: any | ((prev: any) => any)) => {
    updateState(s => ({ ...s, testStat: typeof val === "function" ? val(s.testStat) : val }));
  };

  const testMod = state?.testMod ?? 0;
  const setTestMod = (val: number | ((prev: number) => number)) => {
    updateState(s => ({ ...s, testMod: typeof val === "function" ? val(s.testMod) : val }));
  };

  const testOppMonsterId = state?.testOppMonsterId ?? "none";
  const setTestOppMonsterId = (val: string | ((prev: string) => string)) => {
    updateState(s => ({ ...s, testOppMonsterId: typeof val === "function" ? val(s.testOppMonsterId) : val }));
  };

  const testCustomOppPenalty = state?.testCustomOppPenalty ?? 0;
  const setTestCustomOppPenalty = (val: number | ((prev: number) => number)) => {
    updateState(s => ({ ...s, testCustomOppPenalty: typeof val === "function" ? val(s.testCustomOppPenalty) : val }));
  };

  const testHelpStat = state?.testHelpStat ?? 0;
  const setTestHelpStat = (val: number | ((prev: number) => number)) => {
    updateState(s => ({ ...s, testHelpStat: typeof val === "function" ? val(s.testHelpStat) : val }));
  };

  const testPurpose = state?.testPurpose ?? "";
  const setTestPurpose = (val: string | ((prev: string) => string)) => {
    updateState(s => ({ ...s, testPurpose: typeof val === "function" ? val(s.testPurpose) : val }));
  };

  const testDrawnCards = state?.testDrawnCards ?? [];
  const setTestDrawnCards = (val: Card[] | ((prev: Card[]) => Card[])) => {
    updateState(s => ({ ...s, testDrawnCards: typeof val === "function" ? val(s.testDrawnCards) : val }));
  };

  const testPushed = state?.testPushed ?? false;
  const setTestPushed = (val: boolean | ((prev: boolean) => boolean)) => {
    updateState(s => ({ ...s, testPushed: typeof val === "function" ? val(s.testPushed) : val }));
  };

  const testStatus = state?.testStatus ?? "idle";
  const setTestStatus = (val: any | ((prev: any) => any)) => {
    updateState(s => ({ ...s, testStatus: typeof val === "function" ? val(s.testStatus) : val }));
  };

  const setTestFriendBonus = (val: number | ((prev: number) => number)) => {
    updateState(s => ({ ...s, testFriendBonus: typeof val === "function" ? val(s.testFriendBonus) : val }));
  };

  // Alchemy state
  const [brewingIngredient, setBrewingIngredient] = useState<string>("Basilisk Eyeball");

  // UI and Immersion states
  const selectedMapCellIdx = state?.selectedMapCellIdx ?? null;
  const setSelectedMapCellIdx = (val: number | null | ((prev: number | null) => number | null)) => {
    updateState(s => ({ ...s, selectedMapCellIdx: typeof val === "function" ? val(s.selectedMapCellIdx) : val }));
  };
  const [journalDisplayMode, setJournalDisplayMode] = useState<"thematic" | "system">("thematic");
  const [journalSubView, setJournalSubView] = useState<"field" | "chronicle" | "retirement">("field");
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [activeRuleTitle, setActiveRuleTitle] = useState<string>("");
  const [activeRuleText, setActiveRuleText] = useState<string>("");
  const [activeRulePage, setActiveRulePage] = useState<string>("");
  const [expandedFriendIdx, setExpandedFriendIdx] = useState<number | null>(null);
  const [expandedFoeIdx, setExpandedFoeIdx] = useState<number | null>(null);
  const [expandedHirelingIdx, setExpandedHirelingIdx] = useState<number | null>(null);

  const generateMarkdownChronicle = (gameState: GameState): string => {
    const char = gameState.character;
    const daysCount = gameState.day;
    const statBlock = `- Cups (성배): ${char.stats.cups}
- Wands (지팡이): ${char.stats.wands}
- Swords (검): ${char.stats.swords}
- Coins (동전): ${char.stats.coins}`;

    const completed = (char.goals || [])
      .filter((g): g is Goal => typeof g !== 'string' && g.status === 'completed')
      .map(cg => `- **[${cg.completedDate || '날짜 미상'}]** ${cg.text}\n  *달성기록: ${cg.milestoneNote || '기록 없음'}*`)
      .join('\n');

    const friendsList = (char.friends || [])
      .map(f => {
        const relMap: Record<string, string> = { Devoted: "헌신적", Friendly: "우호적", Neutral: "중립적", Wary: "경계함", Hostile: "적대적" };
        const rel = relMap[f.relationship || 'Neutral'] || f.relationship || '중립적';
        const logs = (f.memoryLogs || []).map(m => `  * ${m}`).join('\n');
        return `- **${f.name}** (${f.info || '소개 없음'}) [관계: ${rel}]\n${logs || '  * 기억된 사건 없음'}`;
      })
      .join('\n\n');

    const foesList = (char.foes || [])
      .map(f => {
        const relMap: Record<string, string> = { Devoted: "헌신적", Friendly: "우호적", Neutral: "중립적", Wary: "경계함", Hostile: "적대적" };
        const rel = relMap[f.relationship || 'Neutral'] || f.relationship || '중립적';
        const logs = (f.memoryLogs || []).map(m => `  * ${m}`).join('\n');
        return `- **${f.name}** (${f.info || '소개 없음'}) [관계: ${rel}]\n${logs || '  * 기억된 사건 없음'}`;
      })
      .join('\n\n');

    const hirelingsList = (char.hirelings || [])
      .map(h => {
        const logs = (h.memoryLogs || []).map(m => `  * ${m}`).join('\n');
        return `- **${h.name}** (${h.info || '소개 없음'}) [충성도: ${h.loyalty || 5}, 부상: ${h.woundsTaken || 0}/${h.maxWounds || 2}]\n${logs || '  * 활동 기록 없음'}`;
      })
      .join('\n\n');

    const scarsList = (char.injuryLogs || [])
      .map(log => {
        const locMap: Record<string, string> = { head: "머리", torso: "몸통", lArm: "왼팔", rArm: "오른팔", lLeg: "왼다리", rLeg: "오른다리" };
        const loc = locMap[log.location] || log.location;
        const healedStatus = log.healed
          ? `완치 (완치일: ${log.dateHealed || '미상'})\n  *남겨진 흔적: ${log.scarsNotes || '치유됨'}*`
          : `부상 중 (부상 획득일: ${log.dateAcquired})`;
        return `- **[${loc}]** ${log.injuryText}\n  *상태: ${healedStatus}*`;
      })
      .join('\n');

    const instinctsList = (char.instinctTriggers || [])
      .map(t => `- **[${t.date}]** 본능 '${t.instinctText}' 격발\n  *시련 내용: ${t.narrativeNote}*`)
      .join('\n');

    const chaptersList = (char.chronicleChapters || [])
      .map((c, idx) => `### Chapter ${idx + 1}. ${c.title} (기간: ${c.dateRange})\n${c.summary}`)
      .join('\n\n');

    const formatEntry = (j: JournalEntry) => {
      const coords = j.x !== null && j.y !== null && j.x !== undefined && j.y !== undefined ? ` @ (${j.x}, ${j.y})` : "";
      const icon = j.chronicleIcon ? `${j.chronicleIcon} ` : "";
      return `- **Day ${j.day || 1}, Watch ${j.watch || 1}**${coords}: ${icon}${j.text}`;
    };

    const sortedJournals = (gameState.journals || [])
      .slice()
      .sort((a, b) => (a.day || 1) - (b.day || 1) || (a.watch || 1) - (b.watch || 1));

    const chronicleTimeline = sortedJournals
      .filter(j => j.chronicle)
      .map(formatEntry)
      .join('\n');

    const pinnedNotesTimeline = sortedJournals
      .filter(j => j.pinned && !j.chronicle)
      .map(formatEntry)
      .join('\n');

    const recentJournalTimeline = sortedJournals
      .filter(j => !j.pinned && !j.chronicle)
      .map(formatEntry)
      .join('\n');

    return `# 📜 GLOAM - 캐릭터 연대기 & 서사 기록 (Character Chronicle)

## 👤 모험가 프로필 (Adventurer Profile)
- **이름**: ${char.name}
- **직업**: ${char.vocation}
- **나이**: ${char.age}세
- **경험치**: ${char.xp} XP / **결의**: ${char.resolve} / 10
- **생존 기간**: 총 ${daysCount}일 동안 모험 진행

### 📊 능력치 (Stats)
${statBlock}

---

## 🏆 달성한 업적 연대기 (Completed Milestones)
${completed || "*달성한 업적이 아직 없습니다.*"}

---

## 🤝 인연 및 인간 관계 (Bonds & Relationships)

### 🟢 Friends (인연)
${friendsList || "*맺어진 인연이 없습니다.*"}

### 🔴 Foes (원수)
${foesList || "*등록된 원수가 없습니다.*"}

### 🟡 Hirelings (고용된 용병)
${hirelingsList || "*고용한 용병이 없습니다.*"}

---

## 🩹 신체 부상 및 흉터 연대기 (Anatomy & Scar Chronicle)
${scarsList || "*신체가 깨끗하며 남겨진 흉터가 없습니다.*"}

---

## ⚡ 본능 격발 역사 (Instinct Triggers)
${instinctsList || "*본능으로 인한 곤경 격발 기록이 없습니다.*"}

---

## 📜 캠페인 챕터 기록 (Campaign Chapters)
${chaptersList || "*기록된 캠페인 챕터가 없습니다.*"}

---

## 📖 캐릭터 대서사 (Chronicle)
${chronicleTimeline || "*기록된 대서사(Chronicle)가 없습니다.*"}

---

## 📌 플레이어 고정 메모 (Pinned Notes)
${pinnedNotesTimeline || "*고정된 일지 메모가 없습니다.*"}

---

## 📜 최근 모험 일지 (Recent Journal)
${recentJournalTimeline || "*최근 기록된 일지가 없습니다.*"}

---

## 🪵 은퇴 기록 및 에필로그 (Retirement / Epilogue)
${char.epilogue ? char.epilogue : "*아직 작성된 마지막 은퇴 기록/에필로그가 없습니다.*"}
`;
  };

  const showRule = (key: string) => {
    const rule = GLOAM_RULES[key];
    if (rule) {
      setActiveRuleTitle(rule.title);
      setActiveRuleText(rule.content);
      setActiveRulePage(rule.page || "");
      setShowRuleModal(true);
    }
  };

  // Session End XP Wizard State
  const [showSessionXpWizard, setShowSessionXpWizard] = useState(false);
  const [sessionParticipated, setSessionParticipated] = useState(true);
  const [sessionEndangered, setSessionEndangered] = useState(false);
  const [sessionGoalFulfilled, setSessionGoalFulfilled] = useState(false);



  // Init Auth State
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDocRef = doc(db!, "saves", `gloam_${u.uid}`);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const cloudData = snap.data();
            if (cloudData && cloudData["gloam_rpg_state"]) {
              const parsed = JSON.parse(cloudData["gloam_rpg_state"]);
              const sanitized = sanitizeGameState(parsed);
              const localStr = localStorage.getItem("gloam_rpg_state");
              if (localStr) {
                const localParsed = JSON.parse(localStr);
                const isLocalDefault = !localParsed.character?.name || localParsed.character.name === "알릭 (Alaric)";
                if (isLocalDefault || confirm("구글 클라우드 백업 데이터를 발견했습니다. 불러오시겠습니까?")) {
                  setState(sanitized);
                  localStorage.setItem("gloam_rpg_state", JSON.stringify(sanitized));
                }
              } else {
                setState(sanitized);
                localStorage.setItem("gloam_rpg_state", JSON.stringify(sanitized));
              }
            }
          }
        } catch (err) {
          console.error("Failed to check cloud save during login:", err);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Load Initial State
  useEffect(() => {
    const loadState = async () => {
      preloadAllTarotImages();
      const loaded = await store.load("gloam_rpg_state", null);
      const sanitized = sanitizeGameState(loaded);
      setState(sanitized);
      setLoading(false);
    };
    loadState();
  }, []);

  // Safe State Updater
  const updateState = (updater: (prev: GameState) => GameState) => {
    setState(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      store.set("gloam_rpg_state", next);
      return next;
    });
  };

  // Google Login / Logout
  const handleSignIn = async () => {
    if (!auth || !googleProvider) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      alert("로그인 중 에러가 발생했습니다: " + e.message);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    if (confirm("로그아웃 하시겠습니까?")) {
      try {
        await signOut(auth);
        const loaded = await store.load("gloam_rpg_state", null);
        const sanitized = sanitizeGameState(loaded);
        setState(sanitized);
      } catch (e: any) {
        console.error("Sign-out error:", e);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm("⚠️ 경고: 정말 캐릭터 정보 및 지도를 포함한 모든 진행상황을 초기화하고 새로 시작하겠습니까?")) {
      updateState(() => ({
        ...INITIAL_STATE,
        playerDeck: createPlayerDeck(),
        refereeDeck: createRefereeDeck(),
        hand: [],
        journals: [{ id: "1", text: "새로운 글롬 탐험을 시작한다. 황혼의 맹세를 되새기며.", date: new Date().toLocaleString() }]
      }));
      setActiveTab("dashboard");
    }
  };

  // Calculate dynamic character parameters based on wounds
  const getDynamicAttributes = (char: Character) => {
    // Torso wound = -3 penalty to all tests
    const testPenalty = char.wounds.torso ? -3 : 0;
    
    // Legs wound = -2 Speed per leg. Base speed is Coins stat.
    const legWoundsCount = (char.wounds.lLeg ? 1 : 0) + (char.wounds.rLeg ? 1 : 0);
    const speed = Math.max(0, char.stats.coins - 2 * legWoundsCount);

    // Max carry capacity is 10 + Coins (up to Coins = 4, capped at 14)
    const carryCapacity = Math.min(14, 10 + char.stats.coins);

    // Vocation mapping based on stat value 4 - keep user-chosen vocation
    let detectedVocation = char.vocation || "방랑기사 (Knight-Errant)";

    return { testPenalty, speed, carryCapacity, detectedVocation };
  };

  if (loading || !state) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">🔮</div>
        <h2>Gloam Companion Loading...</h2>
        <p>황혼의 카드들을 정비하는 중...</p>
      </div>
    );
  }

  const { testPenalty, speed, carryCapacity, detectedVocation } = getDynamicAttributes(state.character);

  // =================================================================
  // CORE FUNCTIONS
  // =================================================================
  const drawCardForPlayer = (count: number = 1) => {
    updateState(s => {
      let deck = [...s.playerDeck];
      let discard = [...s.playerDiscard];
      let hand = [...s.hand];
      let hasFool = false;

      for (let i = 0; i < count; i++) {
        if (deck.length === 0) {
          if (discard.length === 0) break; // no cards at all
          deck = shuffle(discard);
          discard = [];
        }
        const card = deck.shift();
        if (card) {
          const isReversed = Math.random() < 0.25;
          hand.push({ ...card, reversed: isReversed });
          if (card.type === "major" && card.card === "0") {
            hasFool = true;
          }
        }
      }

      if (hasFool) {
        setTimeout(() => {
          alert("🔄 플레이어 손패 보충 중 광대(The Fool)가 드로우되었습니다! 모든 손패를 회수하고 양쪽 덱 전체를 새로 섞습니다.");
        }, 50);

        const playerMap = new Map<string, Card>();
        [
          ...deck,
          ...discard,
          ...hand,
          ...(s.playerInitiativeCard ? [s.playerInitiativeCard] : [])
        ].forEach(c => {
          playerMap.set(getCardIdentity(c), { ...c, reversed: false });
        });

        const refereeMap = new Map<string, Card>();
        [
          ...s.refereeDeck,
          ...s.refereeDiscard,
          ...s.combatMonsters.map(m => m.initiativeCard).filter((c): c is Card => !!c)
        ].forEach(c => {
          refereeMap.set(getCardIdentity(c), { ...c, reversed: false });
        });

        return {
          ...s,
          playerDeck: shuffle(Array.from(playerMap.values())),
          playerDiscard: [],
          refereeDeck: shuffle(Array.from(refereeMap.values())),
          refereeDiscard: [],
          hand: [],
          playerInitiativeCard: null,
          combatMonsters: s.combatMonsters.map(m => ({ ...m, initiativeCard: undefined })),
          lastDrawnOracleCardValue: null,
          journals: [
            {
              id: generateUniqueId(),
              text: `[광대의 대가] 드로우 도중 광대(The Fool)가 드로우되어 모든 덱 전체 셔플 및 손패가 초기화되었습니다.`,
              date: new Date().toLocaleString(),
              day: s.day,
              watch: s.watch,
              pinned: false,
              isThematic: true,
              systemLog: `[드로우 중 광대 격발] 모든 손패 회수 및 덱 셔플`
            },
            ...s.journals
          ]
        };
      }

      return {
        ...s,
        playerDeck: deck,
        playerDiscard: discard,
        hand
      };
    });
  };

  const playCardFromHand = (idx: number, purpose: string) => {
    updateState(s => {
      const card = s.hand[idx];
      const nextHand = s.hand.filter((_, i) => i !== idx);
      const nextDiscard = [...s.playerDiscard, card];
      const cardName = getCardDisplayName(card);
      
      const thematicText = getThematicLogText("card_play", { cardName, purpose });
      const systemLog = `[카드 사용] 손패에서 ${cardName} 카드를 '${purpose}' 목적을 위해 제출했습니다.`;

      const x = selectedMapCellIdx !== null ? (selectedMapCellIdx % 4) : null;
      const y = selectedMapCellIdx !== null ? Math.floor(selectedMapCellIdx / 4) : null;

      return {
        ...s,
        hand: nextHand,
        playerDiscard: nextDiscard,
        journals: [
          {
            id: generateUniqueId(),
            text: thematicText,
            date: new Date().toLocaleString(),
            day: s.day,
            watch: s.watch,
            x,
            y,
            pinned: false,
            isThematic: true,
            systemLog
          },
          ...s.journals
        ]
      };
    });
  };

  const playCardAsPlayerInitiative = (idx: number) => {
    updateState(s => {
      const card = s.hand[idx];
      if (!card) {
        alert("선제권으로 제시할 손패 카드가 없습니다.");
        return s;
      }
      if (s.playerInitiativeCard) {
        alert("이번 라운드의 플레이어 선제권은 이미 정해졌습니다. 다음 라운드까지 변경할 수 없습니다.");
        return s;
      }
      const nextHand = s.hand.filter((_, i) => i !== idx);
      const cardName = getCardDisplayName(card);
      const isFool = card.type === "major" && card.card === "0";

      const thematicText = getThematicLogText("combat_initiative", { cardName });
      const systemLog = isFool
        ? `[선제권 결정] 손패에서 광대(The Fool)를 선제권 0으로 제시했습니다. 라운드 종료 시 광대 규칙에 따라 양쪽 덱을 회수해 섞습니다.`
        : `[선제권 결정] 손패에서 ${cardName} 카드를 이번 라운드 선제권으로 제시했습니다.`;

      const x = selectedMapCellIdx !== null ? (selectedMapCellIdx % 4) : null;
      const y = selectedMapCellIdx !== null ? Math.floor(selectedMapCellIdx / 4) : null;

      return {
        ...s,
        hand: nextHand,
        playerInitiativeCard: card,
        journals: [
          {
            id: generateUniqueId(),
            text: thematicText,
            date: new Date().toLocaleString(),
            day: s.day,
            watch: s.watch,
            x,
            y,
            pinned: false,
            isThematic: true,
            systemLog
          },
          ...s.journals
        ]
      };
    });
  };

  const startNextRound = () => {
    updateState(s => {
      if (s.combatMonsters.length === 0) {
        alert("전투 중인 몬스터가 없어 라운드를 진행할 수 없습니다.");
        return s;
      }
      const unresolved: string[] = [];
      if (!s.playerInitiativeCard) unresolved.push("플레이어 선제권");
      s.combatMonsters.forEach(mon => {
        if (!mon.initiativeCard) unresolved.push(`${mon.name} 선제권`);
      });
      if (unresolved.length > 0) {
        alert(`라운드를 넘길 수 없습니다. 미해결 항목: ${unresolved.join(", ")}`);
        return s;
      }

      const monsterInitiativeCards = s.combatMonsters
        .map(mon => mon.initiativeCard)
        .filter((card): card is Card => !!card);
      // Clear monster initiative cards
      const nextMonsters = s.combatMonsters.map(mon => ({
        ...mon,
        initiativeCard: undefined
      }));

      // Gather current discard pile
      let nextDiscard = [...s.playerDiscard];
      if (s.playerInitiativeCard) {
        nextDiscard.push(s.playerInitiativeCard);
      }

      // Check if The Fool is in the discard pile (was used this round)
      const triggerFoolReshuffle = nextDiscard.some(c => c.type === "major" && c.card === "0");

      const x = selectedMapCellIdx !== null ? (selectedMapCellIdx % 4) : null;
      const y = selectedMapCellIdx !== null ? Math.floor(selectedMapCellIdx / 4) : null;

      if (triggerFoolReshuffle) {
        setTimeout(() => {
          alert("🔄 이번 라운드 중 광대(The Fool) 카드가 소모되었습니다! 라운드 종료 규칙에 따라 모든 손패를 버리고 양쪽 덱 전체를 새로 섞습니다.");
        }, 50);

        const thematicText = `[광대의 대가] 광대(The Fool)의 장난이 끝나고 흩어진 힘을 수습합니다. (모든 덱 전체 셔플 및 손패 초기화)`;
        const systemLog = `[전투 라운드 종료] 광대(The Fool) 카드 발동으로 인한 덱 셔플 및 초기화 (라운드 ${s.combatRound} → ${s.combatRound + 1})`;

        const playerMap = new Map<string, Card>();
        [
          ...s.playerDeck,
          ...nextDiscard,
          ...s.hand
        ].forEach(c => {
          playerMap.set(getCardIdentity(c), { ...c, reversed: false });
        });

        const refereeMap = new Map<string, Card>();
        [
          ...s.refereeDeck,
          ...s.refereeDiscard,
          ...monsterInitiativeCards
        ].forEach(c => {
          refereeMap.set(getCardIdentity(c), { ...c, reversed: false });
        });

        return {
          ...s,
          combatRound: s.combatRound + 1,
          combatMonsters: nextMonsters,
          playerDeck: shuffle(Array.from(playerMap.values())),
          playerDiscard: [],
          refereeDeck: shuffle(Array.from(refereeMap.values())),
          refereeDiscard: [],
          hand: [],
          playerInitiativeCard: null,
          lastDrawnOracleCardValue: null,
          journals: [
            {
              id: generateUniqueId(),
              text: thematicText,
              date: new Date().toLocaleString(),
              day: s.day,
              watch: s.watch,
              x,
              y,
              pinned: false,
              isThematic: true,
              systemLog
            },
            ...s.journals
          ]
        };
      }

      // Standard end of round: refill hand back to 4 cards
      let deck = [...s.playerDeck];
      let discard = nextDiscard;
      let hand = [...s.hand];
      let hasFool = false;

      while (hand.length < 4) {
        if (deck.length === 0) {
          if (discard.length === 0) break;
          deck = shuffle(discard);
          discard = [];
        }
        const c = deck.shift();
        if (c) {
          const isReversed = Math.random() < 0.25;
          hand.push({ ...c, reversed: isReversed });
          if (c.type === "major" && c.card === "0") {
            hasFool = true;
          }
        }
      }

      if (hasFool) {
        setTimeout(() => {
          alert("🔄 플레이어 손패 보충 중 광대(The Fool)가 드로우되었습니다! 모든 손패를 회수하고 양쪽 덱 전체를 새로 섞습니다.");
        }, 50);

        const playerMap = new Map<string, Card>();
        [
          ...deck,
          ...discard,
          ...hand
        ].forEach(c => {
          playerMap.set(getCardIdentity(c), { ...c, reversed: false });
        });

        const refereeMap = new Map<string, Card>();
        [
          ...s.refereeDeck,
          ...s.refereeDiscard,
          ...monsterInitiativeCards
        ].forEach(c => {
          refereeMap.set(getCardIdentity(c), { ...c, reversed: false });
        });

        return {
          ...s,
          combatRound: s.combatRound + 1,
          combatMonsters: nextMonsters,
          playerDeck: shuffle(Array.from(playerMap.values())),
          playerDiscard: [],
          refereeDeck: shuffle(Array.from(refereeMap.values())),
          refereeDiscard: [],
          hand: [],
          playerInitiativeCard: null,
          lastDrawnOracleCardValue: null,
          journals: [
            {
              id: generateUniqueId(),
              text: `[광대의 대가] 손패를 보충하는 도중 광대(The Fool)가 드로우되어 모든 덱 전체 셔플 및 손패가 초기화되었습니다.`,
              date: new Date().toLocaleString(),
              day: s.day,
              watch: s.watch,
              x,
              y,
              pinned: false,
              isThematic: true,
              systemLog: `[손패 보충 중 광대 격발] 모든 손패 회수 및 덱 셔플`
            },
            ...s.journals
          ]
        };
      }

      const thematicText = `[라운드 전열 재정비] 전열을 가다듬으며 다음 전술 행동을 구상합니다. (라운드 ${s.combatRound} → ${s.combatRound + 1})`;
      const systemLog = `[라운드 전환] 다음 라운드를 시작합니다 (라운드 ${s.combatRound} → ${s.combatRound + 1}, 손패 4장 보충 완료)`;

      return {
        ...s,
        combatRound: s.combatRound + 1,
        combatMonsters: nextMonsters,
        playerDeck: deck,
        playerDiscard: discard,
        refereeDiscard: appendUniqueCards(s.refereeDiscard, monsterInitiativeCards),
        hand,
        playerInitiativeCard: null,
        journals: [
          {
            id: generateUniqueId(),
            text: thematicText,
            date: new Date().toLocaleString(),
            day: s.day,
            watch: s.watch,
            x,
            y,
            pinned: false,
            isThematic: true,
            systemLog
          },
          ...s.journals
        ]
      };
    });
  };

  const endCombat = () => {
    updateState(s => {
      let nextDiscard = [...s.playerDiscard];
      if (s.playerInitiativeCard) {
        nextDiscard.push(s.playerInitiativeCard);
      }
      const nextRefereeDiscard = appendUniqueCards(
        s.refereeDiscard,
        s.combatMonsters
          .map(mon => mon.initiativeCard)
          .filter((card): card is Card => !!card)
      );
      
      const triggerFoolReshuffle = nextDiscard.some(c => c.type === "major" && c.card === "0");

      const x = selectedMapCellIdx !== null ? (selectedMapCellIdx % 4) : null;
      const y = selectedMapCellIdx !== null ? Math.floor(selectedMapCellIdx / 4) : null;

      // Chronicle analysis
      const monsters = s.combatMonsters;
      const monsterNames = monsters.map(m => m.name).join(", ");
      const hasBoss = monsters.some(m => {
        const ref = BESTIARY.find(b => b.name === m.name);
        return ref && ref.stat >= 8;
      });
      const hasMajor = monsters.some(m => {
        const ref = BESTIARY.find(b => b.name === m.name);
        return ref && ref.stat >= 4 && ref.stat < 8;
      });
      const isFirstVictory = !s.journals.some(j => j.chronicleCategory === "first_victory");

      let chronicleCategory: string | undefined = undefined;
      let chronicleIcon: string | undefined = undefined;
      let chronicleText = "";

      if (hasBoss) {
        chronicleCategory = "boss_slain";
        chronicleIcon = "💀";
        chronicleText = `💀 [보스 처치] 황혼의 가장 강력하고 무시무시한 존재인 [${monsterNames}]과의 목숨을 건 사투 끝에 승리를 거두었습니다!`;
      } else if (hasMajor) {
        chronicleCategory = "major_foe_defeat";
        chronicleIcon = "👾";
        chronicleText = `👾 [주요 적 격퇴] 위협적인 적 [${monsterNames}]의 포악한 공세를 꺾고 승리를 쟁취했습니다.`;
      } else if (isFirstVictory) {
        chronicleCategory = "first_victory";
        chronicleIcon = "⚔️";
        chronicleText = `⚔️ [첫 전투 승리] 전장에 울려 퍼진 첫 번째 혈전에서 [${monsterNames}] 무리를 물리치고 첫 승리를 선포합니다!`;
      }

      const isChronicle = !!chronicleCategory;

      if (triggerFoolReshuffle) {
        setTimeout(() => {
          alert("🔄 이번 전투 중 광대(The Fool) 카드가 소모되었습니다! 라운드 종료 규칙에 따라 모든 손패를 버리고 양쪽 덱 전체를 새로 섞습니다.");
        }, 50);

        const thematicText = isChronicle ? chronicleText : `[전투 종결 및 소집] 승리의 검을 거두지만, 광대의 마법이 덱을 헤집어 놓아 덱을 소집합니다.`;
        const systemLog = `[전투 종료] 광대(The Fool) 카드 소모로 인한 덱 전체 셔플 초기화`;

        const playerMap = new Map<string, Card>();
        [
          ...s.playerDeck,
          ...nextDiscard,
          ...s.hand
        ].forEach(c => {
          playerMap.set(getCardIdentity(c), { ...c, reversed: false });
        });

        const refereeMap = new Map<string, Card>();
        [
          ...s.refereeDeck,
          ...nextRefereeDiscard
        ].forEach(c => {
          refereeMap.set(getCardIdentity(c), { ...c, reversed: false });
        });

        return {
          ...s,
          combatRound: 1,
          combatMonsters: [],
          playerDeck: shuffle(Array.from(playerMap.values())),
          playerDiscard: [],
          refereeDeck: shuffle(Array.from(refereeMap.values())),
          refereeDiscard: [],
          hand: [],
          playerInitiativeCard: null,
          lastDrawnOracleCardValue: null,
          journals: [
            {
              id: generateUniqueId(),
              text: thematicText,
              date: new Date().toLocaleString(),
              day: s.day,
              watch: s.watch,
              x,
              y,
              pinned: isChronicle,
              isThematic: true,
              systemLog,
              systemGenerated: true,
              chronicle: isChronicle,
              chronicleCategory,
              chronicleIcon
            },
            ...s.journals
          ]
        };
      }

      const thematicText = isChronicle ? chronicleText : `[전투 종결] 적들의 숨통이 끊어지거나 어둠 너머로 퇴각했습니다. 무기를 거두고 호흡을 고릅니다.`;
      const systemLog = `[전투 종료] 전투가 격파/종료되었습니다.`;

      return {
        ...s,
        combatRound: 1,
        combatMonsters: [],
        playerDiscard: nextDiscard,
        refereeDiscard: nextRefereeDiscard,
        playerInitiativeCard: null,
        journals: [
          {
            id: generateUniqueId(),
            text: thematicText,
            date: new Date().toLocaleString(),
            day: s.day,
            watch: s.watch,
            x,
            y,
            pinned: isChronicle,
            isThematic: true,
            systemLog,
            systemGenerated: true,
            chronicle: isChronicle,
            chronicleCategory,
            chronicleIcon
          },
          ...s.journals
        ]
      };
    });
  };

  const drawRefereeCard = (onDraw: (card: Card) => void) => {
    let cardDrawn: Card | null = null;
    updateState(s => {
      let deck = [...s.refereeDeck];
      let discard = [...s.refereeDiscard];

      if (deck.length === 0) {
        if (discard.length === 0) return s; // empty
        deck = shuffle(discard);
        discard = [];
      }
      const c = deck.shift();
      if (c) {
        cardDrawn = { ...c, reversed: Math.random() < 0.25 };
        discard.push(cardDrawn);
      }

      return {
        ...s,
        refereeDeck: deck,
        refereeDiscard: discard
      };
    });
    if (cardDrawn) {
      onDraw(cardDrawn);
    }
  };

  const assignMonsterInitiative = (monsterInstanceId: string) => {
    updateState(s => {
      const monsterIndex = s.combatMonsters.findIndex(mon => mon.id === monsterInstanceId);
      if (monsterIndex === -1) return s;
      if (s.combatMonsters[monsterIndex].initiativeCard) {
        alert("이번 라운드의 몬스터 선제권은 이미 정해졌습니다. 다음 라운드까지 다시 뽑을 수 없습니다.");
        return s;
      }

      let deck = [...s.refereeDeck];
      let discard = [...s.refereeDiscard];
      if (deck.length === 0) {
        if (discard.length === 0) {
          alert("레프리 덱에 뽑을 카드가 없습니다.");
          return s;
        }
        deck = shuffle(discard);
        discard = [];
      }

      const c = deck.shift();
      if (!c) return s;
      const cardDrawn = { ...c, reversed: Math.random() < 0.25 };
      const nextMonsters = [...s.combatMonsters];
      nextMonsters[monsterIndex] = {
        ...nextMonsters[monsterIndex],
        initiativeCard: cardDrawn
      };

      return {
        ...s,
        refereeDeck: deck,
        refereeDiscard: discard,
        combatMonsters: nextMonsters
      };
    });
  };

  const drawPlayerCard = (purpose: string = "oracle"): Card | null => {
    let cardDrawn: Card | null = null;
    updateState(s => {
      let deck = [...s.playerDeck];
      let discard = [...s.playerDiscard];
      if (deck.length === 0) {
        if (discard.length === 0) return s;
        deck = shuffle(discard);
        discard = [];
      }
      const c = deck.shift();
      if (c) {
        cardDrawn = { ...c, reversed: Math.random() < 0.25 };
        discard.push(cardDrawn);
      }
      return { ...s, playerDeck: deck, playerDiscard: discard };
    });

    if (cardDrawn) {
      const card = cardDrawn as Card;
      if (card.type === "major" && card.card === "0") {
        setTimeout(() => {
          alert("🔄 플레이어 덱에서 광대(The Fool)가 드로우되었습니다! 규칙에 따라 모든 손패를 회수하고 양쪽 덱 전체를 새로 섞습니다.");
          reshuffleAllDecks();
        }, 50);
        if (purpose === "carousing" || purpose === "spell" || purpose === "magick" || purpose === "lifepath") {
          return card;
        }
        return null;
      }

      if (purpose === "oracle") {
        const lastVal = state?.lastDrawnOracleCardValue;
        const currentVal = card.card;

        updateState(s => {
          const nextJournals = [...s.journals];
          if (lastVal === currentVal) {
            nextJournals.unshift({
              id: generateUniqueId(),
              text: `[⚠️ 차원 왜곡] 오라클 카드 연속 동일 값 드로우 (${currentVal})! 돌발 사건(Event Deck) 격발이 필요합니다.`,
              date: new Date().toLocaleString()
            });
          }
          return {
            ...s,
            lastDrawnOracleCardValue: currentVal,
            journals: nextJournals
          };
        });

        if (lastVal === currentVal) {
          setTimeout(() => {
            alert(`⚠️ 연속으로 동일한 카드 값 '${currentVal}'이 드로우되었습니다!\n룰북 규칙에 따라 즉시 돌발 사건 덱(Event Deck)에서 이벤트를 한 장 격발 처리하십시오.`);
          }, 80);
        }
      }

      return card;
    }
    return null;
  };

  const reshuffleAllDecks = () => {
    updateState(s => {
      const playerMap = new Map<string, Card>();
      [
        ...s.playerDeck,
        ...s.playerDiscard,
        ...s.hand,
        ...(s.playerInitiativeCard ? [s.playerInitiativeCard] : [])
      ].forEach(c => {
        playerMap.set(getCardIdentity(c), { ...c, reversed: false });
      });

      const refereeMap = new Map<string, Card>();
      [
        ...s.refereeDeck,
        ...s.refereeDiscard,
        ...s.combatMonsters.map(m => m.initiativeCard).filter((c): c is Card => !!c)
      ].forEach(c => {
        refereeMap.set(getCardIdentity(c), { ...c, reversed: false });
      });

      return {
        ...s,
        playerDeck: shuffle(Array.from(playerMap.values())),
        playerDiscard: [],
        refereeDeck: shuffle(Array.from(refereeMap.values())),
        refereeDiscard: [],
        hand: [],
        playerInitiativeCard: null,
        combatMonsters: s.combatMonsters.map(m => ({ ...m, initiativeCard: undefined })),
        lastDrawnOracleCardValue: null
      };
    });
    alert("🔄 덱 전체가 소집되었습니다! 플레이어 덱과 레프리 덱의 버린 카드 더미, 손패, 선제권 카드를 모두 모아 새로 섞었습니다.");
  };

  // Yes/No oracle logic
  const rollYesNoOracle = () => {
    const card = drawPlayerCard("oracle");
    if (!card) return;

    setDrawnOracleCard(card);
    const val = card.card;
    if (val === "A") {
      setOracleYesNo("극단적인 운명 (Extreme)! [1장을 즉시 새로 뽑아 상황을 더 깊게 전개해 보십시오.]");
    } else if (["3", "5", "7", "9"].includes(val)) {
      setOracleYesNo("아니오 (No)");
    } else if (["2", "4", "6", "8", "10"].includes(val)) {
      setOracleYesNo("예 (Yes)");
    } else if (["Page", "Knight"].includes(val)) {
      setOracleYesNo("아니오, 그러나... (No, but...)");
    } else if (["Queen", "King"].includes(val)) {
      setOracleYesNo("예, 하지만... (Yes, but...)");
    } else {
      setOracleYesNo("알 수 없음");
    }
    setOracleAmount(null);
    setOracleActionSubject(null);
  };

  // Amount oracle logic
  const rollAmountOracle = () => {
    const card = drawPlayerCard("oracle");
    if (!card) return;

    setDrawnOracleCard(card);
    const val = card.card;
    if (val === "A") {
      setOracleAmount("도를 지나치게 압도적인 스케일 (Excessive!)");
    } else if (["2", "3", "4", "5"].includes(val)) {
      setOracleAmount("미미함 / 거의 없음 (None)");
    } else if (["6", "7", "8", "9", "10"].includes(val)) {
      setOracleAmount("무난하고 평범한 정도 (Average)");
    } else if (["Page", "Knight", "Queen", "King"].includes(val)) {
      setOracleAmount("상당히 막대함 (Considerable)");
    } else {
      setOracleAmount("보통 수준");
    }
    setOracleYesNo(null);
    setOracleActionSubject(null);
  };

  // Action-Subject Oracle
  const rollActionSubjectOracle = () => {
    const card1 = drawPlayerCard("oracle");
    if (!card1) return;

    let refereeCard: Card | null = null;
    updateState(s => {
      let rDeck = [...s.refereeDeck];
      let rDiscard = [...s.refereeDiscard];
      if (rDeck.length === 0) {
        if (rDiscard.length === 0) return s;
        rDeck = shuffle(rDiscard);
        rDiscard = [];
      }
      const c2 = rDeck.shift();
      if (c2) {
        refereeCard = { ...c2, reversed: Math.random() < 0.25 };
        rDiscard.push(refereeCard);
      }
      return { ...s, refereeDeck: rDeck, refereeDiscard: rDiscard };
    });

    if (card1 && refereeCard) {
      const card2 = refereeCard as Card;

      // Extract Action
      let actionText = "임의의 조치";
      if (card1.type === "minor" && card1.suit) {
        const val = card1.card;
        const suitMap = ORACLE_SUITS[card1.suit === "coins" ? "Coins" : card1.suit === "wands" ? "Wands" : card1.suit === "swords" ? "Swords" : "Cups"];
        if (suitMap && (suitMap as any)[val]) {
          actionText = (suitMap as any)[val];
        }
      }

      // Extract Subject
      let subjectText = "미지의 대상";
      const majorInfo = ORACLE_SUBJECTS[card2.card];
      if (majorInfo) {
        subjectText = card2.reversed ? `${majorInfo.name}의 역방향 (${majorInfo.reversed})` : `${majorInfo.name} (${majorInfo.meaning})`;
      }

      setOracleActionSubject({
        action: actionText,
        subject: subjectText,
        card1,
        card2
      });
      setDrawnOracleCard(null);
      setOracleYesNo(null);
      setOracleAmount(null);
    }
  };

  // =================================================================
  // GENERAL TEST ROLLER FUNCTIONS
  // =================================================================
  const resetTestState = () => {
    setTestStat("none");
    setTestMod(0);
    setTestOppMonsterId("none");
    setTestCustomOppPenalty(0);
    setTestHelpStat(0);
    setTestPurpose("");
    setTestDrawnCards([]);
    setTestPushed(false);
    setTestStatus("idle");
    setTestCurrentTotal(0);
    setTestResolveSpent(0);
    setTestFriendBonus(0);
  };

  const prepareSpellCast = (spellName: string) => {
    resetTestState();
    setTestStat("wands");
    setTestPurpose(`주문 시전: ${spellName}`);
    setActiveTab("dashboard");
    alert(`⚡ 비술 마법 주문 [${spellName}] 시전 판정이 대시보드 테스트 영역에 설정되었습니다.\n완드(Wands) 판정(난이도 14)이 진행됩니다. 필요에 따라 모디파이어를 입력한 후 판정을 치르십시오.`);
  };

  const hasFoeInSelectedCell = (): boolean => {
    const selectedIdx = state?.selectedMapCellIdx;
    if (selectedIdx === null || selectedIdx === undefined) return false;
    const cell = state.mapGrid[selectedIdx];
    if (!cell) return false;
    
    const cellJournals = state.journals.filter(j => j.x === cell.x && j.y === cell.y);
    let foundFoe = false;
    cellJournals.forEach(j => {
      const combinedText = `${j.text} ${j.systemLog || ""}`.toLowerCase();
      (state.character.foes || []).forEach(foe => {
        if (foe.name && combinedText.includes(foe.name.toLowerCase())) {
          foundFoe = true;
        }
      });
    });
    return foundFoe;
  };

  const getFoePenalty = (): number => {
    return hasFoeInSelectedCell() ? -2 : 0;
  };

  const rollGeneralTest = () => {
    if (state.combatMonsters.length > 0) {
      alert("⚔️ 전투가 진행 중일 때는 일반 판정 및 푸시를 진행할 수 없습니다.\n전투 탭에서 전투 주도권 및 액션 판정을 진행해 주십시오.");
      return;
    }
    let statVal = 0;
    if (testStat !== "none" && state?.character?.stats) {
      statVal = (state.character.stats as any)[testStat] || 0;
    }

    let oppPenalty = 0;
    if (testOppMonsterId === "custom") {
      oppPenalty = testCustomOppPenalty;
    } else if (testOppMonsterId !== "none") {
      const mon = BESTIARY.find(m => m.id === parseInt(testOppMonsterId));
      if (mon) oppPenalty = mon.stat;
    }

    const card = drawPlayerCard("test");
    if (!card) {
      resetTestState();
      return;
    }

    const cardVal = getCardNumericValue(card);

    const friendBonus = state.activeFriendAid?.type === "bonus" ? 2 : 0;
    const foePenalty = getFoePenalty();

    const total = cardVal + statVal + testMod - oppPenalty + testHelpStat + testPenalty + friendBonus + foePenalty;
    const isSuccess = total >= 14;
    const isSuitMatch = card.suit === testStat;
    const isGreatSuccess = isSuccess && isSuitMatch;

    setTestDrawnCards([card]);
    setTestPushed(false);
    setTestCurrentTotal(total);
    setTestResolveSpent(0);
    setTestFriendBonus(friendBonus);

    if (state.activeFriendAid?.type === "bonus") {
      updateState(s => ({ ...s, activeFriendAid: null }));
    }

    if (isGreatSuccess) {
      setTestStatus("great_success");
    } else if (isSuccess) {
      setTestStatus("success");
    } else {
      setTestStatus("failed");
    }

    const statName = testStat === "cups" ? "Cups" : testStat === "swords" ? "Swords" : testStat === "coins" ? "Coins" : testStat === "wands" ? "Wands" : "None";
    const statusText = isGreatSuccess ? "극적 성공 (Great Success)" : isSuccess ? "성공 (Success)" : "실패 (Failure)";
    
    const friendText = friendBonus > 0 ? `, 친구원조: +2` : "";
    const foeText = foePenalty !== 0 ? `, 원수패널티: -2` : "";

    const logMsg = `[판정 - ${statName}] 목적: ${testPurpose || "일반 판정"} | 카드: ${getCardDisplayName(card)} (${cardVal}) | 합계: ${total} (스탯: ${statVal}, 모디파이어: ${testMod}, 대항패널티: -${oppPenalty}, 헬프: +${testHelpStat}, 부상패널티: ${testPenalty}${friendText}${foeText}) -> 결과: ${statusText}`;
    addJournalEntry(logMsg);
  };

  const pushGeneralTest = () => {
    if (state.combatMonsters.length > 0) {
      alert("⚔️ 전투가 진행 중일 때는 일반 판정 및 푸시를 진행할 수 없습니다.\n전투 탭에서 전투 주도권 및 액션 판정을 진행해 주십시오.");
      return;
    }
    if (testStatus !== "failed") return;

    const card = drawPlayerCard("test");
    if (!card) {
      resetTestState();
      return;
    }

    const cardVal = getCardNumericValue(card);

    let statVal = 0;
    if (testStat !== "none" && state?.character?.stats) {
      statVal = (state.character.stats as any)[testStat] || 0;
    }
    let oppPenalty = 0;
    if (testOppMonsterId === "custom") {
      oppPenalty = testCustomOppPenalty;
    } else if (testOppMonsterId !== "none") {
      const mon = BESTIARY.find(m => m.id === parseInt(testOppMonsterId));
      if (mon) oppPenalty = mon.stat;
    }

    const origCard = testDrawnCards[0];
    let origCardVal = 0;
    if (origCard) {
      if (origCard.card === "A") origCardVal = 1;
      else if (origCard.card === "Page") origCardVal = 11;
      else if (origCard.card === "Knight") origCardVal = 12;
      else if (origCard.card === "Queen") origCardVal = 13;
      else if (origCard.card === "King") origCardVal = 14;
      else origCardVal = parseInt(origCard.card) || 0;
    }

    const foePenalty = getFoePenalty();
    const total = origCardVal + cardVal + statVal + testMod - oppPenalty + testHelpStat + testPenalty + state.testFriendBonus + foePenalty;
    const isSuccess = total >= 14;

    setTestDrawnCards([...testDrawnCards, card]);
    setTestPushed(true);

    if (isSuccess) {
      setTestStatus("success");
      const logMsg = `[판정 푸시 성공] 추가 카드: ${getCardDisplayName(card)} (${cardVal}) | 합계: ${total} -> 결과: 성공 (Success)`;
      addJournalEntry(logMsg);
    } else {
      setTestStatus("great_failure");
      updateState(s => ({
        ...s,
        character: {
          ...s.character,
          resolve: Math.min(10, s.character.resolve + 1)
        }
      }));
      const logMsg = `[판정 푸시 대실패 - Great Failure] 추가 카드: ${getCardDisplayName(card)} (${cardVal}) | 합계: ${total} -> 결과: 대실패! (결의 +1 획득)`;
      addJournalEntry(logMsg);
      alert("💥 대실패 (Great Failure)!\n상황이 심각하게 꼬이지만, 극적인 시련으로 인해 결의(Resolve) 1점을 얻습니다.");
    }
  };

  const getItemSwordsRequirement = (itemName: string): number | null => {
    if (!itemName) return null;
    const cleanName = itemName.replace(/\(.*\)/, "").trim().toLowerCase();
    
    // Find in weapons
    const foundWeapon = WEAPONS.find(w => 
      w.name.toLowerCase() === cleanName || 
      w.nameKo.toLowerCase() === cleanName ||
      itemName.toLowerCase().includes(w.name.toLowerCase()) ||
      itemName.toLowerCase().includes(w.nameKo.toLowerCase())
    );
    if (foundWeapon) return foundWeapon.swordsReq;
    
    // Find in armor
    const foundArmor = ARMOR.find(a => 
      a.name.toLowerCase() === cleanName || 
      a.nameKo.toLowerCase() === cleanName ||
      itemName.toLowerCase().includes(a.name.toLowerCase()) ||
      itemName.toLowerCase().includes(a.nameKo.toLowerCase())
    );
    if (foundArmor) return foundArmor.swordsReq;
    
    return null;
  };

  // --- Downtime Helper Functions ---
  const getCarousingKey = (card: Card): string => {
    if (card.type === "major" && card.card === "0") return "Fool";
    if (card.card === "Page") return "P";
    if (card.card === "Knight") return "Kn";
    if (card.card === "Queen") return "Q";
    if (card.card === "King") return "K";
    return card.card;
  };

  const getLifepathEvent = (suit: string, val: string): string => {
    const s = suit.toLowerCase();
    const v = val;

    if (s === "cups") {
      if (["A", "2"].includes(v)) return "짧고 강렬한 로맨스 관계를 맺음 (Brief romantic relationship)";
      if (["3", "4"].includes(v)) return "어떤 집단이나 군중으로부터 신뢰를 잃고 눈 밖에 남 (Fell out of favor with a group)";
      if (["5", "6"].includes(v)) return "매우 매력적이고 유혹적인 일생일대의 기회를 스쳐 보냄 (Passed up an alluring opportunity)";
      if (["7", "8"].includes(v)) return "오랫동안 굳게 믿어왔던 가치관이나 사상에 환멸을 느낌 (Disillusioned of belief)";
      if (["9", "10"].includes(v)) return "고향과 완전히 단절된 아주 먼 타국 땅에서 거주함 (Lived in a far-off land)";
      if (v === "Page") return "가슴 깊이 품은 거대한 야망을 향해 헌신적으로 매진함 (Pursued an ambition)";
      if (v === "Knight") return "평생에 걸친 장기적이고 진지한 관계를 이어감 (Were in a long-term relationship)";
      if (v === "Queen") return "아프거나 불우한 누군가를 정성껏 보살피며 지냄 (Took care of someone)";
      if (v === "King") return "예술이나 기술 분야의 든든한 후원자를 만나 사사받음 (Mentored by a patron)";
    }
    if (s === "swords") {
      if (["A", "2"].includes(v)) return "뼈아프고 받아들이기 힘든 잔혹한 진실을 목격하고 깨달음 (Realized a difficult truth)";
      if (["3", "4"].includes(v)) return "곁에 있던 매우 소중하고 가까운 사람의 죽음을 애도함 (Mourned the loss of someone close)";
      if (["5", "6"].includes(v)) return "끔찍한 위험이나 참화가 닥친 구역에서 목숨 걸고 탈출함 (Fled from a dangerous situation)";
      if (["7", "8"].includes(v)) return "억울하거나 실제 지은 범죄로 인해 감옥에 투옥됨 (Imprisoned for a crime)";
      if (["9", "10"].includes(v)) return "가장 믿었던 가까운 동료나 친구에게 배신당함 (Betrayed by a friend)";
      if (v === "Page") return "돌이킬 수 없는 뼈아픈 실수로 막대한 대가를 치름 (Made a terrible mistake)";
      if (v === "Knight") return "싸움 끝에 누군가의 목숨을 빼앗아 손에 피를 묻힘 (Killed someone)";
      if (v === "Queen") return "세상과 인연을 끊고 한동안 어두운 곳에 은둔하며 지냄 (Withdrew from life)";
      if (v === "King") return "지독하게 몰입하는 치열한 학술적/지적 탐구를 완수함 (Embarked on intense intellectual study)";
    }
    if (s === "wands") {
      if (["A", "2"].includes(v)) return "생소한 외국어나 완전히 새로운 이색 기술을 습득함 (Learned a new skill/language)";
      if (["3", "4"].includes(v)) return "머나먼 미지의 땅으로 모험 가득한 기나긴 여정을 다녀옴 (Journey to a distant land)";
      if (["5", "6"].includes(v)) return "장인 길드나 비밀 결사 같은 조직에 정식 가입함 (Joined a group/guild)";
      if (["7", "8"].includes(v)) return "불가능해 보였던 거대한 난관이나 두려움을 극복해냄 (Overcame an obstacle)";
      if (["9", "10"].includes(v)) return "원치 않는 뜻밖의 무거운 짐이나 임무를 떠맡게 됨 (Received unexpected burden)";
      if (v === "Page") return "신비로운 모험이나 숭고한 퀘스트를 수행하러 떠남 (Went on adventure/quest)";
      if (v === "Knight") return "자연재해나 몬스터의 위협으로부터 마을 전체를 구해냄 (Saved a village from disaster)";
      if (v === "Queen") return "과거의 삶을 청산하고 완전히 새로운 커리어를 개척함 (Started a new career)";
      if (v === "King") return "집단의 존경을 받아 강력한 권위와 권력의 자리에 오름 (Achieved position of authority)";
    }
    if (s === "coins") {
      if (["A", "2"].includes(v)) return "척박하고 힘겨운 노동 환경에서 기나긴 하루를 묵묵히 버팀 (Worked hard days in a difficult job)";
      if (["3", "4"].includes(v)) return "일류 기술자 밑에서 도제 계약을 맺고 기술을 사사받음 (Apprenticed under a teacher)";
      if (["5", "6"].includes(v)) return "전 재산을 유실하고 완전히 빈털터리 방랑자 신세로 전락함 (Lost everything and became vagabond)";
      if (["7", "8"].includes(v)) return "특정 공예 기술이나 수련 분야를 마스터해 독자 영역을 개척함 (Mastered a craft/skill)";
      if (["9", "10"].includes(v)) return "큰 재물을 모아 여유롭고 호화로운 삶을 잠시 누림 (Achieved affluent lifestyle)";
      if (v === "Page") return "명성 높은 명문 아카데미나 학술 기관에 입학해 공부함 (Studied at prestigious academy)";
      if (v === "Knight") return "상업 거래망이나 핵심 비즈니스를 직접 총괄하여 운영함 (Oversaw business operation)";
      if (v === "Queen") return "아이를 품에 안고 헌신적으로 길러냄 (Raised a child)";
      if (v === "King") return "화려하지만 암투가 가득한 귀족 궁정에서 오랜 세월을 지냄 (Spent time in a noble court)";
    }
    return "알 수 없는 과거 행적 사건";
  };

  const getMajorCardIndex = (card: Card): number => {
    const romanToIdx: { [key: string]: number } = {
      "I": 0, "II": 1, "III": 2, "IV": 3, "V": 4, "VI": 5, "VII": 6, "VIII": 7, "IX": 8, "X": 9,
      "XI": 10, "XII": 11, "XIII": 12, "XIV": 13, "XV": 14, "XVI": 15, "XVII": 16, "XVIII": 17, "XIX": 18, "XX": 19, "XXI": 20
    };
    return romanToIdx[card.card] !== undefined ? romanToIdx[card.card] : 0;
  };

  const addHireling = () => {
    const cups = state?.character?.stats?.cups || 0;
    const currentCount = state?.character?.hirelings?.length || 0;
    if (currentCount >= cups) {
      alert(`고용 가능한 최대 용병 수에 도달했습니다! (현재 컵 능력치: ${cups}명 제한)\n컵(Cups) 능력치를 올리거나 기존 용병을 해고하십시오.`);
      return;
    }
    const name = prompt("용병 이름을 적으세요:");
    if (!name) return;
    const info = prompt("용병 세부 능력 또는 특징을 적으세요:");
    if (!info) return;
    
    updateState(s => ({
      ...s,
      character: {
        ...s.character,
        hirelings: [...(s.character.hirelings || []), { name, info }]
      }
    }));
  };

  const healWound = (partKey: "head" | "torso" | "lArm" | "rArm" | "lLeg" | "rLeg", partNameKo: string) => {
    if (confirm(`식사와 함께 하룻밤 야영 및 휴식(Rest & Recovery)을 진행하여 ${partNameKo}의 부상을 치유하시겠습니까?\n(시간이 다음 날 아침 제 1워치로 전진합니다.)`)) {
      const scar = prompt(
        `🩹 [부상 완치] 야영 휴식으로 ${partNameKo} 부위가 치유되었습니다.\n남겨진 흉터나 흔적을 기록하십시오 (취소 시 치유 취소, 입력 없이 확인 시 '휴식으로 치유됨'으로 저장):`
      );
      if (scar === null) return; // Cancel healing

      const dateStr = `제 ${state.day}일 제 ${state.watch}워치`;
      updateState(s => {
        const nextLogs = (s.character.injuryLogs || []).map(log => {
          if (log.location === partKey && !log.healed) {
            return {
              ...log,
              healed: true,
              dateHealed: dateStr,
              scarsNotes: scar.trim() || "휴식으로 완치됨"
            };
          }
          return log;
        });

        const cell = s.selectedMapCellIdx !== null ? s.mapGrid[s.selectedMapCellIdx] : null;
        return {
          ...s,
          day: s.day + 1,
          watch: 1,
          character: {
            ...s.character,
            wounds: {
              ...s.character.wounds,
              [partKey]: false
            },
            injuryLogs: nextLogs
          },
          journals: [
            {
              id: generateUniqueId(),
              text: `[야영 휴식 - ${partNameKo} 완치] 식사와 함께 편안한 휴식을 취해 부상을 치유했습니다. (흔적: ${scar.trim() || "치유됨"})`,
              date: new Date().toLocaleString(),
              day: s.day,
              watch: s.watch,
              x: cell ? cell.x : undefined,
              y: cell ? cell.y : undefined,
              chronicle: true,
              chronicleCategory: "campsite",
              chronicleIcon: "⛺"
            },
            ...s.journals
          ]
        };
      });
      alert(`${partNameKo}의 상처가 깨끗하게 치유되었습니다!`);
    }
  };

  const toggleWoundState = (partKey: "head" | "torso" | "lArm" | "rArm" | "lLeg" | "rLeg", currentVal: boolean, partNameKo: string) => {
    const nextVal = !currentVal;
    const dateStr = `제 ${state.day}일 제 ${state.watch}워치`;

    if (nextVal) {
      // 1. Check for available hirelings to absorb the wound
      const eligibleHirelings = (state.character.hirelings || []).filter(h => {
        const maxW = typeof h.maxWounds === 'number' ? h.maxWounds : 2;
        const wTaken = typeof h.woundsTaken === 'number' ? h.woundsTaken : 0;
        return wTaken < maxW;
      });

      let hirelingAbsorbed = false;
      let chosenHirelingIdx = -1;

      if (eligibleHirelings.length > 0) {
        if (eligibleHirelings.length === 1) {
          const singleH = eligibleHirelings[0];
          const confirmAbsorb = confirm(`🛡️ [용병 보호] 살아있는 용병 ${singleH.name || "이름 없음"}이(가) 있습니다.\n\n용병이 대신 상처를 입도록 하시겠습니까?\n(확인: 용병이 상처 대신 입음, 취소: 플레이어가 직접 상처 입음)`);
          if (confirmAbsorb) {
            hirelingAbsorbed = true;
            chosenHirelingIdx = state.character.hirelings.findIndex(h => h === singleH);
          }
        } else {
          const listText = eligibleHirelings.map((h, index) => {
            const maxW = typeof h.maxWounds === 'number' ? h.maxWounds : 2;
            const wTaken = typeof h.woundsTaken === 'number' ? h.woundsTaken : 0;
            return `${index + 1}. ${h.name || "이름 없음"} (부상: ${wTaken}/${maxW})`;
          }).join("\n");
          const input = prompt(`🛡️ [용병 보호] 당신 대신 상처를 입을 용병을 선택하십시오.\n\n${listText}\n\n대신 상처를 입을 용병의 번호(1~${eligibleHirelings.length})를 입력해 주십시오.\n(취소하거나 빈칸 확인 시 플레이어가 직접 상처를 입습니다):`);
          if (input !== null && input.trim() !== "") {
            const selectedIdx = parseInt(input.trim(), 10) - 1;
            if (selectedIdx >= 0 && selectedIdx < eligibleHirelings.length) {
              const selectedH = eligibleHirelings[selectedIdx];
              hirelingAbsorbed = true;
              chosenHirelingIdx = state.character.hirelings.findIndex(h => h === selectedH);
            } else {
              alert("올바르지 않은 번호 선택입니다. 플레이어가 직접 상처를 입습니다.");
            }
          }
        }
      }

      if (hirelingAbsorbed && chosenHirelingIdx !== -1) {
        updateState(s => {
          const newH = [...s.character.hirelings];
          const h = newH[chosenHirelingIdx];
          const cell = s.selectedMapCellIdx !== null ? s.mapGrid[s.selectedMapCellIdx] : null;
          const maxW = typeof h.maxWounds === 'number' ? h.maxWounds : 2;
          const currentWTaken = typeof h.woundsTaken === 'number' ? h.woundsTaken : 0;
          const nextWounds = currentWTaken + 1;
          const isDead = nextWounds >= maxW;
          if (isDead) {
            newH[chosenHirelingIdx] = { 
              ...h, 
              woundsTaken: nextWounds,
              deceased: true,
              deathDay: s.day,
              deathCell: { x: cell ? cell.x : 0, y: cell ? cell.y : 0 }
            };
          } else {
            newH[chosenHirelingIdx] = { ...h, woundsTaken: nextWounds };
          }
          let nextJournals = [...s.journals];

          // Add Chronicle / Journal for absorbing wound
          const absorbLogId = generateUniqueId();
          const absorbLogText = `🛡️ [용병 보호] 동료 용병 ${h.name || "이름 없음"}이(가) 방랑자 대신 ${partNameKo} 상처를 입었습니다. (용병 부상: ${nextWounds}/${maxW})`;
          
          nextJournals = [
            {
              id: absorbLogId,
              text: absorbLogText,
              date: new Date().toLocaleString(),
              day: s.day,
              watch: s.watch,
              pinned: true,
              systemGenerated: true,
              chronicle: true,
              chronicleCategory: "hireling_protection",
              chronicleIcon: "🛡️"
            },
            ...nextJournals
          ];

          if (isDead) {
            // Also add death chronicle entry if this killed the hireling!
            nextJournals = [
              {
                id: generateUniqueId(),
                text: `🕯 [용병 사망] 당신을 대신해 치명적인 상처를 입은 동료 용병 ${h.name || "이름 없음"}이(가) 끝내 목숨을 잃었습니다.`,
                date: new Date().toLocaleString(),
                day: s.day,
                watch: s.watch,
                pinned: true,
                systemGenerated: true,
                chronicle: true,
                chronicleCategory: "hireling_death",
                chronicleIcon: "🕯"
              },
              ...nextJournals
            ];
          }

          return {
            ...s,
            character: { ...s.character, hirelings: newH },
            journals: nextJournals
          };
        });
        alert(`용병이 대신 ${partNameKo} 상처를 입었습니다!`);
        return; // Don't proceed to assign wound to the player!
      }

      const desc = prompt(
        `🚨 [부상 기록] ${partNameKo} 부위에 어떤 부상을 입었습니까?\n원인이나 사건을 간략히 적어주십시오 (취소 시 부상 취소, 입력 없이 확인 시 '원인 불명 부상'으로 저장):`
      );
      if (desc === null) return; // Cancel

      updateState(s => {
        const isFirstInjury = !s.journals.some(j => j.chronicleCategory === "first_serious_injury");
        const category = isFirstInjury ? "first_serious_injury" : undefined;
        const icon = isFirstInjury ? "🩸" : undefined;
        const logText = isFirstInjury
          ? `🩸 [첫 중상] ${partNameKo} 부위에 심각한 부상을 입었습니다. (원인: ${desc.trim() || "원인 불명"})`
          : `🚨 [부상 획득 - ${partNameKo}] ${desc.trim() || "부상을 입었습니다."}`;

        return {
          ...s,
          character: {
            ...s.character,
            wounds: { ...s.character.wounds, [partKey]: true },
            injuryLogs: [
              ...(s.character.injuryLogs || []),
              {
                id: generateUniqueId(),
                location: partKey,
                injuryText: desc.trim() || "원인 불명의 부상",
                dateAcquired: dateStr,
                healed: false
              }
            ]
          },
          journals: [
            {
              id: generateUniqueId(),
              text: logText,
              date: new Date().toLocaleString(),
              day: s.day,
              watch: s.watch,
              pinned: isFirstInjury,
              systemGenerated: true,
              chronicle: isFirstInjury,
              chronicleCategory: category,
              chronicleIcon: icon
            },
            ...s.journals
          ]
        };
      });
    } else {
      const otherWounds = state.character.wounds;
      const allWounded = !!(otherWounds.head && otherWounds.torso && otherWounds.lArm && otherWounds.rArm && otherWounds.lLeg && otherWounds.rLeg);
      const isLethalTrigger = (partKey === "head") || (allWounded);

      let choice = "";
      if (isLethalTrigger) {
        choice = confirm(`💀 [치명적 부상 감지] ${partNameKo}에 이미 부상이 존재하며, 추가 부상을 입는 경우 캐릭터가 사망(두 번째 머리 부상)에 이르게 됩니다.\n\n추가 부상으로 인한 캐릭터 사망을 기록하시겠습니까?\n(확인: 사망 기록 등록, 취소: 일반 부상 정정/수동 치료 진행)`) ? "death" : "heal";
      } else {
        choice = confirm(`🩹 ${partNameKo} 부위의 부상을 수동으로 해제(치료)하시겠습니까?\n(확인: 부상 해제, 취소: 돌아가기)`) ? "heal" : "cancel";
      }

      if (choice === "death") {
        const deathNote = prompt("💀 방랑자의 죽음에 관한 경위나 마지막 기록을 적어주십시오:");
        updateState(s => ({
          ...s,
          journals: [
            {
              id: generateUniqueId(),
              text: `💀 [캐릭터 사망] ${partNameKo}에 치명적인 추가 부상을 입고 최후를 맞이했습니다. (경위: ${deathNote?.trim() || "기록 없음"})`,
              date: new Date().toLocaleString(),
              day: s.day,
              watch: s.watch,
              pinned: true,
              systemGenerated: true,
              chronicle: true,
              chronicleCategory: "character_death",
              chronicleIcon: "💀"
            },
            ...s.journals
          ]
        }));
        alert("방랑자의 사망이 연대기 및 일지에 기록되었습니다.");
        return;
      } else if (choice === "heal") {
        const scar = prompt(
          `🩹 [부상 완치/해제] ${partNameKo} 부위가 치료되었습니다.\n치유 흔적이나 치료 경위를 기록해 주십시오 (취소 시 취소, 입력 없이 확인 시 '부상 해제됨'으로 저장):`
        );
        if (scar === null) return;

        updateState(s => {
          const nextLogs = (s.character.injuryLogs || []).map(log => {
            if (log.location === partKey && !log.healed) {
              return {
                ...log,
                healed: true,
                dateHealed: dateStr,
                scarsNotes: scar.trim() || "부상 해제됨"
              };
            }
            return log;
          });

          return {
            ...s,
            character: {
              ...s.character,
              wounds: { ...s.character.wounds, [partKey]: false },
              injuryLogs: nextLogs
            },
            journals: [
              {
                id: generateUniqueId(),
                text: `[부상 치료 - ${partNameKo}] ${scar.trim() || "부상이 수동 치료되었습니다."}`,
                date: new Date().toLocaleString(),
                day: s.day,
                watch: s.watch
              },
              ...s.journals
            ]
          };
        });
      }
    }
  };

  const useFriendAid = (npcName: string) => {
    if (state.activeFriendAid !== null) {
      alert("⚠️ 이미 활성화된 친구의 원조 효과가 존재합니다. 현재 효과를 사용한 후 다시 시도해 주십시오.");
      return;
    }

    const lastUsedDay = state.usedFriendAids?.[npcName];
    if (lastUsedDay === state.day) {
      alert(`⚠️ ${npcName} 친구는 오늘 이미 도움을 주었습니다. 내일 다시 도움을 청할 수 있습니다.`);
      return;
    }

    const choice = confirm(`🤝 [친구의 원조 - ${npcName}]\n\n어떤 도움을 받으시겠습니까?\n\n[확인]: 다음 일반 판정에 +2 보너스 획득\n[취소]: 다음 일반 판정에서 결의 소모 1 감소 획득`);
    
    const aidType = choice ? "bonus" : "resolve_discount";
    const aidText = choice ? "일반 판정 +2 보너스" : "결의 소모 1 감소";

    updateState(s => ({
      ...s,
      activeFriendAid: {
        npcName,
        type: aidType
      },
      usedFriendAids: {
        ...(s.usedFriendAids || {}),
        [npcName]: s.day
      },
      journals: [
        {
          id: generateUniqueId(),
          text: `🤝 [친구의 도움] 현재 구역에 머물고 있는 친구 ${npcName}의 원조를 받았습니다. (효과: ${aidText})`,
          date: new Date().toLocaleString(),
          day: s.day,
          watch: s.watch,
          pinned: true,
          systemGenerated: true,
          chronicle: true,
          chronicleCategory: "friend_aid",
          chronicleIcon: "🤝"
        },
        ...s.journals
      ]
    }));

    alert(`🤝 ${npcName}의 도움이 활성화되었습니다: ${aidText}\n\n대시보드에서 다음 판정을 진행하십시오.`);
  };

  const rollMonsterMoraleTest = (monName: string, monStat: number) => {
    drawRefereeCard((card) => {
      const cardVal = getCardNumericValue(card);

      const total = cardVal + monStat;
      const success = total >= 14;
      const text = `[몬스터 사기 판정] ${monName} -> 난이도 14 | 판정합: ${total} (레프리 카드: ${getCardDisplayName(card)} + 몬스터 능력치: ${monStat}) -> 결과: ${success ? "성공 (사기 유지)" : "실패 (사기 꺾임/도망/항복)"}`;
      
      alert(text);
      updateState(s => ({
        ...s,
        journals: [
          {
            id: generateUniqueId(),
            text,
            date: new Date().toLocaleString()
          },
          ...s.journals
        ]
      }));
    });
  };

  const rollNpcReactionTest = (npcName: string) => {
    const statVal = state?.character?.stats?.cups || 0;
    const card = drawPlayerCard("reaction");
    if (!card) return;

    const cardVal = getCardNumericValue(card);

    const total = cardVal + statVal;
    const success = total >= 14;
    
    const outcomeText = success
      ? "우호적임 (Friendly/Helpful) - 협조적이거나 호의를 보입니다."
      : "비우호적임 (Hostile/Unfriendly) - 대화를 거부하거나 적대감을 드러냅니다.";
    
    const text = `[NPC 반응 판정] ${npcName} -> Cups 판정합: ${total} (플레이어 카드: ${getCardDisplayName(card)} + Cups: ${statVal}) -> 결과: ${outcomeText}`;
    alert(text);
    updateState(s => ({
      ...s,
      journals: [
        {
          id: generateUniqueId(),
          text,
          date: new Date().toLocaleString()
        },
        ...s.journals
      ]
    }));
  };

  // =================================================================
  // ALCHEMY & ARCANE SPELL FUNCTIONS
  // =================================================================
  const brewAlchemyPotion = () => {
    let potionName = "";
    if (brewingIngredient === "Basilisk Eyeball") potionName = "석화 물약 (Petrifying Potion)";
    else if (brewingIngredient === "Ghost Ectoplasm") potionName = "수면 안개 폭탄 (Sleep-smoke Bomb)";
    else if (brewingIngredient === "Troll Heart") potionName = "재생 물약 (Potion of Regeneration)";
    else if (brewingIngredient === "Barghest Fang") potionName = "사냥개 폼 영약 (Elixir of Hound-form)";
    else if (brewingIngredient === "Blood Asp Venom") potionName = "독가스 폭탄 (Poison Bomb)";
    else potionName = "미지의 연금 약품";

    const statVal = state?.character?.stats?.wands || 0;
    const card = drawPlayerCard("alchemy");
    if (!card) return;

    const cardVal = getCardNumericValue(card);

    const total = cardVal + statVal + testPenalty;
    const success = total >= 14;

    updateState(s => {
      let nextWatch = s.watch + 1;
      let nextDay = s.day;
      if (nextWatch > 3) {
        nextWatch = 1;
        nextDay += 1;
      }

      const nextBrewResult = {
        success,
        potionName,
        ingredient: brewingIngredient,
        total,
        card
      };
      
      const nextJournals = [
        {
          id: generateUniqueId(),
          text: `[연금술 제조] 재료: ${brewingIngredient} -> 완드 판정: ${total}점 (카드: ${getCardDisplayName(card)} + Wands: ${statVal}) -> 결과: ${success ? "성공 및 비약 생산" : "실패 및 재료 소실"} (시간 1 워치 경과: 제 ${nextDay}일 제 ${nextWatch}워치)`,
          date: new Date().toLocaleString()
        },
        ...s.journals
      ];

      return {
        ...s,
        day: nextDay,
        watch: nextWatch,
        alchemicalBrewResult: nextBrewResult,
        journals: nextJournals
      };
    });
  };

  const addBrewResultToInventory = () => {
    if (!state?.alchemicalBrewResult || !state.alchemicalBrewResult.success) return;
    const potionName = state.alchemicalBrewResult.potionName;
    
    updateState(s => {
      if (s.character.inventory.length >= carryCapacity) {
        alert(`소지품 가방 공간이 부족합니다! 물건을 비우고 다시 시도해 주십시오.`);
        return s;
      }
      return {
        ...s,
        character: {
          ...s.character,
          inventory: [...s.character.inventory, potionName]
        },
        alchemicalBrewResult: null
      };
    });
    alert(`성공적으로 [${potionName}] 비약을 소지품 인벤토리에 추가했습니다!`);
  };

  const rollArcaneSpell = () => {
    const minCard = drawPlayerCard("spell");
    if (!minCard) return;

    let refereeCard: Card | null = null;
    updateState(s => {
      let deck = [...s.refereeDeck];
      let discard = [...s.refereeDiscard];
      if (deck.length === 0) {
        if (discard.length === 0) return s;
        deck = shuffle(discard);
        discard = [];
      }
      const c = deck.shift();
      if (c) {
        const cloned = { ...c, reversed: Math.random() < 0.25 };
        refereeCard = cloned;
        discard.push(cloned);
      }
      return { ...s, refereeDeck: deck, refereeDiscard: discard };
    });

    if (!refereeCard) return;
    const majCard = refereeCard as Card;

    let minorWord = "";
    let minorWordKo = "";
    if (minCard.suit) {
      const suitFolder = minCard.suit === "cups" ? "Cups" : minCard.suit === "wands" ? "Wands" : minCard.suit === "swords" ? "Swords" : "Coins";
      const wInfo = ARCANE_MINOR_WORDS[suitFolder]?.[getTableCardKey(minCard)];
      if (wInfo) {
        minorWord = wInfo.en;
        minorWordKo = wInfo.ko;
      }
    }

    let majorWord = "";
    let majorWordKo = "";
    const majInfo = ARCANE_MAJOR_WORDS[majCard.card];
    if (majInfo) {
      majorWord = majCard.reversed ? majInfo.revEn : majInfo.en;
      majorWordKo = majCard.reversed ? majInfo.revKo : majInfo.ko;
    }

    const spellName = `${minorWord} ${majorWord} (${minorWordKo} ${majorWordKo})`;
    const ruleSummary = `소모 결의: 최소 1 Resolve / 피해: 결의 1점 소모당 부상 1점 / 전투 시 시전 판정: 대지 완드 판정(Opposed Wands Test, 대상 몬스터 Stat 만큼 페널티)`;

    updateState(s => ({
      ...s,
      arcaneSpellResult: {
        minorCard: minCard,
        majorCard: majCard,
        spellName,
        ruleSummary
      },
      journals: [
        {
          id: generateUniqueId(),
          text: `[비문 마법 탐구] 카드 단어 조합: ${spellName} 주문 단어를 발견하여 마법 주문을 구성했습니다.`,
          date: new Date().toLocaleString()
        },
        ...s.journals
      ]
    }));
  };

  const addArcaneSpellToSpellbook = () => {
    if (!state?.arcaneSpellResult) return;
    const spellName = state.arcaneSpellResult.spellName;
    if (spellName.includes("광대의 장난")) {
      alert("광대의 장난 주문은 주문첩에 영구히 저장할 수 없습니다!");
      return;
    }
    updateState(s => {
      const nextSpellbook = [...(s.character.spellbook || [])];
      if (nextSpellbook.includes(spellName)) {
        alert("이미 주문첩에 기록된 주문입니다.");
        return s;
      }
      return {
        ...s,
        character: {
          ...s.character,
          spellbook: [...nextSpellbook, spellName]
        },
        arcaneSpellResult: null
      };
    });
    alert(`주문첩에 [${spellName}] 마법이 등록되었습니다!`);
  };

  const searchAndHirelingTest = () => {
    const cups = state?.character?.stats?.cups || 0;
    const currentCount = state?.character?.hirelings?.length || 0;
    if (currentCount >= cups) {
      alert(`고용 가능한 최대 용병 수에 도달했습니다! (현재 컵 능력치: ${cups}명 제한)\n컵(Cups) 능력치를 올리거나 기존 용병을 해고하십시오.`);
      return;
    }

    // 1. Cups Test to Search
    let searchCard: Card | null = null;
    updateState(s => {
      let deck = [...s.playerDeck];
      let discard = [...s.playerDiscard];
      if (deck.length === 0) {
        deck = shuffle(discard);
        discard = [];
      }
      const c = deck.shift();
      if (c) {
        searchCard = { ...c, reversed: Math.random() < 0.25 };
        discard.push(searchCard);
      }
      return { ...s, playerDeck: deck, playerDiscard: discard };
    });

    if (!searchCard) return;
    const sCard = searchCard as Card;
    const sCardVal = getCardNumericValue(sCard);

    const cupsStat = state.character.stats.cups;
    const searchTotal = sCardVal + cupsStat + testPenalty + getFoePenalty();
    const searchSuccess = searchTotal >= 14;

    if (!searchSuccess) {
      alert(`[용병 모집 실패]\nCups 판정 결과: ${searchTotal}점 (카드: ${getCardDisplayName(sCard)} + Cups: ${cupsStat})\n\n마을 안에서 적절한 고용 후보를 발견하는 데 실패했습니다.`);
      updateState(s => ({
        ...s,
        journals: [
          {
            id: generateUniqueId(),
            text: `[용병 모집 실패] Cups 판정 결과 ${searchTotal}점으로 용병 후보 탐색에 실패했습니다.`,
            date: new Date().toLocaleString()
          },
          ...s.journals
        ]
      }));
      return;
    }

    // 2. Generate Candidate NPC using FOLK_ROAD
    const candidate = getRandomCandidate();
    const candidateFemale = candidate.femaleName;
    const candidateMale = candidate.maleName;
    const candidateName = `${candidateFemale}/${candidateMale}`;
    const candidateOccupation = candidate.occupation;
    const candidatePersonality = candidate.personality;

    const confirmHire = confirm(
      `[용병 모집 성공!]\nCups 판정 결과: ${searchTotal}점 (성공)\n\n새로운 용병 후보를 발견했습니다!\n- 이름: ${candidateName}\n- 직업: ${candidateOccupation}\n- 성격: ${candidatePersonality}\n\n이 후보를 용병으로 고용하기 위해 고용 계약 판정(Coins Test)을 진행하시겠습니까?`
    );

    if (!confirmHire) return;

    // 3. Coins Test to Hire
    let hireCard: Card | null = null;
    updateState(s => {
      let deck = [...s.playerDeck];
      let discard = [...s.playerDiscard];
      if (deck.length === 0) {
        deck = shuffle(discard);
        discard = [];
      }
      const c = deck.shift();
      if (c) {
        hireCard = { ...c, reversed: Math.random() < 0.25 };
        discard.push(hireCard);
      }
      return { ...s, playerDeck: deck, playerDiscard: discard };
    });

    if (!hireCard) return;
    const hCard = hireCard as Card;
    const hCardVal = getCardNumericValue(hCard);

    const coinsStat = state.character.stats.coins;
    const hireTotal = hCardVal + coinsStat + testPenalty + getFoePenalty();
    const hireSuccess = hireTotal >= 14;

    if (hireSuccess) {
      alert(
        `[용병 고용 성공!]\nCoins 판정 결과: ${hireTotal}점 (카드: ${getCardDisplayName(hCard)} + Coins: ${coinsStat})\n\n${candidateName}이(가) 계약을 수락하고 당신의 용병으로 합류했습니다!`
      );
      updateState(s => ({
        ...s,
        character: {
          ...s.character,
          hirelings: [...(s.character.hirelings || []), { name: candidateName, info: `${candidateOccupation} (${candidatePersonality})` }]
        },
        journals: [
          {
            id: generateUniqueId(),
            text: `[용병 고용 성공] Cups(${searchTotal}) 및 Coins(${hireTotal}) 판정에 성공하여 용병 ${candidateName}(${candidateOccupation})을 고용했습니다.`,
            date: new Date().toLocaleString()
          },
          ...s.journals
        ]
      }));
    } else {
      alert(
        `[용병 고용 실패]\nCoins 판정 결과: ${hireTotal}점 (카드: ${getCardDisplayName(hCard)} + Coins: ${coinsStat})\n\n${candidateName}이(가) 제시한 고용 금액이나 모험의 위험성에 동의하지 못하고 자리를 떠났습니다.`
      );
      updateState(s => ({
        ...s,
        journals: [
          {
            id: generateUniqueId(),
            text: `[용병 계약 실패] Coins 판정 결과 ${hireTotal}점 부족으로 용병 ${candidateName}과의 고용 계약이 무산되었습니다.`,
            date: new Date().toLocaleString()
          },
          ...s.journals
        ]
      }));
    }
  };

  const payWeeklyHireling = (idx: number) => {
    const hireling = state?.character?.hirelings?.[idx];
    if (!hireling) return;

    if (!confirm(`'${hireling.name}' 용병의 주간 고용 유지를 위한 주간 급여 판정(Coins Test)을 진행하시겠습니까?\n실패 시 용병이 사직하고 떠납니다.`)) {
      return;
    }

    let cardDrawn: Card | null = null;
    updateState(s => {
      let deck = [...s.playerDeck];
      let discard = [...s.playerDiscard];
      if (deck.length === 0) {
        deck = shuffle(discard);
        discard = [];
      }
      const c = deck.shift();
      if (c) {
        cardDrawn = { ...c, reversed: Math.random() < 0.25 };
        discard.push(cardDrawn);
      }
      return { ...s, playerDeck: deck, playerDiscard: discard };
    });

    if (!cardDrawn) return;
    const card = cardDrawn as Card;
    const cardVal = getCardNumericValue(card);

    const coinsStat = state.character.stats.coins;
    const total = cardVal + coinsStat + testPenalty + getFoePenalty();
    const success = total >= 14;

    if (success) {
      alert(`[주간 급여 판정 성공]\nCoins 판정 결과: ${total}점 (성공)\n\n급여가 만족스럽게 지급되었습니다. ${hireling.name}은(는) 고용 상태를 계속 유지합니다.`);
      updateState(s => ({
        ...s,
        journals: [
          {
            id: generateUniqueId(),
            text: `[용병 유지 성공] Coins 판정 ${total}점으로 ${hireling.name}에게 주간 급여를 정상 지급하여 계약을 연장했습니다.`,
            date: new Date().toLocaleString()
          },
          ...s.journals
        ]
      }));
    } else {
      alert(`[주간 급여 판정 실패]\nCoins 판정 결과: ${total}점 (실패)\n\n제시한 주간 급여가 적거나 계약금 부족으로 인해 ${hireling.name}이(가) 즉시 계약을 해지하고 사직했습니다.`);
      updateState(s => ({
        ...s,
        character: {
          ...s.character,
          hirelings: s.character.hirelings.filter((_, i) => i !== idx)
        },
        journals: [
          {
            id: generateUniqueId(),
            text: `🏃 [용병 탈퇴] Coins 판정 ${total}점 실패로 용병 ${hireling.name}이(가) 계약을 파기하고 탈퇴했습니다.`,
            date: new Date().toLocaleString(),
            day: s.day,
            watch: s.watch,
            pinned: true,
            systemGenerated: true,
            chronicle: true,
            chronicleCategory: "hireling_quit",
            chronicleIcon: "🏃"
          },
          ...s.journals
        ]
      }));
    }
  };

  const rollCarousing = () => {
    const card = drawPlayerCard("carousing");
    if (!card) return;

    const key = getCarousingKey(card);
    const text = CAROUSING_TABLE[key] || "알 수 없는 이벤트";
    setCarousingResult({ card, text });
    setFolkNpcResult(null);
    setMagickItemResult(null);
  };

  const rollFolkNpc = () => {
    let cardDrawn: Card | null = null;
    updateState(s => {
      let deck = [...s.refereeDeck];
      let discard = [...s.refereeDiscard];
      if (deck.length === 0) {
        deck = shuffle(discard);
        discard = [];
      }
      const c = deck.shift();
      if (c) {
        cardDrawn = { ...c, reversed: Math.random() < 0.25 };
        discard.push(cardDrawn);
      }
      return { ...s, refereeDeck: deck, refereeDiscard: discard };
    });

    if (cardDrawn) {
      const idx = getMajorCardIndex(cardDrawn);
      const femaleName = FOLK_ROAD.femaleNames[idx] || "알 수 없음";
      const maleName = FOLK_ROAD.maleNames[idx] || "알 수 없음";
      const occupation = FOLK_ROAD.occupations[idx] || "알 수 없음";
      const personality = FOLK_ROAD.personalities[idx] || "알 수 없음";
      
      setFolkNpcResult({
        card: cardDrawn,
        femaleName,
        maleName,
        occupation,
        personality
      });
      setCarousingResult(null);
      setMagickItemResult(null);
    }
  };

  const rollMagickItem = () => {
    const card = drawPlayerCard("magick");
    if (!card) return;

    const key = getCarousingKey(card);
    if (key === "Fool") {
      setMagickItemResult({
        card,
        suit: selectedMagickSuit,
        name: "광대의 장난 (The Fool's Prank)",
        text: "오라클 드로우 중 광대(The Fool)가 뽑혔습니다. 유물을 획득하지 못하고 덱의 마법이 흩어집니다! 덱 전체를 셔플해야 합니다."
      });
    } else {
      const suitArray = MAGICK_ITEMS[selectedMagickSuit] || [];
      const found = suitArray.find(item => item.key === key);
      if (found) {
        setMagickItemResult({
          card,
          suit: selectedMagickSuit,
          name: found.name,
          text: found.text
        });
      } else {
        setMagickItemResult({
          card,
          suit: selectedMagickSuit,
          name: "미지의 유물 (Unknown Relic)",
          text: `해당 카드 값(${key})에 일치하는 마법 보물을 찾을 수 없습니다.`
        });
      }
    }
    setCarousingResult(null);
    setFolkNpcResult(null);
  };

  const addNpcAsFriend = () => {
    if (!folkNpcResult) return;
    const name = `${folkNpcResult.femaleName}/${folkNpcResult.maleName}`;
    const info = `${folkNpcResult.occupation} (${folkNpcResult.personality})`;
    updateState(s => {
      const isFirstFriend = !s.journals.some(j => j.chronicleCategory === "first_friend");
      const nextFriends = [...s.character.friends, { name, info }];
      
      const newJournal: JournalEntry = {
        id: generateUniqueId(),
        text: isFirstFriend 
          ? `⚜ [첫 인연] 새로운 친구 ${name}(${folkNpcResult.occupation})을(를) 만났습니다.`
          : `👥 [새로운 친구] ${name}(${folkNpcResult.occupation})와(과) 인연을 맺었습니다.`,
        date: new Date().toLocaleString(),
        day: s.day,
        watch: s.watch,
        pinned: isFirstFriend,
        systemGenerated: true,
        chronicle: isFirstFriend,
        chronicleCategory: isFirstFriend ? "first_friend" : undefined,
        chronicleIcon: isFirstFriend ? "⚜" : undefined
      };

      return {
        ...s,
        character: {
          ...s.character,
          friends: nextFriends
        },
        journals: [newJournal, ...s.journals]
      };
    });
    alert(`${name}이(가) 인연(Friends) 목록에 추가되었습니다.`);
  };

  const addNpcAsFoe = () => {
    if (!folkNpcResult) return;
    const name = `${folkNpcResult.femaleName}/${folkNpcResult.maleName}`;
    const info = `${folkNpcResult.occupation} (${folkNpcResult.personality})`;
    updateState(s => {
      const isFirstFoe = !s.journals.some(j => j.chronicleCategory === "first_foe");
      const nextFoes = [...s.character.foes, { name, info }];
      
      const newJournal: JournalEntry = {
        id: generateUniqueId(),
        text: isFirstFoe 
          ? `⚔ [첫 숙적] 새로운 원수 ${name}(${folkNpcResult.occupation})가 앞날을 가로막습니다.`
          : `👿 [새로운 원수] ${name}(${folkNpcResult.occupation})와(과) 적대적인 관계로 각인되었습니다.`,
        date: new Date().toLocaleString(),
        day: s.day,
        watch: s.watch,
        pinned: isFirstFoe,
        systemGenerated: true,
        chronicle: isFirstFoe,
        chronicleCategory: isFirstFoe ? "first_foe" : undefined,
        chronicleIcon: isFirstFoe ? "⚔" : undefined
      };

      return {
        ...s,
        character: {
          ...s.character,
          foes: nextFoes
        },
        journals: [newJournal, ...s.journals]
      };
    });
    alert(`${name}이(가) 원수(Foes) 목록에 추가되었습니다.`);
  };

  const addNpcAsHireling = () => {
    if (!folkNpcResult) return;
    const cups = state?.character?.stats?.cups || 0;
    const currentCount = state?.character?.hirelings?.length || 0;
    if (currentCount >= cups) {
      alert(`고용 가능한 최대 용병 수에 도달했습니다! (현재 컵 능력치: ${cups}명 제한)\n컵(Cups) 능력치를 올리거나 기존 용병을 해고하십시오.`);
      return;
    }

    const name = `${folkNpcResult.femaleName}/${folkNpcResult.maleName}`;
    const info = `${folkNpcResult.occupation} (${folkNpcResult.personality})`;

    if (!confirm(`'${name}'을(를) 용병으로 고용하기 위해 고용 계약 판정(Coins Test)을 수행하시겠습니까?`)) {
      return;
    }

    let hireCard: Card | null = null;
    updateState(s => {
      let deck = [...s.playerDeck];
      let discard = [...s.playerDiscard];
      if (deck.length === 0) {
        deck = shuffle(discard);
        discard = [];
      }
      const c = deck.shift();
      if (c) {
        hireCard = { ...c, reversed: Math.random() < 0.25 };
        discard.push(hireCard);
      }
      return { ...s, playerDeck: deck, playerDiscard: discard };
    });

    if (!hireCard) return;
    const hCard = hireCard as Card;
    const hCardVal = getCardNumericValue(hCard);

    const coinsStat = state.character.stats.coins;
    const hireTotal = hCardVal + coinsStat + testPenalty;
    const hireSuccess = hireTotal >= 14;

    if (hireSuccess) {
      alert(
        `[용병 고용 성공!]\nCoins 판정 결과: ${hireTotal}점 (카드: ${getCardDisplayName(hCard)} + Coins: ${coinsStat})\n\n${name}이(가) 계약을 수락하고 당신의 용병으로 합류했습니다!`
      );
      updateState(s => {
        const isFirstHireling = !s.journals.some(j => j.chronicleCategory === "first_hireling");
        const category = isFirstHireling ? "first_hireling" : undefined;
        const icon = isFirstHireling ? "🤝" : undefined;
        const logText = isFirstHireling
          ? `🤝 [첫 용병 고용] 길에서 만난 NPC ${name}(${folkNpcResult.occupation})을 Coins 판정(${hireTotal}점) 성공으로 고용하여 동행을 시작했습니다.`
          : `👥 [용병 고용 성공] 길에서 만난 NPC ${name}(${folkNpcResult.occupation})을 Coins 판정(${hireTotal}점) 성공으로 고용했습니다.`;

        return {
          ...s,
          character: {
            ...s.character,
            hirelings: [...(s.character.hirelings || []), { name, info }]
          },
          journals: [
            {
              id: generateUniqueId(),
              text: logText,
              date: new Date().toLocaleString(),
              day: s.day,
              watch: s.watch,
              pinned: isFirstHireling,
              systemGenerated: true,
              chronicle: isFirstHireling,
              chronicleCategory: category,
              chronicleIcon: icon
            },
            ...s.journals
          ]
        };
      });
    } else {
      alert(
        `[용병 고용 실패]\nCoins 판정 결과: ${hireTotal}점 (카드: ${getCardDisplayName(hCard)} + Coins: ${coinsStat})\n\n${name}이(가) 제시한 조건을 거절하여 고용에 실패했습니다.`
      );
      updateState(s => ({
        ...s,
        journals: [
          {
            id: generateUniqueId(),
            text: `[용병 고용 실패] 길에서 만난 NPC ${name} 고용 계약 Coins 판정(${hireTotal}점) 실패로 무산되었습니다.`,
            date: new Date().toLocaleString()
          },
          ...s.journals
        ]
      }));
    }
  };

  const addMagickItemToInventory = () => {
    if (!magickItemResult) return;
    const itemName = `${magickItemResult.name} (${magickItemResult.suit === "Swords" ? "소드" : magickItemResult.suit === "Coins" ? "코인" : magickItemResult.suit === "Cups" ? "컵" : "완드"} 유물)`;
    updateState(s => ({
      ...s,
      character: {
        ...s.character,
        inventory: [...s.character.inventory, itemName]
      }
    }));
    alert(`'${itemName}' 아이템이 인벤토리에 추가되었습니다.`);
  };

  // Add Item to Journal
  const addJournalEntry = (
    textOverride?: string,
    actionType?: string,
    details?: any,
    chronicleOpts?: { pinned?: boolean; systemGenerated?: boolean; chronicle?: boolean; chronicleCategory?: string; chronicleIcon?: string }
  ) => {
    const entryText = textOverride || newJournalText;
    if (!entryText.trim()) return;

    updateState(s => {
      const thematicText = actionType ? getThematicLogText(actionType, details) : entryText;
      const isThematic = !!actionType;
      
      const x = selectedMapCellIdx !== null ? (selectedMapCellIdx % 4) : null;
      const y = selectedMapCellIdx !== null ? Math.floor(selectedMapCellIdx / 4) : null;

      // Auto-detect first defeat
      let isFirstDefeat = false;
      let opts = { ...chronicleOpts };
      if (
        (thematicText.includes("결과: 실패") || thematicText.includes("결과: 대실패")) &&
        !s.journals.some(j => j.chronicleCategory === "first_defeat")
      ) {
        isFirstDefeat = true;
        opts = {
          pinned: true,
          systemGenerated: true,
          chronicle: true,
          chronicleCategory: "first_defeat",
          chronicleIcon: "💥"
        };
      }

      const logText = isFirstDefeat ? `💥 [첫 패배] ${thematicText}` : thematicText;

      const nextJournals = [
        {
          id: generateUniqueId(),
          text: logText,
          date: new Date().toLocaleString(),
          day: s.day,
          watch: s.watch,
          x,
          y,
          pinned: opts?.pinned !== undefined ? opts.pinned : false,
          isThematic,
          systemLog: entryText,
          systemGenerated: opts?.systemGenerated !== undefined ? opts.systemGenerated : false,
          chronicle: opts?.chronicle !== undefined ? opts.chronicle : false,
          chronicleCategory: opts?.chronicleCategory,
          chronicleIcon: opts?.chronicleIcon
        },
        ...s.journals
      ];

      return {
        ...s,
        journals: pruneJournals(nextJournals)
      };
    });
    if (!textOverride) setNewJournalText("");
  };

  const togglePinJournalEntry = (id: string) => {
    updateState(s => ({
      ...s,
      journals: s.journals.map(j => j.id === id ? { ...j, pinned: !j.pinned } : j)
    }));
  };

  const toggleChronicleJournalEntry = (id: string) => {
    updateState(s => ({
      ...s,
      journals: s.journals.map(j => {
        if (j.id === id) {
          const nextChronicle = !j.chronicle;
          return {
            ...j,
            chronicle: nextChronicle,
            pinned: nextChronicle ? true : j.pinned
          };
        }
        return j;
      })
    }));
  };

  const handleManualPruneJournals = () => {
    const totalCount = state.journals.length;
    const pinnedCount = state.journals.filter(j => j.pinned || j.chronicle).length;
    const unpinnedCount = totalCount - pinnedCount;

    if (unpinnedCount <= 50) {
      alert(`ℹ️ 정리할 고정되지 않은 기록이 50개 이하입니다.\n(전체 기록: ${totalCount}개, 보존됨: ${pinnedCount}개)`);
      return;
    }

    if (window.confirm(`⚠️ 일지 최적화 정리를 진행하시겠습니까?\n고정(Pin) 및 연대기(Chronicle) 일지는 모두 유지되며, 그 외의 일지는 최근 50개만 남기고 삭제됩니다.\n(현재 전체 기록: ${totalCount}개 -> 정리 후 예상: ${pinnedCount + 50}개)`)) {
      updateState(s => {
        const nextJournals = pruneJournals(s.journals);
        return {
          ...s,
          journals: nextJournals
        };
      });
      alert("✨ 일지 최적화 정리가 완료되었습니다.");
    }
  };

  // Buy item coin test logic
  const handleStartBuyTest = (item: { name: string; nameKo: string; coinsMod: string; swordsReq?: number }) => {
    setBuyCatalogItem(item);
    setBuyTestResult(null);
  };

  const handleResolveBuyTest = () => {
    if (!buyCatalogItem) return;

    let cardDrawn: Card | null = null;
    updateState(s => {
      let deck = [...s.playerDeck];
      let discard = [...s.playerDiscard];
      if (deck.length === 0) {
        deck = shuffle(discard);
        discard = [];
      }
      const c = deck.shift();
      if (c) {
        cardDrawn = { ...c, reversed: Math.random() < 0.25 };
        discard.push(cardDrawn);
      }
      return { ...s, playerDeck: deck, playerDiscard: discard };
    });

    if (cardDrawn) {
      const card = cardDrawn as Card;
      let cardVal: number;
      const val = card.card;
      if (val === "A") cardVal = 1;
      else if (val === "Page") cardVal = 11;
      else if (val === "Knight") cardVal = 12;
      else if (val === "Queen") cardVal = 13;
      else if (val === "King") cardVal = 14;
      else cardVal = parseInt(val) || 0;

      const mod = parseInt(buyCatalogItem.coinsMod) || 0;
      const coinsStat = state.character.stats.coins;
      const total = cardVal + coinsStat + mod + testPenalty + getFoePenalty();
      const success = total >= 14;

      setBuyTestResult({
        success,
        total,
        card,
        statUsed: coinsStat
      });

      // If successful, add to inventory automatically
      if (success) {
        updateState(s => {
          if (s.character.inventory.length >= carryCapacity) {
            alert(`성공하여 물건을 구매했지만, 소지품 공간(${carryCapacity}슬롯)이 부족하여 바닥에 보관합니다!`);
            return s;
          }
          return {
            ...s,
            character: {
              ...s.character,
              inventory: [...s.character.inventory, `${buyCatalogItem.nameKo} (${buyCatalogItem.name})`]
            }
          };
        });
      }
    }
  };

  const renderStatWreath = (statKey: "cups" | "swords" | "coins" | "wands", label: string, desc: string, icon: string) => {
    const currentVal = (state.character.stats as any)[statKey];
    return (
      <div key={statKey} className="wreath-card">
        <div className="wreath-svg-container">
          <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
            {/* Elegant double-circle concentric border */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-color)" strokeWidth="1"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" strokeWidth="1.5" strokeDasharray="3 3"/>
            <circle cx="50" cy="50" r="36" fill="none" stroke="var(--border-color)" strokeWidth="0.75"/>
            
            {statKey === "cups" && <path d="M 42 42 L 58 42 L 58 46 C 58 52 54 56 50 56 C 46 56 42 52 42 46 Z M 46 56 L 54 56 L 54 62 L 46 62 Z M 40 62 L 60 62 L 60 65 L 40 65 Z" fill="rgba(150, 111, 35, 0.18)" />}
            {statKey === "swords" && <path d="M 48 30 L 52 30 L 52 58 L 56 58 L 56 61 L 52 61 L 52 68 L 48 68 L 48 61 L 44 61 L 44 58 L 48 58 Z" fill="rgba(150, 111, 35, 0.18)" />}
            {statKey === "coins" && <path d="M 50 32 C 40 32 32 40 32 50 C 32 60 40 68 50 68 C 60 68 68 60 68 50 C 68 40 60 32 50 32 Z M 50 38 L 54 46 L 62 48 L 56 54 L 58 62 L 50 58 L 42 62 L 44 54 L 38 48 L 46 46 Z" fill="rgba(150, 111, 35, 0.18)" />}
            {statKey === "wands" && <path d="M 46 30 L 54 30 L 52 65 L 48 65 Z M 44 26 L 56 26 L 56 29 L 44 29 Z" fill="rgba(150, 111, 35, 0.18)" />}
          </svg>
          <div className="wreath-value-overlay">{currentVal}</div>
        </div>
        <span className="wreath-label">{label} {icon}</span>
        
        <div className="wreath-adjusters">
          <button className="wreath-adjust-btn" onClick={() => updateState(s => {
            const prevVal = (s.character.stats as any)[statKey];
            return {
              ...s,
              character: {
                ...s.character,
                stats: { ...s.character.stats, [statKey]: Math.max(1, prevVal - 1) }
              }
            };
          })}>-</button>
          <button className="wreath-adjust-btn" onClick={() => updateState(s => {
            const prevVal = (s.character.stats as any)[statKey];
            if (prevVal >= 6) return s;
            if (s.character.xp < 10) {
              alert("경험치 10 XP가 소모됩니다. 현재 XP가 부족합니다!");
              return s;
            }
            const nextDay = s.day + 10;
            const statName = statKey === "cups" ? "Cups" : statKey === "swords" ? "Swords" : statKey === "coins" ? "Coins" : "Wands";
            return {
              ...s,
              day: nextDay,
              watch: 1,
              character: {
                ...s.character,
                xp: s.character.xp - 10,
                stats: { ...s.character.stats, [statKey]: prevVal + 1 }
              },
              journals: [{
                id: generateUniqueId(),
                text: getThematicLogText("stat_up", { statName, prevVal }),
                date: new Date().toLocaleString(),
                day: nextDay,
                watch: 1,
                pinned: false,
                isThematic: true,
                systemLog: `[스탯 증가] XP 10 소모하여 ${statName} 스탯이 ${prevVal}에서 ${prevVal + 1}로 증가했습니다.`
              }, ...s.journals]
            };
          })}>+</button>
        </div>
        <p className="wreath-desc">{desc}</p>
      </div>
    );
  };

  const renderPartScars = (partKey: "head" | "torso" | "lArm" | "rArm" | "lLeg" | "rLeg") => {
    const scars = (state.character.injuryLogs || []).filter(
      (log) => log.location === partKey && log.healed
    );
    if (scars.length === 0) return null;

    return (
      <div className="injury-card-content" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", marginTop: "4px", borderTop: "1px dashed rgba(255, 215, 0, 0.15)", paddingTop: "4px" }}>
        <span style={{ fontSize: "0.68rem", color: "var(--color-gold)", fontWeight: "bold" }}>🩹 흉터 (Scars):</span>
        <ul style={{ margin: 0, paddingLeft: "12px", fontSize: "0.68rem", color: "var(--text-muted)", listStyleType: "disc", width: "100%", textAlign: "left" }}>
          {scars.map((scar) => (
            <li key={scar.id} title={`획득: ${scar.dateAcquired}${scar.dateHealed ? ` / 치료: ${scar.dateHealed}` : ""}`}>
              {scar.injuryText} {scar.scarsNotes ? `(${scar.scarsNotes})` : ""}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="app-container">
      <section className="folio-shell" aria-label="Gloam character folio">

      {/* Folio Cover Header */}
      <header className="header-decor">
        <div className="header-title-container">
          <h1 className="gothic-title">
            GLOAM <span className="title-ko-sub">황혼의 폴리오</span>
          </h1>
          <p className="subtitle">
            캐릭터 장부, 캠페인 연대기, 타로 지도책
          </p>
        </div>

        <div className="auth-bar">
          {isFirebaseConfigured && auth ? (
            user ? (
              <>
                <span className="auth-badge online">
                  <span className="dot success"></span>
                  동기화 ({user.displayName || "플레이어"})
                </span>
                <button className="btn-medieval btn-medieval-primary" onClick={async () => {
                  await store.set("gloam_rpg_state", state);
                  alert("성공적으로 캐릭터 시트와 모험 지도가 클라우드 서버에 백업되었습니다!");
                }}>
                  <Upload size={14} /> 백업
                </button>
                <button className="btn-medieval" onClick={handleSignOut}>
                  <LogOut size={14} /> 로그아웃
                </button>
              </>
            ) : (
              <>
                <span className="auth-badge offline">
                  <span className="dot offline"></span>
                  로컬 저장 중
                </span>
                <button className="btn-medieval" onClick={handleSignIn}>
                  <LogIn size={14} /> 구글 연동
                </button>
              </>
            )
          ) : (
            <span className="auth-badge unconfigured">
              로컬 임시 모드
            </span>
          )}
          <button className="btn-medieval danger" onClick={handleReset}>
            <RotateCcw size={14} /> 리셋
          </button>
        </div>
      </header>

      {/* Folio Index Navigation */}
      <nav className="tab-navigation">
        <button className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
          <BookOpen size={16} /> 권두 색인
        </button>
        <button className={`tab-btn ${activeTab === "character" ? "active" : ""}`} onClick={() => setActiveTab("character")}>
          <UserIcon size={16} /> 인물 장부
        </button>
        <button className={`tab-btn ${activeTab === "oracles" ? "active" : ""}`} onClick={() => setActiveTab("oracles")}>
          <Sparkles size={16} /> 타로 도감
        </button>
        <button className={`tab-btn ${activeTab === "map" ? "active" : ""}`} onClick={() => setActiveTab("map")}>
          <MapIcon size={16} /> 원정 지도
        </button>
        <button className={`tab-btn ${activeTab === "journal" ? "active" : ""}`} onClick={() => setActiveTab("journal")}>
          <Compass size={16} /> 현장 일지
        </button>
      </nav>

      {/* Main Panel Routing */}
      <main className="main-content">
        {activeTab === "dashboard" && (
          <div className="dashboard-grid folio-index-grid">
            {/* 첫 번째 열: 컴패니언 환영 및 시간 추적기 */}
            <div className="card-panel gold-border">
              <h2 className="gothic-sub">권두 색인 (Frontispiece)</h2>
              <p className="folio-prose">
                이 folio는 <strong>Gloam (v1.02)</strong> 여정을 한 권의 물건처럼 다룹니다. 왼쪽에는 인물의 흔적, 가운데에는 시간과 판정, 오른쪽에는 신탁과 원정 기록이 접혀 있습니다.
              </p>
              
              <div className="alert alert-note folio-status-strip" style={{ marginTop: "1rem" }}>
                <strong>현재 장부:</strong> <strong>{state.character.name} ({detectedVocation})</strong><br />
                속도(Speed): <strong>{speed}</strong>, 
                소지 한도(Backpack): <strong>{carryCapacity}슬롯</strong>, 
                판정 페널티(Torso): <strong>{testPenalty}</strong>.
              </div>

              {/* 시간 및 워치 추적기 */}
              <div style={{ marginTop: "1.5rem", borderTop: "1px solid #333", paddingTop: "15px" }}>
                <h4 className="gothic-sub" style={{ fontSize: "1.05rem", margin: "0 0 10px 0" }}>여정 시계 (Time &amp; Watch)</h4>
                <div style={{ display: "flex", gap: "15px", alignItems: "center", marginTop: "10px" }}>
                  <div style={{ background: "rgba(42,37,33,0.1)", border: "1px solid var(--border-color)", padding: "8px 12px", borderRadius: "4px", textAlign: "center", minWidth: "70px" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>DAY</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--color-gold)", fontFamily: "var(--gothic)" }}>{state.day}</div>
                  </div>
                  <div style={{ background: "rgba(42,37,33,0.1)", border: "1px solid var(--border-color)", padding: "8px 12px", borderRadius: "4px", textAlign: "center", minWidth: "70px" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>WATCH</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--color-gold)", fontFamily: "var(--gothic)" }}>{state.watch} / 3</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <button className="btn-medieval-small" onClick={() => {
                      updateState(s => {
                        let nextWatch = s.watch + 1;
                        let nextDay = s.day;
                        if (nextWatch > 3) {
                          nextWatch = 1;
                          nextDay += 1;
                        }
                        return {
                          ...s,
                          day: nextDay,
                          watch: nextWatch,
                          journals: [{ id: generateUniqueId(), text: `[시간 경과] 제 ${nextDay}일 제 ${nextWatch}워치가 되었습니다.`, date: new Date().toLocaleString() }, ...s.journals]
                        };
                      });
                    }}>+1 Watch 경과 (8시간)</button>
                    <button className="btn-medieval-small" style={{ borderColor: "var(--color-crimson)", color: "var(--color-crimson)", fontSize: "0.68rem" }} onClick={() => {
                      if (confirm("일차를 1일 이전으로 되돌리시겠습니까?")) {
                        updateState(s => ({ ...s, day: Math.max(1, s.day - 1), watch: 1 }));
                      }
                    }}>-1 Day 이전으로</button>
                  </div>
                </div>
                <p className="rules-helper-text" style={{ marginTop: "10px", fontSize: "0.72rem", lineHeight: "1.3", color: "#888" }}>
                  * 야외 이동당 1 Watch(8시간) 소요. 연금술 비약 제조당 1 Watch 소요. <br />
                  * 하루는 3개의 Watch로 구성됩니다 (제 3워치는 밤 시간대).
                </p>
              </div>

              <div style={{ marginTop: "1.5rem", display: "flex", gap: "10px" }}>
                <button className="btn-medieval" onClick={() => setActiveTab("character")}>
                  시트 열기
                </button>
                <button className="btn-medieval" onClick={() => setActiveTab("oracles")}>
                  타로 드로우
                </button>
              </div>
            </div>

            {/* 두 번째 열: 최근 일지 요약 */}
            <div className="card-panel">
              <h3 className="gothic-sub">최근 낱장 기록</h3>
              <div className="summary-journals">
                {state.journals.slice(0, 4).map((j) => (
                  <div key={j.id} className="summary-journal-item" style={{ borderLeft: "2px solid var(--border-color)", paddingLeft: "10px", marginBottom: "10px" }}>
                    <span className="date" style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>{j.date}</span>
                    <p style={{ fontSize: "0.85rem", margin: "2px 0 0 0", lineHeight: "1.3" }}>{j.text}</p>
                  </div>
                ))}
                {state.journals.length === 0 && <p className="empty-text">기록된 연대기가 없습니다.</p>}
                <button className="btn-medieval text-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-gold)", padding: 0, marginTop: "10px", display: "block" }} onClick={() => setActiveTab("journal")}>
                  현장 일지 펼치기 &rarr;
                </button>
              </div>
            </div>

            {/* 세 번째 열: 범용 운명 판정판 (General Test Roller) */}
            <div className="card-panel gold-border">
              <h3 className="gothic-sub">운명의 판정판 (General Test)</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "5px 0 12px 0", lineHeight: "1.3" }}>
                캐릭터 스탯, 보정치, 대항 페널티(Opposed)를 결합하여 운명의 판정을 드로우합니다. (성공 기준: 14점 이상)
              </p>

              {hasFoeInSelectedCell() && (
                <div style={{
                  background: "rgba(220, 53, 69, 0.15)",
                  border: "1px solid var(--color-crimson)",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  marginBottom: "10px",
                  fontSize: "0.75rem",
                  color: "#ff8b94",
                  lineHeight: "1.3"
                }}>
                  ⚠️ <strong>원수의 위협:</strong> 이 구역에 원수가 도사리고 있어 모든 판정에 <strong>-2 페널티</strong>가 적용됩니다.
                </div>
              )}

              {state.activeFriendAid && (
                <div style={{
                  background: "rgba(76, 175, 80, 0.15)",
                  border: "1px solid #4caf50",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  marginBottom: "10px",
                  fontSize: "0.75rem",
                  color: "#a5d6a7",
                  lineHeight: "1.3"
                }}>
                  🤝 <strong>친구의 도움 활성화 ({state.activeFriendAid.npcName}):</strong> {state.activeFriendAid.type === "bonus" ? "다음 판정에 +2 보너스가 가산됩니다." : "다음 판정 보정에서 첫 결의 소모가 면제됩니다."}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "bold", display: "block", marginBottom: "3px" }}>판정 능력치 (Stat):</label>
                  <select 
                    className="select-medieval w-100" 
                    value={testStat} 
                    onChange={e => {
                      setTestStat(e.target.value as any);
                      setTestDrawnCards([]);
                      setTestStatus("idle");
                    }}
                  >
                    <option value="none">없음 (순수 카드 + modifier)</option>
                    <option value="cups">Cups (컵 - {state.character.stats.cups})</option>
                    <option value="swords">Swords (소드 - {state.character.stats.swords})</option>
                    <option value="coins">Coins (코인 - {state.character.stats.coins})</option>
                    <option value="wands">Wands (완드 - {state.character.stats.wands})</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: "bold", display: "block", marginBottom: "3px" }}>보정치 (Modifier):</label>
                    <input 
                      type="number" 
                      className="banner-input" 
                      style={{ padding: "4px 8px", width: "100%", fontSize: "0.85rem" }}
                      value={testMod} 
                      onChange={e => setTestMod(parseInt(e.target.value) || 0)} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: "bold", display: "block", marginBottom: "3px" }}>동료원조 (+Help):</label>
                    <input 
                      type="number" 
                      className="banner-input" 
                      style={{ padding: "4px 8px", width: "100%", fontSize: "0.85rem" }}
                      value={testHelpStat} 
                      onChange={e => setTestHelpStat(parseInt(e.target.value) || 0)} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "bold", display: "block", marginBottom: "3px" }}>대항 적수 페널티 (Opposed Penalty):</label>
                  <select 
                    className="select-medieval w-100" 
                    value={testOppMonsterId} 
                    onChange={e => setTestOppMonsterId(e.target.value)}
                  >
                    <option value="none">없음 (일반 난이도 14)</option>
                    <option value="custom">직접 수치 입력 페널티</option>
                    {BESTIARY.map(m => (
                      <option key={m.id} value={m.id.toString()}>{m.nameKo} (Stat: -{m.stat})</option>
                    ))}
                  </select>
                  {testOppMonsterId === "custom" && (
                    <input 
                      type="number" 
                      className="banner-input" 
                      style={{ padding: "4px 8px", width: "100%", marginTop: "5px", fontSize: "0.85rem" }} 
                      placeholder="페널티 수치 입력"
                      value={testCustomOppPenalty} 
                      onChange={e => setTestCustomOppPenalty(Math.abs(parseInt(e.target.value) || 0))} 
                    />
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "bold", display: "block", marginBottom: "3px" }}>판정 목적/노트:</label>
                  <input 
                    type="text" 
                    className="banner-input" 
                    style={{ padding: "4px 8px", width: "100%", fontSize: "0.85rem" }} 
                    placeholder="예: 함정 피하기, 문 자물쇠 따기 등"
                    value={testPurpose} 
                    onChange={e => setTestPurpose(e.target.value)} 
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                  <button 
                    className="btn-medieval flex-1" 
                    onClick={rollGeneralTest}
                    disabled={state.combatMonsters.length > 0}
                    style={{
                      opacity: state.combatMonsters.length > 0 ? 0.6 : 1,
                      cursor: state.combatMonsters.length > 0 ? "not-allowed" : "pointer"
                    }}
                  >
                    판정 카드 드로우
                  </button>
                  <button className="btn-medieval-small danger" onClick={resetTestState}>초기화</button>
                </div>

                {/* 판정 결과 카드 */}
                {testDrawnCards.length > 0 && (
                  <div className="oracle-result-card" style={{ marginTop: "8px", backgroundColor: "rgba(42,37,33,0.08)", padding: "10px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {testDrawnCards.map((c, i) => (
                          <img 
                            key={i} 
                            src={getCardImageUrl(c)} 
                            alt="test-card" 
                            style={{ width: "45px", height: "auto", border: "1px solid #444" }} 
                            className={c.reversed ? "reversed-image" : ""}
                          />
                        ))}
                      </div>
                      <div style={{ flex: 1, fontSize: "0.78rem" }}>
                        <h5 style={{ margin: 0, fontSize: "0.82rem" }}>
                          결과: {testStatus === "great_success" && <strong style={{ color: "var(--color-gold)" }}>🎉 극적 성공 (Great Success!)</strong>}
                                {testStatus === "success" && <strong style={{ color: "var(--color-gold)" }}>👍 성공 (Success)</strong>}
                                {testStatus === "failed" && <strong style={{ color: "var(--color-crimson)" }}>💥 실패 (Failure)</strong>}
                                {testStatus === "great_failure" && <strong style={{ color: "var(--color-crimson)" }}>💀 대실패 (Great Failure!)</strong>}
                        </h5>
                        <p style={{ margin: "3px 0 0 0", fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: "1.2" }}>
                          카드: {testDrawnCards.map(c => getCardDisplayName(c)).join(" + ")} <br />
                          {testPushed && <span>[푸시 적용] </span>}
                          부상 페널티: {testPenalty}
                        </p>
                      </div>
                    </div>

                    {testStatus === "failed" && !testPushed && (
                      <div style={{ marginTop: "6px", borderTop: "1px dashed #bbb", paddingTop: "6px", textAlign: "center" }}>
                        <p style={{ fontSize: "0.7rem", color: "var(--color-crimson)", margin: "0 0 4px 0" }}>
                          * 실패했습니다. 리스크를 지고 한 장 더 뽑으시겠습니까?
                        </p>
                        <button 
                          className="btn-medieval-small" 
                          style={{ 
                            width: "100%", 
                            padding: "4px",
                            opacity: state.combatMonsters.length > 0 ? 0.6 : 1,
                            cursor: state.combatMonsters.length > 0 ? "not-allowed" : "pointer"
                          }} 
                          onClick={pushGeneralTest}
                          disabled={state.combatMonsters.length > 0}
                        >
                          🎲 판정 푸시 (카드 1장 추가)
                        </button>
                      </div>
                    )}

                    {/* 결의(Resolve) 소비 판정 보정 - 실패 혹은 성공 직후 사용 가능 */}
                    {(testStatus === "failed" || testStatus === "success") && (
                      <div style={{ marginTop: "6px", borderTop: "1px dashed #555", paddingTop: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem" }}>
                          <span style={{ color: "#ccc" }}>
                            🔥 결의 소비 보정 (현재 결의: <strong style={{ color: "var(--color-gold)" }}>{state.character.resolve}</strong>)
                          </span>
                          <span style={{ color: "#999", fontSize: "0.65rem" }}>소비 {testResolveSpent}점 / 총합 {testCurrentTotal + testResolveSpent}</span>
                        </div>
                        <p style={{ fontSize: "0.65rem", color: "#888", margin: "3px 0 5px 0" }}>
                          결의 1점 = 판정 합계 +1 (결과 확인 후 소비 가능, p.34)
                        </p>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <button
                            className="btn-medieval-small"
                            style={{ flex: 1, fontSize: "0.7rem" }}
                            disabled={state.character.resolve <= 0 && !(state.activeFriendAid?.type === "resolve_discount" && testResolveSpent === 0)}
                            onClick={() => {
                              const isDiscountActive = state.activeFriendAid?.type === "resolve_discount" && testResolveSpent === 0;
                              if (state.character.resolve <= 0 && !isDiscountActive) {
                                alert("결의(Resolve)가 없습니다!");
                                return;
                              }
                              const newTotal = testCurrentTotal + testResolveSpent + 1;
                              const newResolveSpent = testResolveSpent + 1;
                              setTestResolveSpent(newResolveSpent);
                              updateState(s => {
                                const resolveChange = isDiscountActive ? 0 : -1;
                                const nextState = {
                                  ...s,
                                  character: { ...s.character, resolve: Math.max(0, s.character.resolve + resolveChange) }
                                };
                                if (isDiscountActive) {
                                  nextState.activeFriendAid = null; // Consume discount
                                }
                                return nextState;
                              });
                              if (newTotal >= 14 && testStatus === "failed") {
                                setTestStatus("success");
                                const logText = isDiscountActive
                                  ? `[판정 결의 보정 - 친구의 원조] 친구 ${state.activeFriendAid?.npcName || "이름 없음"}의 도움으로 결의를 소모하지 않고 총합 ${newTotal}점 달성 → 성공으로 전환!`
                                  : `[판정 결의 보정] 결의 ${newResolveSpent}점 소비하여 총합 ${newTotal}점 달성 → 성공으로 전환!`;
                                addJournalEntry(logText);
                                alert(`✨ ${isDiscountActive ? "친구의 도움으로 결의 소모 없이" : `결의 ${newResolveSpent}점을 소비하여`} 총합 ${newTotal}점 달성! 판정이 성공으로 전환되었습니다.`);
                              } else {
                                const logText = isDiscountActive
                                  ? `[판정 결의 보정 - 친구의 원조] 친구 ${state.activeFriendAid?.npcName || "이름 없음"}의 도움으로 결의 소모 없이 보정 적용 (총합 ${newTotal}점)`
                                  : `[판정 결의 추가 소비] 결의 소비 ${newResolveSpent}점, 총합 ${newTotal}점`;
                                addJournalEntry(logText);
                              }
                            }}
                          >
                            {state.activeFriendAid?.type === "resolve_discount" && testResolveSpent === 0 
                              ? "🤝 친구 원조 결의 보정 (+1, 결의 소모 0)" 
                              : "결의 1점 소비 (+1)"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {state.combatMonsters.length > 0 && (
                  <div style={{
                    marginTop: "12px",
                    padding: "10px",
                    backgroundColor: "rgba(220, 53, 69, 0.15)",
                    border: "1px solid var(--color-crimson)",
                    borderRadius: "4px",
                    fontSize: "0.78rem",
                    color: "var(--color-crimson)",
                    lineHeight: "1.4"
                  }}>
                    <strong>⚠️ 판정 제한 (전투 진행 중)</strong><br />
                    현재 전투가 진행 중이므로 일반 판정 및 푸시가 잠금 처리되었습니다. 전투 탭에서 주도권 드로우 및 전투 액션 판정을 진행해 주십시오.
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* CHARACTER SHEET TAB */}
        {activeTab === "character" && (
          <div className="sheet-container parchment-container">

            {/* Top Banner Header */}
            <div className="medieval-banner-header crenellation-header">
              <span className="medieval-banner-logo">GLOAM</span>
              <div className="medieval-banner-inputs">
                <div className="banner-field">
                  <span>NAME:</span>
                  <input 
                    type="text" 
                    className="banner-input" 
                    value={state.character.name} 
                    onChange={e => updateState(s => ({ ...s, character: { ...s.character, name: e.target.value } }))} 
                  />
                </div>
                <div className="banner-field">
                  <span>AGE:</span>
                  <input 
                    type="number" 
                    className="banner-input" 
                    value={state.character.age} 
                    onChange={e => updateState(s => ({ ...s, character: { ...s.character, age: parseInt(e.target.value) || 0 } }))} 
                  />
                </div>
                <div className="banner-field">
                  <span>VOCATION:</span>
                  <input 
                    type="text" 
                    className="banner-input" 
                    value={state.character.vocation} 
                    onChange={e => updateState(s => ({ ...s, character: { ...s.character, vocation: e.target.value } }))} 
                  />
                </div>
                <div className="banner-field">
                  <span>LIFEPATH:</span>
                  <input 
                    type="text" 
                    className="banner-input" 
                    placeholder="출생 및 배경 사건 요약"
                    value={(state.character as any).lifepath || ""} 
                    onChange={e => updateState(s => ({ ...s, character: { ...s.character, lifepath: e.target.value } as any }))} 
                  />
                </div>
              </div>
            </div>

            {/* Stats Block (Wreaths) & Portrait Flag */}
            <div className="character-stats-portrait-grid" style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "20px", marginBottom: "25px" }}>
              {/* Stat Wreaths */}
              <div className="stat-wreaths-row" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 0 }}>
                {[
                  { key: "cups", label: "Cups (컵)", desc: "판단, 지식, 의술, 돌봄", icon: "C" },
                  { key: "swords", label: "Swords (소드)", desc: "근력, 용기, 전투, 지구력", icon: "S" },
                  { key: "coins", label: "Coins (코인)", desc: "민첩, 은신, 교활, 자금", icon: "Co" },
                  { key: "wands", label: "Wands (완드)", desc: "의지, 마법, 정신, 오컬트", icon: "W" }
                ].map(stat => renderStatWreath(stat.key as any, stat.label, stat.desc, stat.icon))}
              </div>

              {/* Hanging Portrait */}
              <div className="portrait-hanging-banner">
                <span className="portrait-banner-title">PORTRAIT</span>
                {state.character.portrait ? (
                  <div style={{ position: "relative", width: "100%", height: "100px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <img src={state.character.portrait} alt="Portrait" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button 
                      style={{ position: "absolute", top: 2, right: 2, background: "rgba(255,255,255,0.8)", border: "1px solid #000", padding: "1px 4px", fontSize: "0.65rem", cursor: "pointer" }}
                      onClick={() => updateState(s => ({ ...s, character: { ...s.character, portrait: "" } }))}
                    >삭제</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100px", textAlign: "center" }}>
                    <svg viewBox="0 0 40 40" style={{ width: "40px", height: "40px", marginBottom: "5px", opacity: 0.6 }}>
                      <path d="M 20 4 C 11.16 4 4 11.16 4 20 C 4 28.84 11.16 36 20 36 C 28.84 36 36 28.84 36 20 C 36 11.16 28.84 4 20 4 Z M 20 8 C 23.31 8 26 10.69 26 14 C 26 17.31 23.31 20 20 20 C 16.69 20 14 17.31 14 14 C 14 10.69 16.69 8 20 8 Z M 20 32 C 15.34 32 11.23 29.63 8.8 26.03 C 10.37 23.57 14.88 22 20 22 C 25.12 22 29.63 23.57 31.2 26.03 C 28.77 29.63 24.66 32 20 32 Z" fill="var(--border-color)"/>
                    </svg>
                    <button 
                      className="btn-medieval-small" 
                      onClick={() => {
                        const url = prompt("초상화 이미지의 웹 URL 주소를 입력해주세요:");
                        if (url) updateState(s => ({ ...s, character: { ...s.character, portrait: url } }));
                      }}
                    >초상화 설정</button>
                  </div>
                )}
              </div>
            </div>

            {/* Open Book: Inventory (Left) & Goals/Instincts (Right) */}
            <div className="open-book-container">
              <div className="open-book-binding"></div>
              
              {/* Left Page: Inventory */}
              <div className="book-page left-page">
                <div className="book-page-header">
                  <svg viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span>Inventory</span>
                </div>
                
                <div className="ruled-book-lines">
                  {Array.from({ length: 14 }).map((_, i) => {
                    const item = state.character.inventory[i] || "";
                    return (
                      <div key={i} className="ruled-line-item">
                        <span style={{ fontSize: "0.8rem", width: "22px", color: "var(--text-muted)", fontStyle: "italic" }}>{i + 1}.</span>
                        <input 
                          type="text" 
                          placeholder={i + 1 <= carryCapacity ? "(비어 있음)" : "(소지 용량 초과)"} 
                          value={item}
                          disabled={i + 1 > carryCapacity}
                          style={{ textDecoration: i + 1 > carryCapacity ? "line-through" : "none", opacity: i + 1 > carryCapacity ? 0.5 : 1 }}
                          onChange={e => {
                            const val = e.target.value;
                            updateState(s => {
                              const nextInv = [...s.character.inventory];
                              while (nextInv.length <= i) nextInv.push("");
                              nextInv[i] = val;
                              return {
                                ...s,
                                character: {
                                  ...s.character,
                                  inventory: nextInv
                                }
                              };
                            });
                          }}
                        />
                        {(() => {
                          const req = getItemSwordsRequirement(item);
                          if (req !== null && req > state.character.stats.swords) {
                            return (
                              <span 
                                title={`Swords 요구치 미달: 사용 불가능 (요구: ${req}, 현재: ${state.character.stats.swords})`} 
                                style={{ color: "#e53e3e", cursor: "help", fontSize: "0.72rem", marginRight: "5px", padding: "1px 4px", background: "rgba(229,62,62,0.1)", borderRadius: "3px", border: "1px solid rgba(229,62,62,0.3)", whiteSpace: "nowrap" }}
                              >
                                ⚠️ Swords {req} 필요
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {item && (
                          <button 
                            className="delete-btn" 
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                            onClick={() => {
                              updateState(s => {
                                const nextInv = [...s.character.inventory];
                                nextInv[i] = "";
                                return {
                                  ...s,
                                  character: {
                                    ...s.character,
                                    inventory: nextInv
                                  }
                                };
                              });
                            }}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: "15px", fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>
                  * 가방 한도: {carryCapacity} 칸 (Coins 스탯 연동)
                </div>
              </div>

              {/* Right Page: Goals & Instincts */}
              <div className="book-page right-page">
                {/* Goals Section */}
                <div className="book-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Goals</span>
                  <button 
                    className="btn-medieval-small" 
                    onClick={() => {
                      const text = prompt("새로운 목표를 입력하세요:\n(취소 시 취소, 입력 없이 확인 시 '새 목표'로 저장)");
                      if (text === null) return;
                      const dateStr = `제 ${state.day}일 제 ${state.watch}워치`;
                      updateState(s => ({
                        ...s,
                        character: {
                          ...s.character,
                          goals: [
                            ...s.character.goals,
                            { id: generateUniqueId(), text: text.trim() || "새 목표", status: "active", createdDate: dateStr }
                          ]
                        }
                      }));
                    }}
                  >+</button>
                </div>
                <div className="ruled-book-lines" style={{ marginBottom: "20px" }}>
                  {state.character.goals.filter(g => g.status === "active").map((g, i) => (
                    <div key={g.id || i} className="ruled-line-item">
                      <input 
                        type="text" 
                        value={g.text} 
                        onChange={e => {
                          const val = e.target.value;
                          updateState(s => {
                            const nextGoals = s.character.goals.map(item => item.id === g.id ? { ...item, text: val } : item);
                            return { ...s, character: { ...s.character, goals: nextGoals } };
                          });
                        }} 
                      />
                      <button 
                        style={{ background: "transparent", border: "1px solid var(--border-color)", padding: "1px 6px", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--gothic)" }}
                        onClick={() => {
                          const note = prompt(
                            "🏆 [목표 달성] 이 목표가 어떻게 달성되었는지 기록해 주십시오:\n(취소 시 달성 취소, 입력 없이 확인(Skip) 시 '달성함'으로 저장)"
                          );
                          if (note === null) return;
                          const finalNote = note.trim() || "달성함";
                          const dateStr = `제 ${state.day}일 제 ${state.watch}워치`;
                          updateState(s => {
                            const journalId = generateUniqueId();
                            const nextGoals = s.character.goals.map(item =>
                              item.id === g.id
                                ? { ...item, status: "completed" as const, completedDate: dateStr, milestoneNote: finalNote, linkedJournalId: journalId }
                                : item
                            );
                            const isFirstGoal = !s.journals.some(j => j.chronicleCategory === "first_goal");
                            const category = isFirstGoal ? "first_goal" : "goal_complete";
                            const icon = isFirstGoal ? "🏆" : "✨";
                            const logText = isFirstGoal 
                              ? `🏆 [첫 목표 달성] ${g.text} (기록: ${finalNote})`
                              : `✨ [목표 완료] ${g.text} (기록: ${finalNote})`;

                            return {
                              ...s,
                              character: {
                                ...s.character,
                                goals: nextGoals
                              },
                              journals: [
                                {
                                  id: journalId,
                                  text: logText,
                                  date: new Date().toLocaleString(),
                                  day: s.day,
                                  watch: s.watch,
                                  pinned: true,
                                  systemGenerated: true,
                                  chronicle: true,
                                  chronicleCategory: category,
                                  chronicleIcon: icon
                                },
                                ...s.journals
                              ]
                            };
                          });
                        }}
                      >달성</button>
                      <button
                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem", padding: "0 2px" }}
                        onClick={() => {
                          if (confirm("이 목표를 삭제하시겠습니까?")) {
                            updateState(s => {
                              const nextGoals = s.character.goals.filter(item => item.id !== g.id);
                              return { ...s, character: { ...s.character, goals: nextGoals } };
                            });
                          }
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {state.character.goals.filter(g => g.status === "active").length === 0 && (
                    <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.75rem", margin: "10px 0", textAlign: "center" }}>진행 중인 목표가 없습니다.</p>
                  )}
                </div>

                {/* Completed Milestones List */}
                {state.character.goals.filter(g => g.status === "completed").length > 0 && (
                  <div style={{ marginTop: "10px", borderTop: "1px dashed rgba(187, 153, 93, 0.4)", paddingTop: "8px", marginBottom: "20px" }}>
                    <h6 className="gothic-sub" style={{ color: "var(--color-gold)", margin: "0 0 6px 0", fontSize: "0.78rem", borderBottom: "none" }}>
                      🏆 달성한 업적 연대기 (Completed Milestones)
                    </h6>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "110px", overflowY: "auto", paddingRight: "3px" }}>
                      {state.character.goals.filter(g => g.status === "completed").map((cg) => (
                        <div key={cg.id} style={{ border: "1px solid rgba(187, 153, 93, 0.25)", background: "rgba(187, 153, 93, 0.03)", padding: "5px 6px", borderRadius: "4px", fontSize: "0.72rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1px" }}>
                            <strong style={{ color: "var(--color-gold)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{cg.text}</strong>
                            <span style={{ fontSize: "0.62rem", color: "#888" }}>{cg.completedDate}</span>
                          </div>
                          <p style={{ margin: "2px 0 3px 0", color: "#ccc", fontSize: "0.68rem" }}>
                            <strong>달성 경위:</strong> {cg.milestoneNote}
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "3px", marginTop: "3px" }}>
                            <span style={{ fontSize: "0.58rem", color: "#85bb65" }}>기록 전용 · 보상 수동 처리</span>
                            <select
                              value={cg.linkedJournalId || ""}
                              onChange={(e) => {
                                const jId = e.target.value;
                                updateState(s => {
                                  const nextGoals = s.character.goals.map(item => item.id === cg.id ? { ...item, linkedJournalId: jId || undefined } : item);
                                  return { ...s, character: { ...s.character, goals: nextGoals } };
                                });
                              }}
                              style={{ fontSize: "0.58rem", background: "rgba(0,0,0,0.4)", color: "var(--color-gold)", border: "1px solid var(--color-gold)", borderRadius: "3px", height: "16px", padding: "0 2px" }}
                            >
                              <option value="">일지 연결 안 함</option>
                              {state.journals.slice(0, 10).map(j => (
                                <option key={j.id} value={j.id} style={{ background: "#222", color: "#fff" }}>
                                  [Day {j.day || 1}] {j.text.slice(0, 12)}...
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instincts Section */}
                <div className="book-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Instincts</span>
                  <button 
                    className="btn-medieval-small" 
                    onClick={() => {
                      const text = prompt("새로운 본능을 입력하세요:\n(취소 시 취소, 입력 없이 확인 시 '새 본능'으로 저장)");
                      if (text === null) return;
                      updateState(s => ({
                        ...s,
                        character: {
                          ...s.character,
                          instincts: [...s.character.instincts, text.trim() || "새 본능"]
                        }
                      }));
                    }}
                  >+</button>
                </div>
                <div className="ruled-book-lines" style={{ marginBottom: "20px" }}>
                  {state.character.instincts.map((inst, i) => (
                    <div key={i} className="ruled-line-item">
                      <input 
                        type="text" 
                        value={inst} 
                        onChange={e => {
                          const val = e.target.value;
                          updateState(s => {
                            const nextInsts = [...s.character.instincts];
                            nextInsts[i] = val;
                            return { ...s, character: { ...s.character, instincts: nextInsts } };
                          });
                        }} 
                      />
                      <button 
                        style={{ background: "transparent", border: "1px solid var(--color-crimson)", color: "var(--color-crimson)", padding: "1px 6px", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--gothic)" }}
                        onClick={() => {
                          const note = prompt(
                            "⚡ [본능 격발] 본능으로 인해 어떤 위기나 시련이 생겼는지 기록해 주십시오:\n(취소 시 격발 취소, 입력 없이 확인(Skip) 시 '시련이 일어남'으로 저장)"
                          );
                          if (note === null) return;
                          const finalNote = note.trim() || "시련이 일어남";
                          const dateStr = `제 ${state.day}일 제 ${state.watch}워치`;
                          
                          updateState(s => {
                            const journalId = generateUniqueId();
                            const newTrigger = {
                              id: generateUniqueId(),
                              instinctText: inst,
                              date: dateStr,
                              narrativeNote: finalNote,
                              linkedJournalId: journalId
                            };
                            return {
                              ...s,
                              character: {
                                ...s.character,
                                instinctTriggers: [...(s.character.instinctTriggers || []), newTrigger]
                              },
                              journals: [
                                {
                                  id: journalId,
                                  text: `[본능 격발] 본능 '${inst}' (기록: ${finalNote})`,
                                  date: new Date().toLocaleString(),
                                  day: s.day,
                                  watch: s.watch
                                },
                                ...s.journals
                              ]
                            };
                          });
                        }}
                      >유발</button>
                      <button
                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem", padding: "0 2px" }}
                        onClick={() => {
                          if (confirm("이 본능을 삭제하시겠습니까?")) {
                            updateState(s => {
                              const nextInsts = s.character.instincts.filter((_, idx) => idx !== i);
                              return { ...s, character: { ...s.character, instincts: nextInsts } };
                            });
                          }
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {state.character.instincts.length === 0 && (
                    <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.75rem", margin: "10px 0", textAlign: "center" }}>등록된 본능이 없습니다.</p>
                  )}
                </div>

                {/* Instinct Trigger History */}
                {state.character.instinctTriggers && state.character.instinctTriggers.length > 0 && (
                  <div style={{ marginTop: "10px", borderTop: "1px dashed rgba(220, 53, 69, 0.4)", paddingTop: "8px" }}>
                    <h6 className="gothic-sub" style={{ color: "var(--color-crimson)", margin: "0 0 6px 0", fontSize: "0.78rem", borderBottom: "none" }}>
                      ⚡ 본능 격발 역사 (Instinct Trigger History)
                    </h6>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "110px", overflowY: "auto", paddingRight: "3px" }}>
                      {[...state.character.instinctTriggers].reverse().map((t) => (
                        <div key={t.id} style={{ border: "1px solid rgba(220, 53, 69, 0.25)", background: "rgba(220, 53, 69, 0.03)", padding: "5px 6px", borderRadius: "4px", fontSize: "0.72rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1px" }}>
                            <strong style={{ color: "var(--color-crimson)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{t.instinctText}</strong>
                            <span style={{ fontSize: "0.62rem", color: "#888" }}>{t.date}</span>
                          </div>
                          <p style={{ margin: "2px 0 3px 0", color: "#ccc", fontSize: "0.68rem" }}>
                            <strong>시련 경위:</strong> {t.narrativeNote}
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "3px", marginTop: "3px" }}>
                            <span style={{ fontSize: "0.58rem", color: "#85bb65" }}>기록 전용 · 보상 수동 처리</span>
                            <select
                              value={t.linkedJournalId || ""}
                              onChange={(e) => {
                                const jId = e.target.value;
                                updateState(s => {
                                  const nextTriggers = (s.character.instinctTriggers || []).map(item => item.id === t.id ? { ...item, linkedJournalId: jId || undefined } : item);
                                  return { ...s, character: { ...s.character, instinctTriggers: nextTriggers } };
                                });
                              }}
                              style={{ fontSize: "0.58rem", background: "rgba(0,0,0,0.4)", color: "var(--color-gold)", border: "1px solid var(--color-gold)", borderRadius: "3px", height: "16px", padding: "0 2px" }}
                            >
                              <option value="">일지 연결 안 함</option>
                              {state.journals.slice(0, 10).map(j => (
                                <option key={j.id} value={j.id} style={{ background: "#222", color: "#fff" }}>
                                  [Day {j.day || 1}] {j.text.slice(0, 12)}...
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Anatomy Wounds & Sidebar */}
            <div className="character-anatomy-memory-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "25px" }}>
              
              {/* Anatomy (Left Column) */}
              <div>
                {/* Vertical Banners Row */}
                <div className="vertical-banners-col">
                  {/* Resolve Banner */}
                  <div className="hanging-banner-box">
                    <h5>RESOLVE (결의)</h5>
                    <div className="hanging-banner-value">{state.character.resolve}</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "2px", marginTop: "5px" }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <input 
                          key={i} 
                          type="checkbox" 
                          checked={state.character.resolve > i} 
                          onChange={() => {
                            updateState(s => {
                              const val = s.character.resolve === i + 1 ? i : i + 1;
                              return { ...s, character: { ...s.character, resolve: val } };
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Speed Banner */}
                  <div className="hanging-banner-box">
                    <h5>SPEED (이동)</h5>
                    <div className="hanging-banner-value">{speed}</div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      기본: {state.character.stats.coins}
                    </span>
                  </div>

                  {/* EXP Banner */}
                  <div className="hanging-banner-box">
                    <h5>EXP (경험치)</h5>
                    <div className="hanging-banner-value" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      <button 
                        className="wreath-adjust-btn" 
                        onClick={() => updateState(s => ({ ...s, character: { ...s.character, xp: Math.max(0, s.character.xp - 1) } }))}
                      >-</button>
                      <span>{state.character.xp}</span>
                      <button 
                        className="wreath-adjust-btn" 
                        onClick={() => updateState(s => ({ ...s, character: { ...s.character, xp: s.character.xp + 1 } }))}
                      >+</button>
                    </div>
                    <button 
                      className="btn-medieval-small" 
                      style={{ fontSize: "0.68rem", marginTop: "8px", width: "100%", whiteSpace: "nowrap" }}
                      onClick={() => {
                        setSessionParticipated(true);
                        setSessionEndangered(false);
                        setSessionGoalFulfilled(false);
                        setShowSessionXpWizard(true);
                      }}
                    >
                      세션 종료 XP 정산
                    </button>
                  </div>
                </div>

                {/* Anatomy Grid */}
                <div className="card-panel" style={{ padding: "20px" }}>
                  <h4 className="gothic-sub" style={{ borderBottom: "1px solid var(--border-color)", fontSize: "1.1rem" }}>
                    Anatomy &amp; Injuries (신체 부위 및 부상)
                    <button
                      className="btn-medieval-small danger"
                      style={{ float: "right", marginTop: "-4px", fontSize: "0.7rem", borderColor: "var(--color-crimson)", color: "var(--color-crimson)", padding: "2px 6px" }}
                      onClick={() => {
                        const deathNote = prompt("💀 방랑자의 죽음에 관한 경위나 유언을 기록해 주십시오:");
                        if (deathNote === null) return;
                        updateState(s => ({
                          ...s,
                          journals: [
                            {
                              id: generateUniqueId(),
                              text: `💀 [캐릭터 사망] 최후를 맞이했습니다. (경위: ${deathNote.trim() || "기록 없음"})`,
                              date: new Date().toLocaleString(),
                              day: s.day,
                              watch: s.watch,
                              pinned: true,
                              systemGenerated: true,
                              chronicle: true,
                              chronicleCategory: "character_death",
                              chronicleIcon: "💀"
                            },
                            ...s.journals
                          ]
                        }));
                        alert("사망이 연대기 및 일지에 기록되었습니다.");
                      }}
                    >💀 사망 기록</button>
                  </h4>
                  
                  <div className="injuries-grid">
                    {/* Head Injury Card */}
                    <div className={`injury-card ${state.character.wounds.head ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.head} 
                          onChange={() => toggleWoundState("head", state.character.wounds.head, "머리")} 
                        />
                        <span style={{ color: state.character.wounds.head ? "var(--color-crimson)" : "inherit" }}>머리 (Head) [기절]</span>
                        {state.character.wounds.head && (
                          <button className="btn-medieval-small" style={{ marginLeft: "auto", fontSize: "0.65rem" }} onClick={() => healWound("head", "머리")}>
                            휴식치료
                          </button>
                        )}
                      </div>
                      <div className="injury-card-content">
                        <span>투구 AP2:</span>
                        <div style={{ display: "flex", gap: "3px" }}>
                          {[1, 2].map(n => (
                            <input key={n} type="checkbox" checked={state.character.armorNotches.helmet >= n} onChange={() => {
                              updateState(s => {
                                const current = s.character.armorNotches.helmet;
                                const next = current === n ? n - 1 : n;
                                return { ...s, character: { ...s.character, armorNotches: { ...s.character.armorNotches, helmet: next } } };
                              });
                            }} />
                          ))}
                        </div>
                      </div>
                      {renderPartScars("head")}
                    </div>

                    {/* Torso Injury Card */}
                    <div className={`injury-card ${state.character.wounds.torso ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.torso} 
                          onChange={() => toggleWoundState("torso", state.character.wounds.torso, "몸통")} 
                        />
                        <span style={{ color: state.character.wounds.torso ? "var(--color-crimson)" : "inherit" }}>몸통 (Torso) [-3 판정]</span>
                        {state.character.wounds.torso && (
                          <button className="btn-medieval-small" style={{ marginLeft: "auto", fontSize: "0.65rem" }} onClick={() => healWound("torso", "몸통")}>
                            휴식치료
                          </button>
                        )}
                      </div>
                      <div className="injury-card-content">
                        <span>흉갑 AP3:</span>
                        <div style={{ display: "flex", gap: "3px" }}>
                          {[1, 2, 3].map(n => (
                            <input key={n} type="checkbox" checked={state.character.armorNotches.cuirass >= n} onChange={() => {
                              updateState(s => {
                                const current = s.character.armorNotches.cuirass;
                                const next = current === n ? n - 1 : n;
                                return { ...s, character: { ...s.character, armorNotches: { ...s.character.armorNotches, cuirass: next } } };
                              });
                            }} />
                          ))}
                        </div>
                      </div>
                      {renderPartScars("torso")}
                    </div>

                    {/* Left Arm Injury Card */}
                    <div className={`injury-card ${state.character.wounds.lArm ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.lArm} 
                          onChange={() => toggleWoundState("lArm", state.character.wounds.lArm, "왼팔")} 
                        />
                        <span style={{ color: state.character.wounds.lArm ? "var(--color-crimson)" : "inherit" }}>왼팔 (L.Arm) [떨어뜨림]</span>
                        {state.character.wounds.lArm && (
                          <button className="btn-medieval-small" style={{ marginLeft: "auto", fontSize: "0.65rem" }} onClick={() => healWound("lArm", "왼팔")}>
                            휴식치료
                          </button>
                        )}
                      </div>
                      <div className="injury-card-content">
                        <span>건틀릿 AP1:</span>
                        <input type="checkbox" checked={state.character.armorNotches.gauntletL >= 1} onChange={() => {
                          updateState(s => ({ ...s, character: { ...s.character, armorNotches: { ...s.character.armorNotches, gauntletL: s.character.armorNotches.gauntletL === 1 ? 0 : 1 } } }));
                        }} />
                      </div>
                      {renderPartScars("lArm")}
                    </div>

                    {/* Right Arm Injury Card */}
                    <div className={`injury-card ${state.character.wounds.rArm ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.rArm} 
                          onChange={() => toggleWoundState("rArm", state.character.wounds.rArm, "오른팔")} 
                        />
                        <span style={{ color: state.character.wounds.rArm ? "var(--color-crimson)" : "inherit" }}>오른팔 (R.Arm) [떨어뜨림]</span>
                        {state.character.wounds.rArm && (
                          <button className="btn-medieval-small" style={{ marginLeft: "auto", fontSize: "0.65rem" }} onClick={() => healWound("rArm", "오른팔")}>
                            휴식치료
                          </button>
                        )}
                      </div>
                      <div className="injury-card-content">
                        <span>건틀릿 AP1:</span>
                        <input type="checkbox" checked={state.character.armorNotches.gauntletR >= 1} onChange={() => {
                          updateState(s => ({ ...s, character: { ...s.character, armorNotches: { ...s.character.armorNotches, gauntletR: s.character.armorNotches.gauntletR === 1 ? 0 : 1 } } }));
                        }} />
                      </div>
                      {renderPartScars("rArm")}
                    </div>

                    {/* Left Leg Injury Card */}
                    <div className={`injury-card ${state.character.wounds.lLeg ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.lLeg} 
                          onChange={() => toggleWoundState("lLeg", state.character.wounds.lLeg, "왼다리")} 
                        />
                        <span style={{ color: state.character.wounds.lLeg ? "var(--color-crimson)" : "inherit" }}>왼다리 (L.Leg) [-2 이동]</span>
                        {state.character.wounds.lLeg && (
                          <button className="btn-medieval-small" style={{ marginLeft: "auto", fontSize: "0.65rem" }} onClick={() => healWound("lLeg", "왼다리")}>
                            휴식치료
                          </button>
                        )}
                      </div>
                      <div className="injury-card-content">
                        <span>정강이 AP2:</span>
                        <div style={{ display: "flex", gap: "3px" }}>
                          {[1, 2].map(n => (
                            <input key={n} type="checkbox" checked={state.character.armorNotches.greaveL >= n} onChange={() => {
                              updateState(s => {
                                const current = s.character.armorNotches.greaveL;
                                const next = current === n ? n - 1 : n;
                                return { ...s, character: { ...s.character, armorNotches: { ...s.character.armorNotches, greaveL: next } } };
                              });
                            }} />
                          ))}
                        </div>
                      </div>
                      {renderPartScars("lLeg")}
                    </div>

                    {/* Right Leg Injury Card */}
                    <div className={`injury-card ${state.character.wounds.rLeg ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.rLeg} 
                          onChange={() => toggleWoundState("rLeg", state.character.wounds.rLeg, "오른다리")} 
                        />
                        <span style={{ color: state.character.wounds.rLeg ? "var(--color-crimson)" : "inherit" }}>오른다리 (R.Leg) [-2 이동]</span>
                        {state.character.wounds.rLeg && (
                          <button className="btn-medieval-small" style={{ marginLeft: "auto", fontSize: "0.65rem" }} onClick={() => healWound("rLeg", "오른다리")}>
                            휴식치료
                          </button>
                        )}
                      </div>
                      <div className="injury-card-content">
                        <span>정강이 AP2:</span>
                        <div style={{ display: "flex", gap: "3px" }}>
                          {[1, 2].map(n => (
                            <input key={n} type="checkbox" checked={state.character.armorNotches.greaveR >= n} onChange={() => {
                              updateState(s => {
                                const current = s.character.armorNotches.greaveR;
                                const next = current === n ? n - 1 : n;
                                return { ...s, character: { ...s.character, armorNotches: { ...s.character.armorNotches, greaveR: next } } };
                              });
                            }} />
                          ))}
                        </div>
                      </div>
                      {renderPartScars("rLeg")}
                    </div>

                    {/* Shield Injury Card */}
                    <div className="injury-card">
                      <div className="injury-card-header">
                        <strong>방패 마모 (Shield AP3)</strong>
                      </div>
                      <div className="injury-card-content">
                        <span>슬롯:</span>
                        <div style={{ display: "flex", gap: "3px" }}>
                          {[1, 2, 3].map(n => (
                            <input key={n} type="checkbox" checked={state.character.armorNotches.shield >= n} onChange={() => {
                              updateState(s => {
                                const current = s.character.armorNotches.shield;
                                const next = current === n ? n - 1 : n;
                                return { ...s, character: { ...s.character, armorNotches: { ...s.character.armorNotches, shield: next } } };
                              });
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* 부상 및 흉터 연대기 */}
                  <div style={{ marginTop: "20px", borderTop: "1px dashed #ccc", paddingTop: "15px" }}>
                    <h5 className="gothic-sub" style={{ borderBottom: "none", color: "var(--color-crimson)", margin: "0 0 5px 0", fontSize: "0.92rem" }}>
                      🩸 신체 부상 &amp; 흉터 연대기 (Anatomy &amp; Scar Chronicle)
                    </h5>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 10px 0", fontStyle: "italic" }}>
                      체크 박스 선택/해제 및 휴식 치료 시 상처의 경위나 남겨진 흔적(흉터)을 이야기로써 보존합니다.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", paddingRight: "5px" }}>
                      {(!state.character.injuryLogs || state.character.injuryLogs.length === 0) ? (
                        <p style={{ fontStyle: "italic", fontSize: "0.72rem", color: "#888", textAlign: "center", margin: "10px 0" }}>
                          아직 기록된 부상 내역이 없습니다. 신체 부위는 깨끗하고 흉터가 없습니다.
                        </p>
                      ) : (
                        [...state.character.injuryLogs].reverse().map((log) => {
                          const locMap: Record<string, string> = {
                            head: "머리 (Head)",
                            torso: "몸통 (Torso)",
                            lArm: "왼팔 (L.Arm)",
                            rArm: "오른팔 (R.Arm)",
                            lLeg: "왼다리 (L.Leg)",
                            rLeg: "오른다리 (R.Leg)"
                          };
                          return (
                            <div key={log.id} style={{
                              border: "1px solid",
                              borderColor: log.healed ? "rgba(187, 153, 93, 0.4)" : "var(--color-crimson)",
                              backgroundColor: log.healed ? "rgba(187, 153, 93, 0.04)" : "rgba(220, 53, 69, 0.03)",
                              padding: "8px 10px",
                              borderRadius: "4px",
                              fontSize: "0.78rem"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                <span style={{ fontWeight: "bold", color: log.healed ? "var(--color-ink)" : "var(--color-crimson)" }}>
                                  {locMap[log.location] || log.location} - {log.healed ? "🩹 완치됨 (흉터)" : "🚨 부상 중"}
                                </span>
                                <span style={{ color: "#777", fontSize: "0.7rem" }}>
                                  획득: {log.dateAcquired} {log.healed && `| 완치: ${log.dateHealed}`}
                                </span>
                              </div>
                              <p style={{ margin: "3px 0 0 0", color: "var(--text-bright)", lineHeight: "1.4" }}>
                                <strong>부상 경위:</strong> {log.injuryText}
                              </p>
                              {log.healed && log.scarsNotes && (
                                <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "0.75rem", fontStyle: "italic", borderTop: "1px dashed rgba(0,0,0,0.1)", paddingTop: "4px" }}>
                                  <strong>흉터 및 흔적:</strong> &ldquo;{log.scarsNotes}&rdquo;
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                {/* Lifepath Event Generator */}
                <div className="card-panel" style={{ padding: "20px", marginTop: "20px" }}>
                  <div className="flex-row justify-between align-center" style={{ marginBottom: "12px" }}>
                    <h4 className="gothic-sub" style={{ borderBottom: "none", marginBottom: 0, fontSize: "1.1rem" }}>
                      과거 인생 경로 사건 (Lifepath Logs)
                    </h4>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn-medieval-small" onClick={() => {
                        const card = drawPlayerCard("lifepath");
                        if (!card) return;

                        let valNum = 0;
                        if (card.card === "A") valNum = 1;
                        else if (card.card === "Page") valNum = 11;
                        else if (card.card === "Knight") valNum = 12;
                        else if (card.card === "Queen") valNum = 13;
                        else if (card.card === "King") valNum = 14;
                        else if (card.card === "0") valNum = 0;
                        else valNum = parseInt(card.card) || 0;

                        const bgDesc = (() => {
                          if (card.card === "0") {
                            return "광대의 운명: 과거 기억을 전부 잃고 낯선 황혼의 벌판에서 홀로 깨어난 수수께끼의 기원 (Mysterious memoryless origin)";
                          }
                          const suit = card.suit || "cups";
                          const mapping: { [key: string]: string } = {
                            "wands": "신비하고 기이한 영적 비술 및 야생 숲림 환경 (Wands)",
                            "swords": "전쟁และ 참화, 중소 무인/귀족 가문의 투쟁 환경 (Swords)",
                            "cups": "학구적이며 비교적 유복하고 안전한 상업/사원 환경 (Cups)",
                            "coins": "영지 빈민가와 차가운 길거리, 근본 없는 유랑민 환경 (Coins)"
                          };
                          return mapping[suit] || "평범한 정착민 출생 환경";
                        })();

                        const logText = `[출생배경] ${getCardDisplayName(card)}: ${bgDesc} (나이 +${valNum}년)`;
                        updateState(s => ({
                          ...s,
                          character: {
                            ...s.character,
                            age: s.character.age + valNum,
                            lifepathLogs: [...s.character.lifepathLogs, logText]
                          }
                        }));
                      }}>출생 결정</button>
                      <button className="btn-medieval-small" onClick={() => {
                        const card = drawPlayerCard("lifepath");
                        if (!card) return;

                        let valNum = 0;
                        if (card.card === "A") valNum = 1;
                        else if (card.card === "Page") valNum = 11;
                        else if (card.card === "Knight") valNum = 12;
                        else if (card.card === "Queen") valNum = 13;
                        else if (card.card === "King") valNum = 14;
                        else if (card.card === "0") valNum = 0;
                        else valNum = parseInt(card.card) || 0;

                        const eventDesc = card.card === "0"
                          ? "광대의 장난: 내 과거 행적에 대한 온갖 서류와 기록이 돌풍과 함께 날아가 완전히 세탁됨 (Mysterious twist of fate)"
                          : getLifepathEvent(card.suit || "cups", card.card);

                        const logText = `[과거사건] ${getCardDisplayName(card)}: ${eventDesc} (나이 +${valNum}년)`;
                        updateState(s => ({
                          ...s,
                          character: {
                            ...s.character,
                            age: s.character.age + valNum,
                            lifepathLogs: [...s.character.lifepathLogs, logText]
                          }
                        }));
                      }}>사건 드로우</button>
                    </div>
                  </div>

                  <div className="lifepath-log-list" style={{ maxHeight: "150px", overflowY: "auto", padding: "8px", fontSize: "0.85rem", border: "1px solid var(--border-color)" }}>
                    {state.character.lifepathLogs.map((log, i) => (
                      <div key={i} className="lifepath-item" style={{ borderBottom: "1px dashed rgba(42,37,33,0.15)", padding: "4px 0" }}>
                        <span>{log}</span>
                        <button className="delete-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => updateState(s => ({ ...s, character: { ...s.character, lifepathLogs: s.character.lifepathLogs.filter((_, idx) => idx !== i) } }))}>&times;</button>
                      </div>
                    ))}
                    {state.character.lifepathLogs.length === 0 && <p className="empty-text">기록된 행적이 없습니다.</p>}
                  </div>
                </div>

              </div>

              {/* Sidebar: Notes & Talents, Friends & Foes (Right Column) */}
              <div>
                
                {/* Notes & Talents Book Page mockup */}
                <div className="open-book-container" style={{ gridTemplateColumns: "1fr", marginBottom: "20px" }}>
                  <div className="book-page" style={{ minHeight: "360px" }}>
                    
                    {/* Notes text area */}
                    <div className="book-page-header" style={{ fontSize: "1.2rem", marginBottom: "10px" }}>
                      <span>Character Notes</span>
                    </div>
                    <textarea
                      placeholder="여기에 모험가의 소견, 메모, 수수께끼 풀이 등을 펜으로 기록하십시오..."
                      style={{ 
                        width: "100%", 
                        height: "100px", 
                        background: "transparent", 
                        border: "none", 
                        backgroundImage: "linear-gradient(rgba(42, 37, 33, 0.1) 1px, transparent 1px)", 
                        backgroundSize: "100% 24px", 
                        lineHeight: "24px",
                        fontFamily: "var(--serif)", 
                        fontSize: "0.95rem", 
                        outline: "none", 
                        resize: "none",
                        color: "var(--text-bright)"
                      }}
                      value={(state.character as any).notes || ""}
                      onChange={e => updateState(s => ({ ...s, character: { ...s.character, notes: e.target.value } as any }))}
                    />

                    {/* Talents section */}
                    <div className="book-page-header" style={{ fontSize: "1.2rem", marginTop: "15px", marginBottom: "10px" }}>
                      <span>Unlocked Talents</span>
                    </div>
                    <div style={{ maxHeight: "160px", overflowY: "auto", fontSize: "0.85rem" }}>
                      {state.character.unlockedTalents.map((t, idx) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", borderBottom: "1px dashed rgba(42,37,33,0.15)", padding: "5px 0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "var(--color-gold)", fontWeight: "bold" }}>◆ {t}</span>
                            <button 
                              className="delete-btn" 
                              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                              onClick={() => updateState(s => ({ ...s, character: { ...s.character, unlockedTalents: s.character.unlockedTalents.filter((_, i) => i !== idx) } }))}
                            >&times;</button>
                          </div>
                          {TALENT_DESCRIPTIONS[t] && (
                            <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "2px", lineHeight: "1.3" }}>
                              {renderTextWithRules(TALENT_DESCRIPTIONS[t], showRule)}
                            </div>
                          )}
                        </div>
                      ))}
                      {state.character.unlockedTalents.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>습득된 고유 재능이 없습니다.</p>
                      )}
                    </div>

                    {/* Spellbook section */}
                    <div className="grimoire-spellbook-container" style={{
                      background: "transparent",
                      border: "1px solid var(--border-color)",
                      padding: "15px",
                      borderRadius: 0,
                      boxShadow: "none",
                      color: "var(--text-normal)",
                      marginTop: "15px"
                    }}>
                      <div className="book-page-header" style={{ 
                        fontSize: "1.1rem", 
                        fontWeight: "bold",
                        textAlign: "center",
                        borderBottom: "1px solid var(--border-color)",
                        paddingBottom: "5px",
                        marginBottom: "10px",
                        color: "var(--text-bright)",
                        fontFamily: "Georgia, serif"
                      }}>
                        Grimoire (비문 마도서)
                      </div>
                      <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                        {(state.character.spellbook || []).map((spell, idx) => {
                          const parts = spell.split(":");
                          const namePart = parts[0];
                          const effectPart = parts[1] || "";
                          
                          return (
                            <div key={idx} style={{ 
                              borderBottom: "1px dashed rgba(139,90,43,0.3)", 
                              padding: "6px 0", 
                              display: "flex", 
                              flexDirection: "column",
                              fontSize: "0.82rem"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong style={{ color: "var(--text-bright)" }}>{namePart}</strong>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  <button 
                                    className="btn-medieval-small"
                                    style={{ 
                                      fontSize: "0.68rem", 
                                      padding: "2px 5px", 
                                      background: "transparent", 
                                      color: "var(--text-bright)", 
                                      border: "1px solid var(--border-color)",
                                      borderRadius: 0 
                                    }}
                                    onClick={() => prepareSpellCast(spell)}
                                  >
                                    시전
                                  </button>
                                  <button 
                                    className="delete-btn" 
                                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#666", fontSize: "1.1rem", padding: 0 }}
                                    onClick={() => {
                                      if (confirm(`주문첩에서 [${spell}] 주문을 영구히 삭제하시겠습니까?`)) {
                                        updateState(s => ({ 
                                          ...s, 
                                          character: { 
                                            ...s.character, 
                                            spellbook: (s.character.spellbook || []).filter((_, i) => i !== idx) 
                                          } 
                                        }));
                                      }
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              </div>
                              {effectPart && (
                                <div style={{ fontSize: "0.72rem", color: "#555", marginTop: "3px", fontStyle: "italic", paddingLeft: "12px" }}>
                                  {effectPart}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {(state.character.spellbook || []).length === 0 && (
                          <p style={{ color: "#777", fontStyle: "italic", fontSize: "0.8rem", textAlign: "center", margin: "10px 0" }}>기록된 비문 마법 주문이 없습니다.</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Friends, Foes & Hirelings Hanging Scrolls Grid */}
                <div className="scrolls-grid">
                  
                  {/* Friends Scroll */}
                  <div className="hanging-scroll-box scroll-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "3px", marginBottom: "10px" }}>
                      <h5 style={{ border: "none", margin: 0, fontSize: "0.9rem" }}>FRIENDS (인연)</h5>
                      <button 
                        className="btn-medieval-small" 
                        onClick={() => {
                          const name = prompt("친구 이름을 적으세요:\n(취소 시 취소, 입력 없이 확인 시 '새로운 친구'로 저장)");
                          if (name === null) return;
                          const info = prompt("설명을 적으세요:\n(취소 시 취소, 입력 없이 확인 시 '소개 없음'으로 저장)");
                          if (info === null) return;
                          updateState(s => {
                            const friendName = name.trim() || "새로운 친구";
                            const friendInfo = info.trim() || "소개 없음";
                            const memoryText = `[제 ${s.day}일 제 ${s.watch}워치] 새로운 인연으로 맺어짐`;
                            return {
                              ...s,
                              character: {
                                ...s.character,
                                friends: [
                                  ...s.character.friends,
                                  {
                                    name: friendName,
                                    info: friendInfo,
                                    relationship: 'Neutral',
                                    memoryLogs: [memoryText]
                                  }
                                ]
                              },
                              journals: [
                                {
                                  id: generateUniqueId(),
                                  text: `[인연 등록] ${friendName}: ${friendInfo}`,
                                  date: new Date().toLocaleString(),
                                  day: s.day,
                                  watch: s.watch
                                },
                                ...s.journals
                              ]
                            };
                          });
                        }}
                      >+</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "260px", overflowY: "auto", fontSize: "0.8rem" }}>
                      {state.character.friends.map((f, i) => {
                        const isExpanded = expandedFriendIdx === i;
                        const recentJournals = state.journals.slice(0, 10);
                        return (
                          <div key={i} style={{ borderBottom: "1px dashed rgba(0,0,0,0.15)", paddingBottom: "6px", paddingTop: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }} onClick={() => setExpandedFriendIdx(isExpanded ? null : i)}>
                                <span style={{ fontSize: "0.65rem", color: "var(--color-gold)" }}>{isExpanded ? "▼" : "▶"}</span>
                                <strong>{f.name || "이름 없는 친구"}</strong>
                              </div>
                              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                                <select
                                  value={f.relationship || "Neutral"}
                                  onChange={(e) => {
                                    const newRel = e.target.value as any;
                                    updateState(s => {
                                      const newFriends = [...s.character.friends];
                                      const prevRel = newFriends[i].relationship || "Neutral";
                                      const relMap: Record<string, string> = {
                                        Devoted: "헌신적",
                                        Friendly: "우호적",
                                        Neutral: "중립적",
                                        Wary: "경계함",
                                        Hostile: "적대적"
                                      };
                                      const dateStr = `제 ${s.day}일 제 ${s.watch}워치`;
                                      const logMsg = `[${dateStr}] 관계 변경: ${relMap[prevRel]} ➔ ${relMap[newRel]}`;
                                      
                                      newFriends[i] = {
                                        ...newFriends[i],
                                        relationship: newRel,
                                        memoryLogs: [...(newFriends[i].memoryLogs || []), logMsg]
                                      };
                                      return {
                                        ...s,
                                        character: { ...s.character, friends: newFriends },
                                        journals: [
                                          {
                                            id: generateUniqueId(),
                                            text: `[인연 관계 변화] ${newFriends[i].name}: ${logMsg}`,
                                            date: new Date().toLocaleString(),
                                            day: s.day,
                                            watch: s.watch
                                          },
                                          ...s.journals
                                        ]
                                      };
                                    });
                                  }}
                                  style={{
                                    fontSize: "0.68rem",
                                    background: "rgba(0,0,0,0.3)",
                                    color: getRelationshipColor(f.relationship || "Neutral"),
                                    border: `1px solid ${getRelationshipColor(f.relationship || "Neutral")}`,
                                    borderRadius: "3px",
                                    padding: "0 2px",
                                    cursor: "pointer",
                                    height: "18px"
                                  }}
                                >
                                  <option value="Devoted" style={{ background: "#222", color: "#85bb65" }}>헌신적</option>
                                  <option value="Friendly" style={{ background: "#222", color: "#4caf50" }}>우호적</option>
                                  <option value="Neutral" style={{ background: "#222", color: "#bbb" }}>중립적</option>
                                  <option value="Wary" style={{ background: "#222", color: "#ff9800" }}>경계함</option>
                                  <option value="Hostile" style={{ background: "#222", color: "#f44336" }}>적대적</option>
                                </select>
                                <button className="delete-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => {
                                  if (confirm(`${f.name} 친구를 삭제하시겠습니까?`)) {
                                    updateState(s => ({ ...s, character: { ...s.character, friends: s.character.friends.filter((_, idx) => idx !== i) } }));
                                  }
                                }}>&times;</button>
                              </div>
                            </div>
                            <div style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.75rem", paddingLeft: "10px", marginTop: "2px" }}>{f.info || "설명 없음"}</div>
                            {f.memoryLogs && f.memoryLogs.length > 0 && (
                              <div style={{ fontSize: "0.7rem", color: "var(--color-gold)", paddingLeft: "10px", marginTop: "2px", opacity: 0.85 }}>
                                📜 최근 기록: {f.memoryLogs[f.memoryLogs.length - 1]}
                              </div>
                            )}
                            
                            {isExpanded && (
                              <div style={{ marginLeft: "10px", marginTop: "6px", borderLeft: "1px solid rgba(255, 215, 0, 0.2)", background: "rgba(0,0,0,0.15)", padding: "8px", borderRadius: "3px" }}>
                                {/* Inline editable fields */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "8px" }}>
                                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.68rem", color: "#888", width: "40px" }}>이름:</span>
                                    <input
                                      type="text"
                                      value={f.name}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateState(s => {
                                          const newFriends = [...s.character.friends];
                                          newFriends[i] = { ...newFriends[i], name: val };
                                          return { ...s, character: { ...s.character, friends: newFriends } };
                                        });
                                      }}
                                      style={{ fontSize: "0.72rem", background: "rgba(0,0,0,0.4)", border: "1px solid #444", color: "#fff", borderRadius: "3px", padding: "1px 4px", flex: 1 }}
                                    />
                                  </div>
                                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.68rem", color: "#888", width: "40px" }}>설명:</span>
                                    <input
                                      type="text"
                                      value={f.info}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateState(s => {
                                          const newFriends = [...s.character.friends];
                                          newFriends[i] = { ...newFriends[i], info: val };
                                          return { ...s, character: { ...s.character, friends: newFriends } };
                                        });
                                      }}
                                      style={{ fontSize: "0.72rem", background: "rgba(0,0,0,0.4)", border: "1px solid #444", color: "#fff", borderRadius: "3px", padding: "1px 4px", flex: 1 }}
                                    />
                                  </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px" }}>
                                  <span style={{ fontSize: "0.7rem", color: "var(--color-gold)", fontWeight: "bold" }}>기억의 단편 (Memory Logs)</span>
                                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        const selectedVal = e.target.value;
                                        if (!selectedVal) return;
                                        updateState(s => {
                                          const newFriends = [...s.character.friends];
                                          const logs = Array.isArray(newFriends[i].memoryLogs) ? [...newFriends[i].memoryLogs!] : [];
                                          newFriends[i] = { ...newFriends[i], memoryLogs: [...logs, selectedVal] };
                                          return {
                                            ...s,
                                            character: { ...s.character, friends: newFriends },
                                            journals: [
                                              {
                                                id: generateUniqueId(),
                                                text: `[인연 기억 연결] ${newFriends[i].name}: ${selectedVal}`,
                                                date: new Date().toLocaleString(),
                                                day: s.day,
                                                watch: s.watch
                                              },
                                              ...s.journals
                                            ]
                                          };
                                        });
                                      }}
                                      style={{
                                        fontSize: "0.65rem",
                                        background: "rgba(0,0,0,0.4)",
                                        color: "var(--color-gold)",
                                        border: "1px solid var(--color-gold)",
                                        borderRadius: "3px",
                                        padding: "1px 3px",
                                        maxWidth: "110px",
                                        height: "18px"
                                      }}
                                    >
                                      <option value="" style={{ color: "#888" }}>일지 연결...</option>
                                      {recentJournals.map(j => {
                                        const displayDate = `Day ${j.day || 1} W${j.watch || 1}`;
                                        const snippet = j.text.length > 15 ? j.text.slice(0, 15) + "..." : j.text;
                                        const optionVal = `[일지 - ${displayDate}] ${j.text}`;
                                        return (
                                          <option key={j.id} value={optionVal} style={{ background: "#222", color: "#fff" }}>
                                            [{displayDate}] {snippet}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <button
                                      className="btn-medieval-small"
                                      style={{ fontSize: "0.6rem", padding: "0 3px", height: "18px" }}
                                      onClick={() => {
                                        const log = prompt("기록할 기억/사건을 작성하세요:\n(취소 시 취소, 입력 없이 확인 시 '새로운 기억'으로 저장)");
                                        if (log === null) return;
                                        const finalLog = log.trim() || "새로운 기억";
                                        updateState(s => {
                                          const newFriends = [...s.character.friends];
                                          const logs = Array.isArray(newFriends[i].memoryLogs) ? [...newFriends[i].memoryLogs!] : [];
                                          newFriends[i] = { ...newFriends[i], memoryLogs: [...logs, finalLog] };
                                          return {
                                            ...s,
                                            character: { ...s.character, friends: newFriends },
                                            journals: [
                                              {
                                                id: generateUniqueId(),
                                                text: `[인연 기억] ${newFriends[i].name}: ${finalLog}`,
                                                date: new Date().toLocaleString(),
                                                day: s.day,
                                                watch: s.watch
                                              },
                                              ...s.journals
                                            ]
                                          };
                                        });
                                      }}
                                    >
                                      + 추가
                                    </button>
                                  </div>
                                </div>
                                {(!f.memoryLogs || f.memoryLogs.length === 0) ? (
                                  <div style={{ fontSize: "0.68rem", color: "#666", fontStyle: "italic" }}>기록이 없습니다.</div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "80px", overflowY: "auto" }}>
                                    {f.memoryLogs.map((log, lIdx) => (
                                      <div key={lIdx} style={{ fontSize: "0.7rem", color: "#ccc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ wordBreak: "break-all", paddingRight: "5px" }}>&bull; {log}</span>
                                        <button
                                          style={{ background: "transparent", border: "none", color: "#999", cursor: "pointer", fontSize: "0.7rem", padding: "0 2px" }}
                                          onClick={() => {
                                            if (confirm("기록을 삭제할까요?")) {
                                              updateState(s => {
                                                const newFriends = [...s.character.friends];
                                                newFriends[i] = {
                                                  ...newFriends[i],
                                                  memoryLogs: newFriends[i].memoryLogs?.filter((_, idx) => idx !== lIdx)
                                                };
                                                return { ...s, character: { ...s.character, friends: newFriends } };
                                              });
                                            }
                                          }}
                                        >
                                          &times;
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {state.character.friends.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.75rem", margin: "10px 0" }}>등록된 인연이 없습니다.</p>
                      )}
                    </div>
                  </div>

                  {/* Foes Scroll */}
                  <div className="hanging-scroll-box scroll-card" style={{ borderColor: "var(--color-crimson)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-crimson)", paddingBottom: "3px", marginBottom: "10px" }}>
                      <h5 style={{ border: "none", margin: 0, fontSize: "0.9rem", color: "var(--color-crimson)" }}>FOES (원수)</h5>
                      <button 
                        className="btn-medieval-small danger" 
                        onClick={() => {
                          const name = prompt("원수 이름을 적으세요:\n(취소 시 취소, 입력 없이 확인 시 '새로운 원수'로 저장)");
                          if (name === null) return;
                          const info = prompt("설명을 적으세요:\n(취소 시 취소, 입력 없이 확인 시 '소개 없음'으로 저장)");
                          if (info === null) return;
                          updateState(s => {
                            const foeName = name.trim() || "새로운 원수";
                            const foeInfo = info.trim() || "소개 없음";
                            const memoryText = `[제 ${s.day}일 제 ${s.watch}워치] 원수로 기록됨`;
                            return {
                              ...s,
                              character: {
                                ...s.character,
                                foes: [
                                  ...s.character.foes,
                                  {
                                    name: foeName,
                                    info: foeInfo,
                                    relationship: 'Neutral',
                                    memoryLogs: [memoryText]
                                  }
                                ]
                              },
                              journals: [
                                {
                                  id: generateUniqueId(),
                                  text: `[원수 등록] ${foeName}: ${foeInfo}`,
                                  date: new Date().toLocaleString(),
                                  day: s.day,
                                  watch: s.watch
                                },
                                ...s.journals
                              ]
                            };
                          });
                        }}
                      >+</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "260px", overflowY: "auto", fontSize: "0.8rem" }}>
                      {state.character.foes.map((f, i) => {
                        const isExpanded = expandedFoeIdx === i;
                        const recentJournals = state.journals.slice(0, 10);
                        return (
                          <div key={i} style={{ borderBottom: "1px dashed rgba(220,53,69,0.15)", paddingBottom: "6px", paddingTop: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }} onClick={() => setExpandedFoeIdx(isExpanded ? null : i)}>
                                <span style={{ fontSize: "0.65rem", color: "var(--color-crimson)" }}>{isExpanded ? "▼" : "▶"}</span>
                                <strong style={{ color: "var(--color-crimson)" }}>{f.name || "이름 없는 원수"}</strong>
                              </div>
                              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                                <select
                                  value={f.relationship || "Neutral"}
                                  onChange={(e) => {
                                    const newRel = e.target.value as any;
                                    updateState(s => {
                                      const newFoes = [...s.character.foes];
                                      const prevRel = newFoes[i].relationship || "Neutral";
                                      const relMap: Record<string, string> = {
                                        Devoted: "헌신적",
                                        Friendly: "우호적",
                                        Neutral: "중립적",
                                        Wary: "경계함",
                                        Hostile: "적대적"
                                      };
                                      const dateStr = `제 ${s.day}일 제 ${s.watch}워치`;
                                      const logMsg = `[${dateStr}] 관계 변경: ${relMap[prevRel]} ➔ ${relMap[newRel]}`;
                                      
                                      newFoes[i] = {
                                        ...newFoes[i],
                                        relationship: newRel,
                                        memoryLogs: [...(newFoes[i].memoryLogs || []), logMsg]
                                      };
                                      return {
                                        ...s,
                                        character: { ...s.character, foes: newFoes },
                                        journals: [
                                          {
                                            id: generateUniqueId(),
                                            text: `[원수 관계 변화] ${newFoes[i].name}: ${logMsg}`,
                                            date: new Date().toLocaleString(),
                                            day: s.day,
                                            watch: s.watch
                                          },
                                          ...s.journals
                                        ]
                                      };
                                    });
                                  }}
                                  style={{
                                    fontSize: "0.68rem",
                                    background: "rgba(0,0,0,0.3)",
                                    color: getRelationshipColor(f.relationship || "Neutral"),
                                    border: `1px solid ${getRelationshipColor(f.relationship || "Neutral")}`,
                                    borderRadius: "3px",
                                    padding: "0 2px",
                                    cursor: "pointer",
                                    height: "18px"
                                  }}
                                >
                                  <option value="Devoted" style={{ background: "#222", color: "#85bb65" }}>헌신적</option>
                                  <option value="Friendly" style={{ background: "#222", color: "#4caf50" }}>우호적</option>
                                  <option value="Neutral" style={{ background: "#222", color: "#bbb" }}>중립적</option>
                                  <option value="Wary" style={{ background: "#222", color: "#ff9800" }}>경계함</option>
                                  <option value="Hostile" style={{ background: "#222", color: "#f44336" }}>적대적</option>
                                </select>
                                <button className="delete-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => {
                                  if (confirm(`${f.name} 원수를 목록에서 삭제하시겠습니까?`)) {
                                    updateState(s => ({ ...s, character: { ...s.character, foes: s.character.foes.filter((_, idx) => idx !== i) } }));
                                  }
                                }}>&times;</button>
                              </div>
                            </div>
                            <div style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.75rem", paddingLeft: "10px", marginTop: "2px" }}>{f.info || "설명 없음"}</div>
                            {f.memoryLogs && f.memoryLogs.length > 0 && (
                              <div style={{ fontSize: "0.7rem", color: "var(--color-gold)", paddingLeft: "10px", marginTop: "2px", opacity: 0.85 }}>
                                📜 최근 기록: {f.memoryLogs[f.memoryLogs.length - 1]}
                              </div>
                            )}
                            
                            {isExpanded && (
                              <div style={{ marginLeft: "10px", marginTop: "6px", borderLeft: "1px solid rgba(220, 53, 69, 0.2)", background: "rgba(0,0,0,0.15)", padding: "8px", borderRadius: "3px" }}>
                                {/* Inline editable fields */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "8px" }}>
                                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.68rem", color: "#888", width: "40px" }}>이름:</span>
                                    <input
                                      type="text"
                                      value={f.name}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateState(s => {
                                          const newFoes = [...s.character.foes];
                                          newFoes[i] = { ...newFoes[i], name: val };
                                          return { ...s, character: { ...s.character, foes: newFoes } };
                                        });
                                      }}
                                      style={{ fontSize: "0.72rem", background: "rgba(0,0,0,0.4)", border: "1px solid #444", color: "#fff", borderRadius: "3px", padding: "1px 4px", flex: 1 }}
                                    />
                                  </div>
                                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.68rem", color: "#888", width: "40px" }}>설명:</span>
                                    <input
                                      type="text"
                                      value={f.info}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateState(s => {
                                          const newFoes = [...s.character.foes];
                                          newFoes[i] = { ...newFoes[i], info: val };
                                          return { ...s, character: { ...s.character, foes: newFoes } };
                                        });
                                      }}
                                      style={{ fontSize: "0.72rem", background: "rgba(0,0,0,0.4)", border: "1px solid #444", color: "#fff", borderRadius: "3px", padding: "1px 4px", flex: 1 }}
                                    />
                                  </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px" }}>
                                  <span style={{ fontSize: "0.7rem", color: "var(--color-crimson)", fontWeight: "bold" }}>악연의 역사 (Memory Logs)</span>
                                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        const selectedVal = e.target.value;
                                        if (!selectedVal) return;
                                        updateState(s => {
                                          const newFoes = [...s.character.foes];
                                          const logs = Array.isArray(newFoes[i].memoryLogs) ? [...newFoes[i].memoryLogs!] : [];
                                          newFoes[i] = { ...newFoes[i], memoryLogs: [...logs, selectedVal] };
                                          return {
                                            ...s,
                                            character: { ...s.character, foes: newFoes },
                                            journals: [
                                              {
                                                id: generateUniqueId(),
                                                text: `[원수 기억 연결] ${newFoes[i].name}: ${selectedVal}`,
                                                date: new Date().toLocaleString(),
                                                day: s.day,
                                                watch: s.watch
                                              },
                                              ...s.journals
                                            ]
                                          };
                                        });
                                      }}
                                      style={{
                                        fontSize: "0.65rem",
                                        background: "rgba(0,0,0,0.4)",
                                        color: "var(--color-gold)",
                                        border: "1px solid var(--color-gold)",
                                        borderRadius: "3px",
                                        padding: "1px 3px",
                                        maxWidth: "110px",
                                        height: "18px"
                                      }}
                                    >
                                      <option value="" style={{ color: "#888" }}>일지 연결...</option>
                                      {recentJournals.map(j => {
                                        const displayDate = `Day ${j.day || 1} W${j.watch || 1}`;
                                        const snippet = j.text.length > 15 ? j.text.slice(0, 15) + "..." : j.text;
                                        const optionVal = `[일지 - ${displayDate}] ${j.text}`;
                                        return (
                                          <option key={j.id} value={optionVal} style={{ background: "#222", color: "#fff" }}>
                                            [{displayDate}] {snippet}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <button
                                      className="btn-medieval-small danger"
                                      style={{ fontSize: "0.6rem", padding: "0 3px", height: "18px" }}
                                      onClick={() => {
                                        const log = prompt("기록할 원수와의 사건을 작성하세요:\n(취소 시 취소, 입력 없이 확인 시 '새로운 악연'으로 저장)");
                                        if (log === null) return;
                                        const finalLog = log.trim() || "새로운 악연";
                                        updateState(s => {
                                          const newFoes = [...s.character.foes];
                                          const logs = Array.isArray(newFoes[i].memoryLogs) ? [...newFoes[i].memoryLogs!] : [];
                                          newFoes[i] = { ...newFoes[i], memoryLogs: [...logs, finalLog] };
                                          return {
                                            ...s,
                                            character: { ...s.character, foes: newFoes },
                                            journals: [
                                              {
                                                id: generateUniqueId(),
                                                text: `[원수 기억] ${newFoes[i].name}: ${finalLog}`,
                                                date: new Date().toLocaleString(),
                                                day: s.day,
                                                watch: s.watch
                                              },
                                              ...s.journals
                                            ]
                                          };
                                        });
                                      }}
                                    >
                                      + 추가
                                    </button>
                                  </div>
                                </div>
                                {(!f.memoryLogs || f.memoryLogs.length === 0) ? (
                                  <div style={{ fontSize: "0.68rem", color: "#666", fontStyle: "italic" }}>기록이 없습니다.</div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "80px", overflowY: "auto" }}>
                                    {f.memoryLogs.map((log, lIdx) => (
                                      <div key={lIdx} style={{ fontSize: "0.7rem", color: "#ccc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ wordBreak: "break-all", paddingRight: "5px" }}>&bull; {log}</span>
                                        <button
                                          style={{ background: "transparent", border: "none", color: "#999", cursor: "pointer", fontSize: "0.7rem", padding: "0 2px" }}
                                          onClick={() => {
                                            if (confirm("기록을 삭제할까요?")) {
                                              updateState(s => {
                                                const newFoes = [...s.character.foes];
                                                newFoes[i] = {
                                                  ...newFoes[i],
                                                  memoryLogs: newFoes[i].memoryLogs?.filter((_, idx) => idx !== lIdx)
                                                };
                                                return { ...s, character: { ...s.character, foes: newFoes } };
                                              });
                                            }
                                          }}
                                        >
                                          &times;
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {state.character.foes.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.75rem", margin: "10px 0" }}>등록된 원수가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  {/* Hirelings Scroll */}
                  <div className="hanging-scroll-box scroll-card" style={{ borderColor: "var(--color-gold)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-gold)", paddingBottom: "3px", marginBottom: "10px" }}>
                      <h5 style={{ border: "none", margin: 0, fontSize: "0.9rem", color: "var(--color-gold)" }}>
                        HIRELINGS (용병 {state.character.hirelings?.length || 0}/{state.character.stats.cups})
                      </h5>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button 
                          className="btn-medieval-small" 
                          onClick={searchAndHirelingTest}
                          title="용병 구인 및 고용 판정 (Cups & Coins Test)"
                          style={{ fontSize: "0.7rem", padding: "2px 4px" }}
                        >구인판정</button>
                        <button 
                          className="btn-medieval-small" 
                          onClick={addHireling}
                          title="직접 추가"
                        >+</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "260px", overflowY: "auto", fontSize: "0.8rem" }}>
                      {(() => {
                        const activeHirelings = (state.character.hirelings || []).map((h, originalIdx) => ({ h, originalIdx })).filter(item => item.h.deceased !== true);
                        const deceasedHirelings = (state.character.hirelings || []).map((h, originalIdx) => ({ h, originalIdx })).filter(item => item.h.deceased === true);

                        return (
                          <>
                            {activeHirelings.map((item) => {
                              const h = item.h;
                              const i = item.originalIdx;
                              const isExpanded = expandedHirelingIdx === i;
                              const loyaltyVal = typeof h.loyalty === 'number' ? h.loyalty : 5;
                              const maxW = typeof h.maxWounds === 'number' ? h.maxWounds : 2;
                              const wTaken = typeof h.woundsTaken === 'number' ? h.woundsTaken : 0;
                              const recentJournals = state.journals.slice(0, 10);

                              return (
                                <div key={i} style={{ borderBottom: "1px dashed rgba(212,175,55,0.2)", paddingBottom: "6px", paddingTop: "4px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }} onClick={() => setExpandedHirelingIdx(isExpanded ? null : i)}>
                                      <span style={{ fontSize: "0.65rem", color: "var(--color-gold)" }}>{isExpanded ? "▼" : "▶"}</span>
                                      <strong style={{ color: "var(--color-gold)" }}>{h.name || "이름 없는 용병"}</strong>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                      <label style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.7rem", color: h.paidThisWeek ? "#85bb65" : "#ff9800", cursor: "pointer", userSelect: "none" }}>
                                        <input 
                                          type="checkbox"
                                          checked={!!h.paidThisWeek}
                                          onChange={(e) => {
                                            const checked = e.target.checked;
                                            updateState(s => {
                                              const newH = [...s.character.hirelings];
                                              newH[i] = { ...newH[i], paidThisWeek: checked };
                                              return { ...s, character: { ...s.character, hirelings: newH } };
                                            });
                                          }}
                                          style={{ margin: 0 }}
                                        />
                                        급여지급
                                      </label>
                                      <button 
                                        className="btn-medieval-small" 
                                        style={{ fontSize: "0.62rem", padding: "1px 3px", background: "transparent", color: "var(--color-gold)", border: "1px solid var(--color-gold)", height: "18px" }}
                                        onClick={() => payWeeklyHireling(i)}
                                        title="주간 급여 Coins 판정"
                                      >급여판정</button>
                                      <button className="delete-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => {
                                        if (confirm(`${h.name} 용병을 해고/목록 삭제하시겠습니까?`)) {
                                          updateState(s => ({ ...s, character: { ...s.character, hirelings: s.character.hirelings.filter((_, idx) => idx !== i) } }));
                                        }
                                      }}>&times;</button>
                                    </div>
                                  </div>
                                  
                                  <div style={{ display: "flex", gap: "10px", fontSize: "0.72rem", color: "#bbb", paddingLeft: "10px", marginTop: "2px", alignItems: "center" }}>
                                    <span style={{ fontStyle: "italic", color: "var(--text-muted)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.info || "설명 없음"}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                      <span style={{ color: "#888", fontSize: "0.65rem" }}>부상:</span>
                                      {Array.from({ length: maxW }).map((_, wIdx) => {
                                        const isWounded = wIdx < wTaken;
                                        return (
                                          <span
                                            key={wIdx}
                                            onClick={() => {
                                              updateState(s => {
                                                const newH = [...s.character.hirelings];
                                                const nextWounds = isWounded ? wIdx : wIdx + 1;
                                                newH[i] = { ...newH[i], woundsTaken: nextWounds };
                                                
                                                const isDead = nextWounds >= maxW;
                                                let nextJournals = [...s.journals];
                                                const cell = s.selectedMapCellIdx !== null ? s.mapGrid[s.selectedMapCellIdx] : null;
                                                if (isDead) {
                                                  newH[i] = {
                                                    ...newH[i],
                                                    deceased: true,
                                                    deathDay: s.day,
                                                    deathCell: { x: cell ? cell.x : 0, y: cell ? cell.y : 0 }
                                                  };
                                                  nextJournals = [
                                                    {
                                                      id: generateUniqueId(),
                                                      text: `🕯 [용병 사망] 당신을 지탱해 주던 동료 용병 ${h.name || "이름 없음"}이(가) 치명상을 입고 목숨을 잃었습니다.`,
                                                      date: new Date().toLocaleString(),
                                                      day: s.day,
                                                      watch: s.watch,
                                                      pinned: true,
                                                      systemGenerated: true,
                                                      chronicle: true,
                                                      chronicleCategory: "hireling_death",
                                                      chronicleIcon: "🕯"
                                                    },
                                                    ...nextJournals
                                                  ];
                                                }
                                                return { 
                                                  ...s, 
                                                  character: { ...s.character, hirelings: newH },
                                                  journals: nextJournals
                                                };
                                              });
                                            }}
                                            style={{
                                              cursor: "pointer",
                                              fontSize: "0.75rem",
                                              userSelect: "none"
                                            }}
                                            title={isWounded ? "부상 치료" : "부상 추가"}
                                          >
                                            {isWounded ? "❤️" : "🖤"}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <span style={{ color: "var(--color-gold)", fontSize: "0.68rem" }}>충성도: {loyaltyVal}</span>
                                  </div>
                                  {h.memoryLogs && h.memoryLogs.length > 0 && (
                                    <div style={{ fontSize: "0.7rem", color: "var(--color-gold)", paddingLeft: "10px", marginTop: "2px", opacity: 0.85 }}>
                                      📜 최근 기록: {h.memoryLogs[h.memoryLogs.length - 1]}
                                    </div>
                                  )}

                                  {isExpanded && (
                                    <div style={{ marginLeft: "10px", marginTop: "6px", borderLeft: "1px solid rgba(255, 215, 0, 0.2)", background: "rgba(0,0,0,0.15)", padding: "8px", borderRadius: "3px" }}>
                                      {/* Inline editable fields */}
                                      <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "8px" }}>
                                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                                          <span style={{ fontSize: "0.68rem", color: "#888", width: "40px" }}>이름:</span>
                                          <input
                                            type="text"
                                            value={h.name}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              updateState(s => {
                                                const newH = [...s.character.hirelings];
                                                newH[i] = { ...newH[i], name: val };
                                                return { ...s, character: { ...s.character, hirelings: newH } };
                                              });
                                            }}
                                            style={{ fontSize: "0.72rem", background: "rgba(0,0,0,0.4)", border: "1px solid #444", color: "#fff", borderRadius: "3px", padding: "1px 4px", flex: 1 }}
                                          />
                                        </div>
                                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                                          <span style={{ fontSize: "0.68rem", color: "#888", width: "40px" }}>설명:</span>
                                          <input
                                            type="text"
                                            value={h.info}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              updateState(s => {
                                                const newH = [...s.character.hirelings];
                                                newH[i] = { ...newH[i], info: val };
                                                return { ...s, character: { ...s.character, hirelings: newH } };
                                              });
                                            }}
                                            style={{ fontSize: "0.72rem", background: "rgba(0,0,0,0.4)", border: "1px solid #444", color: "#fff", borderRadius: "3px", padding: "1px 4px", flex: 1 }}
                                          />
                                        </div>
                                      </div>

                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px" }}>
                                        <span style={{ fontSize: "0.68rem", color: "#888", whiteSpace: "nowrap" }}>충성도 조정:</span>
                                        <input 
                                          type="range"
                                          min="0"
                                          max="10"
                                          value={loyaltyVal}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            updateState(s => {
                                              const newH = [...s.character.hirelings];
                                              newH[i] = { ...newH[i], loyalty: val };
                                              return { ...s, character: { ...s.character, hirelings: newH } };
                                            });
                                          }}
                                          style={{ flex: 1, height: "4px", background: "#444", outline: "none", cursor: "pointer" }}
                                        />
                                        <span style={{ fontSize: "0.68rem", color: "var(--color-gold)", width: "15px", textAlign: "right" }}>{loyaltyVal}</span>
                                      </div>

                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "5px", marginBottom: "4px" }}>
                                        <span style={{ fontSize: "0.7rem", color: "var(--color-gold)", fontWeight: "bold" }}>용병 활동 및 계약 (Memory Logs)</span>
                                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                          <select
                                            value=""
                                            onChange={(e) => {
                                              const selectedVal = e.target.value;
                                              if (!selectedVal) return;
                                              updateState(s => {
                                                const newH = [...s.character.hirelings];
                                                const logs = Array.isArray(newH[i].memoryLogs) ? [...newH[i].memoryLogs!] : [];
                                                newH[i] = { ...newH[i], memoryLogs: [...logs, selectedVal] };
                                                return { ...s, character: { ...s.character, hirelings: newH } };
                                              });
                                            }}
                                            style={{
                                              fontSize: "0.65rem",
                                              background: "rgba(0,0,0,0.4)",
                                              color: "var(--color-gold)",
                                              border: "1px solid var(--color-gold)",
                                              borderRadius: "3px",
                                              padding: "1px 3px",
                                              maxWidth: "110px",
                                              height: "18px"
                                            }}
                                          >
                                            <option value="" style={{ color: "#888" }}>일지 연결...</option>
                                            {recentJournals.map(j => {
                                              const displayDate = `Day ${j.day || 1} W${j.watch || 1}`;
                                              const snippet = j.text.length > 15 ? j.text.slice(0, 15) + "..." : j.text;
                                              const optionVal = `[일지 - ${displayDate}] ${j.text}`;
                                              return (
                                                <option key={j.id} value={optionVal} style={{ background: "#222", color: "#fff" }}>
                                                  [{displayDate}] {snippet}
                                                </option>
                                              );
                                            })}
                                          </select>
                                          <button
                                            className="btn-medieval-small"
                                            style={{ fontSize: "0.6rem", padding: "0 3px", height: "18px" }}
                                            onClick={() => {
                                              const log = prompt("기록할 용병의 계약/전투 실적 등을 입력하세요:\n(취소 시 취소, 입력 없이 확인 시 '새로운 계약'으로 저장)");
                                              if (log === null) return;
                                              const finalLog = log.trim() || "새로운 계약";
                                              updateState(s => {
                                                const newH = [...s.character.hirelings];
                                                const logs = Array.isArray(newH[i].memoryLogs) ? [...newH[i].memoryLogs!] : [];
                                                newH[i] = { ...newH[i], memoryLogs: [...logs, finalLog] };
                                                return { ...s, character: { ...s.character, hirelings: newH } };
                                              });
                                            }}
                                          >
                                            + 추가
                                          </button>
                                        </div>
                                      </div>
                                      {(!h.memoryLogs || h.memoryLogs.length === 0) ? (
                                        <div style={{ fontSize: "0.68rem", color: "#666", fontStyle: "italic" }}>기록된 활동이 없습니다.</div>
                                      ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "80px", overflowY: "auto" }}>
                                          {h.memoryLogs.map((log, lIdx) => (
                                            <div key={lIdx} style={{ fontSize: "0.7rem", color: "#ccc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                              <span style={{ wordBreak: "break-all", paddingRight: "5px" }}>&bull; {log}</span>
                                              <button
                                                style={{ background: "transparent", border: "none", color: "#999", cursor: "pointer", fontSize: "0.7rem", padding: "0 2px" }}
                                                onClick={() => {
                                                  if (confirm("기록을 삭제할까요?")) {
                                                    updateState(s => {
                                                      const newH = [...s.character.hirelings];
                                                      newH[i] = {
                                                        ...newH[i],
                                                        memoryLogs: newH[i].memoryLogs?.filter((_, idx) => idx !== lIdx)
                                                      };
                                                      return { ...s, character: { ...s.character, hirelings: newH } };
                                                    });
                                                  }
                                                }}
                                              >
                                                &times;
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {activeHirelings.length === 0 && (
                              <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.75rem", margin: "10px 0" }}>고용된 용병이 없습니다 (최대 {state.character.stats.cups}명 가능).</p>
                            )}

                            {/* Deceased Memorial Sub-section */}
                            {deceasedHirelings.length > 0 && (
                              <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(212,175,55,0.3)", paddingTop: "8px" }}>
                                <span style={{ color: "#888", fontSize: "0.75rem", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                                  🕯️ Fallen Memorial (영면한 동료들)
                                </span>
                                {deceasedHirelings.map((item) => {
                                  const h = item.h;
                                  const deathDayText = h.deathDay ? `제 ${h.deathDay}일` : "알 수 없는 날";
                                  const deathCellText = h.deathCell ? `(${h.deathCell.x + 1}, ${h.deathCell.y + 1})` : "알 수 없는 구역";
                                  return (
                                    <div key={item.originalIdx} style={{
                                      background: "rgba(10, 10, 10, 0.4)",
                                      border: "1px dashed rgba(255, 255, 255, 0.15)",
                                      borderRadius: "3px",
                                      padding: "6px 10px",
                                      marginBottom: "4px",
                                      fontSize: "0.75rem",
                                      color: "#999",
                                      filter: "sepia(25%) brightness(85%)"
                                    }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <strong>🕯️ {h.name || "이름 없는 용병"}</strong>
                                        <button className="delete-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555" }} onClick={() => {
                                          if (confirm(`${h.name} 용병의 기록을 추모비에서 완전히 제거하시겠습니까?`)) {
                                            updateState(s => ({
                                              ...s,
                                              character: {
                                                ...s.character,
                                                hirelings: s.character.hirelings.filter((_, idx) => idx !== item.originalIdx)
                                              }
                                            }));
                                          }
                                        }}>&times;</button>
                                      </div>
                                      <div style={{ fontSize: "0.68rem", color: "#777", marginTop: "2px", fontStyle: "italic" }}>
                                        {deathDayText} {deathCellText} 구역에서 전사함.
                                      </div>
                                      {h.info && <div style={{ fontSize: "0.68rem", color: "#666", marginTop: "2px" }}>{h.info}</div>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                </div>

                {/* Quick Add shop & Talents List section */}
                <div className="card-panel" style={{ padding: "20px", marginTop: "20px" }}>
                  <h4 className="gothic-sub" style={{ fontSize: "1.1rem" }}>카탈로그 구매 &amp; 전체 재능 해금</h4>
                  
                  {/* Shop section */}
                  <div style={{ fontSize: "0.95rem" }}>
                    <div style={{ fontWeight: "bold", borderBottom: "1px solid var(--border-color)", paddingBottom: "3px" }}>빠른 장비 판정 구매 (Coins Test)</div>
                    <div style={{ display: "flex", gap: "8px", margin: "10px 0" }}>
                      <button className="btn-medieval-small" style={{ fontSize: "0.85rem", padding: "4px 8px" }} onClick={() => {
                        const item = prompt("장비 이름 (예: 단검):");
                        if (item) handleStartBuyTest({ name: item, nameKo: item, coinsMod: "0" });
                      }}>임의 아이템 Coins 판정</button>
                    </div>

                    {/* Shop Tabs */}
                    <div style={{ display: "flex", gap: "2px", marginBottom: "6px" }}>
                      {(["weapons", "armor", "trade"] as const).map(tab => (
                        <button
                          key={tab}
                          className={`btn-medieval-small${shopTab === tab ? "" : " danger"}`}
                          style={{
                            flex: 1,
                            fontSize: "0.72rem",
                            padding: "3px 2px",
                            opacity: shopTab === tab ? 1 : 0.55,
                            background: shopTab === tab ? "var(--bg-btn)" : "transparent"
                          }}
                          onClick={() => setShopTab(tab)}
                        >
                          {tab === "weapons" ? "무기" : tab === "armor" ? "방어구" : "교역품"}
                        </button>
                      ))}
                    </div>

                    <div style={{ border: "1px solid var(--border-color)", maxHeight: "160px", overflowY: "auto", padding: "6px", backgroundColor: "var(--bg-panel-light)" }}>
                      {shopTab === "weapons" && (
                        <>
                          <strong style={{ fontSize: "0.85rem", color: "var(--color-gold)" }}>무기 목록 (p.26):</strong>
                          {WEAPONS.map(w => (
                            <div key={w.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "3px 0", borderBottom: "1px dashed rgba(0,0,0,0.05)" }}>
                              <span>{w.nameKo} <span style={{ color: "#888", fontSize: "0.7rem" }}>피해:{w.wounds} 사거리:{w.range} Swords필요:{w.swordsReq}</span></span>
                              <button className="btn-medieval-small" style={{ fontSize: "0.72rem", padding: "2px 5px" }} onClick={() => handleStartBuyTest({ name: w.name, nameKo: w.nameKo, coinsMod: w.coins, swordsReq: w.swordsReq })}>Coins판정</button>
                            </div>
                          ))}
                        </>
                      )}

                      {shopTab === "armor" && (
                        <>
                          <strong style={{ fontSize: "0.85rem", color: "var(--color-gold)" }}>방어구 목록 (p.27):</strong>
                          {ARMOR.map(a => (
                            <div key={a.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "3px 0", borderBottom: "1px dashed rgba(0,0,0,0.05)" }}>
                              <span>{a.nameKo} <span style={{ color: "#888", fontSize: "0.7rem" }}>AP:{a.ap} 부위:{a.bodyPartKo} Swords필요:{a.swordsReq}</span></span>
                              <button className="btn-medieval-small" style={{ fontSize: "0.72rem", padding: "2px 5px" }} onClick={() => handleStartBuyTest({ name: a.name, nameKo: a.nameKo, coinsMod: a.coins, swordsReq: a.swordsReq })}>Coins판정</button>
                            </div>
                          ))}
                        </>
                      )}

                      {shopTab === "trade" && (
                        <>
                          <strong style={{ fontSize: "0.85rem", color: "var(--color-gold)" }}>교역품/모험 도구 (p.28-29):</strong>
                          <input
                            type="text"
                            placeholder="검색..."
                            value={tradeGoodsSearch}
                            onChange={e => setTradeGoodsSearch(e.target.value)}
                            style={{ width: "100%", padding: "3px 5px", fontSize: "0.78rem", margin: "5px 0", background: "rgba(0,0,0,0.2)", border: "1px solid #555", color: "var(--text-bright)", borderRadius: "3px" }}
                          />
                          {TRADE_GOODS.filter(g =>
                            !tradeGoodsSearch || g.nameKo.includes(tradeGoodsSearch) || g.name.toLowerCase().includes(tradeGoodsSearch.toLowerCase())
                          ).map(g => (
                            <div key={g.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "3px 0", borderBottom: "1px dashed rgba(0,0,0,0.05)" }}>
                              <span>{g.nameKo} <span style={{ color: "#888", fontSize: "0.7rem" }}>Coins:{g.coins}</span></span>
                              <button className="btn-medieval-small" style={{ fontSize: "0.72rem", padding: "2px 5px" }} onClick={() => handleStartBuyTest({ name: g.name, nameKo: g.nameKo, coinsMod: g.coins })}>Coins판정</button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>


                  {/* Talents Purchase section */}
                  <div style={{ marginTop: "15px", fontSize: "0.95rem" }}>
                    <div style={{ fontWeight: "bold", borderBottom: "1px solid var(--border-color)", paddingBottom: "3px" }}>재능 연마 해금 (XP 소모)</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", maxHeight: "150px", overflowY: "auto" }}>
                      {["전령관", "방랑기사", "비술사", "소매치기"].map(v => {
                        const talents = v === "전령관" ? ["Disarming Presence (무장 해제)", "Academic (학술 지성)", "Duel of Wits (언쟁 달인)", "Inspire (격려 연설)", "Parley (평화 교섭)", "Verity & Guile (진실과 기만)"] :
                                        v === "방랑기사" ? ["Sally Forth (과감한 돌격)", "Geas (맹세 명령)", "Itinerant Hospitality (기사 환대)", "Martial Dominance (전투 지배)", "Oath-sworn (피의 맹세)", "Trial by Combat (결투 대결)"] :
                                        v === "비술사" ? ["Magick (비술 각성)", "Augury (징조 읽기)", "Sixth Sense (영적 감지)", "Familiar (사역마 소환)", "Undo Magick (마법 해제)", "Bind Magick (마법 부여)"] :
                                        ["Nimble (민첩 대처)", "One with the Shadows (그림자 동화)", "Sneak-Attack (급소 암습)", "Poisoner (독약 제조)", "Impersonate (변장 모사)", "Split (신속 퇴각)"];
                        
                        const isOwn = detectedVocation.includes(v);
                        const cost = isOwn ? 5 : 10;

                        return (
                          <div key={v} style={{ paddingLeft: "5px" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: isOwn ? "var(--color-gold)" : "inherit" }}>{v} ({isOwn ? "천직" : "타직"})</span>
                            {talents.map((t, index) => {
                              const isUnlocked = state.character.unlockedTalents.includes(t);
                              const isStarting = index === 0;
                              if (isUnlocked) return null;
                              return (
                                <div key={t} style={{ display: "flex", flexDirection: "column", borderBottom: "1px dashed rgba(255,255,255,0.08)", padding: "5px 0", paddingLeft: "10px", fontSize: "0.88rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span>{isStarting ? "◆" : "◇"} {t}</span>
                                    <button 
                                      className="btn-medieval-small" 
                                      onClick={() => {
                                        if (isStarting && !isOwn) {
                                          alert("타 천직의 시작 재능은 규칙상 배울 수 없습니다.");
                                          return;
                                        }
                                        if (state.character.xp < cost) {
                                          alert(`${cost} XP가 필요합니다.`);
                                          return;
                                        }
                                        updateState(s => {
                                          const nextDay = s.day + cost;
                                          return {
                                            ...s,
                                            day: nextDay,
                                            watch: 1,
                                            character: {
                                              ...s.character,
                                              xp: s.character.xp - cost,
                                              unlockedTalents: [...s.character.unlockedTalents, t]
                                            },
                                            journals: [{
                                              id: generateUniqueId(),
                                              text: getThematicLogText("talent_unlock", { talentName: t }),
                                              date: new Date().toLocaleString(),
                                              day: nextDay,
                                              watch: 1,
                                              pinned: false,
                                              isThematic: true,
                                              systemLog: `[재능 해금] XP ${cost} 소모하여 재능 '${t}' 연마. ${cost}일간의 훈련 시간이 경과하여 제 ${nextDay}일 제 1워치가 되었습니다.`
                                            }, ...s.journals]
                                          };
                                        });
                                      }}
                                    >연마 ({cost}XP)</button>
                                  </div>
                                  {TALENT_DESCRIPTIONS[t] && (
                                    <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "3px", lineHeight: "1.3" }}>
                                      {renderTextWithRules(TALENT_DESCRIPTIONS[t], showRule)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 3: TAROT & ORACLES */}
        {activeTab === "oracles" && (
          <div className="oracles-layout">
            
            {/* Left side: Card Drawer & Hand */}
            <div className="card-panel gold-border flex-2">
              <div className="flex-row justify-between align-center" style={{ borderBottom: "1px solid #333", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                <h3 className="gothic-sub">타로 핸드 매니저 (Player Hand)</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn-medieval" onClick={() => drawCardForPlayer(1)} disabled={state.hand.length >= 4}>
                    카드 1장 드로우 (최대 4장)
                  </button>
                  <button className="btn-medieval" onClick={() => updateState(s => {
                    const currentHand = [...s.hand];
                    const nextDiscard = [...s.playerDiscard, ...currentHand];
                    return { ...s, hand: [], playerDiscard: nextDiscard };
                  })}>손패 전체 폐기</button>
                  <button className="btn-medieval" onClick={reshuffleAllDecks}>덱 전체 셔플</button>
                </div>
              </div>

              {/* Hand cards display */}
              <div className="hand-display-area" style={{ marginTop: "1rem" }}>
                {state.hand.map((card, idx) => (
                  <div key={idx} className="tarot-card-container">
                    <img 
                      src={getCardImageUrl(card)} 
                      alt={getCardDisplayName(card)} 
                      className={`tarot-card-image ${card.reversed ? "reversed-image" : ""}`}
                    />
                    <div className="tarot-card-meta">
                      <h5>{getCardDisplayName(card)}</h5>
                      <div className="card-actions-row">
                        <button className="btn-card-small" onClick={() => {
                          const purpose = prompt("이 카드를 제출하는 목적/행동을 간단히 적으세요:");
                          if (purpose) playCardFromHand(idx, purpose);
                        }}>행동/판정에 내기</button>
                        <button className="btn-card-small gold-btn" disabled={!!state.playerInitiativeCard} onClick={() => {
                          playCardAsPlayerInitiative(idx);
                        }}>선제권으로 제시</button>
                        <button className="btn-card-small toggle" onClick={() => updateState(s => {
                          const nextHand = [...s.hand];
                          nextHand[idx].reversed = !nextHand[idx].reversed;
                          return { ...s, hand: nextHand };
                        })}>역방향 토글</button>
                      </div>
                    </div>
                  </div>
                ))}
                {state.hand.length === 0 && (
                  <div className="empty-deck-spot">
                    <p className="hand-empty-copy">손에 든 카드가 없습니다. 상단에서 카드를 뽑아 4장의 손패를 채워주십시오.</p>
                  </div>
                )}
              </div>

              {/* Decks counters */}
              <div className="deck-counters-bar">
                <span>플레이어 덱 잔여: <strong>{state.playerDeck.length}</strong>장</span> &bull;
                <span>플레이어 버린 더미: <strong>{state.playerDiscard.length}</strong>장</span> &bull;
                <span>레프리 덱 잔여: <strong>{state.refereeDeck.length}</strong>장</span> &bull;
                <span>레프리 버린 더미: <strong>{state.refereeDiscard.length}</strong>장</span>
              </div>
            </div>

            {/* Right side: Fate Oracles */}
            <div className="card-panel flex-1">
              <h3 className="gothic-sub oracle-heading">
                <span>운명의 신탁</span>
                <span className="heading-subline">(Solo Oracles)</span>
              </h3>
              <p className="rules-helper-text">
                마스터가 없을 때 무작위 질문에 답하거나, 황혼이 내린 계략을 해석하는 단어를 구성합니다.
              </p>

              <div className="oracle-button-list" style={{ marginTop: "1rem" }}>
                <button className="btn-medieval w-100" onClick={rollYesNoOracle}>
                  예 / 아니오 (Yes/No) 신탁
                </button>
                <button className="btn-medieval w-100" onClick={rollAmountOracle}>
                  수량 / 강도 (Amount) 신탁
                </button>
                <button className="btn-medieval w-100" onClick={rollActionSubjectOracle}>
                  행동 - 주제 (Action-Subject) 신탁
                </button>
              </div>

              {/* Oracle display screen */}
              <div className="oracle-output-screen" style={{ marginTop: "1.5rem" }}>
                
                {drawnOracleCard && (
                  <div className="oracle-result-card">
                    <h4>신탁 드로우 카드</h4>
                    <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                      <img 
                        src={getCardImageUrl(drawnOracleCard)} 
                        alt="Oracle" 
                        style={{ width: "80px", height: "auto", border: "1px solid #444" }} 
                        className={drawnOracleCard.reversed ? "reversed-image" : ""}
                      />
                      <div>
                        <h5>{getCardDisplayName(drawnOracleCard)}</h5>
                        {oracleYesNo && (
                          <div className="result-badge">
                            결과: <strong>{oracleYesNo}</strong>
                          </div>
                        )}
                        {oracleAmount && (
                          <div className="result-badge">
                            결과: <strong>{oracleAmount}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {oracleActionSubject && (
                  <div className="oracle-result-card">
                    <h4>행동 - 주제 결합 단어</h4>
                    <div className="flex-row gap-10" style={{ margin: "10px 0" }}>
                      <img 
                        src={getCardImageUrl(oracleActionSubject.card1)} 
                        alt="Action" 
                        style={{ width: "65px", height: "auto", border: "1px solid #444" }} 
                        className={oracleActionSubject.card1.reversed ? "reversed-image" : ""}
                      />
                      <img 
                        src={getCardImageUrl(oracleActionSubject.card2)} 
                        alt="Subject" 
                        style={{ width: "65px", height: "auto", border: "1px solid #444" }} 
                        className={oracleActionSubject.card2.reversed ? "reversed-image" : ""}
                      />
                    </div>
                    <div className="result-sentence">
                      행동 단어: <strong style={{ color: "var(--gold)" }}>{oracleActionSubject.action}</strong> <br />
                      주제 단어: <strong style={{ color: "var(--gold)" }}>{oracleActionSubject.subject}</strong>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "5px" }}>
                      * 두 단어를 합쳐 상황이 당신에게 무엇을 직감하는지 해석하십시오. 처음 떠오른 상상이 가장 훌륭한 답입니다.
                    </p>
                    <button className="btn-medieval-small" style={{ marginTop: "8px" }} onClick={() => addJournalEntry(`[신탁 묘사] 행동: ${oracleActionSubject.action} | 주제: ${oracleActionSubject.subject} 카드를 뽑아 다음과 같은 계기를 맞이했다: `)}>
                      일지에 기록하기
                    </button>
                  </div>
                )}

                {!drawnOracleCard && !oracleActionSubject && (
                  <p className="empty-text" style={{ padding: "20px 0" }}>신탁 결과를 굴리지 않았습니다. 상단 버튼을 클릭하십시오.</p>
                )}

              </div>
            </div>

            {/* Downtime & Special Tables Section */}
            <div className="card-panel gold-border downtime-panel" style={{ gridColumn: "span 2", width: "100%", marginTop: "20px" }}>
              <div style={{ borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "15px" }}>
                <h3 className="gothic-sub">특별 테이블 &amp; 다운타임 (Downtime &amp; Special Tables)</h3>
                <p className="rules-helper-text">
                  룰북 50~60페이지의 선술집 축제(Carousing), 유랑민 생성(Folk NPC Generator), 그리고 마법 보물 드로우(Magick Items) 규칙을 수행합니다.
                </p>
              </div>

              <div className="downtime-grid">
                
                {/* 1. Carousing Column */}
                <div className="downtime-column">
                  <div>
                    <h4 className="gothic-sub" style={{ fontSize: "1.05rem", color: "var(--color-gold)", borderBottom: "1px solid #444", paddingBottom: "5px", marginBottom: "8px" }}>
                      선술집 축제 (Carousing - p.51)
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "#888", margin: "8px 0", height: "35px" }}>
                      정착지 다운타임 중 축제를 즐깁니다. 플레이어 덱에서 카드를 1장 드로우하여 결과를 판정합니다.
                    </p>
                    <button className="btn-medieval w-100" onClick={rollCarousing}>축제 카드 드로우</button>
                    
                    {carousingResult && (
                      <div style={{ marginTop: "15px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <img 
                          src={getCardImageUrl(carousingResult.card)} 
                          alt="Carousing card" 
                          style={{ width: "65px", height: "auto", border: "1px solid #555" }}
                          className={carousingResult.card.reversed ? "reversed-image" : ""}
                        />
                        <div style={{ fontSize: "0.8rem" }}>
                          <h5 style={{ margin: 0, color: "var(--color-gold)" }}>{getCardDisplayName(carousingResult.card)}</h5>
                          <p style={{ marginTop: "5px", color: "var(--text-bright)", lineHeight: "1.3" }}>{carousingResult.text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {carousingResult && (
                    <button 
                      className="btn-medieval-small w-100" 
                      style={{ marginTop: "15px" }} 
                      onClick={() => addJournalEntry(`[선술집 축제 다운타임] ${getCardDisplayName(carousingResult.card)}: ${carousingResult.text}`)}
                    >
                      일지에 기록하기
                    </button>
                  )}
                </div>

                {/* 2. Folk NPC Generator Column */}
                <div className="downtime-column">
                  <div>
                    <h4 className="gothic-sub" style={{ fontSize: "1.05rem", color: "var(--color-gold)", borderBottom: "1px solid #444", paddingBottom: "5px", marginBottom: "8px" }}>
                      유랑민 생성기 (Folk NPC - p.53)
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "#888", margin: "8px 0", height: "35px" }}>
                      여정 중 조우하거나 고용할 수 있는 무작위 인물을 생성합니다. 레프리 덱에서 메이저 카드를 1장 뽑습니다.
                    </p>
                    <button className="btn-medieval w-100" onClick={rollFolkNpc}>유랑민 생성</button>

                    {folkNpcResult && (
                      <div style={{ marginTop: "15px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                          <img 
                            src={getCardImageUrl(folkNpcResult.card)} 
                            alt="Folk NPC Major Card" 
                            style={{ width: "50px", height: "auto", border: "1px solid #555" }}
                            className={folkNpcResult.card.reversed ? "reversed-image" : ""}
                          />
                          <div>
                            <h5 style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-gold)" }}>
                              {getCardDisplayName(folkNpcResult.card)}
                            </h5>
                          </div>
                        </div>
                        <div className="npc-card-woodcut">
                          <div><strong>여성 이름:</strong> {folkNpcResult.femaleName}</div>
                          <div><strong>남성 이름:</strong> {folkNpcResult.maleName}</div>
                          <div><strong>직업:</strong> {folkNpcResult.occupation}</div>
                          <div style={{ marginTop: "4px", borderTop: "1px dashed #ccc", paddingTop: "4px" }}>
                            <strong>성격:</strong> {folkNpcResult.personality}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {folkNpcResult && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "15px" }}>
                      <button 
                        className="btn-medieval-small" 
                        onClick={() => addJournalEntry(`[유랑민 생성] ${getCardDisplayName(folkNpcResult.card)} - 여성명: ${folkNpcResult.femaleName} / 남성명: ${folkNpcResult.maleName} | 직업: ${folkNpcResult.occupation} | 성격: ${folkNpcResult.personality}`)}
                      >
                        일지에 기록하기
                      </button>
                      <button 
                        className="btn-medieval-small" 
                        onClick={() => rollNpcReactionTest(`${folkNpcResult.femaleName}/${folkNpcResult.maleName}`)}
                      >
                        반응 판정 (Cups Test vs 14)
                      </button>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button className="btn-medieval-small" style={{ flex: 1, padding: "4px 2px", fontSize: "0.75rem" }} onClick={addNpcAsFriend}>인연 등록</button>
                        <button className="btn-medieval-small" style={{ flex: 1, padding: "4px 2px", fontSize: "0.75rem" }} onClick={addNpcAsFoe}>원수 등록</button>
                        <button className="btn-medieval-small" style={{ flex: 1, padding: "4px 2px", fontSize: "0.75rem" }} onClick={addNpcAsHireling}>용병 고용</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Magick Item Drawer Column */}
                <div className="downtime-column">
                  <div>
                    <h4 className="gothic-sub" style={{ fontSize: "1.05rem", color: "var(--color-gold)", borderBottom: "1px solid #444", paddingBottom: "5px", marginBottom: "8px" }}>
                      마법 보물 (Magick Items - p.56)
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "#888", margin: "8px 0", height: "35px" }}>
                      비술적 전설 유물을 획득합니다. 문양(Suit)을 결정한 후 플레이어 덱에서 드로우하여 유물을 결정합니다.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                      <select 
                        className="select-medieval w-100" 
                        value={selectedMagickSuit} 
                        onChange={(e) => setSelectedMagickSuit(e.target.value as any)}
                      >
                        <option value="Swords">소드 (Swords) - 무기류</option>
                        <option value="Coins">코인 (Coins) - 방구/장신구</option>
                        <option value="Cups">컵 (Cups) - 도구/영약</option>
                        <option value="Wands">완드 (Wands) - 악기/마법도구</option>
                      </select>
                      <button className="btn-medieval w-100" onClick={rollMagickItem}>보물 드로우</button>
                    </div>

                    {magickItemResult && (
                      <div style={{ marginTop: "15px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <img 
                          src={getCardImageUrl(magickItemResult.card)} 
                          alt="Magick card" 
                          style={{ width: "65px", height: "auto", border: "1px solid #555" }}
                          className={magickItemResult.card.reversed ? "reversed-image" : ""}
                        />
                        <div style={{ fontSize: "0.8rem", flex: 1 }}>
                          <h5 style={{ margin: 0, color: "var(--color-gold)" }}>
                            {getCardDisplayName(magickItemResult.card)}
                          </h5>
                          <h6 style={{ margin: "3px 0", fontSize: "0.85rem", color: "var(--text-bright)" }}>
                            {magickItemResult.name}
                          </h6>
                          <p style={{ color: "#bbb", lineHeight: "1.3", fontSize: "0.75rem" }}>{magickItemResult.text}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {magickItemResult && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "15px" }}>
                      <button 
                        className="btn-medieval-small" 
                        onClick={() => addJournalEntry(`[마법 보물 탐색] ${selectedMagickSuit} ${getCardDisplayName(magickItemResult.card)}: ${magickItemResult.name} - ${magickItemResult.text}`)}
                      >
                        일지에 기록하기
                      </button>
                      {magickItemResult.name !== "광대의 장난 (The Fool's Prank)" && (
                        <button className="btn-medieval-small" onClick={addMagickItemToInventory}>
                          소지품 인벤토리에 추가
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Alchemical Cauldron Column */}
                <div className="downtime-column">
                  <div>
                    <h4 className="gothic-sub" style={{ fontSize: "1.05rem", color: "var(--color-gold)", borderBottom: "1px solid #444", paddingBottom: "5px", marginBottom: "8px" }}>
                      연금술 비약 제조 (Alchemy Cauldron - p.54)
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "#888", margin: "8px 0", height: "35px" }}>
                      몬스터의 잔해(전리품)를 가마솥에 넣어 비약을 조제합니다. (Wands 판정 난이도 14)
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                      <select 
                        className="select-medieval w-100" 
                        value={brewingIngredient} 
                        onChange={(e) => setBrewingIngredient(e.target.value)}
                      >
                        <option value="Basilisk Eyeball">바실리스크 안구 → 석화 물약</option>
                        <option value="Ghost Ectoplasm">유령 엑토플라즘 → 수면 안개 폭탄</option>
                        <option value="Troll Heart">트롤 심장 → 재생 물약</option>
                        <option value="Barghest Fang">바게스트 송곳니 → 사냥개 영약</option>
                        <option value="Blood Asp Venom">핏빛 독사 독액 → 독가스 폭탄</option>
                      </select>
                      <button className="btn-medieval w-100" onClick={brewAlchemyPotion}>가마솥 끓이기</button>
                    </div>

                    {state.alchemicalBrewResult && (
                      <div style={{ marginTop: "15px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                          <img 
                            src={getCardImageUrl(state.alchemicalBrewResult.card)} 
                            alt="Alchemy card" 
                            style={{ width: "50px", height: "auto", border: "1px solid #555" }}
                            className={state.alchemicalBrewResult.card.reversed ? "reversed-image" : ""}
                          />
                          <div style={{ fontSize: "0.8rem" }}>
                            <h5 style={{ margin: 0, color: state.alchemicalBrewResult.success ? "var(--color-gold)" : "var(--color-crimson)" }}>
                              결과: {state.alchemicalBrewResult.success ? "제조 성공!" : "제조 실패"}
                            </h5>
                            <span style={{ color: "#bbb" }}>
                              판정합: {state.alchemicalBrewResult.total} (카드 {state.alchemicalBrewResult.card.card} + 완드 {state.character.stats.wands})
                            </span>
                          </div>
                        </div>
                        <div className="npc-card-woodcut" style={{ fontSize: "0.8rem", borderStyle: "solid" }}>
                          <strong>제조된 비약:</strong> {state.alchemicalBrewResult.potionName}
                        </div>
                      </div>
                    )}
                  </div>

                  {state.alchemicalBrewResult && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "15px" }}>
                      {state.alchemicalBrewResult.success ? (
                        <button className="btn-medieval-small" onClick={addBrewResultToInventory}>
                          소지품 가방에 추가
                        </button>
                      ) : (
                        <p style={{ fontSize: "0.75rem", color: "var(--color-crimson)", fontStyle: "italic", textAlign: "center", margin: 0 }}>
                          재료를 모두 낭비하고 검은 연기만 피어올랐습니다.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Arcane Spell Generator Column */}
                <div className="downtime-column">
                  <div>
                    <h4 className="gothic-sub" style={{ fontSize: "1.05rem", color: "var(--color-gold)", borderBottom: "1px solid #444", paddingBottom: "5px", marginBottom: "8px" }}>
                      비문 마법 주문 생성 (Arcane Spells - p.38)
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "#888", margin: "8px 0", height: "35px" }}>
                      플레이어 덱(마이너)과 레프리 덱(메이저)에서 카드를 한 장씩 뽑아 비문 주문을 조합합니다.
                    </p>
                    <button className="btn-medieval w-100" onClick={rollArcaneSpell}>주문 마법 탐구</button>

                    {state.arcaneSpellResult && (
                      <div style={{ marginTop: "15px" }}>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "10px" }}>
                          <div>
                            <div style={{ fontSize: "0.7rem", textAlign: "center", color: "#888" }}>마이너 (동사)</div>
                            <img 
                              src={getCardImageUrl(state.arcaneSpellResult.minorCard)} 
                              alt="Minor Card" 
                              style={{ width: "50px", height: "auto", border: "1px solid #555" }}
                              className={state.arcaneSpellResult.minorCard.reversed ? "reversed-image" : ""}
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: "0.7rem", textAlign: "center", color: "#888" }}>메이저 (명사)</div>
                            <img 
                              src={getCardImageUrl(state.arcaneSpellResult.majorCard)} 
                              alt="Major Card" 
                              style={{ width: "50px", height: "auto", border: "1px solid #555" }}
                              className={state.arcaneSpellResult.majorCard.reversed ? "reversed-image" : ""}
                            />
                          </div>
                        </div>
                        <div className="npc-card-woodcut" style={{ fontSize: "0.75rem", borderStyle: "solid" }}>
                          <div style={{ color: "#6b46c1", fontWeight: "bold", fontSize: "0.85rem", marginBottom: "4px" }}>
                            {state.arcaneSpellResult.spellName}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#666", lineHeight: "1.2" }}>
                            {state.arcaneSpellResult.ruleSummary}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {state.arcaneSpellResult && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "15px" }}>
                      <button className="btn-medieval-small" onClick={addArcaneSpellToSpellbook}>
                        주문첩(Spellbook)에 기록
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. Folk Magick Guide Column */}
                <div className="downtime-column">
                  <div>
                    <h4 className="gothic-sub" style={{ fontSize: "1.05rem", color: "var(--color-gold)", borderBottom: "1px solid #444", paddingBottom: "5px", marginBottom: "8px" }}>
                      민속 마법 안내서 (Folk Magick - p.37)
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "#888", margin: "8px 0 10px 0", height: "35px" }}>
                      캐릭터가 Cups 또는 Wands 스탯을 사용해 소환하는 재래 마법 규칙을 확인합니다.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { title: "치유 (Healing)", stat: "Cups", cost: "1 Resolve", effect: "Cups 판정(vs 14). 성공 시 자신 또는 인접 대상의 부상 1개를 제거합니다." },
                        { title: "원소 소환 (Elemental)", stat: "Wands", cost: "1 Resolve", effect: "Wands 판정(vs 14). 성공 시 불, 물, 바람, 흙 중 하나의 원소 효과를 발동합니다." },
                        { title: "예지 (Foresight)", stat: "Cups", cost: "1 Resolve", effect: "Cups 판정(vs 14). 성공 시 레프리에게 Yes/No 신탁 1회 무료 사용 또는 다음 테스트에 +2 보너스." },
                        { title: "퇴마 (Ward Evil)", stat: "Wands", cost: "1 Resolve", effect: "Wands 판정(vs 14). 성공 시 이번 전투에서 언데드/악령 유형 몬스터의 대항 패널티를 -2 감소." },
                        { title: "자연 독 (Natural Poison)", stat: "Wands", cost: "재료", effect: "Wands 판정(vs 14) + 독초 재료. 성공 시 독약 1회분(다음 공격 시 추가 피해 1) 제조." },
                        { title: "달의 오라클 (Moon Oracle)", stat: "Cups", cost: "1 Resolve + 야간", effect: "Cups 판정(vs 14). 밤에만 사용 가능. 성공 시 행운의 오라클 카드 1장을 뒤로 돌려두고 나중에 사용." },
                      ].map((spell, idx) => (
                        <div key={idx} style={{ background: "transparent", border: "1px solid var(--border-color)", borderRadius: 0, padding: "7px 9px" }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: "bold", color: "var(--text-bright)", marginBottom: "3px" }}>{spell.title}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                            사용 스탯: <strong style={{ color: "var(--color-gold)" }}>{spell.stat}</strong> · 비용: {spell.cost}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-normal)", lineHeight: "1.3" }}>{spell.effect}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: "10px", padding: "8px", background: "transparent", border: "1px solid var(--border-color)", borderRadius: 0, fontSize: "0.7rem", color: "var(--text-normal)", lineHeight: "1.4" }}>
                      <strong style={{ color: "var(--text-bright)" }}>공통 규칙 (p.37):</strong><br />
                      • 민속 마법은 판정 후 결의(Resolve)를 1점 소모합니다.<br />
                      • 대실패(Great Failure) 시 시전자가 마법 반동으로 피해 1점을 받습니다.<br />
                      • 같은 마법을 같은 날 두 번 사용하면 +3 패널티가 누적됩니다.
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 4: ADVENTURE & MAP & COMBAT TRACKER */}
        {activeTab === "map" && (
          <div className="map-combat-layout">
            
            {/* Visual Tarot Grid Map */}
            <div className="card-panel gold-border flex-2">
              <div className="flex-row justify-between align-center" style={{ borderBottom: "1px solid #333", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                <h3 className="gothic-sub">모험 유적 격자 지도 (4x4 Tarot Map)</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <select className="inline-select" value={state.mapType} onChange={e => updateState(s => ({ ...s, mapType: e.target.value as any }))}>
                    <option value="wilderness">야외 야생 (Wilderness)</option>
                    <option value="dungeon">지하 던전 (Dungeon)</option>
                    <option value="settlement">마을 정착지 (Settlement)</option>
                  </select>
                  <button className="btn-medieval" onClick={() => {
                    updateState(s => ({
                      ...s,
                      mapGrid: Array.from({ length: 16 }, (_, i) => ({
                        x: i % 4,
                        y: Math.floor(i / 4)
                      }))
                    }));
                  }}>지형 초기화</button>
                </div>
              </div>
              
              <div className="grid-map-board" style={{ marginTop: "1rem" }}>
                {state.mapGrid.map((cell, idx) => {
                  const cellJournals = state.journals.filter(j => j.x === cell.x && j.y === cell.y);
                  const chronicleJournals = cellJournals.filter(j => j.chronicle === true);

                  // Calculate Place Scar Index
                  const scarIndex = cellJournals.reduce((acc, j) => {
                    if (j.chronicleCategory === "character_death") return acc + 1.5;
                    if (j.chronicleCategory === "hireling_death") return acc + 1.5;
                    if (j.chronicleCategory === "first_defeat") return acc + 1.0;
                    if (j.chronicleCategory === "boss_slain") return acc + 1.0;
                    return acc;
                  }, 0);

                  // Check Sanctuary status
                  const hasCampsite = cellJournals.some(j => j.chronicleCategory === "campsite");

                  // Build blended filters and cell styles (older, quieter, heavier)
                  let cardFilter = "none";
                  let cellStyle: React.CSSProperties = {
                    transition: "all 0.4s ease-in-out",
                    position: "relative"
                  };

                  if (scarIndex >= 2.0) {
                    // Cursed Ground (Abandoned)
                    cardFilter = hasCampsite
                      ? "grayscale(75%) brightness(50%) sepia(10%) contrast(95%)"
                      : "grayscale(85%) brightness(55%) contrast(90%)";
                    cellStyle = {
                      ...cellStyle,
                      borderColor: "rgba(90, 80, 80, 0.55)",
                      boxShadow: "inset 0 0 10px rgba(90, 80, 80, 0.45)",
                      backgroundColor: "rgba(20, 10, 10, 0.9)"
                    };
                  } else if (scarIndex > 0) {
                    // Scarred Ground (Exhausted)
                    cardFilter = hasCampsite
                      ? "grayscale(40%) brightness(65%) sepia(10%) contrast(95%)"
                      : "grayscale(45%) brightness(70%) contrast(95%)";
                    cellStyle = {
                      ...cellStyle,
                      borderColor: "rgba(110, 110, 110, 0.45)",
                      boxShadow: "inset 0 0 6px rgba(110, 110, 110, 0.3)",
                      backgroundColor: "rgba(25, 20, 20, 0.95)"
                    };
                  } else if (hasCampsite) {
                    // Sanctuary Ground (Warm)
                    cardFilter = "sepia(35%) brightness(90%) contrast(95%)";
                    cellStyle = {
                      ...cellStyle,
                      borderColor: "rgba(187, 153, 93, 0.3)",
                      boxShadow: "inset 0 0 6px rgba(187, 153, 93, 0.15)",
                      backgroundColor: "rgba(30, 26, 20, 0.95)"
                    };
                  }

                  const isSelected = selectedMapCellIdx === idx;
                  if (isSelected) {
                    cellStyle.borderColor = "var(--color-gold)";
                    cellStyle.boxShadow = (cellStyle.boxShadow ? cellStyle.boxShadow + ", " : "") + "0 0 15px rgba(255, 215, 0, 0.4)";
                  }

                  // Check if any active Friend or Foe is present in this cell
                  const presentFriendNames: string[] = [];
                  const presentFoeNames: string[] = [];
                  
                  cellJournals.forEach(j => {
                    const combinedText = `${j.text} ${j.systemLog || ""}`.toLowerCase();
                    state.character.friends.forEach(f => {
                      if (f.name && combinedText.includes(f.name.toLowerCase())) {
                        if (!presentFriendNames.includes(f.name)) {
                          presentFriendNames.push(f.name);
                        }
                      }
                    });
                    state.character.foes.forEach(f => {
                      if (f.name && combinedText.includes(f.name.toLowerCase())) {
                        if (!presentFoeNames.includes(f.name)) {
                          presentFoeNames.push(f.name);
                        }
                      }
                    });
                  });

                  // Build tooltip title
                  let tooltipTitle = `${cell.description || "미개척 지역"} (${cell.x + 1}, ${cell.y + 1})`;
                  if (presentFriendNames.length > 0) {
                    tooltipTitle += `\n🤝 인연: ${presentFriendNames.join(", ")}`;
                  }
                  if (presentFoeNames.length > 0) {
                    tooltipTitle += `\n⚔️ 원수: ${presentFoeNames.join(", ")}`;
                  }
                  if (chronicleJournals.length > 0) {
                    tooltipTitle += `\n\n📜 역사 기록:`;
                    chronicleJournals.forEach(j => {
                      const icon = j.chronicleIcon ? `[${j.chronicleIcon}] ` : "";
                      tooltipTitle += `\n- Day ${j.day} Watch ${j.watch}: ${icon}${j.text}`;
                    });
                  }

                  return (
                    <div 
                      key={idx} 
                      className={`map-grid-cell ${isSelected ? "selected" : ""}`} 
                      onClick={() => {
                        setSelectedMapCellIdx(idx);
                      }}
                      title={tooltipTitle}
                      style={cellStyle}
                    >
                      {cell.card ? (
                        <div className="revealed-map-cell">
                          <img 
                            src={getCardImageUrl(cell.card)} 
                            alt="map" 
                            className={`map-card-thumbnail ${cell.card.reversed ? "reversed-image" : ""}`}
                            style={{ filter: cardFilter }}
                          />
                          <div className="cell-overlay">
                            <span>{cell.description}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="unrevealed-map-cell">
                          <span className="coord">{cell.x + 1}, {cell.y + 1}</span>
                          <span className="draw-prompt">카드 탐색</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="rules-helper-text" style={{ marginTop: "10px" }}>
                * 지도 격자 구역을 클릭하여 선택하면 아래에 세부 정보가 표시되며, 지형 탐색, 스토리 일지 기록 및 만난 인연/원수 확인이 가능합니다.
              </p>

              {/* Selected Cell Detail Panel */}
              {selectedMapCellIdx !== null && (() => {
                const cell = state.mapGrid[selectedMapCellIdx];
                if (!cell) return null;
                
                // Find matching journal entries (convert to 0-based for matching state)
                const cellJournals = state.journals.filter(j => j.x === cell.x && j.y === cell.y);
                
                // Find NPCs met in this cell by checking text match
                const npcNamesInCell = new Set<string>();
                cellJournals.forEach(j => {
                  const combinedText = `${j.text} ${j.systemLog || ""}`.toLowerCase();
                  [...state.character.friends, ...state.character.foes, ...state.character.hirelings].forEach(npc => {
                    if (npc.name && combinedText.includes(npc.name.toLowerCase())) {
                      npcNamesInCell.add(npc.name);
                    }
                  });
                });

                return (
                  <div style={{ marginTop: "20px", borderTop: "2px solid var(--color-gold)", paddingTop: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <h4 className="gothic-sub" style={{ margin: 0, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📍 구역 세부 정보: ({cell.x + 1}, {cell.y + 1})</span>
                        {cell.card && (
                          <span style={{ fontSize: "0.8rem", color: "var(--color-gold)" }}>
                            [{getCardDisplayName(cell.card)}]
                          </span>
                        )}
                      </h4>
                      <div style={{ display: "flex", gap: "5px" }}>
                        {!cell.card && (
                          <button
                            className="btn-medieval-small"
                            onClick={() => {
                              drawRefereeCard((card) => {
                                const index = MAJORS.filter(m => m !== "0").indexOf(card.card);
                                const terrainList = state.mapType === "wilderness" ? MAP_WILDERNESS : state.mapType === "dungeon" ? MAP_DUNGEON : MAP_SETTLEMENT;
                                const terrain = terrainList[index] || "미지의 구역";

                                updateState(s => {
                                  const nextGrid = [...s.mapGrid];
                                  nextGrid[selectedMapCellIdx] = {
                                    ...cell,
                                    card,
                                    type: s.mapType,
                                    description: terrain
                                  };

                                  const isFirstDiscovery = !s.journals.some(j => j.chronicleCategory === "first_discovery");
                                  const isFirstSettlement = s.mapType === "settlement" && !s.journals.some(j => j.chronicleCategory === "first_settlement");
                                  const isFirstDungeon = s.mapType === "dungeon" && !s.journals.some(j => j.chronicleCategory === "first_dungeon");

                                  let category: string | undefined = undefined;
                                  let icon: string | undefined = undefined;
                                  let logText = `🗺 [구역 탐색] 좌표 (${cell.x + 1}, ${cell.y + 1}) 지역을 탐색하여 [${terrain}] 발견 (타로 카드: ${getCardDisplayName(card)})`;

                                  if (isFirstDiscovery) {
                                    category = "first_discovery";
                                    icon = "🧭";
                                    logText = `🧭 [최초 지역 발견] 최초로 좌표 (${cell.x + 1}, ${cell.y + 1}) 구역을 개척하고 [${terrain}] 지형을 발견했습니다!`;
                                  } else if (isFirstSettlement) {
                                    category = "first_settlement";
                                    icon = "🏰";
                                    logText = `🏰 [최초 정착지 발견] 좌표 (${cell.x + 1}, ${cell.y + 1})에서 사람들의 온기가 서린 정착지 [${terrain}]을(를) 최초 발견했습니다.`;
                                  } else if (isFirstDungeon) {
                                    category = "first_dungeon";
                                    icon = "🗝";
                                    logText = `🗝 [최초 던전 발견] 어둠과 위험이 도사리는 유적/던전 [${terrain}]을(를) 최초로 발견했습니다.`;
                                  }

                                  const isChronicle = !!category;

                                  const newJournal: JournalEntry = {
                                    id: generateUniqueId(),
                                    text: logText,
                                    date: new Date().toLocaleString(),
                                    day: s.day,
                                    watch: s.watch,
                                    x: cell.x,
                                    y: cell.y,
                                    pinned: isChronicle,
                                    systemGenerated: true,
                                    chronicle: isChronicle,
                                    chronicleCategory: category,
                                    chronicleIcon: icon
                                  };

                                  return { 
                                    ...s, 
                                    mapGrid: nextGrid,
                                    journals: [newJournal, ...s.journals]
                                  };
                                });
                              });
                            }}
                          >
                            지형 탐색
                          </button>
                        )}
                        <button
                          className="btn-medieval-small"
                          onClick={() => {
                            const nextDesc = prompt("이 격자 구역에 관한 스토리 묘사/노트를 저장합니다:", cell.description || "");
                            if (nextDesc !== null) {
                              updateState(s => {
                                const nextGrid = [...s.mapGrid];
                                nextGrid[selectedMapCellIdx].description = nextDesc;
                                return { ...s, mapGrid: nextGrid };
                              });
                            }
                          }}
                        >
                          메모 편집
                        </button>
                        <button
                          className="btn-medieval-small danger"
                          onClick={() => setSelectedMapCellIdx(null)}
                        >
                          선택 해제
                        </button>
                      </div>
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid #333", borderRadius: "4px", padding: "12px", fontSize: "0.85rem", lineHeight: "1.5" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ color: "#aaa" }}>지형 묘사:</span>{" "}
                        <strong style={{ color: "var(--text-bright)" }}>
                          {cell.description || (cell.card ? "묘사 없음" : "아직 탐색되지 않은 지역입니다.")}
                        </strong>
                      </div>

                      {/* Synced Journals */}
                      <div style={{ marginTop: "12px", borderTop: "1px dashed #444", paddingTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ color: "var(--color-gold)", fontWeight: "bold", fontSize: "0.8rem" }}>📖 이 구역의 탐험 일지 ({cellJournals.length})</span>
                          <button
                            className="btn-medieval-small"
                            style={{ fontSize: "0.68rem", padding: "2px 5px", height: "22px" }}
                            onClick={() => {
                              const newLog = prompt("이 구역에 기록할 새 일지를 작성하세요:");
                              if (newLog) {
                                updateState(s => {
                                  return {
                                    ...s,
                                    journals: [
                                      {
                                        id: generateUniqueId(),
                                        text: newLog,
                                        date: new Date().toLocaleString(),
                                        day: s.day,
                                        watch: s.watch,
                                        x: cell.x,
                                        y: cell.y,
                                        pinned: false,
                                        isThematic: false,
                                        systemLog: newLog
                                      },
                                      ...s.journals
                                    ]
                                  };
                                });
                              }
                            }}
                          >
                            + 새 일지 기록
                          </button>
                        </div>
                        {cellJournals.length === 0 ? (
                          <div style={{ fontSize: "0.75rem", color: "#666", fontStyle: "italic" }}>기록된 일지가 없습니다.</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                            {cellJournals.map(j => {
                              const isChronicle = j.chronicle === true;
                              return (
                                <div 
                                  key={j.id} 
                                  style={isChronicle ? {
                                    border: "1px solid var(--color-gold)",
                                    backgroundColor: "rgba(187, 153, 93, 0.08)",
                                    borderRadius: "4px",
                                    padding: "6px 10px",
                                    marginBottom: "4px",
                                    boxShadow: "0 0 5px rgba(187, 153, 93, 0.15)"
                                  } : {
                                    borderBottom: "1px dashed rgba(255,255,255,0.05)",
                                    paddingBottom: "4px",
                                    marginBottom: "4px"
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: isChronicle ? "var(--color-gold)" : "#888" }}>
                                    <span>
                                      {isChronicle && <span style={{ marginRight: "4px" }}>📜 연대기 ·</span>}
                                      제 {j.day || 1}일 {j.watch || 1}워치 ({j.date})
                                    </span>
                                    <button
                                      style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", padding: "0 3px" }}
                                      onClick={() => {
                                        if (confirm("이 일지를 삭제하시겠습니까?")) {
                                          updateState(s => ({
                                            ...s,
                                            journals: s.journals.filter(x => x.id !== j.id)
                                          }));
                                        }
                                      }}
                                    >
                                      &times;
                                    </button>
                                  </div>
                                  <div style={{ fontSize: "0.8rem", color: isChronicle ? "var(--text-bright)" : "#ddd", marginTop: "2px", fontWeight: isChronicle ? "bold" : "normal" }}>
                                    {j.chronicleIcon && <span style={{ marginRight: "6px", fontSize: "0.9rem" }}>{j.chronicleIcon}</span>}
                                    {j.text}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Synced NPCs */}
                      <div style={{ marginTop: "12px", borderTop: "1px dashed #444", paddingTop: "8px" }}>
                        <span style={{ color: "var(--color-gold)", fontWeight: "bold", fontSize: "0.8rem", display: "block", marginBottom: "6px" }}>
                          👥 이 구역에서 조우한 인물 ({npcNamesInCell.size})
                        </span>
                        {npcNamesInCell.size === 0 ? (
                          <div style={{ fontSize: "0.75rem", color: "#666", fontStyle: "italic" }}>기록에 언급된 NPC가 없습니다.</div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                            {[...npcNamesInCell].map(name => {
                              const isFriend = state.character.friends.some(f => f.name === name);
                              const isFoe = state.character.foes.some(f => f.name === name);
                              const isHireling = state.character.hirelings.some(h => h.name === name);
                              
                              let typeKo = "NPC";
                              let color = "#bbb";
                              if (isFriend) { typeKo = "친구"; color = "#4caf50"; }
                              else if (isFoe) { typeKo = "원수"; color = "var(--color-crimson)"; }
                              else if (isHireling) { typeKo = "용병"; color = "var(--color-gold)"; }

                              const lastUsedDay = state.usedFriendAids?.[name];
                              const isAidedToday = lastUsedDay === state.day;

                              return (
                                <div
                                  key={name}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    fontSize: "0.75rem",
                                    background: "rgba(0,0,0,0.3)",
                                    border: `1px solid ${color}`,
                                    color: "#eee",
                                    padding: "2px 6px",
                                    borderRadius: "3px"
                                  }}
                                >
                                  <span>{name} <span style={{ fontSize: "0.65rem", color }}>({typeKo})</span></span>
                                  {isFriend && (
                                    <button
                                      className="btn-medieval-small"
                                      style={{
                                        fontSize: "0.62rem",
                                        padding: "1px 4px",
                                        marginLeft: "4px",
                                        background: isAidedToday ? "rgba(255,255,255,0.05)" : "rgba(76, 175, 80, 0.2)",
                                        border: `1px solid ${isAidedToday ? "#555" : "#4caf50"}`,
                                        color: isAidedToday ? "#888" : "#4caf50",
                                        cursor: isAidedToday ? "not-allowed" : "pointer",
                                        height: "18px",
                                        lineHeight: "1"
                                      }}
                                      disabled={isAidedToday}
                                      onClick={() => useFriendAid(name)}
                                      title={isAidedToday ? "오늘 이미 도움을 받았습니다." : "친구의 도움을 요청합니다."}
                                    >
                                      {isAidedToday ? "🤝 오늘원조완료" : "🤝 원조받기"}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Adventure Events & Combat Tracker */}
            <div className="card-panel flex-1">
              <h3 className="gothic-sub">돌발 인카운터 &amp; 전투 트래커</h3>
              
              {/* Event Drawer */}
              <div className="event-drawer-box" style={{ marginTop: "1rem" }}>
                <h4>무작위 이벤트 격발</h4>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn-medieval flex-1" onClick={() => {
                    drawRefereeCard((card) => {
                      const idx = MAJORS.filter(m => m !== "0").indexOf(card.card);
                      const evList = state.mapType === "wilderness" ? WILDERNESS_EVENTS : state.mapType === "dungeon" ? DUNGEON_EVENTS : SETTLEMENT_EVENTS;
                      const evText = evList[idx] || "무난한 조우가 발생합니다.";
                      const desc = card.reversed ? `[역방향 비틀림] ${evText}의 반대나 부정적인 방향으로 꼬인 참화가 벌어집니다!` : evText;
                      
                      alert(`[이벤트 격발: ${getCardDisplayName(card)}]\n\n${desc}`);
                      addJournalEntry(`[이벤트 격발 - ${state.mapType}] ${getCardDisplayName(card)}: ${desc}`);
                    });
                  }}>이벤트 카드 드로우</button>
                </div>
              </div>

              {/* Combat Tracker */}
              <div className="combat-tracker-box" style={{ marginTop: "1.5rem" }}>
                <h4>전투 관리자 (Round: {state.combatRound})</h4>
                
                {/* Player Initiative Status */}
                <div className="player-initiative-status" style={{ 
                  padding: "8px 12px", 
                  background: "rgba(255, 215, 0, 0.05)", 
                  border: "1px solid rgba(255, 215, 0, 0.15)", 
                  borderRadius: "4px", 
                  marginBottom: "12px", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  fontSize: "0.9rem" 
                }}>
                  <div>
                    <strong>플레이어 선제권: </strong>
                    {state.playerInitiativeCard ? (
                      <span style={{ color: "var(--color-gold)", fontWeight: "bold" }}>
                        {getCardDisplayName(state.playerInitiativeCard)}
                      </span>
                    ) : (
                      <span style={{ color: "#888" }}>미정 (손패에서 제시)</span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>선제권은 손패 카드만 사용</span>
                </div>
                
                {/* Spawner */}
                <div className="monster-spawner-row">
                  <select className="inline-select" value={selectedMonsterToSpawn} onChange={e => setSelectedMonsterToSpawn(parseInt(e.target.value) || 1)}>
                    {BESTIARY.map(m => (
                      <option key={m.id} value={m.id}>{m.nameKo} (Stat: {m.stat}, HP: {m.wounds})</option>
                    ))}
                  </select>
                  <button className="btn-medieval-small" onClick={() => {
                    const template = BESTIARY.find(m => m.id === selectedMonsterToSpawn);
                    if (template) {
                      updateState(s => ({
                        ...s,
                        combatMonsters: [
                          ...s.combatMonsters,
                          {
                            id: generateUniqueId(),
                            monsterId: template.id,
                            name: template.nameKo,
                            woundsTaken: 0
                          }
                        ]
                      }));
                    }
                  }}>전장 투입</button>
                </div>

                {/* Monster list in combat */}
                <div className="combat-monsters-list" style={{ marginTop: "1rem" }}>
                  {state.combatMonsters.map((mon, mIdx) => {
                    const template = BESTIARY.find(b => b.id === mon.monsterId)!;
                    return (
                      <div key={mon.id} className="combat-monster-card">
                        <div className="flex-row justify-between align-center">
                          <strong>{mon.name}</strong>
                          <span style={{ fontSize: "0.8rem", color: "#888" }}>Stat: {template.stat} &bull; Speed: {template.speed}</span>
                        </div>
                        
                        <div className="flex-row justify-between align-center" style={{ marginTop: "5px" }}>
                          <span>Wounds: <strong>{mon.woundsTaken} / {template.wounds}</strong></span>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button className="btn-counter-small" onClick={() => updateState(s => {
                              const nextMonsters = [...s.combatMonsters];
                              nextMonsters[mIdx].woundsTaken = Math.max(0, mon.woundsTaken - 1);
                              return { ...s, combatMonsters: nextMonsters };
                            })}>-</button>
                            <button className="btn-counter-small" onClick={() => updateState(s => {
                              const nextMonsters = [...s.combatMonsters];
                              nextMonsters[mIdx].woundsTaken = Math.min(template.wounds, mon.woundsTaken + 1);
                              if (nextMonsters[mIdx].woundsTaken === template.wounds) {
                                alert(`${mon.name}이(가) 치명적인 신체 부상을 입고 굴복했습니다!`);
                              }
                              return { ...s, combatMonsters: nextMonsters };
                            })}>+</button>
                          </div>
                        </div>

                        {/* Monster Initiative card */}
                        <div className="flex-row justify-between align-center" style={{ marginTop: "8px", borderTop: "1px dashed #333", paddingTop: "5px" }}>
                          <span>선제권: {mon.initiativeCard ? getCardDisplayName(mon.initiativeCard) : "미정"}</span>
                          <button className="btn-medieval-small" disabled={!!mon.initiativeCard} title={mon.initiativeCard ? "이번 라운드 선제권은 이미 결정되었습니다." : "레프리 덱에서 몬스터 선제권을 뽑습니다."} onClick={() => {
                            if (mon.initiativeCard) {
                              alert("이번 라운드의 몬스터 선제권은 이미 정해졌습니다. 다음 라운드까지 다시 뽑을 수 없습니다.");
                              return;
                            }
                            assignMonsterInitiative(mon.id);
                          }}>선제권 카드 결정</button>
                        </div>

                        {/* Monster Morale Test */}
                        <div className="flex-row justify-between align-center" style={{ marginTop: "6px", borderTop: "1px dashed #333", paddingTop: "5px" }}>
                          <span>사기 수치: {template.stat}</span>
                          <button className="btn-medieval-small" onClick={() => rollMonsterMoraleTest(mon.name, template.stat)}>
                            사기 판정 (Ref + Stat vs 14)
                          </button>
                        </div>

                        <button className="btn-medieval-small danger w-100" style={{ marginTop: "10px" }} onClick={() => {
                          updateState(s => ({
                            ...s,
                            combatMonsters: s.combatMonsters.filter((_, i) => i !== mIdx)
                          }));
                        }}>처치 / 퇴각 처리</button>
                      </div>
                    );
                  })}

                  {state.combatMonsters.length === 0 && (
                    <p className="empty-text">전투에 대치 중인 몬스터가 없습니다.</p>
                  )}
                </div>

                {state.combatMonsters.length > 0 && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                    <button className="btn-medieval flex-1" onClick={startNextRound}>다음 라운드 시작</button>
                    <button className="btn-medieval" onClick={endCombat}>전투 종료</button>
                  </div>
                )}

                {/* Combat Quick Reference */}
                <div style={{ marginTop: "1.5rem", borderTop: "1px solid #333", paddingTop: "12px" }}>
                  <button
                    className="btn-medieval-small"
                    style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px" }}
                    onClick={() => setShowCombatRef(v => !v)}
                  >
                    <span>전술 행동 빠른 참조 (Combat Reference - p.31)</span>
                    <span>{showCombatRef ? "▲ 접기" : "▼ 펼치기"}</span>
                  </button>

                  {showCombatRef && (
                    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        {
                          icon: "I",
                          name: "공격 (Attack) - 행동",
                          stat: "Swords",
                          rule: "Swords 판정 vs 대상의 선제권 수치. 성공 시 무기 Wound 피해 적용.",
                          note: "첫 드로우 카드와 테스트 스탯(Swords) 슈트가 일치하여 14점 이상이면 극적 성공(Great Success)으로 추가 1 Wound 피해."
                        },
                        {
                          icon: "II",
                          name: "주문 시전 (Cast a Spell) - 행동",
                          stat: "Wands",
                          rule: "결의(Resolve)를 1점 이상 소비하여 시전. 적 타격 시 대항 Wands 판정 필요.",
                          note: "전투 중 주문 시전은 적과의 대항 Wands 판정에서 성공해야 시전 완료됩니다."
                        },
                        {
                          icon: "III",
                          name: "무기 탈착 (Draw/Sheathe) - 행동",
                          stat: "Any",
                          rule: "손패에서 카드 1장을 버리고 무기를 뽑거나 검집에 넣습니다.",
                          note: "자유 행동(Free Action)이 아니며 카드 소모가 필요합니다."
                        },
                        {
                          icon: "IV",
                          name: "도주 (Flee) - 행동",
                          stat: "Coins",
                          rule: "대항 Coins 판정 수행. 성공 시 인카운터/전투를 즉시 벗어나 안전하게 도망칩니다.",
                          note: "도망치기 어려운 험난한 환경에서는 대항 난이도가 올라갈 수 있습니다."
                        },
                        {
                          icon: "V",
                          name: "잡기 (Grapple) - 행동",
                          stat: "Swords",
                          rule: "대항 Swords 판정 수행. 성공 시 대상을 붙잡아 고정(immobilize)합니다.",
                          note: "이후 이동 행동(Move) 시 자신의 이동 속도(Speed)의 절반만큼 대상을 끌고 함께 갈 수 있습니다."
                        },
                        {
                          icon: "VI",
                          name: "이동 (Move) - 행동",
                          stat: "Any",
                          rule: "손패에서 카드 1장을 버리고 자신의 속도(Speed)만큼 직교(orthogonal) 이동하거나 점프합니다.",
                          note: "대각선 이동은 불가능하며, 부상을 입어 속도가 0이 되면 혼자 이동 불가합니다."
                        },
                        {
                          icon: "VII",
                          name: "밀쳐내기 (Shove) - 행동",
                          stat: "Swords",
                          rule: "대항 Swords 판정 수행. 성공 시 대상을 자신의 Swords 스탯만큼의 칸 수(squares)로 밀쳐냅니다.",
                          note: "몬스터가 아군을 밀칠 때도 자신의 Stat만큼 밀어냅니다 (p.31)."
                        },
                        {
                          icon: "VIII",
                          name: "던지기 (Throw) - 행동",
                          stat: "Swords",
                          rule: "카드 1장을 버리고, [버린 카드 값 + Swords 스탯] 칸만큼 물체/투척 무기를 멀리 던집니다.",
                          note: "무기 투척 피해는 해당 투척품의 Wound 수치를 따릅니다."
                        },
                        {
                          icon: "IX",
                          name: "회피 (Dodge) - 반응",
                          stat: "Coins",
                          rule: "상대 턴에 피격 전 대항 Coins 판정. 성공 시 피해를 완전히 무력화합니다.",
                          note: "극적 성공(Great Success) 시 즉시 공격자에게 원하는 신체 부위에 1 Wound 피해를 가합니다."
                        },
                        {
                          icon: "X",
                          name: "반격 (Riposte) - 반응",
                          stat: "Swords",
                          rule: "적의 근접 공격이 나에게 빗나갔을 때(실패), 카드 1장을 내어 대항 근접 공격을 수행합니다.",
                          note: "상대의 헛점을 노리는 날카로운 카운터 공격입니다."
                        },
                        {
                          icon: "XI",
                          name: "부위 조준 (Called Shot) - 특수",
                          stat: "Swords",
                          rule: "공격 시 아머가 얇거나 없는 특정 부위(머리, 몸통 등)를 지정해 대항 Swords 판정 공격을 가합니다.",
                          note: "일반 공격은 피격자가 피격 부위를 결정(방패 올리기 등)하지만, Called Shot은 공격자가 지정합니다."
                        }
                      ].map((action, idx) => (
                        <div key={idx} style={{ background: "transparent", border: "1px solid var(--border-color)", borderRadius: 0, padding: "8px 10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-bright)" }}>
                              {action.icon} {action.name}
                            </span>
                            <span style={{ fontSize: "0.7rem", padding: "1px 6px", background: "transparent", color: "var(--text-bright)", borderRadius: 0, border: "1px solid var(--border-color)" }}>
                              {action.stat}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.72rem", color: "var(--text-normal)", margin: "4px 0 2px 0", lineHeight: "1.3" }}>{action.rule}</p>
                          <p style={{ fontSize: "0.67rem", color: "var(--text-muted)", margin: 0, lineHeight: "1.2", fontStyle: "italic" }}>* {action.note}</p>
                        </div>
                      ))}

                      <div style={{ padding: "7px 10px", background: "transparent", border: "1px solid var(--border-color)", borderRadius: 0, fontSize: "0.7rem", color: "var(--text-normal)", lineHeight: "1.4" }}>
                        <strong style={{ color: "var(--color-gold)" }}>전투 기본 순서 (p.30):</strong><br />
                        ① 핸드 보충: 라운드 시작 시 플레이어는 손패가 4장이 될 때까지 카드 보충. 레프리는 몬스터당 3장 드로우.<br />
                        ② 선제권 결정: 손패 중 1장을 Facedown으로 내고 동시 공개. 선제권 카드 숫자가 낮을수록(0~14) 먼저 행동.<br />
                        ③ 행동 순서: 선제권 카드 0부터 14까지 오름차순 순서로 턴 수행. (선제권 값은 피격 난이도인 Target Number가 됨)<br />
                        ④ 행동 및 반응: 손패가 있는 한 횟수 제한 없이 자유롭게 행동 수행. 상대 턴에는 반응(회피, 반격)으로 대응.<br />
                        ⑤ 광대(The Fool): 선제권 0으로 취급되거나 행동에 +3 보너스 부여. 광대가 사용된 라운드 종료 시 두 덱 모두 셔플.
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 5: JOURNAL */}
        {activeTab === "journal" && (
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            
            {/* Sub-tab selection bar */}
            <div className="journal-subtabs" style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid rgba(187, 153, 93, 0.3)", paddingBottom: "8px" }}>
              <button
                className={`btn-medieval-small journal-subtab ${journalSubView === "field" ? "gold-btn" : ""}`}
                style={{ padding: "6px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px" }}
                onClick={() => setJournalSubView("field")}
              >
                <span className="journal-subtab-title">현장 일지</span>
                <span className="journal-subtab-note">Field Journal</span>
              </button>
              <button
                className={`btn-medieval-small journal-subtab ${journalSubView === "chronicle" ? "gold-btn" : ""}`}
                style={{ padding: "6px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px" }}
                onClick={() => setJournalSubView("chronicle")}
              >
                <span className="journal-subtab-title">캐릭터 대서사</span>
                <span className="journal-subtab-note">Character Chronicle</span>
              </button>
              <button
                className={`btn-medieval-small journal-subtab ${journalSubView === "retirement" ? "gold-btn" : ""}`}
                style={{ padding: "6px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px" }}
                onClick={() => setJournalSubView("retirement")}
              >
                <span className="journal-subtab-title">은퇴 기록장</span>
                <span className="journal-subtab-note">Retirement / Epilogue</span>
              </button>
            </div>

            {/* Sub-View 1: Field Journal */}
            {journalSubView === "field" && (
              <div className="journal-layout" style={{ display: "flex", gap: "20px", width: "100%", alignItems: "flex-start" }}>
                {/* Left Column: Chronicle Editor & Daily Feed */}
                <div className="card-panel gold-border" style={{ flex: 2, padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                    <h3 className="gothic-sub" style={{ margin: 0 }}>모험 연대기 &amp; 서사 일지</h3>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button 
                        className={`btn-medieval-small ${journalDisplayMode === "thematic" ? "gold-btn" : ""}`} 
                        onClick={() => setJournalDisplayMode("thematic")}
                      >
                        여행 기록 모드
                      </button>
                      <button 
                        className={`btn-medieval-small ${journalDisplayMode === "system" ? "gold-btn" : ""}`} 
                        onClick={() => setJournalDisplayMode("system")}
                      >
                        시스템 디버그 모드
                      </button>
                      <button 
                        className="btn-medieval-small danger" 
                        onClick={handleManualPruneJournals}
                        title="고정(Pin)된 로그는 보존하고, 고정되지 않은 오래된 로그들을 정리하여 최적화합니다."
                      >
                        🧹 일지 정리 및 최적화
                      </button>
                    </div>
                  </div>

                  <p className="rules-helper-text">
                    오늘의 사건, 계시, 검투 기록을 적어두어 나만의 이야기 연대기를 만들어가는 필드입니다. (룰북의 페이지 번호는 클릭 시 빠른 규칙 카드를 표시합니다.)
                  </p>

                  {/* Tag current coordinate if available */}
                  <div className="journal-input-section" style={{ marginTop: "1rem", position: "relative" }}>
                    <textarea 
                      className="journal-textarea" 
                      style={{ width: "100%", height: "90px", padding: "10px", background: "rgba(0,0,0,0.3)", color: "#eee", border: "1px solid var(--border-color)", borderRadius: "4px", fontSize: "0.9rem" }}
                      placeholder={selectedMapCellIdx !== null 
                        ? `[위치: (${selectedMapCellIdx % 4}, ${Math.floor(selectedMapCellIdx / 4)})] 오늘의 황혼 속 모험 일지를 기록하십시오...`
                        : "오늘의 황혼 속 모험 일지를 기록하십시오..."} 
                      value={newJournalText}
                      onChange={e => setNewJournalText(e.target.value)}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-gold)" }}>
                        {selectedMapCellIdx !== null ? (
                          <span>📍 격자 좌표 <strong>({selectedMapCellIdx % 4}, {Math.floor(selectedMapCellIdx / 4)})</strong> 위치 연동 중</span>
                        ) : (
                          <span style={{ color: "#777" }}>📍 지도 탭에서 셀을 클릭하면 일지가 해당 좌표와 자동 연동됩니다.</span>
                        )}
                      </span>
                      <button className="btn-medieval" onClick={() => addJournalEntry()}>일지에 기록 추가</button>
                    </div>
                  </div>

                  {/* Grouped Chronicle Feed */}
                  <div className="journal-history-list" style={{ marginTop: "2rem" }}>
                    <h4 className="gothic-sub" style={{ fontSize: "1.1rem", borderBottom: "1px solid #333", paddingBottom: "5px" }}>연대기 기록 (Chronicle History)</h4>
                    
                    {state.journals.length === 0 ? (
                      <p className="empty-text" style={{ fontStyle: "italic", textAlign: "center", color: "#666", marginTop: "20px" }}>기록된 모험 일지가 아직 존재하지 않습니다.</p>
                    ) : (() => {
                      const groupJournalsByDayAndWatch = (entries: JournalEntry[]) => {
                        const groups: Record<number, Record<number, JournalEntry[]>> = {};
                        entries.forEach(j => {
                          const d = j.day || 1;
                          const w = j.watch || 1;
                          if (!groups[d]) groups[d] = {};
                          if (!groups[d][w]) groups[d][w] = [];
                          groups[d][w].push(j);
                        });
                        return groups;
                      };
                      
                      const grouped = groupJournalsByDayAndWatch(state.journals);
                      const sortedDays = Object.keys(grouped).map(Number).sort((a, b) => b - a);
                      
                      return sortedDays.map(dayNum => {
                        const dayGroup = grouped[dayNum];
                        return (
                          <div key={dayNum} className="chronicle-day-group" style={{ marginBottom: "20px", borderLeft: "2px solid var(--color-gold)", paddingLeft: "12px" }}>
                            <h4 style={{ color: "var(--color-gold)", margin: "0 0 10px 0", fontSize: "1.15rem", fontFamily: "Cinzel, serif" }}>
                              제 {dayNum}일 (Day {dayNum})
                            </h4>
                            
                            {Object.keys(dayGroup)
                              .map(Number)
                              .sort((a, b) => b - a)
                              .map(watchNum => {
                                const watchEntries = dayGroup[watchNum];
                                const watchName = watchNum === 1 ? "제 1워치 (새벽 - Watch 1)" :
                                                  watchNum === 2 ? "제 2워치 (황혼 - Watch 2)" :
                                                  "제 3워치 (심야 - Watch 3)";
                                
                                return (
                                  <div key={watchNum} className="chronicle-watch-group" style={{ marginBottom: "10px" }}>
                                    <div style={{ fontSize: "0.8rem", color: "#888", fontWeight: "bold", borderBottom: "1px dashed rgba(255,255,255,0.08)", paddingBottom: "2px", marginBottom: "6px" }}>
                                      {watchName}
                                    </div>
                                    
                                    {watchEntries.map(j => (
                                      <div key={j.id} className="journal-history-card" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.03)", padding: "10px", borderRadius: "4px", marginBottom: "8px" }}>
                                        <div className="flex-row justify-between align-center" style={{ borderBottom: "1px dashed rgba(255,255,255,0.06)", paddingBottom: "4px", marginBottom: "6px" }}>
                                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <span className="date" style={{ fontSize: "0.75rem", color: "#666" }}>{j.date}</span>
                                            {j.x !== null && j.y !== null && (
                                              <span style={{ fontSize: "0.72rem", color: "var(--color-gold)", background: "rgba(255, 215, 0, 0.08)", padding: "1px 4px", borderRadius: "3px" }}>
                                                좌표 ({j.x}, {j.y})
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <button 
                                              style={{ background: "transparent", border: "none", cursor: "pointer", color: j.chronicle ? "var(--color-gold)" : "#555", fontSize: "0.95rem", padding: 0 }}
                                              onClick={() => toggleChronicleJournalEntry(j.id)}
                                              title={j.chronicle ? "연대기에서 제외" : "대서사 연대기로 승격 (Add to Chronicle)"}
                                            >
                                              📖
                                            </button>
                                            <button 
                                              style={{ background: "transparent", border: "none", cursor: "pointer", color: j.pinned ? "var(--color-gold)" : "#555", fontSize: "0.95rem", padding: 0 }}
                                              onClick={() => togglePinJournalEntry(j.id)}
                                              title={j.pinned ? "일지 고정 해제 (Unpin Note)" : "일지 고정 (Pin Note - 자동 정리 방지)"}
                                            >
                                              {j.pinned ? "★" : "☆"}
                                            </button>
                                            <button 
                                              className="delete-btn" 
                                              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#888", padding: 0, fontSize: "1.1rem", lineHeight: "1" }} 
                                              onClick={() => {
                                                if (confirm("정말 이 일지 기록을 삭제하겠습니까?")) {
                                                  updateState(s => ({
                                                    ...s,
                                                    journals: s.journals.filter(x => x.id !== j.id)
                                                  }));
                                                }
                                              }}
                                            >
                                              &times;
                                            </button>
                                          </div>
                                        </div>
                                        
                                        <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", margin: 0, fontSize: "0.88rem", color: "#ddd" }}>
                                          {journalDisplayMode === "thematic" 
                                            ? renderTextWithRules(j.text, showRule) 
                                            : renderTextWithRules(j.systemLog || j.text, showRule)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Right Column: Pinned Chronicle Summary Sidebar */}
                <div className="card-panel gold-border" style={{ flex: 1, padding: "20px", background: "var(--color-card-bg)", borderColor: "var(--color-gold)", position: "sticky", top: "20px" }}>
                  <h4 className="gothic-sub" style={{ borderBottom: "2px solid var(--color-gold)", paddingBottom: "5px", color: "var(--color-gold)", marginTop: 0 }}>
                    황혼의 대서사 (Chronicle)
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", margin: "5px 0 15px 0" }}>
                    일지에서 고정(★)한 역사적 사건들이 서사 요약집을 형성하여 남습니다.
                  </p>

                  <div style={{ maxHeight: "450px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "5px" }}>
                    {state.journals.filter(j => j.chronicle).length === 0 ? (
                      <p style={{ fontStyle: "italic", fontSize: "0.75rem", color: "#555", textAlign: "center", margin: "20px 0" }}>
                        아직 기록된 연대기 사건이 없습니다. 일지의 [📖] 아이콘을 클릭해 연대기로 승격하십시오.
                      </p>
                    ) : (
                      state.journals
                        .filter(j => j.chronicle)
                        .sort((a, b) => (a.day || 1) - (b.day || 1) || (a.watch || 1) - (b.watch || 1)) // chronological order for story reading
                        .map(j => (
                          <div key={j.id} style={{ borderBottom: "1px dashed rgba(255, 215, 0, 0.15)", paddingBottom: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-gold)", fontWeight: "bold", marginBottom: "3px" }}>
                              <span>Day {j.day || 1} - Watch {j.watch || 1}</span>
                              {j.x !== null && j.y !== null && (
                                <span>📍 ({j.x}, {j.y})</span>
                              )}
                            </div>
                            <p style={{ margin: 0, fontSize: "0.82rem", color: "#ccc", lineHeight: "1.5", fontStyle: "italic" }}>
                              {j.chronicleIcon ? `${j.chronicleIcon} ` : ""}&ldquo;{j.text}&rdquo;
                            </p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-View 2: Character Chronicle */}
            {journalSubView === "chronicle" && (
              <div className="journal-layout" style={{ display: "flex", gap: "20px", width: "100%", alignItems: "flex-start" }}>
                {/* Left Column: Chapters editor & listing */}
                <div className="card-panel gold-border" style={{ flex: 1.1, padding: "20px" }}>
                  <h3 className="gothic-sub" style={{ margin: "0 0 10px 0", borderBottom: "2px solid var(--color-gold)", paddingBottom: "5px" }}>
                    📚 챕터 관리자 (Campaign Chapters)
                  </h3>
                  <p className="rules-helper-text" style={{ fontSize: "0.74rem", margin: "0 0 15px 0", lineHeight: "1.4" }}>
                    여정의 주요 분기점이나 장소 이동에 맞춰 커스텀 챕터를 생성해 보세요. 모험의 전체 윤곽을 구성하는 데 도움이 됩니다.
                  </p>

                  {/* Chapter Creator Form */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(0,0,0,0.25)", padding: "12px", borderRadius: "6px", border: "1px solid rgba(187, 153, 93, 0.2)" }}>
                    <h5 className="gothic-sub" style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-gold)", borderBottom: "none" }}>
                      📖 새 챕터 추가
                    </h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.68rem", color: "#888" }}>챕터 제목 (예: 제1장: 황혼의 시작):</span>
                      <input 
                        type="text" 
                        value={newChapterTitle} 
                        onChange={e => setNewChapterTitle(e.target.value)} 
                        style={{ fontSize: "0.8rem", padding: "4px 8px", background: "rgba(0,0,0,0.4)", color: "#fff", border: "1px solid #444", borderRadius: "3px" }}
                        placeholder="예: 황혼의 시작"
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.68rem", color: "#888" }}>기간 (예: Day 1 - 5):</span>
                      <input 
                        type="text" 
                        value={newChapterDateRange} 
                        onChange={e => setNewChapterDateRange(e.target.value)} 
                        style={{ fontSize: "0.8rem", padding: "4px 8px", background: "rgba(0,0,0,0.4)", color: "#fff", border: "1px solid #444", borderRadius: "3px" }}
                        placeholder="예: Day 1 ~ 5"
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.68rem", color: "#888" }}>챕터 요약 및 소회:</span>
                      <textarea 
                        value={newChapterSummary} 
                        onChange={e => setNewChapterSummary(e.target.value)} 
                        style={{ fontSize: "0.8rem", padding: "6px 8px", background: "rgba(0,0,0,0.4)", color: "#fff", border: "1px solid #444", borderRadius: "3px", height: "70px", resize: "none" }}
                        placeholder="이 시기 동안 겪은 중요 사건을 간략히 요약합니다..."
                      />
                    </div>
                    <button 
                      className="btn-medieval" 
                      style={{ fontSize: "0.8rem", padding: "4px 10px", marginTop: "5px" }}
                      onClick={() => {
                        if (!newChapterTitle.trim() && !newChapterSummary.trim() && !newChapterDateRange.trim()) {
                          alert("챕터 제목, 기간, 요약 중 하나는 작성해야 합니다.");
                          return;
                        }
                        updateState(s => ({
                          ...s,
                          character: {
                            ...s.character,
                            chronicleChapters: [
                              ...(s.character.chronicleChapters || []),
                              {
                                id: generateUniqueId(),
                                title: newChapterTitle.trim() || `Day ${s.day}의 장`,
                                summary: newChapterSummary.trim() || "요약 없음",
                                dateRange: newChapterDateRange.trim() || `Day ${s.day}`
                              }
                            ]
                          }
                        }));
                        setNewChapterTitle("");
                        setNewChapterSummary("");
                        setNewChapterDateRange("");
                        alert("새로운 챕터가 연대기에 추가되었습니다!");
                      }}
                    >
                      챕터 등록
                    </button>
                  </div>

                  {/* Chapters List */}
                  <div style={{ marginTop: "20px" }}>
                    <h5 className="gothic-sub" style={{ fontSize: "0.88rem", color: "var(--color-gold)", margin: "0 0 10px 0", borderBottom: "none" }}>
                      📖 작성된 챕터 목록
                    </h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                      {(!state.character.chronicleChapters || state.character.chronicleChapters.length === 0) ? (
                        <p style={{ fontStyle: "italic", fontSize: "0.75rem", color: "#555", textAlign: "center", margin: "10px 0" }}>
                          등록된 챕터가 없습니다. 여정의 매듭을 지어 챕터를 추가해 보세요.
                        </p>
                      ) : (
                        state.character.chronicleChapters.map((c, idx) => (
                          <div key={c.id} style={{ border: "1px solid rgba(187, 153, 93, 0.3)", background: "rgba(187, 153, 93, 0.04)", padding: "10px", borderRadius: "5px", fontSize: "0.78rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(187, 153, 93, 0.15)", paddingBottom: "3px", marginBottom: "5px" }}>
                              <strong style={{ color: "var(--color-gold)" }}>Chapter {idx + 1}. {c.title}</strong>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span style={{ fontSize: "0.68rem", color: "#888" }}>({c.dateRange})</span>
                                <button
                                  style={{ background: "transparent", border: "none", color: "#f44336", cursor: "pointer", fontSize: "0.85rem" }}
                                  onClick={() => {
                                    if (confirm("이 챕터를 삭제하시겠습니까?")) {
                                      updateState(s => ({
                                        ...s,
                                        character: {
                                          ...s.character,
                                          chronicleChapters: (s.character.chronicleChapters || []).filter(item => item.id !== c.id)
                                        }
                                      }));
                                    }
                                  }}
                                >
                                  &times;
                                </button>
                              </div>
                            </div>
                            <p style={{ margin: 0, color: "#ccc", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
                              {c.summary}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Narrative progression preview */}
                <div className="card-panel gold-border" style={{ flex: 1.1, padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--color-gold)", paddingBottom: "5px", marginBottom: "15px" }}>
                    <h3 className="gothic-sub" style={{ margin: 0, border: "none" }}>
                      📝 연대기 요약 &amp; 내보내기
                    </h3>
                    <button
                      className="btn-medieval"
                      style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                      onClick={() => {
                        const md = generateMarkdownChronicle(state);
                        setMarkdownContent(md);
                        setShowExportModal(true);
                      }}
                    >
                      📤 Markdown 내보내기
                    </button>
                  </div>

                  <p className="rules-helper-text" style={{ fontSize: "0.74rem", lineHeight: "1.4", marginBottom: "15px" }}>
                    지금까지 캐릭터가 얻은 흉터, 달성한 과업, 챕터 요약을 하나의 기록물로 엮어 미리 봅니다.
                  </p>

                  <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "6px", border: "1px solid #333", maxHeight: "400px", overflowY: "auto", fontSize: "0.78rem", display: "flex", flexDirection: "column", gap: "15px" }}>
                    {/* Character Base info */}
                    <div>
                      <h5 style={{ color: "var(--color-gold)", margin: "0 0 5px 0", fontSize: "0.82rem", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "2px" }}>모험가 프로필</h5>
                      <div>이름: {state.character.name} | 직업: {state.character.vocation} | {state.character.age}세</div>
                      <div>XP: {state.character.xp} | 결의: {state.character.resolve} | 생존: 총 {state.day}일</div>
                    </div>

                    {/* Milestones */}
                    <div>
                      <h5 style={{ color: "var(--color-gold)", margin: "0 0 5px 0", fontSize: "0.82rem", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "2px" }}>달성한 업적</h5>
                      {state.character.goals.filter(g => g.status === "completed").length === 0 ? (
                        <span style={{ color: "#666", fontStyle: "italic" }}>달성한 목표가 없습니다.</span>
                      ) : (
                        state.character.goals.filter(g => g.status === "completed").map(cg => (
                          <div key={cg.id} style={{ margin: "3px 0 0 5px", color: "#ccc" }}>
                            • <strong>[{cg.completedDate}]</strong> {cg.text} (경위: {cg.milestoneNote})
                          </div>
                        ))
                      )}
                    </div>

                    {/* Scars */}
                    <div>
                      <h5 style={{ color: "var(--color-gold)", margin: "0 0 5px 0", fontSize: "0.82rem", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "2px" }}>부상 및 흉터</h5>
                      {(!state.character.injuryLogs || state.character.injuryLogs.length === 0) ? (
                        <span style={{ color: "#666", fontStyle: "italic" }}>기록된 신체 흉터가 없습니다.</span>
                      ) : (
                        state.character.injuryLogs.map(l => (
                          <div key={l.id} style={{ margin: "3px 0 0 5px", color: "#ccc" }}>
                            • [{l.location === "head" ? "머리" : l.location === "torso" ? "몸통" : l.location === "lArm" ? "왼팔" : l.location === "rArm" ? "오른팔" : l.location === "lLeg" ? "왼다리" : "오른다리"}] {l.injuryText} {l.healed && `(흔적: ${l.scarsNotes})`}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Relationships */}
                    <div>
                      <h5 style={{ color: "var(--color-gold)", margin: "0 0 5px 0", fontSize: "0.82rem", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "2px" }}>인연 &amp; 원수</h5>
                      <div style={{ paddingLeft: "5px" }}>
                        <strong>인연:</strong> {state.character.friends.map(f => `${f.name}(${f.relationship || "중립"})`).join(", ") || "없음"}
                      </div>
                      <div style={{ paddingLeft: "5px", marginTop: "3px" }}>
                        <strong>원수:</strong> {state.character.foes.map(f => `${f.name}(${f.relationship || "중립"})`).join(", ") || "없음"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-View 3: Retirement / Epilogue */}
            {journalSubView === "retirement" && (
              <div className="journal-layout" style={{ display: "flex", gap: "20px", width: "100%", justifyContent: "center" }}>
                <div className="card-panel gold-border" style={{ maxWidth: "600px", width: "100%", padding: "25px", background: "rgba(30, 25, 20, 0.75)" }}>
                  <h3 className="gothic-sub" style={{ margin: "0 0 10px 0", borderBottom: "2px solid var(--color-gold)", paddingBottom: "5px", textAlign: "center" }}>
                    모험가의 은퇴 및 에필로그 (Retirement &amp; Epilogue)
                  </h3>
                  
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", lineHeight: "1.5", margin: "0 0 20px 0" }}>
                    &ldquo;황혼(Gloaming) 속에서 당신이 남긴 맹세는 완수되었습니까, 아니면 야생의 침묵 속에 묻혔습니까?&rdquo;<br />
                    방랑의 끝자락, 캐릭터의 마지막 운명이나 은퇴의 순간을 에필로그 서사로 엄숙히 장식해 주십시오.
                  </p>

                  <div className="export-monologue-frame" style={{ border: "1px solid rgba(187,153,93,0.3)", padding: "15px", borderRadius: "6px", background: "rgba(0,0,0,0.3)", marginBottom: "20px" }}>
                    <h5 style={{ margin: "0 0 8px 0", fontSize: "0.82rem", color: "var(--color-gold)", fontFamily: "Cinzel, serif" }}>
                      마지막 독백 / 캐릭터의 종장 (The Epilogue)
                    </h5>
                    <textarea
                      value={state.character.epilogue || ""}
                      onChange={e => {
                        const val = e.target.value;
                        updateState(s => ({
                          ...s,
                          character: {
                            ...s.character,
                            epilogue: val
                          }
                        }));
                      }}
                      style={{
                        width: "100%",
                        height: "180px",
                        background: "transparent",
                        border: "none",
                        color: "#eee",
                        fontSize: "0.88rem",
                        lineHeight: "1.6",
                        fontStyle: "italic",
                        resize: "none",
                        outline: "none",
                        padding: "5px"
                      }}
                      placeholder="이 방랑자는 마침내 황혼 아래에서 안식을 찾았다..."
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <button
                      className="btn-medieval"
                      onClick={() => {
                        const epilogueText = state.character.epilogue.trim() || "에필로그가 빈 기록으로 보존되었습니다.";
                        updateState(s => ({
                          ...s,
                          journals: [
                            {
                              id: generateUniqueId(),
                              text: `🕯 [캠페인 종료] 에필로그: ${epilogueText}`,
                              date: new Date().toLocaleString(),
                              day: s.day,
                              watch: s.watch,
                              pinned: true,
                              systemGenerated: true,
                              chronicle: true,
                              chronicleCategory: "campaign_end",
                              chronicleIcon: "🕯"
                            },
                            ...s.journals
                          ]
                        }));
                        alert("에필로그가 캐릭터 시트와 Journal에 보존되었습니다.");
                      }}
                    >
                      💾 에필로그를 Journal에 봉인
                    </button>
                    <button
                      className="btn-medieval"
                      onClick={() => {
                        const md = generateMarkdownChronicle(state);
                        setMarkdownContent(md);
                        setShowExportModal(true);
                      }}
                    >
                      📤 전체 연대기 내보내기 (Markdown)
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
      </section>

      {/* Item Purchase Test Modal Popup */}
      {buyCatalogItem && (
        <div className="modal-backdrop">
          <div className="modal-content-panel gold-border">
            <h3 className="gothic-sub">기어 획득 판정 (Coins Test)</h3>
            <p className="desc" style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "1rem" }}>
              아이템 <strong>{buyCatalogItem.nameKo} ({buyCatalogItem.name})</strong>을(를) 획득하려 Coins 판정을 수행합니다.<br />
              구매 수정치: <strong style={{ color: "var(--gold)" }}>{buyCatalogItem.coinsMod}</strong> &bull; 
              Swords 요구치: <strong>{buyCatalogItem.swordsReq || "-"}</strong>
            </p>

            {buyTestResult ? (
              <div className="buy-test-result-box">
                <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "1rem" }}>
                  <img 
                    src={getCardImageUrl(buyTestResult.card)} 
                    alt="test card" 
                    style={{ width: "80px", height: "auto", border: "1px solid #444" }}
                  />
                  <div>
                    <h5>판정 카드: {getCardDisplayName(buyTestResult.card)}</h5>
                    <div style={{ fontSize: "0.9rem", color: "#ddd" }}>
                      카드값 + Coins스탯 + 수정치 + 부상페널티 = 총합 <br />
                      <strong>{buyTestResult.total - buyTestResult.statUsed - (parseInt(buyCatalogItem.coinsMod) || 0) - testPenalty} + {buyTestResult.statUsed} + {buyCatalogItem.coinsMod} + {testPenalty} = {buyTestResult.total}</strong>
                    </div>
                  </div>
                </div>

                <div className={`result-outcome-badge ${buyTestResult.success ? "success" : "failed"}`}>
                  판정 결과: {buyTestResult.success ? "🎉 구매 성공! (14점 이상)" : "💥 구매 실패 (자금 부족/재고 없음)"}
                </div>

                <div className="flex-row gap-10" style={{ marginTop: "1.5rem" }}>
                  <button className="btn-medieval flex-1" onClick={() => setBuyCatalogItem(null)}>확인</button>
                  {!buyTestResult.success && (
                    <button className="btn-medieval" onClick={handleResolveBuyTest}>
                      재시도 (결의 소모 또는 푸시)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: "#ddd", marginBottom: "1rem" }}>플레이어 덱에서 카드 1장을 뽑아 Coins 수정치 및 판정 페널티를 대입합니다.</p>
                <button className="btn-medieval" onClick={handleResolveBuyTest}>카드 뽑고 판정하기</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session End XP Wizard Modal */}
      {showSessionXpWizard && (
        <div className="modal-backdrop">
          <div className="modal-content-panel gold-border" style={{ maxWidth: "450px" }}>
            <h3 className="gothic-sub" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "15px" }}>
              ⏳ 세션 종료 및 XP 정산 (End of Session XP)
            </h3>
            
            <p className="desc" style={{ color: "#aaa", fontSize: "0.82rem", marginBottom: "1.2rem", lineHeight: "1.4" }}>
              룰북 p.35 규칙에 따라 세션 종료 시 다음과 같은 질문에 답하여 경험치(XP) 및 결의(Resolve) 보상을 정산합니다.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "15px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", cursor: "pointer", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "4px", border: "1px solid #333" }}>
                <input 
                  type="checkbox" 
                  checked={sessionParticipated} 
                  onChange={e => setSessionParticipated(e.target.checked)} 
                />
                <div>
                  <strong style={{ color: "var(--color-gold)" }}>세션에 참여했습니까? (+1 XP)</strong>
                  <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px" }}>세션을 진행하고 기여한 경우 획득합니다.</div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", cursor: "pointer", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "4px", border: "1px solid #333" }}>
                <input 
                  type="checkbox" 
                  checked={sessionEndangered} 
                  onChange={e => setSessionEndangered(e.target.checked)} 
                />
                <div>
                  <strong style={{ color: "var(--color-gold)" }}>생명이 위태로운 조우를 겪었습니까? (+1 XP)</strong>
                  <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px" }}>전투나 치명적인 곤경에서 살아남았을 경우 획득합니다.</div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", cursor: "pointer", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "4px", border: "1px solid #333" }}>
                <input 
                  type="checkbox" 
                  checked={sessionGoalFulfilled} 
                  onChange={e => setSessionGoalFulfilled(e.target.checked)} 
                />
                <div>
                  <strong style={{ color: "var(--color-gold)" }}>캐릭터 목표(Goal) 중 최소 하나를 달성했습니까? (+1 XP, +1 결의)</strong>
                  <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px" }}>세션 목표나 캐릭터 전용 목표를 완료했을 경우 획득합니다. (결의는 최대 10점 한도)</div>
                </div>
              </label>
            </div>

            <div style={{ background: "rgba(184,142,80,0.08)", border: "1px solid rgba(184,142,80,0.25)", borderRadius: "4px", padding: "10px", margin: "15px 0", textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "#aaa" }}>예상 획득 보상</div>
              <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--color-gold)", margin: "4px 0" }}>
                XP +{(sessionParticipated ? 1 : 0) + (sessionEndangered ? 1 : 0) + (sessionGoalFulfilled ? 1 : 0)} / 
                결의 +{sessionGoalFulfilled ? 1 : 0}
              </div>
            </div>

            <div className="flex-row gap-10" style={{ marginTop: "1.5rem" }}>
	              <button className="btn-medieval flex-1" onClick={() => {
                const rewardSessionId = `day-${state.day}-watch-${state.watch}`;
                if (state.sessionRewardHistory.some(r => r.id === rewardSessionId)) {
                  alert("이 세션 보상은 이미 정산되었습니다.");
                  return;
                }
                if (!sessionParticipated && !sessionEndangered && !sessionGoalFulfilled) {
                  alert("정산할 유효한 세션 조건을 하나 이상 선택해야 합니다.");
                  return;
                }
                if (sessionGoalFulfilled && state.character.goals.filter(g => g.status === "completed").length === 0) {
                  alert("목표 달성 보상을 받으려면 완료된 Goal 기록이 최소 하나 필요합니다.");
                  return;
                }
                const addXp = (sessionParticipated ? 1 : 0) + (sessionEndangered ? 1 : 0) + (sessionGoalFulfilled ? 1 : 0);
                const addResolve = sessionGoalFulfilled ? 1 : 0;
                
                updateState(s => {
                  const newXp = s.character.xp + addXp;
                  const newResolve = Math.min(10, s.character.resolve + addResolve);
                  
                  // Journal text
                  const reasons = [];
                  if (sessionParticipated) reasons.push("세션 참여 (+1 XP)");
                  if (sessionEndangered) reasons.push("생명 위협 (+1 XP)");
                  if (sessionGoalFulfilled) reasons.push("목표 달성 (+1 XP, +1 결의)");
                  
                  const reasonStr = reasons.length > 0 ? reasons.join(", ") : "기본 정산";
                  
                  const rewardRecord: SessionRewardRecord = {
                    id: rewardSessionId,
                    date: new Date().toLocaleString(),
                    day: s.day,
                    watch: s.watch,
                    xp: addXp,
                    resolve: addResolve,
                    reasons
                  };

                  return {
                    ...s,
                    currentSessionId: rewardSessionId,
                    sessionRewardHistory: [...s.sessionRewardHistory, rewardRecord],
                    character: {
                      ...s.character,
                      xp: newXp,
                      resolve: newResolve
                    },
                    journals: [{
                      id: generateUniqueId(),
                      text: `[세션 종료 정산] 획득: XP +${addXp}, 결의 +${addResolve} (사유: ${reasonStr})`,
                      date: new Date().toLocaleString()
                    }, ...s.journals]
                  };
                });
                
                setShowSessionXpWizard(false);
                alert(`🎉 세션 정산이 완료되었습니다!\n경험치 +${addXp}점과 결의 +${addResolve}점이 적립되었습니다.`);
              }}>
                정산 적용
              </button>
              <button className="btn-medieval danger" onClick={() => setShowSessionXpWizard(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rulebook Reference Modal */}
      {showRuleModal && (
        <div className="modal-backdrop" onClick={() => setShowRuleModal(false)}>
          <div className="modal-content-panel gold-border" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="gothic-sub" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>📖 {activeRuleTitle} {activeRulePage && `(p.${activeRulePage})`}</span>
              <button 
                className="delete-btn" 
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem" }}
                onClick={() => setShowRuleModal(false)}
              >&times;</button>
            </h3>
            <p style={{ color: "#ddd", fontSize: "0.9rem", lineHeight: "1.6", whiteSpace: "pre-wrap", margin: "10px 0" }}>
              {activeRuleText}
            </p>
            <div style={{ textAlign: "right", marginTop: "20px" }}>
              <button className="btn-medieval" onClick={() => setShowRuleModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Markdown Export Modal */}
      {showExportModal && (
        <div className="modal-backdrop">
          <div className="modal-content-panel gold-border" style={{ maxWidth: "650px", width: "95%" }}>
            <h3 className="gothic-sub" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>📤 캐릭터 연대기 내보내기 (Markdown Export)</span>
              <button 
                className="delete-btn" 
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem" }}
                onClick={() => setShowExportModal(false)}
              >&times;</button>
            </h3>
            <p style={{ color: "#aaa", fontSize: "0.8rem", marginBottom: "12px", lineHeight: "1.4" }}>
              전체 캠페인의 발자취가 정돈된 마크다운 문서로 변환되었습니다. 복사하여 개인 일지나 블로그, 커뮤니티에 자유롭게 활용해 보세요.
            </p>
            <textarea
              readOnly
              value={markdownContent}
              style={{
                width: "100%",
                height: "280px",
                background: "rgba(0,0,0,0.5)",
                color: "#ddd",
                border: "1px solid #444",
                borderRadius: "4px",
                padding: "10px",
                fontSize: "0.8rem",
                fontFamily: "monospace",
                lineHeight: "1.5",
                resize: "none",
                marginBottom: "15px"
              }}
              onClick={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.select();
              }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                className="btn-medieval"
                onClick={() => {
                  navigator.clipboard.writeText(markdownContent);
                  alert("마크다운 문서가 클립보드에 복사되었습니다!");
                }}
              >
                📋 클립보드 복사
              </button>
              <button
                className="btn-medieval"
                onClick={() => {
                  const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = `${state.character.name.replace(/[^\w가-힣-]+/g, "_") || "gloam"}_chronicle.md`;
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
              >
                ⬇️ .md 다운로드
              </button>
              <button
                className="btn-medieval danger"
                onClick={() => setShowExportModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
