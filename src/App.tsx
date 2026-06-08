import { useState, useEffect } from 'react';
import {
  Compass, BookOpen, Settings, LogOut, LogIn,
  Shuffle, Trash2, Download, Cloud, CloudOff, Check, AlertCircle, X
} from 'lucide-react';
import {
  generateTarotDeck,
  getYesNoOutcome,
  getAmountOutcome,
  ArcaneMagickVerbs,
  ArcaneMagickNouns,
  FolkNPCTable
} from './tarotData';
import type { TarotCard } from './tarotData';
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
  saveFirebaseConfig,
  getSavedFirebaseConfig
} from './firebase';
import type { FirebaseConfig } from './firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import './App.css';

interface JournalEntry {
  id: string;
  timestamp: number;
  type: 'draw_player' | 'draw_referee' | 'oracle_yesno' | 'oracle_amount' | 'oracle_action_subject' | 'select' | 'system';
  cardName: string;
  cardId: string;
  imageUrl: string;
  isReversed?: boolean;
  // For action-subject pairs
  cardName2?: string;
  cardId2?: string;
  imageUrl2?: string;
  isReversed2?: boolean;
  interpretation: string;
  note: string;
}

function App() {
  // --- States ---
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [playerDeck, setPlayerDeck] = useState<TarotCard[]>([]);
  const [refereeDeck, setRefereeDeck] = useState<TarotCard[]>([]);
  
  // Active states
  const [activeCard, setActiveCard] = useState<TarotCard | null>(null);
  const [activeCardReversed, setActiveCardReversed] = useState(false);
  
  // For Action-Subject Oracle showing 2 cards side by side
  const [activeCard2, setActiveCard2] = useState<TarotCard | null>(null);
  const [activeCardReversed2, setActiveCardReversed2] = useState(false);
  const [isActionSubjectView, setIsActionSubjectView] = useState(false);
  
  // Options
  const [allowReversed, setAllowReversed] = useState(true);
  const [manualReversed, setManualReversed] = useState(false); // For manual offline logging
  
  // Preloading states
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  
  // UI Panels / Navigation
  const [activeTab, setActiveTab] = useState<'browser' | 'journal' | 'rules'>('browser');
  const [browserFilter, setBrowserFilter] = useState<string>('All');
  const [expandedSection, setExpandedSection] = useState<string | null>('lore');
  
  // Log / Journal
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  
  // Auth & Cloud state
  const [user, setUser] = useState<User | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  
  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFoolModal, setShowFoolModal] = useState(false);
  
  // Settings Form
  const [settingsForm, setSettingsForm] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  // --- Initialize Deck & Preloader ---
  useEffect(() => {
    const allCards = generateTarotDeck();
    setDeck(allCards);

    // Initial shuffle
    resetDecks(allCards);

    // Preload Images
    let loadedCount = 0;
    const totalImages = allCards.length;

    // Load dynamic settings form if saved
    const savedConfig = getSavedFirebaseConfig();
    if (savedConfig) {
      setSettingsForm(savedConfig);
    }

    const handleImageLoad = () => {
      loadedCount++;
      const progress = Math.round((loadedCount / totalImages) * 100);
      setPreloadProgress(progress);
      if (loadedCount >= totalImages) {
        setIsPreloading(false);
      }
    };

    allCards.forEach((card) => {
      const img = new Image();
      img.src = card.imageUrl;
      img.onload = handleImageLoad;
      img.onerror = handleImageLoad; // Don't get stuck if an image fails
    });
  }, []);

  // --- Auth Observer ---
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        loadJournalFromCloud(firebaseUser);
      } else {
        const localData = localStorage.getItem('gloam_journal_log');
        if (localData) {
          try {
            setJournal(JSON.parse(localData));
          } catch (e) {
            console.error(e);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Firestore Journal Sync ---
  const saveJournal = async (updatedJournal: JournalEntry[]) => {
    setJournal(updatedJournal);
    localStorage.setItem('gloam_journal_log', JSON.stringify(updatedJournal));

    if (isFirebaseConfigured && auth && db && user) {
      setCloudSyncing(true);
      try {
        await setDoc(doc(db, 'users', user.uid), {
          journal: updatedJournal,
          lastUpdated: Date.now()
        });
      } catch (e) {
        console.error("Firestore sync failed:", e);
      } finally {
        setCloudSyncing(false);
      }
    }
  };

  const loadJournalFromCloud = async (currentUser: User) => {
    if (!db) return;
    setCloudSyncing(true);
    try {
      const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (docSnap.exists() && docSnap.data().journal) {
        const cloudJournal = docSnap.data().journal as JournalEntry[];
        const localData = localStorage.getItem('gloam_journal_log');
        let localJournal: JournalEntry[] = [];
        if (localData) {
          try { localJournal = JSON.parse(localData); } catch (e) {}
        }

        if (cloudJournal.length >= localJournal.length) {
          setJournal(cloudJournal);
          localStorage.setItem('gloam_journal_log', JSON.stringify(cloudJournal));
        } else if (localJournal.length > 0) {
          await setDoc(doc(db, 'users', currentUser.uid), {
            journal: localJournal,
            lastUpdated: Date.now()
          });
          setJournal(localJournal);
        }
      } else {
        const localData = localStorage.getItem('gloam_journal_log');
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            await setDoc(doc(db, 'users', currentUser.uid), {
              journal: parsed,
              lastUpdated: Date.now()
            });
            setJournal(parsed);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("Failed to load journal from cloud:", e);
    } finally {
      setCloudSyncing(false);
    }
  };

  // --- Decks Shuffling ---
  const resetDecks = (allCards: TarotCard[]) => {
    // Player Deck: Minor Arcana + The Fool
    const playerBase = allCards.filter(c => c.suit !== 'Major' || c.value === 0);
    // Referee Deck: Major Arcana I-XXI
    const refereeBase = allCards.filter(c => c.suit === 'Major' && c.value > 0);

    const shuffledPlayer = shuffle(playerBase);
    const shuffledReferee = shuffle(refereeBase);

    setPlayerDeck(shuffledPlayer);
    setRefereeDeck(shuffledReferee);
  };

  const shuffle = (array: TarotCard[]): TarotCard[] => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const triggerReshuffle = () => {
    resetDecks(deck);
    setShowFoolModal(false);
    
    const newEntry: JournalEntry = {
      id: `system_${Date.now()}`,
      timestamp: Date.now(),
      type: 'system',
      cardName: '덱 셔플 완료',
      cardId: 'shuffle',
      imageUrl: '',
      interpretation: '모든 카드가 안전하게 회수되어 다시 셔플되었습니다.',
      note: '광대(The Fool)가 드로우되어 플레이어 및 레프리 덱을 초기화했습니다.'
    };
    saveJournal([newEntry, ...journal]);
  };

  // --- Draw Mechanisms ---
  const drawPlayerCard = () => {
    if (playerDeck.length === 0) {
      alert("플레이어 덱이 비어 있습니다. 덱을 회수하여 다시 셔플하세요!");
      return;
    }

    setIsActionSubjectView(false);
    const copy = [...playerDeck];
    const card = copy.shift()!;
    setPlayerDeck(copy);

    const isReversed = allowReversed && Math.random() < 0.5;
    setActiveCard(card);
    setActiveCardReversed(isReversed);

    let interpretation = `스탯 분야: ${card.statAssociation || '없음'}. `;
    if (card.actionKeyword) {
      interpretation += `Gloam 액션 키워드: "${card.actionKeyword}"`;
    }

    const newEntry: JournalEntry = {
      id: `draw_${Date.now()}`,
      timestamp: Date.now(),
      type: 'draw_player',
      cardName: card.name,
      cardId: card.id,
      imageUrl: card.imageUrl,
      isReversed,
      interpretation,
      note: ''
    };

    saveJournal([newEntry, ...journal]);

    if (card.suit === 'Major' && card.value === 0) {
      setTimeout(() => {
        setShowFoolModal(true);
      }, 700);
    }
  };

  const drawRefereeCard = () => {
    if (refereeDeck.length === 0) {
      alert("레프리 덱이 비어 있습니다. 덱을 회수하여 다시 셔플하세요!");
      return;
    }

    setIsActionSubjectView(false);
    const copy = [...refereeDeck];
    const card = copy.shift()!;
    setRefereeDeck(copy);

    const isReversed = allowReversed && Math.random() < 0.5;
    setActiveCard(card);
    setActiveCardReversed(isReversed);

    const keyword = isReversed ? card.subjectKeywordReversed : card.subjectKeywordUpright;
    const interpretation = `Gloam 레프리 대상 키워드: "${keyword}" (${isReversed ? '역방향' : '정방향'})`;

    const newEntry: JournalEntry = {
      id: `draw_${Date.now()}`,
      timestamp: Date.now(),
      type: 'draw_referee',
      cardName: card.name,
      cardId: card.id,
      imageUrl: card.imageUrl,
      isReversed,
      interpretation,
      note: ''
    };

    saveJournal([newEntry, ...journal]);
  };

  // Yes/No Oracle
  const rollYesNoOracle = () => {
    if (playerDeck.length === 0) {
      alert("플레이어 덱이 비어 있습니다. 덱을 회수하여 다시 셔플하세요!");
      return;
    }

    setIsActionSubjectView(false);
    const copy = [...playerDeck];
    const card = copy.shift()!;
    setPlayerDeck(copy);

    const isReversed = allowReversed && Math.random() < 0.5;
    setActiveCard(card);
    setActiveCardReversed(isReversed);

    const answer = getYesNoOutcome(card);
    const interpretation = `Yes/No 오라클: [${answer.outcome}] - ${answer.note}`;

    const newEntry: JournalEntry = {
      id: `oracle_yn_${Date.now()}`,
      timestamp: Date.now(),
      type: 'oracle_yesno',
      cardName: card.name,
      cardId: card.id,
      imageUrl: card.imageUrl,
      isReversed,
      interpretation,
      note: ''
    };

    saveJournal([newEntry, ...journal]);

    if (card.suit === 'Major' && card.value === 0) {
      setTimeout(() => {
        setShowFoolModal(true);
      }, 700);
    }
  };

  // Amount Oracle
  const rollAmountOracle = () => {
    if (playerDeck.length === 0) {
      alert("플레이어 덱이 비어 있습니다. 덱을 회수하여 다시 셔플하세요!");
      return;
    }

    setIsActionSubjectView(false);
    const copy = [...playerDeck];
    const card = copy.shift()!;
    setPlayerDeck(copy);

    const isReversed = allowReversed && Math.random() < 0.5;
    setActiveCard(card);
    setActiveCardReversed(isReversed);

    const amount = getAmountOutcome(card);
    const interpretation = `수량 오라클: [${amount.outcome}] - ${amount.note}`;

    const newEntry: JournalEntry = {
      id: `oracle_amt_${Date.now()}`,
      timestamp: Date.now(),
      type: 'oracle_amount',
      cardName: card.name,
      cardId: card.id,
      imageUrl: card.imageUrl,
      isReversed,
      interpretation,
      note: ''
    };

    saveJournal([newEntry, ...journal]);

    if (card.suit === 'Major' && card.value === 0) {
      setTimeout(() => {
        setShowFoolModal(true);
      }, 700);
    }
  };

  // Action-Subject Combined Oracle
  const rollActionSubjectOracle = () => {
    if (playerDeck.length === 0) {
      alert("플레이어 덱이 비어 있습니다. 덱을 회수하여 다시 셔플하세요!");
      return;
    }
    if (refereeDeck.length === 0) {
      alert("레프리 덱이 비어 있습니다. 덱을 회수하여 다시 셔플하세요!");
      return;
    }

    setIsActionSubjectView(true);

    const playerCopy = [...playerDeck];
    const actCard = playerCopy.shift()!;
    setPlayerDeck(playerCopy);
    const actReversed = allowReversed && Math.random() < 0.5;

    const refCopy = [...refereeDeck];
    const subCard = refCopy.shift()!;
    setRefereeDeck(refCopy);
    const subReversed = allowReversed && Math.random() < 0.5;

    setActiveCard(actCard);
    setActiveCardReversed(actReversed);
    setActiveCard2(subCard);
    setActiveCardReversed2(subReversed);

    const actionWord = actCard.actionKeyword || "혼돈 (Chaos)";
    const subjectWord = subReversed ? subCard.subjectKeywordReversed : subCard.subjectKeywordUpright;
    
    const interpretation = `행동-대상 오라클 결과: "${actionWord} / ${subjectWord}"`;

    const newEntry: JournalEntry = {
      id: `oracle_as_${Date.now()}`,
      timestamp: Date.now(),
      type: 'oracle_action_subject',
      cardName: actCard.name,
      cardId: actCard.id,
      imageUrl: actCard.imageUrl,
      isReversed: actReversed,
      cardName2: subCard.name,
      cardId2: subCard.id,
      imageUrl2: subCard.imageUrl,
      isReversed2: subReversed,
      interpretation,
      note: ''
    };

    saveJournal([newEntry, ...journal]);

    if (actCard.suit === 'Major' && actCard.value === 0) {
      setTimeout(() => {
        setShowFoolModal(true);
      }, 700);
    }
  };

  // Arcane Magick Spell Formulator (Page 38)
  const rollArcaneMagickSpell = () => {
    if (playerDeck.length === 0) {
      alert("플레이어 덱이 비어 있습니다. 덱을 회수하여 다시 셔플하세요!");
      return;
    }
    if (refereeDeck.length === 0) {
      alert("레프리 덱이 비어 있습니다. 덱을 회수하여 다시 셔플하세요!");
      return;
    }

    setIsActionSubjectView(true);

    const playerCopy = [...playerDeck];
    const verbCard = playerCopy.shift()!;
    setPlayerDeck(playerCopy);
    const verbReversed = allowReversed && Math.random() < 0.5;

    const refCopy = [...refereeDeck];
    const nounCard = refCopy.shift()!;
    setRefereeDeck(refCopy);
    const nounReversed = allowReversed && Math.random() < 0.5;

    setActiveCard(verbCard);
    setActiveCardReversed(verbReversed);
    setActiveCard2(nounCard);
    setActiveCardReversed2(nounReversed);

    const verb = ArcaneMagickVerbs[verbCard.suit]?.[verbCard.value] || "혼돈";
    const nounData = ArcaneMagickNouns[nounCard.value] || { upright: "혼돈", reversed: "혼돈" };
    const noun = nounReversed ? nounData.reversed : nounData.upright;

    const interpretation = `비전 마법 주문 구성 완료: "${verb} ${noun}" (동사: ${verb} [${verbCard.name}로부터] | 명사: ${noun} [${nounCard.name}${nounReversed ? ' - 역방향' : ''}로부터]). 시전하려면 최소 1 Resolve가 필요합니다. 피해량: 소비한 Resolve당 1부상 (전투 테스트 성공 시).`;

    const newEntry: JournalEntry = {
      id: `magick_${Date.now()}`,
      timestamp: Date.now(),
      type: 'oracle_action_subject',
      cardName: verbCard.name,
      cardId: verbCard.id,
      imageUrl: verbCard.imageUrl,
      isReversed: verbReversed,
      cardName2: nounCard.name,
      cardId2: nounCard.id,
      imageUrl2: nounCard.imageUrl,
      isReversed2: nounReversed,
      interpretation,
      note: ''
    };

    saveJournal([newEntry, ...journal]);

    if (verbCard.suit === 'Major' && verbCard.value === 0) {
      setTimeout(() => {
        setShowFoolModal(true);
      }, 700);
    }
  };

  // Folk Road traveler generator (Page 53)
  const rollFolkTraveler = () => {
    if (refereeDeck.length === 0) {
      alert("레프리 덱이 비어 있습니다. 덱을 회수하여 다시 셔플하세요!");
      return;
    }

    setIsActionSubjectView(false);

    const refCopy = [...refereeDeck];
    const card = refCopy.shift()!;
    setRefereeDeck(refCopy);

    const isReversed = allowReversed && Math.random() < 0.5;
    setActiveCard(card);
    setActiveCardReversed(isReversed);

    if (card.value === 0) {
      const interpretation = `길 위의 조우: 변신하며 형체를 알 수 없는 채 연기처럼 사라지는 신비로운 광대 나그네. (광대 카드가 뽑혀 즉시 모든 덱을 회수하여 다시 섞어야 합니다!)`;
      const newEntry: JournalEntry = {
        id: `traveler_${Date.now()}`,
        timestamp: Date.now(),
        type: 'draw_referee',
        cardName: card.name,
        cardId: card.id,
        imageUrl: card.imageUrl,
        isReversed,
        interpretation,
        note: '수동 셔플 필요.'
      };
      saveJournal([newEntry, ...journal]);
      setTimeout(() => {
        setShowFoolModal(true);
      }, 700);
      return;
    }

    const npc = FolkNPCTable[card.value];
    if (npc) {
      const isFemale = Math.random() < 0.5;
      const name = isFemale ? npc.femaleName : npc.maleName;
      const role = npc.occupation;
      const trait = npc.personality;
      
      const interpretation = `길 위의 나그네: ${role}인 ${name}. 개인 성격/별자리 사인: ${trait} (${isReversed ? '역방향: 적대적이거나 방어적이며 상반된 행동 양식' : '정방향: 일반적인 성향'})`;

      const newEntry: JournalEntry = {
        id: `traveler_${Date.now()}`,
        timestamp: Date.now(),
        type: 'draw_referee',
        cardName: card.name,
        cardId: card.id,
        imageUrl: card.imageUrl,
        isReversed,
        interpretation,
        note: ''
      };
      saveJournal([newEntry, ...journal]);
    }
  };

  // Card browser selection
  const selectCardFromBrowser = (card: TarotCard) => {
    setIsActionSubjectView(false);
    setActiveCard(card);
    setActiveCardReversed(false); // Browser defaults to upright

    const description = card.suit === 'Major' 
      ? `메이저 대상 키워드: "${card.subjectKeywordUpright}" (정방향), "${card.subjectKeywordReversed}" (역방향).`
      : `마이너 행동 키워드: "${card.actionKeyword}". 스탯 연관성: ${card.statAssociation}`;

    const newEntry: JournalEntry = {
      id: `select_${Date.now()}`,
      timestamp: Date.now(),
      type: 'select',
      cardName: card.name,
      cardId: card.id,
      imageUrl: card.imageUrl,
      isReversed: false,
      interpretation: `카탈로그 탐색: ${description}`,
      note: ''
    };

    saveJournal([newEntry, ...journal]);
  };

  // --- Offline Manual Draw Log Actions ---
  const handleManualPlayerLog = () => {
    if (!activeCard) return;
    setIsActionSubjectView(false);
    setActiveCardReversed(manualReversed);

    let interpretation = `(오프라인 수동 드로우) 스탯 연관성: ${activeCard.statAssociation || '없음'}. `;
    if (activeCard.actionKeyword) {
      interpretation += `Gloam 액션 키워드: "${activeCard.actionKeyword}"`;
    }

    const newEntry: JournalEntry = {
      id: `manual_pl_${Date.now()}`,
      timestamp: Date.now(),
      type: 'draw_player',
      cardName: activeCard.name,
      cardId: activeCard.id,
      imageUrl: activeCard.imageUrl,
      isReversed: manualReversed,
      interpretation,
      note: '실물 타로 카드로 드로우하여 기록함.'
    };

    saveJournal([newEntry, ...journal]);
    alert(`${activeCard.name}을(를) 플레이어 드로우로 기록했습니다.`);

    if (activeCard.suit === 'Major' && activeCard.value === 0) {
      setShowFoolModal(true);
    }
  };

  const handleManualRefereeLog = () => {
    if (!activeCard) return;
    setIsActionSubjectView(false);
    setActiveCardReversed(manualReversed);

    const keyword = manualReversed ? activeCard.subjectKeywordReversed : activeCard.subjectKeywordUpright;
    const interpretation = `(오프라인 수동 드로우) Gloam 레프리 대상 키워드: "${keyword}" (${manualReversed ? '역방향' : '정방향'})`;

    const newEntry: JournalEntry = {
      id: `manual_ref_${Date.now()}`,
      timestamp: Date.now(),
      type: 'draw_referee',
      cardName: activeCard.name,
      cardId: activeCard.id,
      imageUrl: activeCard.imageUrl,
      isReversed: manualReversed,
      interpretation,
      note: '실물 타로 카드로 드로우하여 기록함.'
    };

    saveJournal([newEntry, ...journal]);
    alert(`${activeCard.name}을(를) 레프리 드로우로 기록했습니다.`);
  };

  const handleManualYesNoLog = () => {
    if (!activeCard) return;
    setIsActionSubjectView(false);
    setActiveCardReversed(manualReversed);

    const answer = getYesNoOutcome(activeCard);
    const interpretation = `(오프라인 수동 드로우) Yes/No 오라클: [${answer.outcome}] - ${answer.note}`;

    const newEntry: JournalEntry = {
      id: `manual_yn_${Date.now()}`,
      timestamp: Date.now(),
      type: 'oracle_yesno',
      cardName: activeCard.name,
      cardId: activeCard.id,
      imageUrl: activeCard.imageUrl,
      isReversed: manualReversed,
      interpretation,
      note: '실물 타로 카드로 드로우하여 기록함.'
    };

    saveJournal([newEntry, ...journal]);
    alert(`${activeCard.name}을(를) Yes/No 오라클 드로우로 평가하여 기록했습니다.`);

    if (activeCard.suit === 'Major' && activeCard.value === 0) {
      setShowFoolModal(true);
    }
  };

  const handleManualAmountLog = () => {
    if (!activeCard) return;
    setIsActionSubjectView(false);
    setActiveCardReversed(manualReversed);

    const amount = getAmountOutcome(activeCard);
    const interpretation = `(오프라인 수동 드로우) 수량 오라클: [${amount.outcome}] - ${amount.note}`;

    const newEntry: JournalEntry = {
      id: `manual_amt_${Date.now()}`,
      timestamp: Date.now(),
      type: 'oracle_amount',
      cardName: activeCard.name,
      cardId: activeCard.id,
      imageUrl: activeCard.imageUrl,
      isReversed: manualReversed,
      interpretation,
      note: '실물 타로 카드로 드로우하여 기록함.'
    };

    saveJournal([newEntry, ...journal]);
    alert(`${activeCard.name}을(를) 수량 오라클 드로우로 평가하여 기록했습니다.`);

    if (activeCard.suit === 'Major' && activeCard.value === 0) {
      setShowFoolModal(true);
    }
  };

  // --- Journal Helper Functions ---
  const updateNote = (id: string, text: string) => {
    const updated = journal.map(entry => {
      if (entry.id === id) {
        return { ...entry, note: text };
      }
      return entry;
    });
    saveJournal(updated);
  };

  const deleteEntry = (id: string) => {
    if (confirm("이 모험 기록을 일지에서 삭제하시겠습니까?")) {
      const updated = journal.filter(entry => entry.id !== id);
      saveJournal(updated);
    }
  };

  const clearJournal = () => {
    if (confirm("정말로 모든 세션 모험 일지를 초기화하시겠습니까? 복구할 수 없습니다.")) {
      saveJournal([]);
    }
  };

  const exportJournal = () => {
    if (journal.length === 0) {
      alert("출력할 모험 일지 내용이 비어 있습니다!");
      return;
    }

    let output = `GLOAM RPG 타로 세션 모험 일지 (Tarot Adventure Journal)\n`;
    output += `출력 일시: ${new Date().toLocaleString()}\n`;
    output += `==============================================\n\n`;

    journal.forEach((entry, index) => {
      const dateStr = new Date(entry.timestamp).toLocaleTimeString();
      const num = journal.length - index;
      
      output += `[#${num}] ${dateStr} - ${entry.cardName}`;
      if (entry.isReversed) output += ` (역방향)`;
      if (entry.cardName2) {
        output += ` + ${entry.cardName2}`;
        if (entry.isReversed2) output += ` (역방향)`;
      }
      output += `\n`;
      output += `결과/해석: ${entry.interpretation}\n`;
      if (entry.note.trim()) {
        output += `작성한 일지 기록:\n   ${entry.note.replace(/\n/g, '\n   ')}\n`;
      }
      output += `----------------------------------------------\n\n`;
    });

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gloam-journal-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- Auth & Settings Functions ---
  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured || !auth) {
      alert("Firebase 설정이 완료되지 않았습니다. 우측 상단 기어 모양 아이콘을 클릭하여 Firebase 정보를 등록하십시오.");
      setShowSettingsModal(true);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      alert("구글 로그인 처리에 실패했습니다. Firebase Authorized Domains 설정을 다시 확인하십시오.");
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(settingsForm);
    alert("설정 저장이 완료되었습니다. 구동 환경 갱신을 위해 페이지가 새로고침됩니다.");
    window.location.reload();
  };

  const handleSettingsReset = () => {
    if (confirm("Firebase 설정값을 기본값으로 되돌리시겠습니까? 웹 브라우저 내 저장 내역이 정리됩니다.")) {
      saveFirebaseConfig(null);
      window.location.reload();
    }
  };

  // Filtering browser cards
  const filteredCards = deck.filter((card) => {
    if (browserFilter === 'All') return true;
    if (browserFilter === 'Major') return card.suit === 'Major';
    return card.suit === browserFilter;
  });

  return (
    <div className="app-container">
      {/* 1. Preloader Overlay */}
      {isPreloading && (
        <div className="preloader-overlay">
          <div className="preloader-content">
            <h2>Gloam 타로 컴패니언</h2>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${preloadProgress}%` }}
              ></div>
            </div>
            <p>타로 덱을 동조시키는 중... {preloadProgress}%</p>
            <button
              className="btn-secondary"
              style={{ marginTop: '20px' }}
              onClick={() => setIsPreloading(false)}
            >
              사전 로딩 건너뛰기
            </button>
          </div>
        </div>
      )}

      {/* 2. Header */}
      <header className="app-header">
        <div className="header-title-group">
          <h1>Gloam</h1>
          <p>솔로 타로 RPG 오라클 & 기록 컴패니언</p>
        </div>

        <div className="header-actions">
          {/* Cloud Sync Status Indicator */}
          {isFirebaseConfigured ? (
            user ? (
              <div className="user-profile">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="user-avatar"
                  />
                )}
                <span className="user-name">{user.displayName || '플레이어'}</span>
                {cloudSyncing ? (
                  <Cloud className="animate-pulse text-indigo-400" size={16} />
                ) : (
                  <span title="구글 클라우드 동기화 완료"><Check className="text-emerald-400" size={16} /></span>
                )}
                <button onClick={handleLogout} className="btn-icon" title="로그아웃">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={handleGoogleLogin} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogIn size={16} /> 구글 계정 연동하기
              </button>
            )
          ) : (
            <div className="flex items-center text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CloudOff size={14} className="text-zinc-600" />
              <span>로컬 데이터 모드</span>
            </div>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            className="btn-icon"
            title="Firebase 연동 설정"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* 3. Main Dashboard Grid */}
      <main className="main-grid">
        {/* Left: Decks & Active Card Board */}
        <section className="board-column">
          {/* Decks Panel */}
          <div className="dashboard-card">
            <div className="dashboard-card-title">타로 덱 상태</div>
            <div className="decks-container">
              <div className="deck-status-box">
                <div className="deck-label">플레이어 덱</div>
                <div className="deck-count">{playerDeck.length}</div>
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>마이너 아르카나 + 광대</span>
              </div>
              <div className="deck-status-box">
                <div className="deck-label">레프리 덱</div>
                <div className="deck-count">{refereeDeck.length}</div>
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>메이저 아르카나 I-XXI</span>
              </div>
            </div>

            <div className="deck-controls">
              <button className="btn-primary" onClick={drawPlayerCard}>
                플레이어 카드 드로우
              </button>
              <button className="btn-primary" onClick={drawRefereeCard}>
                레프리 카드 드로우
              </button>
              <button
                className="btn-secondary reshuffle-btn"
                onClick={() => {
                  if (confirm("모든 카드를 수거하고 플레이어/레프리 덱을 즉시 새로 셔플하시겠습니까?")) {
                    triggerReshuffle();
                  }
                }}
              >
                <Shuffle size={14} style={{ marginRight: '6px' }} /> 모든 카드 수거 및 다시 셔플
              </button>
            </div>

            <label className="toggle-option">
              <input
                type="checkbox"
                checked={allowReversed}
                onChange={(e) => setAllowReversed(e.target.checked)}
              />
              역방향 (Reversed / 거꾸로 나온 카드) 사용 허용
            </label>
          </div>

          {/* Active Card Board View */}
          <div className="dashboard-card active-card-display">
            <div className="dashboard-card-title" style={{ position: 'absolute', top: '20px', left: '20px', right: '20px' }}>
              액티브 타로 테이블 보드
            </div>

            {activeCard ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '30px' }}>
                {/* Visual rendering side-by-side if Action-Subject */}
                {isActionSubjectView && activeCard2 ? (
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--accent)' }}>행동 분야 (플레이어)</span>
                      <div className="card-outer-wrapper">
                        <div className="card-visual">
                          <img
                            src={activeCard.imageUrl}
                            alt={activeCard.name}
                            className={`card-image ${activeCardReversed ? 'card-reversed' : ''}`}
                          />
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-h)' }}>{activeCard.name}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--accent)' }}>대상 분야 (레프리)</span>
                      <div className="card-outer-wrapper">
                        <div className="card-visual">
                          <img
                            src={activeCard2.imageUrl}
                            alt={activeCard2.name}
                            className={`card-image ${activeCardReversed2 ? 'card-reversed' : ''}`}
                          />
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-h)' }}>{activeCard2.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="card-outer-wrapper">
                    <div className="card-visual">
                      <img
                        src={activeCard.imageUrl}
                        alt={activeCard.name}
                        className={`card-image ${activeCardReversed ? 'card-reversed' : ''}`}
                      />
                    </div>
                  </div>
                )}

                {/* Metadata Details Info Box */}
                <div className="card-metadata" style={{ marginTop: '16px' }}>
                  <div className="card-title-badge">
                    <span>{isActionSubjectView ? "오라클 결합 해석 결과" : activeCard.name}</span>
                    {!isActionSubjectView && (
                      <span className={activeCardReversed ? 'badge-reversed' : 'badge-upright'}>
                        {activeCardReversed ? '역방향 (Reversed)' : '정방향 (Upright)'}
                      </span>
                    )}
                  </div>

                  {isActionSubjectView && activeCard2 ? (
                    <div>
                      <div className="stat-box" style={{ background: '#18181b', borderLeftColor: '#c084fc' }}>
                        <div className="info-label">결합된 키워드 해석</div>
                        <div className="info-val" style={{ fontSize: '16px', fontWeight: 600 }}>
                          {activeCard.actionKeyword} / {activeCardReversed2 ? activeCard2.subjectKeywordReversed : activeCard2.subjectKeywordUpright}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text)' }}>
                        플레이어 덱 키워드: {activeCard.actionKeyword} (사용 카드: {activeCard.name}) <br />
                        레프리 덱 키워드: {activeCardReversed2 ? activeCard2.subjectKeywordReversed : activeCard2.subjectKeywordUpright} ({activeCardReversed2 ? '역방향' : '정방향'} / 사용 카드: {activeCard2.name})
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Stat association */}
                      {activeCard.statAssociation && (
                        <div className="info-row">
                          <div className="info-label">룰북 관련 캐릭터 스탯 분야</div>
                          <div className="info-val">{activeCard.statAssociation}</div>
                        </div>
                      )}

                      {/* Gloam Keywords */}
                      {activeCard.suit === 'Major' ? (
                        activeCard.value > 0 ? (
                          <div className="info-row">
                            <div className="info-label">레프리 전용 대상 키워드 (Subject)</div>
                            <div className="info-val">
                              <strong>정방향:</strong> {activeCard.subjectKeywordUpright} <br />
                              <strong>역방향:</strong> {activeCard.subjectKeywordReversed}
                            </div>
                          </div>
                        ) : (
                          <div className="info-row">
                            <div className="info-label">0 - 광대 카드 (The Fool)</div>
                            <div className="info-val">모든 덱 리콜 셔플 트리거. 즉시 테이블 카드를 수거해 섞으십시오.</div>
                          </div>
                        )
                      ) : (
                        <div className="info-row">
                          <div className="info-label">플레이어 전용 행동 키워드 (Action)</div>
                          <div className="info-val" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)' }}>
                            {activeCard.actionKeyword}
                          </div>
                        </div>
                      )}

                      {/* Oracle Values */}
                      {activeCard.suit !== 'Major' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                          <div className="stat-box">
                            <div className="info-label">예/아니오 오라클 판정</div>
                            <div className="info-val" style={{ fontSize: '12px', fontWeight: 600 }}>
                              {getYesNoOutcome(activeCard).outcome}
                            </div>
                          </div>
                          <div className="stat-box">
                            <div className="info-label">수량(Amount) 오라클 판정</div>
                            <div className="info-val" style={{ fontSize: '12px', fontWeight: 600 }}>
                              {getAmountOutcome(activeCard).outcome}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <Compass className="empty-state-icon" size={48} />
                <p style={{ fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px' }}>활성화된 카드 없음</p>
                <p style={{ fontSize: '12px' }}>덱에서 임의로 드로우하거나 우측 카탈로그에서 해석할 카드를 선택하세요.</p>
              </div>
            )}
          </div>

          {/* Quick Oracle Roller Buttons */}
          <div className="dashboard-card">
            <div className="dashboard-card-title">자동 해석기 (Oracles)</div>
            <div className="oracle-options">
              <button className="btn-secondary" onClick={rollYesNoOracle}>
                Yes / No 판정
              </button>
              <button className="btn-secondary" onClick={rollAmountOracle}>
                수량 판정
              </button>
              <button className="btn-primary" onClick={rollActionSubjectOracle}>
                행동-대상 결합
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text)', marginTop: '8px', textAlign: 'center' }}>
              가상 타로 덱에서 규칙 카드를 자동 인출하여 오라클 평가 결과를 산출합니다.
            </p>
          </div>
        </section>

        {/* Right: Browse Cards Catalog / Journal Log */}
        <section className="panels-column">
          <div className="tabs-header">
            <button
              onClick={() => setActiveTab('browser')}
              className={`tab-btn ${activeTab === 'browser' ? 'active' : ''}`}
            >
              타로 카탈로그
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`tab-btn ${activeTab === 'journal' ? 'active' : ''}`}
            >
              모험 일지 기록 ({journal.length})
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            >
              룰북 & 레퍼런스
            </button>
          </div>

          <div className="tab-content">
            {/* Tab: Card Catalog Browser */}
            {activeTab === 'browser' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="browser-filters">
                  {['All', 'Major', 'Cups', 'Swords', 'Wands', 'Pentacles'].map((suitName) => (
                    <button
                      key={suitName}
                      onClick={() => setBrowserFilter(suitName)}
                      className={`filter-btn ${browserFilter === suitName ? 'active' : ''}`}
                    >
                      {suitName === 'All' ? '전체' : (suitName === 'Major' ? '메이저' : (suitName === 'Cups' ? '컵' : (suitName === 'Swords' ? '검' : (suitName === 'Wands' ? '완드' : '동전'))))}
                    </button>
                  ))}
                </div>

                <div className="cards-grid" style={{ flexGrow: 1, maxHeight: '360px' }}>
                  {filteredCards.map((card) => (
                    <div
                      key={card.id}
                      className="grid-card-item"
                      onClick={() => selectCardFromBrowser(card)}
                    >
                      <div className="grid-card-thumbnail">
                        <img src={card.imageUrl} alt={card.name} />
                      </div>
                      <div className="grid-card-name">
                        {card.name.split(' (')[0]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manual Offline Draw Actions Panel */}
                {activeCard && (
                  <div className="dashboard-card" style={{ marginTop: '20px', padding: '16px', background: '#0d0d0f' }}>
                    <div className="info-label" style={{ marginBottom: '10px', color: 'var(--accent)', fontSize: '12px' }}>
                      선택한 카드 수동 로그 및 해석 (오프라인 실물 타로 기록용)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)' }}>{activeCard.name}</span>
                      <label className="toggle-option" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={manualReversed}
                          onChange={(e) => setManualReversed(e.target.checked)}
                        />
                        실물 카드가 거꾸로 나옴 (역방향)
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '6px' }} onClick={handleManualPlayerLog}>
                        플레이어 드로우로 등록
                      </button>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '6px' }} onClick={handleManualRefereeLog}>
                        레프리 드로우로 등록
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '6px' }} onClick={handleManualYesNoLog}>
                        Yes/No 오라클로 기록
                      </button>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '6px' }} onClick={handleManualAmountLog}>
                        수량 오라클로 기록
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Session Journal */}
            {activeTab === 'journal' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="journal-controls">
                  <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                    일지는 로컬 저장소와 구글 드라이브(Firebase)에 자동 보존됩니다.
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={exportJournal} title="모험 일지 로컬 텍스트 다운로드">
                      <Download size={14} style={{ marginRight: '4px' }} /> 일지 내보내기
                    </button>
                    <button className="btn-secondary" onClick={clearJournal} style={{ color: '#f87171' }} title="전체 일지 삭제">
                      <Trash2 size={14} style={{ marginRight: '4px' }} /> 비우기
                    </button>
                  </div>
                </div>

                {journal.length === 0 ? (
                  <div className="empty-state" style={{ margin: 'auto' }}>
                    <BookOpen className="empty-state-icon" size={48} />
                    <p style={{ fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px' }}>작성된 일지가 없습니다</p>
                    <p style={{ fontSize: '12px' }}>카드를 뽑거나 수동 기록하면 세션 활동이 여기에 누적됩니다.</p>
                  </div>
                ) : (
                  <div className="journal-timeline">
                    {journal.map((entry) => (
                      <div key={entry.id} className="journal-entry">
                        {entry.imageUrl && (
                          <div className={`entry-thumbnail ${entry.isReversed ? 'reversed' : ''}`}>
                            <img src={entry.imageUrl} alt={entry.cardName} />
                          </div>
                        )}
                        {entry.imageUrl2 && (
                          <div className={`entry-thumbnail ${entry.isReversed2 ? 'reversed' : ''}`} style={{ marginLeft: '-10px' }}>
                            <img src={entry.imageUrl2} alt={entry.cardName2} />
                          </div>
                        )}

                        <div className="entry-details">
                          <div className="entry-header">
                            <div>
                              <span className="entry-card-name">
                                {entry.cardName} {entry.isReversed ? '(역방향)' : ''}
                                {entry.cardName2 && ` + ${entry.cardName2} ${entry.isReversed2 ? '(역방향)' : ''}`}
                              </span>
                              <div className="entry-action-type">
                                {entry.type === 'draw_player' && '플레이어 덱 드로우'}
                                {entry.type === 'draw_referee' && '레프리 덱 드로우'}
                                {entry.type === 'oracle_yesno' && 'Yes/No 오라클'}
                                {entry.type === 'oracle_amount' && '수량 오라클'}
                                {entry.type === 'oracle_action_subject' && '행동-대상 오라클'}
                                {entry.type === 'select' && '카탈로그 탐색'}
                                {entry.type === 'system' && '시스템 안내'}
                              </div>
                            </div>
                            <span className="entry-time">
                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>

                          <div className="entry-interpretation">{entry.interpretation}</div>

                          {entry.type !== 'system' && (
                            <textarea
                              className="entry-note-area"
                              placeholder="여기에 생각이나 모험 상황, 행동 결과 등을 기록해 보세요..."
                              value={entry.note}
                              onChange={(e) => updateNote(entry.id, e.target.value)}
                            />
                          )}
                        </div>

                        <button
                          className="delete-entry-btn"
                          onClick={() => deleteEntry(entry.id)}
                          title="로그 삭제"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Rules & Lore Reference */}
            {activeTab === 'rules' && (
              <div className="rules-section-container">
                {/* 1. Welcome & Setting */}
                <div className="collapsible-section">
                  <button 
                    className={`collapsible-header ${expandedSection === 'lore' ? 'active' : ''}`}
                    onClick={() => setExpandedSection(expandedSection === 'lore' ? null : 'lore')}
                    type="button"
                  >
                    <span>월드 배경 설정 & 설명</span>
                    <span className="arrow">{expandedSection === 'lore' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'lore' && (
                    <div className="collapsible-content">
                      <h3>Gloam의 세계에 오신 것을 환영합니다</h3>
                      <p><strong>위험천만한 잔혹동화 세계관:</strong> Gloam의 세계는 기사도의 동화, 어두운 전설, 왜곡된 민담, 고대의 악으로 이루어져 있습니다. 아주 단순한 부적에서부터 현실을 뒤트는 주문에 이르기까지 마법이 사방에 도사리고 있으나, 그것은 결코 안전하지 않습니다.</p>
                      <p><strong>타로 기반 시스템:</strong> 주사위 대신 표준 78장 타로 덱을 핵심 무작위 난수 생성기로 사용합니다. 전투는 숨겨진 카드를 통한 전략적인 눈치싸움 방식을 띠며, 수명/성장 경로 생성(Lifepath)과 주문 마법, 오라클 등 여러 방면에서 메이저/마이너 아르카나 카드의 상징성을 폭넓게 차용합니다.</p>
                      <p><strong>플레이어 주도 서사:</strong> 캐릭터 제작 시 각자 자신만의 <strong>목표(Goals)</strong>를 설정하며, 이를 수행하고 달성하는 과정이 모험가의 주된 성장 요소가 됩니다. 레프리(Referee)는 미리 준비된 이야기를 따라가기보다는 플레이어가 세운 목표를 바탕으로 위협을 조직합니다.</p>
                      <p><strong>관계의 가치:</strong> 평판, 피로 맺은 맹세, 조력자, 그리고 적대자의 관계는 칼날이나 주문만큼 중요하게 작용합니다. 아군과 적대자가 생기며, 세계는 모험가의 행동에 실시간으로 반응합니다.</p>
                    </div>
                  )}
                </div>

                {/* 2. Character Creation */}
                <div className="collapsible-section">
                  <button 
                    className={`collapsible-header ${expandedSection === 'creation' ? 'active' : ''}`}
                    onClick={() => setExpandedSection(expandedSection === 'creation' ? null : 'creation')}
                    type="button"
                  >
                    <span>캐릭터 생성 가이드</span>
                    <span className="arrow">{expandedSection === 'creation' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'creation' && (
                    <div className="collapsible-content">
                      <h3>캐릭터 구축 체크리스트</h3>
                      <ol style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                        <li><strong>라이프패스 (Lifepath):</strong> 플레이어 덱에서 카드를 연속 드로우하여 가문을 구성하고 성장 계절을 설정합니다. 뽑은 카드의 수치만큼 나이를 누적합니다 (최소 모험가 나이 18세).
                          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text)' }}>
                            <li><strong>완드(Wands):</strong> 신비하고 기묘하며 오컬트적인 환경</li>
                            <li><strong>검(Swords):</strong> 전쟁, 분쟁, 가문의 방랑, 소귀족</li>
                            <li><strong>컵(Cups):</strong> 학술, 안전, 상업, 정치적 환경</li>
                            <li><strong>동전(Coins):</strong> 시정 잡배, 가난, 빈민가, 방랑자</li>
                          </ul>
                        </li>
                        <li style={{ marginTop: '6px' }}><strong>Stat (능력치 배분):</strong> 1, 2, 3, 4의 능력치 점수를 아래 네 개 분야에 원하는 대로 분배합니다:
                          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text)' }}>
                            <li><strong>컵 (Cups):</strong> 판단력, 학식, 의학, 돌봄, 인내, 도구 활용</li>
                            <li><strong>검 (Swords):</strong> 근력, 용기, 지구력, 활력, 전투 행동</li>
                            <li><strong>완드 (Wands):</strong> 의지, 신비 능력, 정신력, 열정, 비전 오컬트 지식</li>
                            <li><strong>동전 (Coins):</strong> 민첩성, 은신, 영리함, 대인 조작, 자산</li>
                          </ul>
                        </li>
                        <li style={{ marginTop: '6px' }}><strong>보케이션 (Vocation / 직업 선택):</strong> 가장 높은 능력치 점수인 **4**를 할당한 스탯에 따라 직업과 고유 시작 재능(Starting Talent)이 자동 결정됩니다:
                          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text)' }}>
                            <li>Cups (4점) &rarr; <strong>전령 (Herald)</strong> (시작 재능: 무장해제 미소 Disarming Presence)</li>
                            <li>Swords (4점) &rarr; <strong>방랑기사 (Knight-Errant)</strong> (시작 재능: 출격 명령 Sally Forth)</li>
                            <li>Wands (4점) &rarr; <strong>술사 (Mystic)</strong> (시작 재능: 비전 마법 Magick)</li>
                            <li>Coins (4점) &rarr; <strong>소매치기 (Cutpurse)</strong> (시작 재능: 날렵함 Nimble)</li>
                          </ul>
                        </li>
                        <li style={{ marginTop: '6px' }}><strong>결의 (Resolve):</strong> 시작 수치 1점 (최대 10). 재능을 발동하거나 대실패 시 재충전, 스탯 판정 보정에 소모하는 강력한 자원입니다.</li>
                      </ol>
                      <div className="stat-box" style={{ fontSize: '12px' }}>
                        <strong>솔로 플레이 혜택:</strong> 혼자서 룰북 오라클만을 통해 솔로 플레이를 할 때는, <strong>시작 시 임의의 직업 재능을 1개 추가로 소유한 채</strong> 모험을 개시합니다!
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Arcane Magick Formulator */}
                <div className="collapsible-section">
                  <button 
                    className={`collapsible-header ${expandedSection === 'magick' ? 'active' : ''}`}
                    onClick={() => setExpandedSection(expandedSection === 'magick' ? null : 'magick')}
                    type="button"
                  >
                    <span>비전 마법 주문 생성기 (Page 38)</span>
                    <span className="arrow">{expandedSection === 'magick' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'magick' && (
                    <div className="collapsible-content">
                      <p style={{ marginBottom: '12px' }}>
                        비전 마법은 플레이어 덱 마이너 카드의 <strong>동사 단어 (Verb)</strong>와 레프리 덱 메이저 카드의 <strong>명사 단어 (Noun)</strong>를 임의 조합하여 그 효력을 Referee와 상의하여 유연하게 해석하는 고유 시스템입니다. 최소 1 이상의 Resolve를 소모하여 캐스팅합니다.
                      </p>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        onClick={rollArcaneMagickSpell}
                        style={{ width: '100%', marginBottom: '12px' }}
                      >
                        비전 마법 단어 결합하여 주문 생성
                      </button>
                      
                      <div className="stat-box" style={{ fontSize: '12px' }}>
                        <strong>마법 피해량 규칙:</strong> 적에게 상처를 유발하는 형태의 주문은 사용 시 소비한 **Resolve 1점당 1부상**의 피해를 기본 유발합니다. 전투 중 사용하려면 대항 완드(Wands) 판정에 승리해야 합니다.
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Folk Road NPC Generator */}
                <div className="collapsible-section">
                  <button 
                    className={`collapsible-header ${expandedSection === 'folk' ? 'active' : ''}`}
                    onClick={() => setExpandedSection(expandedSection === 'folk' ? null : 'folk')}
                    type="button"
                  >
                    <span>길 위의 나그네(NPC) 생성기 (Page 53)</span>
                    <span className="arrow">{expandedSection === 'folk' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'folk' && (
                    <div className="collapsible-content">
                      <p style={{ marginBottom: '12px' }}>
                        모험 중 길에서 갑작스레 만나게 될 부랑아나 상인, 사제 등의 만남을 결정합니다. 메이저 아르카나 카드를 기반으로 나그네의 역할군, 전용 성명 및 별자리 특징을 조합하여 제시합니다.
                      </p>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        onClick={rollFolkTraveler}
                        style={{ width: '100%' }}
                      >
                        무작위 길 위의 나그네 생성
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. Core Rules & Tests */}
                <div className="collapsible-section">
                  <button 
                    className={`collapsible-header ${expandedSection === 'tests' ? 'active' : ''}`}
                    onClick={() => setExpandedSection(expandedSection === 'tests' ? null : 'tests')}
                    type="button"
                  >
                    <span>능력치 판정(Test) 규칙 (Page 8)</span>
                    <span className="arrow">{expandedSection === 'tests' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'tests' && (
                    <div className="collapsible-content">
                      <h3>능력치 테스트 진행법</h3>
                      <p>수행하고자 하는 행동에 부합하는 능력치 분야(스탯 1~4점)를 고르고 플레이어 덱에서 카드를 1장 드로우합니다. 카드 수치와 능력치를 합쳐 <strong>14점 이상</strong>이면 성공합니다.</p>
                      
                      <h4 style={{ marginTop: '8px', marginBottom: '4px' }}>테스트 밀어붙이기 (Pushing)</h4>
                      <p>첫 카드의 점수가 모자라 실패했을 때, 선택 사항으로 판정을 <strong>푸시(Push)</strong>할 수 있습니다. 덱에서 2번째 카드를 뽑아 합산하며, 이를 통해 14점이 넘으면 성공입니다. 단, 두 번 드로우했음에도 판정에 미달하면 <strong>대실패 (Great Failure)</strong>로 취급되어 심각한 부작용이 생기지만, 내적인 고뇌와 한 극복으로 **Resolve 1점**을 환급받습니다.</p>
                      
                      <h4 style={{ marginTop: '8px', marginBottom: '4px' }}>판정 결과 유형</h4>
                      <ul style={{ paddingLeft: '20px', fontSize: '13px' }}>
                        <li><strong>대성공 (Great Success):</strong> 첫 장 인출만으로 14점 이상이며, 그 카드의 슈트가 판정하려던 스탯 분야(Cups/Swords 등)와 일치하는 경우. 원하는 결과 이상의 추가 보너스 획득.</li>
                        <li><strong>성공 (Success):</strong> 최종 합산 수치 14점 이상.</li>
                        <li><strong>실패 (Failure):</strong> 합산 수치 13점 이하. 좋지 않은 장애나 난관 돌발.</li>
                        <li><strong>대실패 (Great Failure):</strong> 푸시(Push) 카드까지 뽑았으나 최종 13점 이하에 그침.</li>
                      </ul>

                      <h4 style={{ marginTop: '8px', marginBottom: '4px' }}>시간 척도 (Time Scales)</h4>
                      <p><strong>교대 (Watch):</strong> 8시간 단위 (야영, 정비 및 야외 대이동 단위). 하루는 3교대로 구성.<br />
                      <strong>차례 (Turn):</strong> 15분 단위 (던전 탐색, 은신 및 구조물 돌파 시점). 1시간에 4턴.<br />
                      <strong>라운드 (Round):</strong> 10초 단위 (전투 상황용 정밀 턴제).</p>
                    </div>
                  )}
                </div>

                {/* 6. Combat & Wounds */}
                <div className="collapsible-section">
                  <button 
                    className={`collapsible-header ${expandedSection === 'combat' ? 'active' : ''}`}
                    onClick={() => setExpandedSection(expandedSection === 'combat' ? null : 'combat')}
                    type="button"
                  >
                    <span>전투 흐름 & 부상 규칙</span>
                    <span className="arrow">{expandedSection === 'combat' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'combat' && (
                    <div className="collapsible-content">
                      <h3>전투 라운드 진행 방법</h3>
                      <ol style={{ paddingLeft: '20px', fontSize: '13px', marginBottom: '12px' }}>
                        <li><strong>카드 수급:</strong> 핸드 카드가 4장이 되도록 드로우합니다. 레프리는 몬스터/NPC당 카드를 3장씩 쥡니다.</li>
                        <li><strong>우선권 결정 (Initiative):</strong> 각자 손패에서 카드 1장을 골라 엎어놓습니다. 엎어놓은 카드의 수치는 적이 나를 맞추기 위해 넘어야 할 판정 난이도가 됩니다 (낮은 카드는 선수를 잡기 좋으나 피격받기 쉽고, 높은 카드는 느리나 탄탄해집니다).</li>
                        <li><strong>행동 단계:</strong> 우선권 카드 수치 0번부터 14번까지 차례대로 오픈하며 자기 차례의 행동을 집행합니다.</li>
                        <li><strong>정리 단계:</strong> 원하지 않는 패를 버리고 새 라운드를 엽니다. 라운드 중 광대(Fool) 카드가 1번이라도 오픈되었다면, 정리 단계에서 다 쓴 카드를 수거해 덱을 즉시 새로 섞어야 합니다.</li>
                      </ol>

                      <h3>부위별 부상 (Wound) 효과</h3>
                      <p style={{ marginBottom: '8px' }}>체력 점수(HP) 개념이 존재하지 않으며, 피격 시 공격 무기의 고유 부상 수치에 해당하는 만큼 부위 부상을 입습니다:</p>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ textAlign: 'left', padding: '6px' }}>부상 부위</th>
                            <th style={{ textAlign: 'left', padding: '6px' }}>발생하는 결함/디버프</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px', fontWeight: 600 }}>팔 (Arms)</td>
                            <td style={{ padding: '6px' }}>해당 팔에 든 무기나 도구를 떨어뜨립니다. 치료 전까진 그 팔을 전혀 쓸 수 없습니다.</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px', fontWeight: 600 }}>머리 (Head)</td>
                            <td style={{ padding: '6px' }}>정신을 잃고 기절합니다. 기절해 있는 동안 머리에 추가 부상을 1번 더 입으면 즉사합니다.</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px', fontWeight: 600 }}>몸통 (Torso)</td>
                            <td style={{ padding: '6px' }}>극심한 장기 충격으로 인해 수행하는 모든 판정(Test)에 -3 보정 페널티가 영구 누적됩니다.</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px', fontWeight: 600 }}>다리 (Legs)</td>
                            <td style={{ padding: '6px' }}>한 쪽을 다칠 때마다 이동 속도가 2씩 삭감됩니다. 속도가 0이 되면 다른 사람의 도움 없이는 스스로 설 수 없습니다.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 4. Fool Card Shuffling Modal */}
      {showFoolModal && (
        <div className="settings-modal" style={{ zIndex: 1001 }}>
          <div className="settings-box" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <AlertCircle size={48} className="text-purple-300" style={{ margin: '0 auto 16px', color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>광대 (The Fool) 드로우됨</h3>
            <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '24px', lineBreak: 'normal' }}>
              광대 카드는 덱에 예측할 수 없는 혼돈을 의미합니다. Gloam RPG 룰북 규칙에 따라, 광대 카드가 공개되면 즉시 모든 판정 카드를 회수해 덱을 새로 셔플해야 합니다.
            </p>
            <button className="btn-primary" onClick={triggerReshuffle} style={{ width: '100%' }}>
              <Shuffle size={14} style={{ marginRight: '6px' }} /> 모든 카드 회수 및 다시 셔플
            </button>
          </div>
        </div>
      )}

      {/* 5. Firebase Configurations Settings Modal */}
      {showSettingsModal && (
        <div className="settings-modal">
          <form className="settings-box" onSubmit={handleSettingsSave}>
            <div className="settings-box-header">
              <h3>구글 연동 & Firebase 클라우드 동기화 설정</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowSettingsModal(false)}
                style={{ border: 'none', width: '24px', height: '24px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '16px' }}>
              아래에 Firebase 프로젝트 API 키값을 입력하시면 구글 로그인 활성화를 통해 다중 브라우저 기기 환경에서도 모험 일지(Journal Log) 데이터 동기화 혜택을 온전히 누릴 수 있습니다.
            </p>

            <div className="form-group">
              <label>API Key (apiKey)</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.apiKey}
                onChange={(e) => setSettingsForm({ ...settingsForm, apiKey: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Auth Domain (authDomain)</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.authDomain}
                onChange={(e) => setSettingsForm({ ...settingsForm, authDomain: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Project ID (projectId)</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.projectId}
                onChange={(e) => setSettingsForm({ ...settingsForm, projectId: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Storage Bucket (storageBucket)</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.storageBucket}
                onChange={(e) => setSettingsForm({ ...settingsForm, storageBucket: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Messaging Sender ID (messagingSenderId)</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.messagingSenderId}
                onChange={(e) => setSettingsForm({ ...settingsForm, messagingSenderId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>App ID (appId)</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.appId}
                onChange={(e) => setSettingsForm({ ...settingsForm, appId: e.target.value })}
                required
              />
            </div>

            <div className="domain-auth-info">
              <p><strong>중요: Firebase 승인된 도메인(Authorized Domains) 설정</strong></p>
              <p>구글 팝업 인증을 연동하려면 반드시 Firebase 콘솔의 Authentication &rarr; Settings &rarr; Authorized Domains 목록에 배포용 도메인을 등록해 주세요.</p>
              <p>로컬 PC에서 개발하는 경우 기본적으로 <code>localhost</code>가 등록되어 있어야 정상 작동합니다.</p>
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSettingsReset}
                style={{ color: '#f87171' }}
              >
                연동 정보 완전 초기화
              </button>
              <button type="submit" className="btn-primary">
                정보 등록 및 환경 갱신
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
