import { useState, useEffect, useRef } from 'react';
import { useCardsStore, useSessionStore, useThemeStore } from './stores';
import { BingoCard } from './components/BingoCard';
import { NumberPicker, RecentlyCalled } from './components/NumberPicker';
import { CardEditor } from './components/CardEditor';
import { BingoOverlay } from './components/BingoOverlay';
import { ConfirmModal } from './components/ConfirmModal';
import { computeMarks, detectWins } from './core/rules';
import type { Card, Cell, RuleMode } from './core/models';
import { createCell, LINE_INDICES, RULE_MODES, RULE_MODE_LABELS, BINGO_LETTERS } from './core/models';
import { getBingoCall } from './core/bingoCalls';

// Theme toggle icons
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

type Tab = 'cards' | 'session';
type CardView = 'list' | 'new' | 'edit';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('cards');
  const [cardView, setCardView] = useState<CardView>('list');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [newCardName, setNewCardName] = useState('');
  const [newCardCells, setNewCardCells] = useState<Cell[]>(() =>
    Array.from({ length: 25 }, (_, i) => createCell(i))
  );

  // Bingo celebration state
  const [showBingoOverlay, setShowBingoOverlay] = useState(false);
  const [winningCardName, setWinningCardName] = useState('');
  const [showClearSlider, setShowClearSlider] = useState(false);
  const celebratedWinsRef = useRef<Set<string>>(new Set());

  // Bingo call phrase display
  const [currentCallPhrase, setCurrentCallPhrase] = useState<string | null>(null);
  const callPhraseTimeoutRef = useRef<number | null>(null);

  const { cards, addCard, deleteCard, setCellNumber, getCard } = useCardsStore();
  const { currentSession, startSession, toggleCalledNumber, setRuleMode, resetMarks } = useSessionStore();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Check for new bingo wins
  useEffect(() => {
    if (!currentSession || currentSession.ruleMode === 'NONE') return;

    const calledNumbers = currentSession.calledNumbers;
    const ruleMode = currentSession.ruleMode;

    for (const card of cards) {
      const marks = computeMarks(card, calledNumbers);
      const winResult = detectWins(card, marks, ruleMode);

      if (winResult.isWin) {
        // Create a unique key including the winning lines so new wins trigger celebration
        const winningLines = winResult.winningLines?.sort().join(',') || '';
        const winKey = `${card.id}-${ruleMode}-${winningLines}`;

        if (!celebratedWinsRef.current.has(winKey)) {
          celebratedWinsRef.current.add(winKey);
          setWinningCardName(card.name);
          setShowBingoOverlay(true);
          break; // Only show one celebration at a time
        }
      }
    }
  }, [currentSession?.calledNumbers, currentSession?.ruleMode, cards]);

  // Clear celebrated wins when session is reset
  useEffect(() => {
    if (currentSession?.calledNumbers.length === 0) {
      celebratedWinsRef.current.clear();
    }
  }, [currentSession?.calledNumbers.length]);

  // Cleanup call phrase timeout on unmount
  useEffect(() => {
    return () => {
      if (callPhraseTimeoutRef.current) {
        clearTimeout(callPhraseTimeoutRef.current);
      }
    };
  }, []);

  // Start session if not already started
  const ensureSession = () => {
    if (!currentSession) {
      startSession(cards.map(c => c.id));
    }
  };

  // Handle tab switch
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'session') {
      ensureSession();
    }
  };

  // Create new card
  const handleCreateCard = () => {
    setNewCardName(`Card ${cards.length + 1}`);
    setNewCardCells(Array.from({ length: 25 }, (_, i) => createCell(i)));
    setCardView('new');
  };

  // Save new card
  const handleSaveNewCard = () => {
    const card: Omit<Card, 'id' | 'createdAt'> = {
      name: newCardName || `Card ${cards.length + 1}`,
      cells: newCardCells,
      hasFreeCenter: true,
    };
    addCard(card);
    setCardView('list');
  };

  // Edit existing card
  const handleEditCard = (cardId: string) => {
    setEditingCardId(cardId);
    setCardView('edit');
  };

  // Update cell during editing
  const handleNewCardCellChange = (index: number, number: number | undefined) => {
    setNewCardCells(prev => {
      const next = [...prev];
      next[index] = { ...next[index], number };
      return next;
    });
  };

  // Update cell for existing card
  const handleEditCardCellChange = (index: number, number: number | undefined) => {
    if (editingCardId) {
      setCellNumber(editingCardId, index, number);
    }
  };

  // Handle number toggle with bingo call phrase display
  const handleNumberToggle = (num: number) => {
    const isCurrentlyCalled = currentSession?.calledNumbers.includes(num);

    // Only show phrase when marking a number (not when un-marking)
    if (!isCurrentlyCalled) {
      const phrase = getBingoCall(num);
      if (phrase) {
        const col = Math.floor((num - 1) / 15);
        const letter = BINGO_LETTERS[col];
        setCurrentCallPhrase(`${phrase} — ${letter}${num}`);

        // Clear any existing timeout
        if (callPhraseTimeoutRef.current) {
          clearTimeout(callPhraseTimeoutRef.current);
        }

        // Reset after 2 seconds
        callPhraseTimeoutRef.current = window.setTimeout(() => {
          setCurrentCallPhrase(null);
        }, 2000);
      }
    }

    toggleCalledNumber(num);
  };

  // Handle number toggle from card click in session
  const handleCardCellClick = (card: Card, index: number) => {
    if (!currentSession) return;
    const cell = card.cells[index];
    if (cell.isFree || cell.number === undefined) return;
    handleNumberToggle(cell.number);
  };

  // Get winning cell indices for highlighting
  const getWinningIndices = (marks: boolean[], ruleMode: RuleMode): Set<number> => {
    const winResult = detectWins({ cells: [], name: '', id: '', createdAt: 0, hasFreeCenter: true }, marks, ruleMode);
    const indices = new Set<number>();

    if (winResult.isWin && winResult.winningLines) {
      winResult.winningLines.forEach(lineId => {
        LINE_INDICES[lineId].forEach(i => indices.add(i));
      });
    }

    return indices;
  };

  // Cards tab content
  const renderCardsTab = () => {
    if (cardView === 'new') {
      return (
        <div className="p-4">
          <div className="text-center mb-4">
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{newCardName}</span>
            <span className="text-gray-400 dark:text-gray-500 mx-2">—</span>
            <span className="text-gray-500 dark:text-gray-400">Select the numbers on your card</span>
          </div>
          <CardEditor
            card={{ id: 'new', name: newCardName, cells: newCardCells, createdAt: 0, hasFreeCenter: true }}
            onCellChange={handleNewCardCellChange}
            onSave={handleSaveNewCard}
            onCancel={() => setCardView('list')}
          />
        </div>
      );
    }

    if (cardView === 'edit' && editingCardId) {
      const card = getCard(editingCardId);
      if (!card) {
        setCardView('list');
        return null;
      }

      return (
        <div className="p-4">
          <div className="text-center mb-4">
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{card.name}</span>
            <span className="text-gray-400 dark:text-gray-500 mx-2">—</span>
            <span className="text-gray-500 dark:text-gray-400">Select the numbers on your card</span>
          </div>
          <CardEditor
            card={card}
            onCellChange={handleEditCardCellChange}
            onSave={() => setCardView('list')}
            onCancel={() => setCardView('list')}
          />
        </div>
      );
    }

    return (
      <div className="p-4">
        {cards.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-6">
            {/* BINGO Hero */}
            <div className="flex justify-center gap-2 mb-2">
              <span className="text-5xl font-black text-red-500 drop-shadow-md">B</span>
              <span className="text-5xl font-black text-orange-500 drop-shadow-md">I</span>
              <span className="text-5xl font-black text-green-500 drop-shadow-md">N</span>
              <span className="text-5xl font-black text-blue-500 drop-shadow-md">G</span>
              <span className="text-5xl font-black text-purple-500 drop-shadow-md">O</span>
            </div>
            <div className="flex justify-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            </div>

            {/* Tagline */}
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Track your cards.</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-8">Never miss a win.</p>

            {/* Compact Steps */}
            <div className="space-y-3 mb-8 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-2xl">1.</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Add your bingo cards</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">2.</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Tap numbers as they're called</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">3.</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Get alerted on BINGO!</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleCreateCard}
              className="w-full max-w-xs px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Add Your First Card
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cards.map(card => {
                const marks = currentSession ? computeMarks(card, currentSession.calledNumbers) : Array(25).fill(false);

                return (
                  <div key={card.id} className="relative">
                    <BingoCard
                      card={card}
                      marks={marks}
                      showName={true}
                    />
                    <div className="flex gap-2 mt-2 justify-center">
                      <button
                        onClick={() => handleEditCard(card.id)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCard(card.id)}
                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={handleCreateCard}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
              >
                Add New Card
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Session tab content
  const renderSessionTab = () => {
    const calledNumbers = currentSession?.calledNumbers ?? [];
    const ruleMode = currentSession?.ruleMode ?? 'STANDARD';

    return (
      <div className="p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Number picker */}
          <div className="lg:flex-1">
            {/* Rule mode selector */}
            <div className="mb-4 flex justify-center">
              <select
                value={ruleMode}
                onChange={(e) => setRuleMode(e.target.value as RuleMode)}
                className="px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-200 focus:border-blue-500 outline-none"
              >
                {RULE_MODES.map(mode => (
                  <option key={mode} value={mode}>
                    {RULE_MODE_LABELS[mode].name}
                  </option>
                ))}
              </select>
            </div>

            <div className={`text-center mb-2 font-medium transition-all duration-300 ${
              currentCallPhrase
                ? 'text-blue-600 dark:text-blue-400 text-lg'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {currentCallPhrase || "Tap numbers as they're called"}
            </div>
            <NumberPicker
              calledNumbers={calledNumbers}
              onToggle={handleNumberToggle}
            />

            {/* Recently called */}
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700 dark:text-gray-200">Recently Called ({calledNumbers.length})</span>
                {calledNumbers.length > 0 && (
                  <button
                    onClick={() => setShowClearSlider(true)}
                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <RecentlyCalled
                calledNumbers={calledNumbers}
                onRemove={toggleCalledNumber}
              />
            </div>
          </div>

          {/* Right side - Cards */}
          <div className="lg:flex-1">
            <div className="text-center text-gray-500 dark:text-gray-400 mb-4 font-medium">
              Your Cards (click numbers to toggle)
            </div>
            {cards.length === 0 ? (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
                <div className="text-blue-800 dark:text-blue-300 font-medium mb-2">No cards added yet</div>
                <p className="text-blue-600 dark:text-blue-400 text-sm mb-4">
                  Add your bingo card numbers first, then come back here to track called numbers during the game.
                </p>
                <button
                  onClick={() => { setActiveTab('cards'); handleCreateCard(); }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                >
                  Add Your First Card
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {cards.map(card => {
                  const marks = computeMarks(card, calledNumbers);
                  const winResult = detectWins(card, marks, ruleMode);
                  const winningIndices = getWinningIndices(marks, ruleMode);

                  return (
                    <BingoCard
                      key={card.id}
                      card={card}
                      marks={marks}
                      winningIndices={winningIndices}
                      isWinner={winResult.isWin}
                      onCellClick={(index) => handleCardCellClick(card, index)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Bingo celebration overlay */}
      {showBingoOverlay && (
        <BingoOverlay
          winnerName={winningCardName}
          onDismiss={() => setShowBingoOverlay(false)}
        />
      )}

      {/* Clear confirmation modal */}
      {showClearSlider && (
        <ConfirmModal
          title="Clear all numbers?"
          message="This will reset the game."
          confirmLabel="Clear All"
          onConfirm={() => {
            resetMarks();
            setShowClearSlider(false);
          }}
          onCancel={() => setShowClearSlider(false)}
        />
      )}

      {/* Header */}
      <header className="bg-blue-600 dark:bg-blue-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-blue-500 dark:hover:bg-blue-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <h1 className="text-xl font-bold text-center">
            {activeTab === 'cards' ? 'My Cards' : 'Track Game'}
          </h1>
          <button
            onClick={() => handleTabChange(activeTab === 'cards' ? 'session' : 'cards')}
            className="px-3 py-1.5 bg-blue-500/20 text-white rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors flex items-center gap-1"
          >
            {activeTab === 'cards' ? '▶ Play' : 'My Cards'}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto">
        {activeTab === 'cards' ? renderCardsTab() : renderSessionTab()}
      </main>
    </div>
  );
}

export default App;
