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
  
  // Preloading states
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  
  // UI Panels / Navigation
  const [activeTab, setActiveTab] = useState<'browser' | 'journal' | 'rules'>('browser');
  const [browserFilter, setBrowserFilter] = useState<string>('All');
  
  // Log / Journal
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  
  // Auth & Cloud state
  const [user, setUser] = useState<User | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  
  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFoolModal, setShowFoolModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('lore');
  
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
        // Load journal from Firestore on login
        loadJournalFromCloud(firebaseUser);
      } else {
        // Fallback to local storage if logged out
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
        
        // Merge strategy: Combine cloud and local based on timestamp/existence or just take cloud
        // Here we default to taking cloud if it exists, otherwise write local to cloud
        const localData = localStorage.getItem('gloam_journal_log');
        let localJournal: JournalEntry[] = [];
        if (localData) {
          try { localJournal = JSON.parse(localData); } catch (e) {}
        }

        if (cloudJournal.length >= localJournal.length) {
          setJournal(cloudJournal);
          localStorage.setItem('gloam_journal_log', JSON.stringify(cloudJournal));
        } else if (localJournal.length > 0) {
          // Sync local to cloud
          await setDoc(doc(db, 'users', currentUser.uid), {
            journal: localJournal,
            lastUpdated: Date.now()
          });
          setJournal(localJournal);
        }
      } else {
        // Firestore is empty, upload local journal if any
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

  // --- Decks Fisher-Yates Shuffling ---
  const resetDecks = (allCards: TarotCard[]) => {
    // Player Deck: Minor Arcana + The Fool (Major_0)
    const playerBase = allCards.filter(c => c.suit !== 'Major' || c.value === 0);
    // Referee Deck: Major Arcana I-XXI (Major_1 to Major_21)
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
    
    // Add reshuffle system entry to journal
    const newEntry: JournalEntry = {
      id: `system_${Date.now()}`,
      timestamp: Date.now(),
      type: 'system',
      cardName: 'Decks Shuffled',
      cardId: 'shuffle',
      imageUrl: '',
      interpretation: 'The decks have been fully gathered, recalled, and reshuffled.',
      note: 'The Fool was drawn, triggering a reset of all tarot decks.'
    };
    saveJournal([newEntry, ...journal]);
  };

  // --- Draw Mechanisms ---
  const drawPlayerCard = () => {
    if (playerDeck.length === 0) {
      alert("Player deck is empty. Please reshuffle!");
      return;
    }

    setIsActionSubjectView(false);
    const copy = [...playerDeck];
    const card = copy.shift()!;
    setPlayerDeck(copy);

    const isReversed = allowReversed && Math.random() < 0.5;
    setActiveCard(card);
    setActiveCardReversed(isReversed);

    let interpretation = `Stat Association: ${card.statAssociation || 'None'}. `;
    if (card.actionKeyword) {
      interpretation += `Gloam Action Prompt: "${card.actionKeyword}"`;
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

    // Check if Fool is drawn (Fool triggers recall & shuffle)
    if (card.suit === 'Major' && card.value === 0) {
      setTimeout(() => {
        setShowFoolModal(true);
      }, 700);
    }
  };

  const drawRefereeCard = () => {
    if (refereeDeck.length === 0) {
      alert("Referee deck is empty. Please reshuffle!");
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
    const interpretation = `Gloam Referee Subject Prompt: "${keyword}" (${isReversed ? 'Reversed' : 'Upright'})`;

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

  // Yes/No Oracle (Draws from Player Deck)
  const rollYesNoOracle = () => {
    if (playerDeck.length === 0) {
      alert("Player deck is empty. Please reshuffle!");
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
    const interpretation = `Yes/No Oracle: [${answer.outcome}] - ${answer.note}`;

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

  // Amount Oracle (Draws from Player Deck)
  const rollAmountOracle = () => {
    if (playerDeck.length === 0) {
      alert("Player deck is empty. Please reshuffle!");
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
    const interpretation = `Amount Oracle: [${amount.outcome}] - ${amount.note}`;

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

  // Action-Subject Combined Oracle (Action from Player Deck, Subject from Referee Deck)
  const rollActionSubjectOracle = () => {
    if (playerDeck.length === 0) {
      alert("Player deck is empty. Please reshuffle!");
      return;
    }
    if (refereeDeck.length === 0) {
      alert("Referee deck is empty. Please reshuffle!");
      return;
    }

    setIsActionSubjectView(true);

    // Draw Player Card (Action)
    const playerCopy = [...playerDeck];
    const actCard = playerCopy.shift()!;
    setPlayerDeck(playerCopy);
    const actReversed = allowReversed && Math.random() < 0.5;

    // Draw Referee Card (Subject)
    const refCopy = [...refereeDeck];
    const subCard = refCopy.shift()!;
    setRefereeDeck(refCopy);
    const subReversed = allowReversed && Math.random() < 0.5;

    // Set side by side display
    setActiveCard(actCard);
    setActiveCardReversed(actReversed);
    setActiveCard2(subCard);
    setActiveCardReversed2(subReversed);

    const actionWord = actCard.actionKeyword || "Chaos";
    const subjectWord = subReversed ? subCard.subjectKeywordReversed : subCard.subjectKeywordUpright;
    
    const interpretation = `Action-Subject Oracle Prompt: "${actionWord} / ${subjectWord}"`;

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

    // Check if Fool is drawn in player deck
    if (actCard.suit === 'Major' && actCard.value === 0) {
      setTimeout(() => {
        setShowFoolModal(true);
      }, 700);
    }
  };

  // Arcane Magick Spell Formulator (Page 38)
  const rollArcaneMagickSpell = () => {
    if (playerDeck.length === 0) {
      alert("Player deck is empty. Please reshuffle!");
      return;
    }
    if (refereeDeck.length === 0) {
      alert("Referee deck is empty. Please reshuffle!");
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

    const verb = ArcaneMagickVerbs[verbCard.suit]?.[verbCard.value] || "Folly";
    const nounData = ArcaneMagickNouns[nounCard.value] || { upright: "Chaos", reversed: "Chaos" };
    const noun = nounReversed ? nounData.reversed : nounData.upright;

    const interpretation = `Arcane Spell Formulated: "${verb} ${noun}" (Verb: ${verb} from ${verbCard.name} | Noun: ${noun} from ${nounCard.name}${nounReversed ? ' [Reversed]' : ''}). Spend at least 1 Resolve to cast. Wounds: 1 per Resolve spent (if combat test succeeds).`;

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
      alert("Referee deck is empty. Please reshuffle!");
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
      const interpretation = `Road Encounter: A mysterious traveler who shifts identity and disappears like a phantom. (The Fool triggers an immediate reshuffle of all decks!)`;
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
      
      const interpretation = `Road Traveler: ${name} the ${role}. Personality/Sign: ${trait} (${isReversed ? 'Reversed: Hostile, defensive or opposite behaviour' : 'Upright: Normal behavior'})`;

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
    setActiveCardReversed(false); // Browser displays upright

    const description = card.suit === 'Major' 
      ? `Subject keywords: "${card.subjectKeywordUpright}" (Upright), "${card.subjectKeywordReversed}" (Reversed).`
      : `Action keyword: "${card.actionKeyword}". Stat: ${card.statAssociation}`;

    const newEntry: JournalEntry = {
      id: `select_${Date.now()}`,
      timestamp: Date.now(),
      type: 'select',
      cardName: card.name,
      cardId: card.id,
      imageUrl: card.imageUrl,
      isReversed: false,
      interpretation: `Browsed Tarot Card: ${description}`,
      note: ''
    };

    saveJournal([newEntry, ...journal]);
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
    if (confirm("Are you sure you want to delete this journal entry?")) {
      const updated = journal.filter(entry => entry.id !== id);
      saveJournal(updated);
    }
  };

  const clearJournal = () => {
    if (confirm("This will permanently delete all journal entries in this session. Proceed?")) {
      saveJournal([]);
    }
  };

  const exportJournal = () => {
    if (journal.length === 0) {
      alert("Your journal is empty!");
      return;
    }

    let output = `GLOAM RPG TAROT COMPANION JOURNAL\n`;
    output += `Generated on: ${new Date().toLocaleString()}\n`;
    output += `==============================================\n\n`;

    journal.forEach((entry, index) => {
      const dateStr = new Date(entry.timestamp).toLocaleTimeString();
      const num = journal.length - index;
      
      output += `[#${num}] ${dateStr} - ${entry.cardName}`;
      if (entry.isReversed) output += ` (REVERSED)`;
      if (entry.cardName2) {
        output += ` + ${entry.cardName2}`;
        if (entry.isReversed2) output += ` (REVERSED)`;
      }
      output += `\n`;
      output += `Result: ${entry.interpretation}\n`;
      if (entry.note.trim()) {
        output += `Journal Note:\n   ${entry.note.replace(/\n/g, '\n   ')}\n`;
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
      alert("Please configure Firebase using the settings cog in the top-right corner to activate Google integration.");
      setShowSettingsModal(true);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      alert("Login failed. Check your Firebase domains or console logs.");
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
    alert("Firebase settings saved. The page will reload to apply configuration.");
    window.location.reload();
  };

  const handleSettingsReset = () => {
    if (confirm("Reset to default configuration? This will clear dynamic Firebase keys from your browser.")) {
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
            <h2>Gloam Companion</h2>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${preloadProgress}%` }}
              ></div>
            </div>
            <p>Gathering tarot cards... {preloadProgress}%</p>
            <button
              className="btn-secondary"
              style={{ marginTop: '20px' }}
              onClick={() => setIsPreloading(false)}
            >
              Skip Preloading
            </button>
          </div>
        </div>
      )}

      {/* 2. Header */}
      <header className="app-header">
        <div className="header-title-group">
          <h1>Gloam</h1>
          <p>Solo Tarot RPG Oracle & Companion</p>
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
                <span className="user-name">{user.displayName || 'Player'}</span>
                {cloudSyncing ? (
                  <span title="Syncing..."><Cloud className="animate-pulse text-indigo-400" size={16} /></span>
                ) : (
                  <span title="Synced with Cloud"><Check className="text-emerald-400" size={16} /></span>
                )}
                <button onClick={handleLogout} className="btn-icon" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={handleGoogleLogin} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogIn size={16} /> Sign In with Google
              </button>
            )
          ) : (
            <div className="flex items-center text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CloudOff size={14} className="text-zinc-600" />
              <span>Local Mode</span>
            </div>
          )}

          <button
            onClick={() => setShowSettingsModal(true)}
            className="btn-icon"
            title="Firebase Sync Settings"
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
            <div className="dashboard-card-title">Decks state</div>
            <div className="decks-container">
              <div className="deck-status-box">
                <div className="deck-label">Player Deck</div>
                <div className="deck-count">{playerDeck.length}</div>
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>Minor + Fool</span>
              </div>
              <div className="deck-status-box">
                <div className="deck-label">Referee Deck</div>
                <div className="deck-count">{refereeDeck.length}</div>
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>Major I-XXI</span>
              </div>
            </div>

            <div className="deck-controls">
              <button className="btn-primary" onClick={drawPlayerCard}>
                Draw Player Card
              </button>
              <button className="btn-primary" onClick={drawRefereeCard}>
                Draw Referee Card
              </button>
              <button
                className="btn-secondary reshuffle-btn"
                onClick={() => {
                  if (confirm("Are you sure you want to recall and reshuffle both decks?")) {
                    triggerReshuffle();
                  }
                }}
              >
                <Shuffle size={14} style={{ marginRight: '6px' }} /> Recall & Reshuffle Decks
              </button>
            </div>

            <label className="toggle-option">
              <input
                type="checkbox"
                checked={allowReversed}
                onChange={(e) => setAllowReversed(e.target.checked)}
              />
              Allow Reversed (Upside-Down) Cards
            </label>
          </div>

          {/* Active Card Board View */}
          <div className="dashboard-card active-card-display">
            <div className="dashboard-card-title" style={{ position: 'absolute', top: '20px', left: '20px', right: '20px' }}>
              Active Tarot Board
            </div>

            {activeCard ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '30px' }}>
                {/* Visual rendering side-by-side if Action-Subject */}
                {isActionSubjectView && activeCard2 ? (
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--accent)' }}>Action (Player)</span>
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
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--accent)' }}>Subject (Referee)</span>
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
                    <span>{isActionSubjectView ? "Combined Oracle Prompt" : activeCard.name}</span>
                    {!isActionSubjectView && (
                      <span className={activeCardReversed ? 'badge-reversed' : 'badge-upright'}>
                        {activeCardReversed ? 'Reversed' : 'Upright'}
                      </span>
                    )}
                  </div>

                  {isActionSubjectView && activeCard2 ? (
                    <div>
                      <div className="stat-box" style={{ background: '#18181b', borderLeftColor: '#c084fc' }}>
                        <div className="info-label">Combined Meaning</div>
                        <div className="info-val" style={{ fontSize: '16px', fontWeight: 600 }}>
                          {activeCard.actionKeyword} / {activeCardReversed2 ? activeCard2.subjectKeywordReversed : activeCard2.subjectKeywordUpright}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text)' }}>
                        Player Deck Keyword: {activeCard.actionKeyword} (from {activeCard.name}) <br />
                        Referee Deck Keyword: {activeCardReversed2 ? activeCard2.subjectKeywordReversed : activeCard2.subjectKeywordUpright} ({activeCardReversed2 ? 'Reversed' : 'Upright'} from {activeCard2.name})
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Stat association */}
                      {activeCard.statAssociation && (
                        <div className="info-row">
                          <div className="info-label">Stat Theme</div>
                          <div className="info-val">{activeCard.statAssociation}</div>
                        </div>
                      )}

                      {/* Gloam Keywords */}
                      {activeCard.suit === 'Major' ? (
                        activeCard.value > 0 ? (
                          <div className="info-row">
                            <div className="info-label">Subject Keywords</div>
                            <div className="info-val">
                              <strong>Upright:</strong> {activeCard.subjectKeywordUpright} <br />
                              <strong>Reversed:</strong> {activeCard.subjectKeywordReversed}
                            </div>
                          </div>
                        ) : (
                          <div className="info-row">
                            <div className="info-label">The Fool</div>
                            <div className="info-val">Reshuffle trigger. Recall all cards in play.</div>
                          </div>
                        )
                      ) : (
                        <div className="info-row">
                          <div className="info-label">Action Keyword</div>
                          <div className="info-val" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)' }}>
                            {activeCard.actionKeyword}
                          </div>
                        </div>
                      )}

                      {/* Oracle Values */}
                      {activeCard.suit !== 'Major' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                          <div className="stat-box">
                            <div className="info-label">Yes/No Oracle</div>
                            <div className="info-val" style={{ fontSize: '12px', fontWeight: 600 }}>
                              {getYesNoOutcome(activeCard).outcome}
                            </div>
                          </div>
                          <div className="stat-box">
                            <div className="info-label">Amount Oracle</div>
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
                <p style={{ fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px' }}>No active card</p>
                <p style={{ fontSize: '12px' }}>Draw a card from the decks or choose one in the card catalog browser.</p>
              </div>
            )}
          </div>

          {/* Quick Oracle Roller Buttons */}
          <div className="dashboard-card">
            <div className="dashboard-card-title">Oracles (Auto-Draw)</div>
            <div className="oracle-options">
              <button className="btn-secondary" onClick={rollYesNoOracle}>
                Yes / No
              </button>
              <button className="btn-secondary" onClick={rollAmountOracle}>
                Amount
              </button>
              <button className="btn-primary" onClick={rollActionSubjectOracle}>
                Action-Subject
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text)', marginTop: '8px', textAlign: 'center' }}>
              Automatically draws necessary cards from the decks and evaluates results.
            </p>
          </div>
        </section>

        {/* Right: Browse Cards Catalog / Journal Journal Log */}
        <section className="panels-column">
          <div className="tabs-header">
            <button
              onClick={() => setActiveTab('browser')}
              className={`tab-btn ${activeTab === 'browser' ? 'active' : ''}`}
            >
              Card Catalog
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`tab-btn ${activeTab === 'journal' ? 'active' : ''}`}
            >
              Session Journal ({journal.length})
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            >
              Rules & Lore
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
                      {suitName === 'Pentacles' ? 'Coins' : suitName}
                    </button>
                  ))}
                </div>

                <div className="cards-grid">
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
                        {card.suit === 'Major' && card.value > 0 ? card.name.split(' - ')[0] : card.name.replace(` of ${card.suit}`, '')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Session Journal */}
            {activeTab === 'journal' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="journal-controls">
                  <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                    Journal logs persist in local storage.
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={exportJournal} title="Export as TEXT file">
                      <Download size={14} style={{ marginRight: '4px' }} /> Export
                    </button>
                    <button className="btn-secondary" onClick={clearJournal} style={{ color: '#f87171' }} title="Clear Logs">
                      <Trash2 size={14} style={{ marginRight: '4px' }} /> Clear
                    </button>
                  </div>
                </div>

                {journal.length === 0 ? (
                  <div className="empty-state" style={{ margin: 'auto' }}>
                    <BookOpen className="empty-state-icon" size={48} />
                    <p style={{ fontWeight: 500, color: 'var(--text-h)', marginBottom: '6px' }}>Journal is empty</p>
                    <p style={{ fontSize: '12px' }}>Your draws, selections, and notes will be recorded here.</p>
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
                                {entry.cardName} {entry.isReversed ? '(Reversed)' : ''}
                                {entry.cardName2 && ` + ${entry.cardName2} ${entry.isReversed2 ? '(Reversed)' : ''}`}
                              </span>
                              <div className="entry-action-type">
                                {entry.type === 'draw_player' && 'Player Deck Draw'}
                                {entry.type === 'draw_referee' && 'Referee Deck Draw'}
                                {entry.type === 'oracle_yesno' && 'Yes/No Oracle'}
                                {entry.type === 'oracle_amount' && 'Amount Oracle'}
                                {entry.type === 'oracle_action_subject' && 'Action-Subject Oracle'}
                                {entry.type === 'select' && 'Inspect Card'}
                                {entry.type === 'system' && 'System Event'}
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
                              placeholder="Write your adventure journal notes here..."
                              value={entry.note}
                              onChange={(e) => updateNote(entry.id, e.target.value)}
                            />
                          )}
                        </div>

                        <button
                          className="delete-entry-btn"
                          onClick={() => deleteEntry(entry.id)}
                          title="Delete entry"
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
                    <span>World Lore & Welcome</span>
                    <span className="arrow">{expandedSection === 'lore' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'lore' && (
                    <div className="collapsible-content">
                      <h3>Welcome to Gloam</h3>
                      <p><strong>A dangerous fairytale setting:</strong> The world of Gloam is chivalric fairytale, dark legend, weird folklore, and ancient evil. Magick is everywhere, from simple charms to reality-bending spells, and it’s never completely safe.</p>
                      <p><strong>Tarot-based systems:</strong> Tarot cards are used as the random number generator instead of dice. Combat uses an engaging hidden-card mechanic. Several game systems (Lifepath, Arcane Magick, Oracles) use the full thematic depth of the Major and Minor Arcana.</p>
                      <p><strong>Player-driven narrative:</strong> The players come up with their own Goals during character creation, and fulfilling them is one of the main ways characters grow. The Referee designs adventures based on the characters' Goals.</p>
                      <p><strong>Relationships matter:</strong> Reputation, oaths, allies, and enemies matter as much as swords and spells. Friends help the characters and foes try to hinder them. The world reacts to the player characters' actions.</p>
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
                    <span>Character Creation Guide</span>
                    <span className="arrow">{expandedSection === 'creation' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'creation' && (
                    <div className="collapsible-content">
                      <h3>Creation Checklist</h3>
                      <ol style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                        <li><strong>Lifepath:</strong> Draw cards from the Player Deck. Each card represents a season of life. Add value to age (minimum age 18).
                          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text)' }}>
                            <li><strong>Wands:</strong> mystical, spiritual, weird, occult</li>
                            <li><strong>Swords:</strong> war, conflict, journey, lesser nobility</li>
                            <li><strong>Cups:</strong> academic, safety, commerce, political</li>
                            <li><strong>Coins:</strong> streets, poverty, low-born, rootless</li>
                          </ul>
                        </li>
                        <li style={{ marginTop: '6px' }}><strong>Stats:</strong> Assign values 1, 2, 3, and 4 to:
                          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text)' }}>
                            <li><strong>Cups:</strong> judgement, learning, medicine, care, patience</li>
                            <li><strong>Swords:</strong> strength, courage, endurance, vigor, combat</li>
                            <li><strong>Wands:</strong> will, mysticism, spirit, passion, occult</li>
                            <li><strong>Coins:</strong> agility, stealth, cunning, manipulation, wealth</li>
                          </ul>
                        </li>
                        <li style={{ marginTop: '6px' }}><strong>Vocation:</strong> The stat you assign 4 to determines Vocation:
                          <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text)' }}>
                            <li>Cups (4) &rarr; <strong>Herald</strong> (Talent: Disarming Presence)</li>
                            <li>Swords (4) &rarr; <strong>Knight-Errant</strong> (Talent: Sally Forth)</li>
                            <li>Wands (4) &rarr; <strong>Mystic</strong> (Talent: Magick)</li>
                            <li>Coins (4) &rarr; <strong>Cutpurse</strong> (Talent: Nimble)</li>
                          </ul>
                        </li>
                        <li style={{ marginTop: '6px' }}><strong>Resolve:</strong> Starts at 1. Used to activate talents, push tests, or power items.</li>
                      </ol>
                      <div className="stat-box" style={{ fontSize: '12px' }}>
                        <strong>Solo Advantage:</strong> For solo play, your character starts with <strong>one extra starting Talent</strong> chosen from any Vocation!
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
                    <span>Arcane Magick Generator (Page 38)</span>
                    <span className="arrow">{expandedSection === 'magick' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'magick' && (
                    <div className="collapsible-content">
                      <p style={{ marginBottom: '12px' }}>
                        Arcane Spells bend reality. A spell is composed of two words: a <strong>Verb</strong> (drawn from Player Deck Minor Arcana) and a <strong>Noun</strong> (drawn from Referee Deck Major Arcana). Spend at least 1 Resolve to cast.
                      </p>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        onClick={rollArcaneMagickSpell}
                        style={{ width: '100%', marginBottom: '12px' }}
                      >
                        Formulate Arcane Spell
                      </button>
                      
                      <div className="stat-box" style={{ fontSize: '12px' }}>
                        <strong>Magick Rule:</strong> Spells that inflict Wounds cause one Wound per Resolve spent. To cast a spell in combat, you must succeed on an Opposed Wands Test.
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
                    <span>Road NPC Generator (Page 53)</span>
                    <span className="arrow">{expandedSection === 'folk' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'folk' && (
                    <div className="collapsible-content">
                      <p style={{ marginBottom: '12px' }}>
                        Generate characters you meet on the road. Draws a card from the Major Arcana to determine occupation, gender-based names, and planetary sign personality.
                      </p>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        onClick={rollFolkTraveler}
                        style={{ width: '100%' }}
                      >
                        Generate Road NPC
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
                    <span>Core Rules & Tests (Page 8)</span>
                    <span className="arrow">{expandedSection === 'tests' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'tests' && (
                    <div className="collapsible-content">
                      <h3>Making a Test</h3>
                      <p>Draw one card from the Player Deck and add the associated Stat (1-4). You must get <strong>14 or higher</strong> to succeed.</p>
                      
                      <h4 style={{ marginTop: '8px', marginBottom: '4px' }}>Pushing Tests</h4>
                      <p>Optional. If you fail, draw a second card and add it to the total. If it meets 14+, you succeed. If you fail after Pushing, it is a <strong>Great Failure</strong> (gain 1 Resolve, but things go terribly wrong!).</p>
                      
                      <h4 style={{ marginTop: '8px', marginBottom: '4px' }}>Test Outcomes</h4>
                      <ul style={{ paddingLeft: '20px', fontSize: '13px' }}>
                        <li><strong>Great Success:</strong> 14+ on the first card AND the card's suit matches the test suit.</li>
                        <li><strong>Success:</strong> 14+ total.</li>
                        <li><strong>Failure:</strong> 13 or lower.</li>
                        <li><strong>Great Failure:</strong> Failed even after pushing.</li>
                      </ul>

                      <h4 style={{ marginTop: '8px', marginBottom: '4px' }}>Time Scales</h4>
                      <p><strong>Watch:</strong> 8 hours (travel & resting scale).<br />
                      <strong>Turn:</strong> 15 minutes (dungeon crawling scale).<br />
                      <strong>Round:</strong> 10 seconds (combat scale).</p>
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
                    <span>Combat & Wounds Reference</span>
                    <span className="arrow">{expandedSection === 'combat' ? '▼' : '▶'}</span>
                  </button>
                  {expandedSection === 'combat' && (
                    <div className="collapsible-content">
                      <h3>Combat Round Flow</h3>
                      <ol style={{ paddingLeft: '20px', fontSize: '13px', marginBottom: '12px' }}>
                        <li><strong>Draw up to 4:</strong> Players draw until they hold 4 cards. Referee draws 3 per NPC.</li>
                        <li><strong>Initiative:</strong> Choose 1 card from hand and play facedown. It sets the test target number enemies need to hit you (lower initiative acts earlier but is easier to hit).</li>
                        <li><strong>Turn Order:</strong> Count up from 0 to 14. Revelation and actions in order.</li>
                        <li><strong>End of Round:</strong> Discard unwanted cards. Reshuffle decks if The Fool was drawn.</li>
                      </ol>

                      <h3>Wound Consequences</h3>
                      <p style={{ marginBottom: '8px' }}>Wounds have lingering consequences on specific body parts instead of HP:</p>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ textAlign: 'left', padding: '6px' }}>Part</th>
                            <th style={{ textAlign: 'left', padding: '6px' }}>Consequence</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px', fontWeight: 600 }}>Arms</td>
                            <td style={{ padding: '6px' }}>Drop held items. Cannot use that arm.</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px', fontWeight: 600 }}>Head</td>
                            <td style={{ padding: '6px' }}>Collapse unconscious. A second head wound causes death.</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px', fontWeight: 600 }}>Torso</td>
                            <td style={{ padding: '6px' }}>All tests suffer a -3 penalty.</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px', fontWeight: 600 }}>Legs</td>
                            <td style={{ padding: '6px' }}>Speed reduced by 2 per wound. Speed 0 causes collapse.</td>
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
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>The Fool drawn</h3>
            <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '24px', lineBreak: 'normal' }}>
              The Fool represents the ultimate agent of chaos. As per the Gloam RPG rules, drawing The Fool requires you to immediately recall and reshuffle both decks.
            </p>
            <button className="btn-primary" onClick={triggerReshuffle} style={{ width: '100%' }}>
              <Shuffle size={14} style={{ marginRight: '6px' }} /> Recall & Reshuffle Decks
            </button>
          </div>
        </div>
      )}

      {/* 5. Firebase Configurations Settings Modal */}
      {showSettingsModal && (
        <div className="settings-modal">
          <form className="settings-box" onSubmit={handleSettingsSave}>
            <div className="settings-box-header">
              <h3>Firebase Sync Settings</h3>
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
              Configure your Firebase keys below to store and synchronize your solo adventure journal logs to Firestore. This lets you access your journals across different devices.
            </p>

            <div className="form-group">
              <label>API Key</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.apiKey}
                onChange={(e) => setSettingsForm({ ...settingsForm, apiKey: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Auth Domain</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.authDomain}
                onChange={(e) => setSettingsForm({ ...settingsForm, authDomain: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Project ID</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.projectId}
                onChange={(e) => setSettingsForm({ ...settingsForm, projectId: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Storage Bucket</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.storageBucket}
                onChange={(e) => setSettingsForm({ ...settingsForm, storageBucket: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Messaging Sender ID</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.messagingSenderId}
                onChange={(e) => setSettingsForm({ ...settingsForm, messagingSenderId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>App ID</label>
              <input
                type="text"
                className="form-control"
                value={settingsForm.appId}
                onChange={(e) => setSettingsForm({ ...settingsForm, appId: e.target.value })}
                required
              />
            </div>

            <div className="domain-auth-info">
              <p><strong>Important authorized domains:</strong></p>
              <p>Ensure you add your host domain to the Firebase Console &rarr; Auth &rarr; Settings &rarr; Authorized Domains.</p>
              <p>For local development, make sure <code>localhost</code> is on the list.</p>
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSettingsReset}
                style={{ color: '#f87171' }}
              >
                Clear Settings
              </button>
              <button type="submit" className="btn-primary">
                Save & Reload
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
