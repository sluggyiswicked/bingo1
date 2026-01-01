import { useState, useEffect, useRef } from 'react';
import { useCardsStore, useSessionStore } from './stores';
import { BingoCard } from './components/BingoCard';
import { NumberPicker, RecentlyCalled } from './components/NumberPicker';
import { CardEditor } from './components/CardEditor';
import { BingoOverlay } from './components/BingoOverlay';
import { computeMarks, detectWins } from './core/rules';
import type { Card, Cell, RuleMode } from './core/models';
import { createCell, LINE_INDICES, RULE_MODES, RULE_MODE_LABELS } from './core/models';

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
  const celebratedWinsRef = useRef<Set<string>>(new Set());

  const { cards, addCard, deleteCard, setCellNumber, getCard } = useCardsStore();
  const { currentSession, startSession, toggleCalledNumber, setRuleMode, resetMarks } = useSessionStore();

  // Check for new bingo wins
  useEffect(() => {
    if (!currentSession || currentSession.ruleMode === 'NONE') return;

    const calledNumbers = currentSession.calledNumbers;
    const ruleMode = currentSession.ruleMode;

    for (const card of cards) {
      const marks = computeMarks(card, calledNumbers);
      const winResult = detectWins(card, marks, ruleMode);

      if (winResult.isWin) {
        // Create a unique key for this win state
        const winKey = `${card.id}-${calledNumbers.length}-${ruleMode}`;

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

  // Handle number toggle from card click in session
  const handleCardCellClick = (card: Card, index: number) => {
    if (!currentSession) return;
    const cell = card.cells[index];
    if (cell.isFree || cell.number === undefined) return;
    toggleCalledNumber(cell.number);
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
          <div className="mb-4">
            <input
              type="text"
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              placeholder="Card name"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
            />
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
          <div className="max-w-2xl mx-auto">
            {/* Welcome Hero */}
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Welcome to Bingo Assistant</h2>
              <p className="text-lg text-gray-600 mb-6">
                Your digital companion for tracking bingo cards during live games
              </p>
            </div>

            {/* Value Proposition */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How it works</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <div className="font-medium text-gray-800">Add your bingo cards</div>
                    <div className="text-gray-600 text-sm">Enter the numbers from your physical bingo cards</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <div className="font-medium text-gray-800">Mark called numbers</div>
                    <div className="text-gray-600 text-sm">Tap numbers as they're called - all your cards update automatically</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <div className="font-medium text-gray-800">Never miss a BINGO</div>
                    <div className="text-gray-600 text-sm">We'll alert you instantly when any of your cards wins</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Modes Info */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Supports all game modes</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium">Single Line</span>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium">Double Bingo</span>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium">Picture Frame</span>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium">X Pattern</span>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium">Blackout</span>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium">Free Play</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                onClick={handleCreateCard}
                className="px-8 py-4 bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all"
              >
                Create Your First Card
              </button>
              <p className="text-gray-500 text-sm mt-3">It only takes a minute to add your card numbers</p>
            </div>
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
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCard(card.id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
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
                className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white font-medium text-gray-700 focus:border-blue-500 outline-none"
              >
                {RULE_MODES.map(mode => (
                  <option key={mode} value={mode}>
                    {RULE_MODE_LABELS[mode].name}
                  </option>
                ))}
              </select>
            </div>

            <NumberPicker
              calledNumbers={calledNumbers}
              onToggle={toggleCalledNumber}
            />

            {/* Recently called */}
            <div className="mt-4 bg-white rounded-lg p-4 shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700">Recently Called ({calledNumbers.length})</span>
                {calledNumbers.length > 0 && (
                  <button
                    onClick={resetMarks}
                    className="text-sm text-red-500 hover:text-red-700"
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
            <div className="text-center text-gray-500 mb-4 font-medium">
              Your Cards (click numbers to toggle)
            </div>
            {cards.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <div className="text-blue-800 font-medium mb-2">No cards added yet</div>
                <p className="text-blue-600 text-sm mb-4">
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
    <div className="min-h-screen bg-gray-100">
      {/* Bingo celebration overlay */}
      {showBingoOverlay && (
        <BingoOverlay
          winnerName={winningCardName}
          onDismiss={() => setShowBingoOverlay(false)}
        />
      )}

      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center">Bingo Assistant</h1>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto flex">
          <button
            onClick={() => handleTabChange('cards')}
            className={`flex-1 py-3 text-center font-semibold transition-all border-b-4
              ${activeTab === 'cards'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            My Cards
          </button>
          <button
            onClick={() => handleTabChange('session')}
            className={`flex-1 py-3 text-center font-semibold transition-all border-b-4
              ${activeTab === 'session'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Call Numbers
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto">
        {activeTab === 'cards' ? renderCardsTab() : renderSessionTab()}
      </main>
    </div>
  );
}

export default App;
