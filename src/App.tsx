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
  ORACLE_SUBJECTS
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
  unlockedTalents: string[];
  lifepathLogs: string[];
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
  unlockedTalents: ["Sally Forth (과감한 돌격)"],
  lifepathLogs: [
    "출생: 검(Swords) 문양의 전시 상황 속에서 소수의 몰락 영지 기사의 가문에 태어났습니다.",
    "청년기: 믿었던 가장 가까운 동료 기사에게 배신당해 큰 마음의 상처를 입었습니다. (+9세)",
    "청년기: 고고학적이고 역사적인 고문헌을 밤낮으로 치열하게 탐구하며 지식을 마스터했습니다. (+14세)"
  ]
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
  mapType: "wilderness"
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
          // 25% chance of being reversed
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
        hand: []
      };
    });
    alert("🔄 광대(The Fool)가 소집되었습니다! 플레이어 덱과 레프리 덱의 버린 카드 더미를 모두 모아 새로 섞어 손패를 초기화했습니다.");
  };

  // Yes/No oracle logic
  const rollYesNoOracle = () => {
    // Draw card from player deck
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

    if (cardDrawn) {
      const card = cardDrawn as Card;
      setDrawnOracleCard(card);
      
      if (card.type === "major" && card.card === "0") {
        setOracleYesNo("광대(The Fool) 카드입니다! 즉시 다시 섞기(Reshuffle)를 가동하십시오.");
        return;
      }

      // Logic
      // Ace = extreme
      // 3,5,7,9 = No
      // 2,4,6,8,10 = Yes
      // Page/Knight = No, but
      // Queen/King = Yes, but
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
    }
  };

  // Amount oracle logic
  const rollAmountOracle = () => {
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

    if (cardDrawn) {
      const card = cardDrawn as Card;
      setDrawnOracleCard(card);
      
      // 2-5: None
      // 6-10: Average
      // Court: Considerable
      // Ace: Excessive
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
    }
  };

  // Action-Subject Oracle
  const rollActionSubjectOracle = () => {
    let playerCard: Card | null = null;
    let refereeCard: Card | null = null;

    updateState(s => {
      let pDeck = [...s.playerDeck];
      let pDiscard = [...s.playerDiscard];
      let rDeck = [...s.refereeDeck];
      let rDiscard = [...s.refereeDiscard];

      if (pDeck.length === 0) {
        pDeck = shuffle(pDiscard);
        pDiscard = [];
      }
      const c1 = pDeck.shift();
      if (c1) {
        playerCard = c1;
        pDiscard.push(c1);
      }

      if (rDeck.length === 0) {
        rDeck = shuffle(rDiscard);
        rDiscard = [];
      }
      const c2 = rDeck.shift();
      if (c2) {
        refereeCard = { ...c2, reversed: Math.random() < 0.25 };
        rDiscard.push(refereeCard);
      }

      return {
        ...s,
        playerDeck: pDeck,
        playerDiscard: pDiscard,
        refereeDeck: rDeck,
        refereeDiscard: rDiscard
      };
    });

    if (playerCard && refereeCard) {
      const card1 = playerCard as Card;
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
            <div className="card-panel gold-border">
              <h2 className="gothic-sub">글롬(Gloam) Companion에 오신 것을 환영합니다</h2>
              <p style={{ lineHeight: "1.7", color: "var(--text-muted)" }}>
                이 웹앱은 타로 카드 기반의 다크 판타지 솔로 저널링 RPG인 <strong>Gloam (v1.02)</strong>을 원활하게 
                플레이할 수 있도록 설계된 전용 디지털 컴패니언입니다. 룰북 한 장 한 장의 세부 지침과 오라클, 
                전투 매니저, 인터랙티브 캐릭터 시트를 지원합니다.
              </p>
              
              <div className="alert alert-note" style={{ marginTop: "1rem", border: "1px solid var(--border-color)", padding: "10px", backgroundColor: "var(--bg-panel-light)" }}>
                <strong>💡 캐릭터 시트 상태 안내:</strong> 현재 캐릭터는 <strong>{state.character.name} ({detectedVocation})</strong>입니다.<br />
                속도(Speed): <strong>{speed}</strong>, 
                소지 한도(Backpack): <strong>{carryCapacity}슬롯</strong>, 
                판정 페널티(Torso): <strong>{testPenalty}</strong>.
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

            <div className="card-panel">
              <h3 className="gothic-sub">최근 일지 요약</h3>
              <div className="summary-journals">
                {state.journals.slice(0, 3).map((j) => (
                  <div key={j.id} className="summary-journal-item" style={{ borderLeft: "2px solid var(--border-color)", paddingLeft: "10px", marginBottom: "10px" }}>
                    <span className="date" style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>{j.date}</span>
                    <p style={{ fontSize: "0.9rem" }}>{j.text}</p>
                  </div>
                ))}
                {state.journals.length === 0 && <p className="empty-text">기록된 연대기가 없습니다.</p>}
                <button className="btn-medieval text-btn" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-gold)", padding: 0, marginTop: "10px" }} onClick={() => setActiveTab("journal")}>
                  전체 기록 보기 &rarr;
                </button>
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

                  </div>
                </div>

                {/* Friends & Foes Hanging Scrolls Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  
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
