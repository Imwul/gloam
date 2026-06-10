import { useState, useEffect } from "react";
import { db, isFirebaseConfigured, auth, googleProvider } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { 
  WEAPONS, 
  ARMOR, 
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
  Trash2, 
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
  goals: string[];
  friends: { name: string; info: string }[];
  foes: { name: string; info: string }[];
  hirelings: { name: string; info: string }[];
  unlockedTalents: string[];
  lifepathLogs: string[];
  spellbook: string[]; // Arcane spells known by the character
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
  journals: { id: string; text: string; date: string }[];
  combatMonsters: CombatMonster[];
  combatRound: number;
  mapType: "wilderness" | "dungeon" | "settlement";
  day: number;
  watch: number; // 1, 2, 3
  lastDrawnOracleCardValue: string | null;
  activeTest: ActiveTest | null;
  arcaneSpellResult: { minorCard: Card; majorCard: Card; spellName: string; ruleSummary: string } | null;
  alchemicalBrewResult: { success: boolean; potionName: string; ingredient: string; total: number; card: Card } | null;
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
    "어릴 적 고향을 파괴한 도적 두목을 추적해 처단한다.",
    "잃어버린 가문의 명검 아스칼론을 폐허에서 찾아낸다.",
    "황혼의 거점 성채에 갇힌 친구를 구출한다."
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
  spellbook: []
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
  alchemicalBrewResult: null
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
  const [buyCatalogItem, setBuyCatalogItem] = useState<{ name: string; nameKo: string; coinsMod: string; swordsReq?: number } | null>(null);
  const [buyTestResult, setBuyTestResult] = useState<{ success: boolean; total: number; card: Card; statUsed: number } | null>(null);

  // Oracle drawn states
  const [drawnOracleCard, setDrawnOracleCard] = useState<Card | null>(null);
  const [oracleYesNo, setOracleYesNo] = useState<string | null>(null);
  const [oracleAmount, setOracleAmount] = useState<string | null>(null);
  const [oracleActionSubject, setOracleActionSubject] = useState<{ action: string; subject: string; card1: Card; card2: Card } | null>(null);

  // Combat States
  const [selectedMonsterToSpawn, setSelectedMonsterToSpawn] = useState<number>(1);

  // Downtime & Special Tables States
  const [carousingResult, setCarousingResult] = useState<{ card: Card; text: string } | null>(null);
  const [folkNpcResult, setFolkNpcResult] = useState<{ card: Card; femaleName: string; maleName: string; occupation: string; personality: string } | null>(null);
  const [selectedMagickSuit, setSelectedMagickSuit] = useState<"Swords" | "Coins" | "Cups" | "Wands">("Swords");
  const [magickItemResult, setMagickItemResult] = useState<{ card: Card; suit: string; name: string; text: string } | null>(null);

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
              const localStr = localStorage.getItem("gloam_rpg_state");
              if (localStr) {
                const localParsed = JSON.parse(localStr);
                const isLocalDefault = !localParsed.character?.name || localParsed.character.name === "알릭 (Alaric)";
                if (isLocalDefault || confirm("구글 클라우드 백업 데이터를 발견했습니다. 불러오시겠습니까?")) {
                  setState(parsed);
                  localStorage.setItem("gloam_rpg_state", JSON.stringify(parsed));
                }
              } else {
                setState(parsed);
                localStorage.setItem("gloam_rpg_state", JSON.stringify(parsed));
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
      if (loaded) {
        // Safe checks/migrations
        if (!loaded.character) loaded.character = INITIAL_CHARACTER;
        if (!loaded.character.spellbook) loaded.character.spellbook = [];
        if (loaded.day === undefined) loaded.day = 1;
        if (loaded.watch === undefined) loaded.watch = 1;
        if (loaded.lastDrawnOracleCardValue === undefined) loaded.lastDrawnOracleCardValue = null;
        if (loaded.activeTest === undefined) loaded.activeTest = null;
        if (loaded.arcaneSpellResult === undefined) loaded.arcaneSpellResult = null;
        if (loaded.alchemicalBrewResult === undefined) loaded.alchemicalBrewResult = null;
        if (!loaded.mapGrid) {
          loaded.mapGrid = Array.from({ length: 16 }, (_, i) => ({
            x: i % 4,
            y: Math.floor(i / 4)
          }));
        }
        setState(loaded);
      } else {
        // Initialize state and decks
        setState({
          ...INITIAL_STATE,
          playerDeck: createPlayerDeck(),
          refereeDeck: createRefereeDeck()
        });
      }
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
        if (loaded) {
          setState(loaded);
        } else {
          setState({
            ...INITIAL_STATE,
            playerDeck: createPlayerDeck(),
            refereeDeck: createRefereeDeck()
          });
        }
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

    // Vocation mapping based on stat value 4
    let detectedVocation = char.vocation;
    if (char.stats.cups === 4) detectedVocation = "전령관 (Herald)";
    else if (char.stats.swords === 4) detectedVocation = "방랑기사 (Knight-Errant)";
    else if (char.stats.wands === 4) detectedVocation = "비술사 (Mystic)";
    else if (char.stats.coins === 4) detectedVocation = "소매치기 (Cutpurse)";

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
    let foolDrawn = false;
    updateState(s => {
      let deck = [...s.playerDeck];
      let discard = [...s.playerDiscard];
      let hand = [...s.hand];

      for (let i = 0; i < count; i++) {
        if (deck.length === 0) {
          if (discard.length === 0) break; // no cards at all
          deck = shuffle(discard);
          discard = [];
        }
        const card = deck.shift();
        if (card) {
          if (card.type === "major" && card.card === "0") {
            foolDrawn = true;
          }
          const isReversed = Math.random() < 0.25;
          hand.push({ ...card, reversed: isReversed });
        }
      }

      return {
        ...s,
        playerDeck: deck,
        playerDiscard: discard,
        hand
      };
    });

    if (foolDrawn) {
      setTimeout(() => {
        alert("🔄 플레이어 덱에서 광대(The Fool)가 드로우되었습니다! 규칙에 따라 모든 손패를 회수하고 양쪽 덱 전체를 새로 섞습니다.");
        reshuffleAllDecks();
      }, 50);
    }
  };

  const playCardFromHand = (idx: number, purpose: string) => {
    updateState(s => {
      const card = s.hand[idx];
      const nextHand = s.hand.filter((_, i) => i !== idx);
      const nextDiscard = [...s.playerDiscard, card];

      return {
        ...s,
        hand: nextHand,
        playerDiscard: nextDiscard,
        journals: [
          {
            id: Date.now().toString(),
            text: `[카드 사용] 손패에서 ${getCardDisplayName(card)} 카드를 '${purpose}' 목적을 위해 제출했습니다.`,
            date: new Date().toLocaleString()
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
        discard.push(c);
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
        if (purpose === "carousing" || purpose === "spell") {
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
              id: Date.now().toString(),
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
      const fullPlayerDeck = createPlayerDeck();
      const fullRefereeDeck = createRefereeDeck();
      return {
        ...s,
        playerDeck: fullPlayerDeck,
        playerDiscard: [],
        refereeDeck: fullRefereeDeck,
        refereeDiscard: [],
        hand: [],
        lastDrawnOracleCardValue: null
      };
    });
    alert("🔄 덱 전체가 소집되었습니다! 플레이어 덱과 레프리 덱의 버린 카드 더미를 모두 모아 새로 섞어 손패를 초기화했습니다.");
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
  const [testStat, setTestStat] = useState<"cups" | "swords" | "coins" | "wands" | "none">("none");
  const [testMod, setTestMod] = useState<number>(0);
  const [testOppMonsterId, setTestOppMonsterId] = useState<string>("none");
  const [testCustomOppPenalty, setTestCustomOppPenalty] = useState<number>(0);
  const [testHelpStat, setTestHelpStat] = useState<number>(0);
  const [testPurpose, setTestPurpose] = useState<string>("");
  const [testDrawnCards, setTestDrawnCards] = useState<Card[]>([]);
  const [testPushed, setTestPushed] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<"idle" | "rolled" | "success" | "failed" | "great_success" | "great_failure">("idle");

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
  };

  const rollGeneralTest = () => {
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

    let cardVal = 0;
    if (card.card === "A") cardVal = 1;
    else if (card.card === "Page") cardVal = 11;
    else if (card.card === "Knight") cardVal = 12;
    else if (card.card === "Queen") cardVal = 13;
    else if (card.card === "King") cardVal = 14;
    else cardVal = parseInt(card.card) || 0;

    const total = cardVal + statVal + testMod - oppPenalty + testHelpStat + testPenalty;
    const isSuccess = total >= 14;
    const isSuitMatch = card.suit === testStat;
    const isGreatSuccess = isSuccess && isSuitMatch;

    setTestDrawnCards([card]);
    setTestPushed(false);

    if (isGreatSuccess) {
      setTestStatus("great_success");
    } else if (isSuccess) {
      setTestStatus("success");
    } else {
      setTestStatus("failed");
    }

    const statName = testStat === "cups" ? "Cups" : testStat === "swords" ? "Swords" : testStat === "coins" ? "Coins" : testStat === "wands" ? "Wands" : "None";
    const statusText = isGreatSuccess ? "극적 성공 (Great Success)" : isSuccess ? "성공 (Success)" : "실패 (Failure)";
    const logMsg = `[판정 - ${statName}] 목적: ${testPurpose || "일반 판정"} | 카드: ${getCardDisplayName(card)} (${cardVal}) | 합계: ${total} (스탯: ${statVal}, 모디파이어: ${testMod}, 대항패널티: -${oppPenalty}, 헬프: +${testHelpStat}, 부상패널티: ${testPenalty}) -> 결과: ${statusText}`;
    addJournalEntry(logMsg);
  };

  const pushGeneralTest = () => {
    if (testStatus !== "failed") return;

    const card = drawPlayerCard("test");
    if (!card) {
      resetTestState();
      return;
    }

    let cardVal = 0;
    if (card.card === "A") cardVal = 1;
    else if (card.card === "Page") cardVal = 11;
    else if (card.card === "Knight") cardVal = 12;
    else if (card.card === "Queen") cardVal = 13;
    else if (card.card === "King") cardVal = 14;
    else cardVal = parseInt(card.card) || 0;

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

    const total = origCardVal + cardVal + statVal + testMod - oppPenalty + testHelpStat + testPenalty;
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

  // --- Downtime Helper Functions ---
  const getCarousingKey = (card: Card): string => {
    if (card.type === "major" && card.card === "0") return "Fool";
    if (card.card === "Page") return "P";
    if (card.card === "Knight") return "Kn";
    if (card.card === "Queen") return "Q";
    if (card.card === "King") return "K";
    return card.card;
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
      updateState(s => ({
        ...s,
        day: s.day + 1,
        watch: 1,
        character: {
          ...s.character,
          wounds: {
            ...s.character.wounds,
            [partKey]: false
          }
        },
        journals: [
          {
            id: Date.now().toString(),
            text: `[야영 휴식] 식사와 함께 편안한 휴식을 취해 ${partNameKo} 부상을 치유했습니다. (시간이 제 ${s.day + 1}일 제 1워치로 전진했습니다.)`,
            date: new Date().toLocaleString()
          },
          ...s.journals
        ]
      }));
      alert(`${partNameKo}의 상처가 깨끗하게 치유되었습니다!`);
    }
  };

  const rollMonsterMoraleTest = (monName: string, monStat: number) => {
    drawRefereeCard((card) => {
      let cardVal = 0;
      if (card.card === "A") cardVal = 1;
      else if (card.card === "Page") cardVal = 11;
      else if (card.card === "Knight") cardVal = 12;
      else if (card.card === "Queen") cardVal = 13;
      else if (card.card === "King") cardVal = 14;
      else cardVal = parseInt(card.card) || 0;

      const total = cardVal + monStat;
      const success = total >= 14;
      const text = `[몬스터 사기 판정] ${monName} -> 난이도 14 | 판정합: ${total} (레프리 카드: ${getCardDisplayName(card)} + 몬스터 능력치: ${monStat}) -> 결과: ${success ? "성공 (사기 유지)" : "실패 (사기 꺾임/도망/항복)"}`;
      
      alert(text);
      updateState(s => ({
        ...s,
        journals: [
          {
            id: Date.now().toString(),
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

    let cardVal = 0;
    if (card.card === "A") cardVal = 1;
    else if (card.card === "Page") cardVal = 11;
    else if (card.card === "Knight") cardVal = 12;
    else if (card.card === "Queen") cardVal = 13;
    else if (card.card === "King") cardVal = 14;
    else cardVal = parseInt(card.card) || 0;

    const total = cardVal + statVal;
    const success = total >= 14;
    
    let outcomeText = "";
    if (success) {
      outcomeText = "우호적임 (Friendly/Helpful) - 협조적이거나 호의를 보입니다.";
    } else {
      outcomeText = "비우호적임 (Hostile/Unfriendly) - 대화를 거부하거나 적대감을 드러냅니다.";
    }
    
    const text = `[NPC 반응 판정] ${npcName} -> Cups 판정합: ${total} (플레이어 카드: ${getCardDisplayName(card)} + Cups: ${statVal}) -> 결과: ${outcomeText}`;
    alert(text);
    updateState(s => ({
      ...s,
      journals: [
        {
          id: Date.now().toString(),
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
  const [brewingIngredient, setBrewingIngredient] = useState<string>("Basilisk Eyeball");

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

    let cardVal = 0;
    if (card.card === "A") cardVal = 1;
    else if (card.card === "Page") cardVal = 11;
    else if (card.card === "Knight") cardVal = 12;
    else if (card.card === "Queen") cardVal = 13;
    else if (card.card === "King") cardVal = 14;
    else cardVal = parseInt(card.card) || 0;

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
          id: Date.now().toString(),
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
        refereeCard = { ...c, reversed: Math.random() < 0.25 };
        discard.push(c);
      }
      return { ...s, refereeDeck: deck, refereeDiscard: discard };
    });

    if (!refereeCard) return;
    const majCard = refereeCard as Card;

    let minorWord = "";
    let minorWordKo = "";
    if (minCard.suit) {
      const suitFolder = minCard.suit === "cups" ? "Cups" : minCard.suit === "wands" ? "Wands" : minCard.suit === "swords" ? "Swords" : "Coins";
      const wInfo = ARCANE_MINOR_WORDS[suitFolder]?.[minCard.card];
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
          id: Date.now().toString(),
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
        discard.push(c);
      }
      return { ...s, playerDeck: deck, playerDiscard: discard };
    });

    if (!searchCard) return;
    const sCard = searchCard as Card;
    let sCardVal = 0;
    if (sCard.card === "A") sCardVal = 1;
    else if (sCard.card === "Page") sCardVal = 11;
    else if (sCard.card === "Knight") sCardVal = 12;
    else if (sCard.card === "Queen") sCardVal = 13;
    else if (sCard.card === "King") sCardVal = 14;
    else sCardVal = parseInt(sCard.card) || 0;

    const cupsStat = state.character.stats.cups;
    const searchTotal = sCardVal + cupsStat + testPenalty;
    const searchSuccess = searchTotal >= 14;

    if (!searchSuccess) {
      alert(`[용병 모집 실패]\nCups 판정 결과: ${searchTotal}점 (카드: ${getCardDisplayName(sCard)} + Cups: ${cupsStat})\n\n마을 안에서 적절한 고용 후보를 발견하는 데 실패했습니다.`);
      updateState(s => ({
        ...s,
        journals: [
          {
            id: Date.now().toString(),
            text: `[용병 모집 실패] Cups 판정 결과 ${searchTotal}점으로 용병 후보 탐색에 실패했습니다.`,
            date: new Date().toLocaleString()
          },
          ...s.journals
        ]
      }));
      return;
    }

    // 2. Generate Candidate NPC using FOLK_ROAD
    const idx = Math.floor(Math.random() * FOLK_ROAD.occupations.length);
    const candidateFemale = FOLK_ROAD.femaleNames[idx] || "알 수 없음";
    const candidateMale = FOLK_ROAD.maleNames[idx] || "알 수 없음";
    const candidateName = `${candidateFemale}/${candidateMale}`;
    const candidateOccupation = FOLK_ROAD.occupations[idx] || "일반인";
    const candidatePersonality = FOLK_ROAD.personalities[idx] || "평범한";

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
        discard.push(c);
      }
      return { ...s, playerDeck: deck, playerDiscard: discard };
    });

    if (!hireCard) return;
    const hCard = hireCard as Card;
    let hCardVal = 0;
    if (hCard.card === "A") hCardVal = 1;
    else if (hCard.card === "Page") hCardVal = 11;
    else if (hCard.card === "Knight") hCardVal = 12;
    else if (hCard.card === "Queen") hCardVal = 13;
    else if (hCard.card === "King") hCardVal = 14;
    else hCardVal = parseInt(hCard.card) || 0;

    const coinsStat = state.character.stats.coins;
    const hireTotal = hCardVal + coinsStat + testPenalty;
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
            id: Date.now().toString(),
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
            id: Date.now().toString(),
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
        discard.push(c);
      }
      return { ...s, playerDeck: deck, playerDiscard: discard };
    });

    if (!cardDrawn) return;
    const card = cardDrawn as Card;
    let cardVal = 0;
    if (card.card === "A") cardVal = 1;
    else if (card.card === "Page") cardVal = 11;
    else if (card.card === "Knight") cardVal = 12;
    else if (card.card === "Queen") cardVal = 13;
    else if (card.card === "King") cardVal = 14;
    else cardVal = parseInt(card.card) || 0;

    const coinsStat = state.character.stats.coins;
    const total = cardVal + coinsStat + testPenalty;
    const success = total >= 14;

    if (success) {
      alert(`[주간 급여 판정 성공]\nCoins 판정 결과: ${total}점 (성공)\n\n급여가 만족스럽게 지급되었습니다. ${hireling.name}은(는) 고용 상태를 계속 유지합니다.`);
      updateState(s => ({
        ...s,
        journals: [
          {
            id: Date.now().toString(),
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
            id: Date.now().toString(),
            text: `[용병 사직] Coins 판정 ${total}점 실패로 용병 ${hireling.name}이(가) 계약을 파기하고 탈퇴했습니다.`,
            date: new Date().toLocaleString()
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
        discard.push(c);
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
    updateState(s => ({
      ...s,
      character: {
        ...s.character,
        friends: [...s.character.friends, { name, info }]
      }
    }));
    alert(`${name}이(가) 인연(Friends) 목록에 추가되었습니다.`);
  };

  const addNpcAsFoe = () => {
    if (!folkNpcResult) return;
    const name = `${folkNpcResult.femaleName}/${folkNpcResult.maleName}`;
    const info = `${folkNpcResult.occupation} (${folkNpcResult.personality})`;
    updateState(s => ({
      ...s,
      character: {
        ...s.character,
        foes: [...s.character.foes, { name, info }]
      }
    }));
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
        discard.push(c);
      }
      return { ...s, playerDeck: deck, playerDiscard: discard };
    });

    if (!hireCard) return;
    const hCard = hireCard as Card;
    let hCardVal = 0;
    if (hCard.card === "A") hCardVal = 1;
    else if (hCard.card === "Page") hCardVal = 11;
    else if (hCard.card === "Knight") hCardVal = 12;
    else if (hCard.card === "Queen") hCardVal = 13;
    else if (hCard.card === "King") hCardVal = 14;
    else hCardVal = parseInt(hCard.card) || 0;

    const coinsStat = state.character.stats.coins;
    const hireTotal = hCardVal + coinsStat + testPenalty;
    const hireSuccess = hireTotal >= 14;

    if (hireSuccess) {
      alert(
        `[용병 고용 성공!]\nCoins 판정 결과: ${hireTotal}점 (카드: ${getCardDisplayName(hCard)} + Coins: ${coinsStat})\n\n${name}이(가) 계약을 수락하고 당신의 용병으로 합류했습니다!`
      );
      updateState(s => ({
        ...s,
        character: {
          ...s.character,
          hirelings: [...(s.character.hirelings || []), { name, info }]
        },
        journals: [
          {
            id: Date.now().toString(),
            text: `[용병 고용 성공] 길에서 만난 NPC ${name}(${folkNpcResult.occupation})을 Coins 판정(${hireTotal}점) 성공으로 고용했습니다.`,
            date: new Date().toLocaleString()
          },
          ...s.journals
        ]
      }));
    } else {
      alert(
        `[용병 고용 실패]\nCoins 판정 결과: ${hireTotal}점 (카드: ${getCardDisplayName(hCard)} + Coins: ${coinsStat})\n\n${name}이(가) 제시한 조건을 거절하여 고용에 실패했습니다.`
      );
      updateState(s => ({
        ...s,
        journals: [
          {
            id: Date.now().toString(),
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
  const addJournalEntry = (textOverride?: string) => {
    const entryText = textOverride || newJournalText;
    if (!entryText.trim()) return;

    updateState(s => ({
      ...s,
      journals: [
        {
          id: Date.now().toString(),
          text: entryText,
          date: new Date().toLocaleString()
        },
        ...s.journals
      ]
    }));
    if (!textOverride) setNewJournalText("");
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
        cardDrawn = c;
        discard.push(c);
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
      const total = cardVal + coinsStat + mod + testPenalty;
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
            return {
              ...s,
              character: {
                ...s.character,
                xp: s.character.xp - 10,
                stats: { ...s.character.stats, [statKey]: prevVal + 1 }
              }
            };
          })}>+</button>
        </div>
        <p className="wreath-desc">{desc}</p>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Gothic Aesthetic Header */}
      <header className="header-decor">
        <div className="header-title-container">
          <h1 className="gothic-title">
            GLOAM <span className="title-ko-sub">어스름의 동반자</span>
          </h1>
          <p className="subtitle">
            1인 전용 타로카드 RPG 컴패니언
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

      {/* Primary Tab Navigation */}
      <nav className="tab-navigation">
        <button className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
          <BookOpen size={16} /> 황혼 요약
        </button>
        <button className={`tab-btn ${activeTab === "character" ? "active" : ""}`} onClick={() => setActiveTab("character")}>
          <UserIcon size={16} /> 캐릭터 시트
        </button>
        <button className={`tab-btn ${activeTab === "oracles" ? "active" : ""}`} onClick={() => setActiveTab("oracles")}>
          <Sparkles size={16} /> 타로 &amp; 신탁
        </button>
        <button className={`tab-btn ${activeTab === "map" ? "active" : ""}`} onClick={() => setActiveTab("map")}>
          <MapIcon size={16} /> 지도 &amp; 전투
        </button>
        <button className={`tab-btn ${activeTab === "journal" ? "active" : ""}`} onClick={() => setActiveTab("journal")}>
          <Compass size={16} /> 모험 연대기
        </button>
      </nav>

      {/* Main Panel Routing */}
      <main className="main-content">
        {activeTab === "dashboard" && (
          <div className="dashboard-grid">
            {/* 첫 번째 열: 컴패니언 환영 및 시간 추적기 */}
            <div className="card-panel gold-border">
              <h2 className="gothic-sub">글롬(Gloam) Companion</h2>
              <p style={{ lineHeight: "1.6", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                이 웹앱은 타로 카드 기반의 다크 판타지 RPG인 <strong>Gloam (v1.02)</strong>을 원활하게 
                플레이하기 위한 디지털 서적 겸 컴패니언입니다. 룰북 지침, 오라클, 전투 트래커, 캐릭터 시트가 연동됩니다.
              </p>
              
              <div className="alert alert-note" style={{ marginTop: "1rem", border: "1px solid var(--border-color)", padding: "10px", backgroundColor: "var(--bg-panel-light)", fontSize: "0.85rem" }}>
                <strong>💡 캐릭터 시트 상태 안내:</strong> 현재 캐릭터는 <strong>{state.character.name} ({detectedVocation})</strong>입니다.<br />
                속도(Speed): <strong>{speed}</strong>, 
                소지 한도(Backpack): <strong>{carryCapacity}슬롯</strong>, 
                판정 페널티(Torso): <strong>{testPenalty}</strong>.
              </div>

              {/* 시간 및 워치 추적기 */}
              <div style={{ marginTop: "1.5rem", borderTop: "1px solid #333", paddingTop: "15px" }}>
                <h4 className="gothic-sub" style={{ fontSize: "1.05rem", margin: "0 0 10px 0" }}>⏱️ 여정 시간 및 환경 추적기 (Time &amp; Watch Tracker)</h4>
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
                          journals: [{ id: Date.now().toString(), text: `[시간 경과] 제 ${nextDay}일 제 ${nextWatch}워치가 되었습니다.`, date: new Date().toLocaleString() }, ...s.journals]
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
              <h3 className="gothic-sub">최근 일지 요약</h3>
              <div className="summary-journals">
                {state.journals.slice(0, 4).map((j) => (
                  <div key={j.id} className="summary-journal-item" style={{ borderLeft: "2px solid var(--border-color)", paddingLeft: "10px", marginBottom: "10px" }}>
                    <span className="date" style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>{j.date}</span>
                    <p style={{ fontSize: "0.85rem", margin: "2px 0 0 0", lineHeight: "1.3" }}>{j.text}</p>
                  </div>
                ))}
                {state.journals.length === 0 && <p className="empty-text">기록된 연대기가 없습니다.</p>}
                <button className="btn-medieval text-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-gold)", padding: 0, marginTop: "10px", display: "block" }} onClick={() => setActiveTab("journal")}>
                  전체 기록 보기 &rarr;
                </button>
              </div>
            </div>

            {/* 세 번째 열: 범용 운명 판정판 (General Test Roller) */}
            <div className="card-panel gold-border">
              <h3 className="gothic-sub">🔮 운명의 판정판 (General Test Roller)</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "5px 0 12px 0", lineHeight: "1.3" }}>
                캐릭터 스탯, 보정치, 대항 페널티(Opposed)를 결합하여 운명의 판정을 드로우합니다. (성공 기준: 14점 이상)
              </p>

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
                  <button className="btn-medieval flex-1" onClick={rollGeneralTest}>판정 카드 드로우</button>
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
                        <button className="btn-medieval-small" style={{ width: "100%", padding: "4px" }} onClick={pushGeneralTest}>
                          🎲 판정 푸시 (카드 1장 추가)
                        </button>
                      </div>
                    )}
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
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "20px", marginBottom: "25px" }}>
              {/* Stat Wreaths */}
              <div className="stat-wreaths-row" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 0 }}>
                {[
                  { key: "cups", label: "Cups (컵)", desc: "판단, 지식, 의술, 돌봄", icon: "🏆" },
                  { key: "swords", label: "Swords (소드)", desc: "근력, 용기, 전투, 지구력", icon: "⚔️" },
                  { key: "coins", label: "Coins (코인)", desc: "민첩, 은신, 교활, 자금", icon: "🪙" },
                  { key: "wands", label: "Wands (완드)", desc: "의지, 마법, 정신, 오컬트", icon: "🪄" }
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
                <div className="book-page-header">
                  <span>Goals</span>
                </div>
                <div className="ruled-book-lines" style={{ marginBottom: "30px" }}>
                  {state.character.goals.map((g, i) => (
                    <div key={i} className="ruled-line-item">
                      <input 
                        type="text" 
                        value={g} 
                        onChange={e => {
                          const val = e.target.value;
                          updateState(s => {
                            const nextGoals = [...s.character.goals];
                            nextGoals[i] = val;
                            return { ...s, character: { ...s.character, goals: nextGoals } };
                          });
                        }} 
                      />
                      <button 
                        style={{ background: "transparent", border: "1px solid var(--border-color)", padding: "1px 6px", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--gothic)" }}
                        onClick={() => {
                          if (confirm(`'${g}' 목표를 성공적으로 이행 완료하였습니까?\n경험치 1 XP와 결의 1점을 획득합니다.`)) {
                            updateState(s => ({
                              ...s,
                              character: {
                                ...s.character,
                                xp: s.character.xp + 1,
                                resolve: Math.min(10, s.character.resolve + 1)
                              },
                              journals: [{ id: Date.now().toString(), text: `[목표 완료] '${g}' 목표를 달성하여 1 XP와 결의 1점을 얻었습니다!`, date: new Date().toLocaleString() }, ...s.journals]
                            }));
                          }
                        }}
                      >달성</button>
                    </div>
                  ))}
                </div>

                {/* Instincts Section */}
                <div className="book-page-header">
                  <span>Instincts</span>
                </div>
                <div className="ruled-book-lines">
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
                          updateState(s => ({
                            ...s,
                            character: { ...s.character, resolve: Math.min(10, s.character.resolve + 1) },
                            journals: [{ id: Date.now().toString(), text: `[본능 곤경] 본능 '${inst}'에 이끌려 시련이 가해졌으며, 결의 1점을 획득했습니다.`, date: new Date().toLocaleString() }, ...s.journals]
                          }));
                          alert("본능에 이끌려 서사가 꼬이고 시련을 겪어 결의 1점을 얻습니다!");
                        }}
                      >유발</button>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: "auto", fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", lineHeight: "1.4" }}>
                  * 목표 달성 시 결의 +1 / XP +1 <br />
                  * 본능 곤경 격발 시 결의 +1
                </p>
              </div>
            </div>

            {/* Bottom Section: Anatomy Wounds & Sidebar */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "25px" }}>
              
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
                  </div>
                </div>

                {/* Anatomy Grid */}
                <div className="card-panel" style={{ padding: "20px" }}>
                  <h4 className="gothic-sub" style={{ borderBottom: "1px solid var(--border-color)", fontSize: "1.1rem" }}>
                    Anatomy &amp; Injuries (신체 부위 및 부상)
                  </h4>
                  
                  <div className="injuries-grid">
                    {/* Head Injury Card */}
                    <div className={`injury-card ${state.character.wounds.head ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.head} 
                          onChange={e => updateState(s => ({ ...s, character: { ...s.character, wounds: { ...s.character.wounds, head: e.target.checked } } }))} 
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
                    </div>

                    {/* Torso Injury Card */}
                    <div className={`injury-card ${state.character.wounds.torso ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.torso} 
                          onChange={e => updateState(s => ({ ...s, character: { ...s.character, wounds: { ...s.character.wounds, torso: e.target.checked } } }))} 
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
                    </div>

                    {/* Left Arm Injury Card */}
                    <div className={`injury-card ${state.character.wounds.lArm ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.lArm} 
                          onChange={e => updateState(s => ({ ...s, character: { ...s.character, wounds: { ...s.character.wounds, lArm: e.target.checked } } }))} 
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
                    </div>

                    {/* Right Arm Injury Card */}
                    <div className={`injury-card ${state.character.wounds.rArm ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.rArm} 
                          onChange={e => updateState(s => ({ ...s, character: { ...s.character, wounds: { ...s.character.wounds, rArm: e.target.checked } } }))} 
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
                    </div>

                    {/* Left Leg Injury Card */}
                    <div className={`injury-card ${state.character.wounds.lLeg ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.lLeg} 
                          onChange={e => updateState(s => ({ ...s, character: { ...s.character, wounds: { ...s.character.wounds, lLeg: e.target.checked } } }))} 
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
                    </div>

                    {/* Right Leg Injury Card */}
                    <div className={`injury-card ${state.character.wounds.rLeg ? "wounded" : ""}`}>
                      <div className="injury-card-header">
                        <input 
                          type="checkbox" 
                          checked={state.character.wounds.rLeg} 
                          onChange={e => updateState(s => ({ ...s, character: { ...s.character, wounds: { ...s.character.wounds, rLeg: e.target.checked } } }))} 
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

                </div>

                {/* Lifepath Event Generator */}
                <div className="card-panel" style={{ padding: "20px", marginTop: "20px" }}>
                  <div className="flex-row justify-between align-center" style={{ marginBottom: "12px" }}>
                    <h4 className="gothic-sub" style={{ borderBottom: "none", marginBottom: 0, fontSize: "1.1rem" }}>
                      과거 인생 경로 사건 (Lifepath Logs)
                    </h4>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn-medieval-small" onClick={() => {
                        drawRefereeCard((card) => {
                          const suit = card.suit || "cups";
                          const mapping: { [key: string]: string } = {
                            "wands": "신비하고 기이한 영적 비술 환경 (Wands)",
                            "swords": "전쟁과 참화, 중소 귀족 가문의 분란 환경 (Swords)",
                            "cups": "학구적이며 비교적 유복하고 안전한 상업 환경 (Cups)",
                            "coins": "빈민가와 거리, 뿌리 없는 떠돌이 환경 (Coins)"
                          };
                          const valNum = card.card === "A" ? 1 : card.card === "Page" ? 11 : card.card === "Knight" ? 12 : card.card === "Queen" ? 13 : card.card === "King" ? 14 : parseInt(card.card) || 0;
                          const logText = `[출생배경] ${getCardDisplayName(card)}: ${mapping[suit]}. 나이 +${valNum}년`;
                          
                          updateState(s => ({
                            ...s,
                            character: {
                              ...s.character,
                              age: s.character.age + valNum,
                              lifepathLogs: [...s.character.lifepathLogs, logText]
                            }
                          }));
                        });
                      }}>출생 결정</button>
                      <button className="btn-medieval-small" onClick={() => {
                        drawRefereeCard((card) => {
                          const suit = card.suit || "cups";
                          const val = card.card;
                          const suitFolder = suit === "wands" ? "완드" : suit === "swords" ? "소드" : suit === "coins" ? "코인" : "컵";
                          const foundEvent = `과거 사건 카드로 ${getCardDisplayName(card)}를 뽑았습니다. 가이드북 p.12-13의 ${suitFolder} 사건을 대조하십시오.`;
                          const valNum = val === "A" ? 1 : val === "Page" ? 11 : val === "Knight" ? 12 : val === "Queen" ? 13 : val === "King" ? 14 : parseInt(val) || 0;
                          const logText = `[과거사건] ${getCardDisplayName(card)}: ${foundEvent} 나이 +${valNum}년`;

                          updateState(s => ({
                            ...s,
                            character: {
                              ...s.character,
                              age: s.character.age + valNum,
                              lifepathLogs: [...s.character.lifepathLogs, logText]
                            }
                          }));
                        });
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
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(42,37,33,0.15)", padding: "3px 0" }}>
                          <span style={{ color: "var(--color-gold)", fontWeight: "bold" }}>◆ {t}</span>
                          <button 
                            className="delete-btn" 
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                            onClick={() => updateState(s => ({ ...s, character: { ...s.character, unlockedTalents: s.character.unlockedTalents.filter((_, i) => i !== idx) } }))}
                          >&times;</button>
                        </div>
                      ))}
                      {state.character.unlockedTalents.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>습득된 고유 재능이 없습니다.</p>
                      )}
                    </div>

                    {/* Spellbook section */}
                    <div className="book-page-header" style={{ fontSize: "1.2rem", marginTop: "15px", marginBottom: "10px" }}>
                      <span>Spellbook (주문첩)</span>
                    </div>
                    <div style={{ maxHeight: "160px", overflowY: "auto", fontSize: "0.85rem" }}>
                      {(state.character.spellbook || []).map((spell, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(42,37,33,0.15)", padding: "3px 0" }}>
                          <span style={{ color: "#6b46c1", fontWeight: "bold" }}>⚡ {spell}</span>
                          <button 
                            className="delete-btn" 
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
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
                          >&times;</button>
                        </div>
                      ))}
                      {(state.character.spellbook || []).length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>기록된 비문 마법 주문이 없습니다.</p>
                      )}
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
                          const name = prompt("친구 이름을 적으세요:");
                          const info = prompt("설명을 적으세요:");
                          if (name && info) {
                            updateState(s => ({ ...s, character: { ...s.character, friends: [...s.character.friends, { name, info }] } }));
                          }
                        }}
                      >+</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto", fontSize: "0.8rem" }}>
                      {state.character.friends.map((f, i) => (
                        <div key={i} style={{ borderBottom: "1px dashed rgba(0,0,0,0.1)", paddingBottom: "4px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong>{f.name}</strong>
                            <button className="delete-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => updateState(s => ({ ...s, character: { ...s.character, friends: s.character.friends.filter((_, idx) => idx !== i) } }))}>&times;</button>
                          </div>
                          <span style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.75rem" }}>{f.info}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Foes Scroll */}
                  <div className="hanging-scroll-box scroll-card" style={{ borderColor: "var(--color-crimson)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-crimson)", paddingBottom: "3px", marginBottom: "10px" }}>
                      <h5 style={{ border: "none", margin: 0, fontSize: "0.9rem", color: "var(--color-crimson)" }}>FOES (원수)</h5>
                      <button 
                        className="btn-medieval-small danger" 
                        onClick={() => {
                          const name = prompt("원수 이름을 적으세요:");
                          const info = prompt("설명을 적으세요:");
                          if (name && info) {
                            updateState(s => ({ ...s, character: { ...s.character, foes: [...s.character.foes, { name, info }] } }));
                          }
                        }}
                      >+</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto", fontSize: "0.8rem" }}>
                      {state.character.foes.map((f, i) => (
                        <div key={i} style={{ borderBottom: "1px dashed rgba(0,0,0,0.1)", paddingBottom: "4px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong style={{ color: "var(--color-crimson)" }}>{f.name}</strong>
                            <button className="delete-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => updateState(s => ({ ...s, character: { ...s.character, foes: s.character.foes.filter((_, idx) => idx !== i) } }))}>&times;</button>
                          </div>
                          <span style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.75rem" }}>{f.info}</span>
                        </div>
                      ))}
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto", fontSize: "0.8rem" }}>
                      {(state.character.hirelings || []).map((h, i) => (
                        <div key={i} style={{ borderBottom: "1px dashed rgba(0,0,0,0.1)", paddingBottom: "4px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong style={{ color: "var(--color-gold)" }}>{h.name}</strong>
                            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                              <button 
                                className="btn-medieval-small" 
                                style={{ fontSize: "0.65rem", padding: "1px 4px", background: "transparent", color: "var(--color-gold)", border: "1px solid var(--color-gold)" }}
                                onClick={() => payWeeklyHireling(i)}
                                title="주간 급여 Coins 판정"
                              >급여판정</button>
                              <button className="delete-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => updateState(s => ({ ...s, character: { ...s.character, hirelings: s.character.hirelings.filter((_, idx) => idx !== i) } }))}>&times;</button>
                            </div>
                          </div>
                          <span style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.75rem" }}>{h.info}</span>
                        </div>
                      ))}
                      {(!state.character.hirelings || state.character.hirelings.length === 0) && (
                        <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.75rem", margin: "10px 0" }}>고용된 용병이 없습니다 (최대 {state.character.stats.cups}명 가능).</p>
                      )}
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

                    <div style={{ border: "1px solid var(--border-color)", maxHeight: "150px", overflowY: "auto", padding: "6px", backgroundColor: "var(--bg-panel-light)" }}>
                      <strong style={{ fontSize: "0.85rem", color: "var(--color-gold)" }}>무기 목록:</strong>
                      {WEAPONS.map(w => (
                        <div key={w.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", padding: "3px 0", borderBottom: "1px dashed rgba(0,0,0,0.05)" }}>
                          <span>{w.nameKo} (Swords 필요: {w.swordsReq})</span>
                          <button className="btn-medieval-small" style={{ fontSize: "0.75rem", padding: "2px 6px" }} onClick={() => handleStartBuyTest({ name: w.name, nameKo: w.nameKo, coinsMod: w.coins, swordsReq: w.swordsReq })}>Coins판정</button>
                        </div>
                      ))}
                      <strong style={{ fontSize: "0.85rem", color: "var(--color-gold)", display: "block", marginTop: "8px" }}>방어구 목록:</strong>
                      {ARMOR.map(a => (
                        <div key={a.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", padding: "3px 0", borderBottom: "1px dashed rgba(0,0,0,0.05)" }}>
                          <span>{a.nameKo} (AP: {a.ap})</span>
                          <button className="btn-medieval-small" style={{ fontSize: "0.75rem", padding: "2px 6px" }} onClick={() => handleStartBuyTest({ name: a.name, nameKo: a.nameKo, coinsMod: a.coins })}>Coins판정</button>
                        </div>
                      ))}
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
                                <div key={t} style={{ display: "flex", justifyContent: "space-between", paddingLeft: "10px", fontSize: "0.88rem", margin: "3px 0" }}>
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
                                      updateState(s => ({
                                        ...s,
                                        character: {
                                          ...s.character,
                                          xp: s.character.xp - cost,
                                          unlockedTalents: [...s.character.unlockedTalents, t]
                                        },
                                        journals: [{ id: Date.now().toString(), text: `[재능 해금] ${cost} XP 소모, 재능 '${t}' 연마`, date: new Date().toLocaleString() }, ...s.journals]
                                      }));
                                    }}
                                  >연마 ({cost}XP)</button>
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
              <div className="flex-row justify-between align-center" style={{ borderBottom: "1px solid #333", paddingBottom: "10px" }}>
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
                    <p>손에 든 카드가 없습니다. 상단에서 카드를 뽑아 4장의 손패를 채워주십시오.</p>
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
              <h3 className="gothic-sub">운명의 신탁 (Solo Oracles)</h3>
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

              </div>
            </div>

          </div>
        )}

        {/* TAB 4: ADVENTURE & MAP & COMBAT TRACKER */}
        {activeTab === "map" && (
          <div className="map-combat-layout">
            
            {/* Visual Tarot Grid Map */}
            <div className="card-panel gold-border flex-2">
              <div className="flex-row justify-between align-center" style={{ borderBottom: "1px solid #333", paddingBottom: "10px" }}>
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
                {state.mapGrid.map((cell, idx) => (
                  <div key={idx} className="map-grid-cell" onClick={() => {
                    if (cell.card) {
                      // Toggle description
                      const nextDesc = prompt("이 격자 구역에 관한 스토리 묘사/노트를 저장합니다:", cell.description || "");
                      updateState(s => {
                        const nextGrid = [...s.mapGrid];
                        nextGrid[idx].description = nextDesc || "";
                        return { ...s, mapGrid: nextGrid };
                      });
                      return;
                    }

                    // Draw card from Referee deck to lay down terrain
                    drawRefereeCard((card) => {
                      // Map major to terrain
                      const index = MAJORS.filter(m => m !== "0").indexOf(card.card);
                      const terrainList = state.mapType === "wilderness" ? MAP_WILDERNESS : state.mapType === "dungeon" ? MAP_DUNGEON : MAP_SETTLEMENT;
                      const terrain = terrainList[index] || "미지의 구역";

                      updateState(s => {
                        const nextGrid = [...s.mapGrid];
                        nextGrid[idx] = {
                          ...cell,
                          card,
                          type: s.mapType,
                          description: terrain
                        };
                        return { ...s, mapGrid: nextGrid };
                      });
                    });
                  }}>
                    {cell.card ? (
                      <div className="revealed-map-cell">
                        <img 
                          src={getCardImageUrl(cell.card)} 
                          alt="map" 
                          className={`map-card-thumbnail ${cell.card.reversed ? "reversed-image" : ""}`}
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
                ))}
              </div>
              <p className="rules-helper-text" style={{ marginTop: "10px" }}>
                * 빈 격자 칸을 클릭하면 레프리 덱(메이저 아르카나)에서 카드를 한 장씩 뽑아 지형이 즉석 생성 배치됩니다. 지도를 클릭해 구역 스토리를 메모할 수도 있습니다.
              </p>
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
                <h4>⚔️ 전투 관리자 (Round: {state.combatRound})</h4>
                
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
                            id: Date.now().toString(),
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
                          <button className="btn-medieval-small" onClick={() => {
                            // Draw initiative for monster from player/referee logic
                            drawRefereeCard((card) => {
                              updateState(s => {
                                const nextMonsters = [...s.combatMonsters];
                                nextMonsters[mIdx].initiativeCard = card;
                                return { ...s, combatMonsters: nextMonsters };
                              });
                            });
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
                    <button className="btn-medieval flex-1" onClick={() => updateState(s => ({ ...s, combatRound: s.combatRound + 1 }))}>다음 라운드 시작</button>
                    <button className="btn-medieval" onClick={() => updateState(s => ({ ...s, combatRound: 1, combatMonsters: [] }))}>전투 종료</button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: JOURNAL */}
        {activeTab === "journal" && (
          <div className="journal-layout">
            <div className="card-panel gold-border">
              <h3 className="gothic-sub">모험 기록 및 서사 일지</h3>
              <p className="rules-helper-text">
                이 란은 모험가가 행동한 타로 카드 기록이나 오라클 신탁, 몬스터 조우 결과 등을 적어두어 나만의 이야기 연대기를 만들어가는 필드입니다.
              </p>

              <div className="journal-input-section" style={{ marginTop: "1rem" }}>
                <textarea 
                  className="journal-textarea" 
                  placeholder="오늘 글롬의 여정에서 겪은 시련이나 이야기를 작성하십시오..." 
                  value={newJournalText}
                  onChange={e => setNewJournalText(e.target.value)}
                />
                <button className="btn-medieval" onClick={() => addJournalEntry()}>일지에 기록 추가</button>
              </div>

              <div className="journal-history-list" style={{ marginTop: "2rem" }}>
                <h4>일지 히스토리</h4>
                {state.journals.map(j => (
                  <div key={j.id} className="journal-history-card">
                    <div className="flex-row justify-between align-center" style={{ borderBottom: "1px dashed #333", paddingBottom: "5px", marginBottom: "5px" }}>
                      <span className="date">{j.date}</span>
                      <button className="delete-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => {
                        if (confirm("정말 이 일지 기록을 삭제하겠습니까?")) {
                          updateState(s => ({
                            ...s,
                            journals: s.journals.filter(x => x.id !== j.id)
                          }));
                        }
                      }}><Trash2 size={12} /></button>
                    </div>
                    <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>{j.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

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
    </div>
  );
}
