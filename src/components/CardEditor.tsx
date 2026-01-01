import { useState, useCallback } from 'react';
import type { Card, Cell } from '../core/models';
import { BINGO_LETTERS, COLUMN_RANGES, isValidNumberForColumn, getColumnColorClass, getColumnTextColorClass } from '../core/models';

interface CardEditorProps {
  card: Card;
  onCellChange: (index: number, number: number | undefined) => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export function CardEditor({ card, onCellChange, onSave, onCancel }: CardEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

  const getUsedNumbersInColumn = useCallback((col: number): Set<number> => {
    const used = new Set<number>();
    for (let row = 0; row < 5; row++) {
      const index = row * 5 + col;
      if (index === 12) continue;
      const num = card.cells[index]?.number;
      if (num !== undefined) {
        used.add(num);
      }
    }
    return used;
  }, [card.cells]);

  const validateCard = useCallback((): boolean => {
    return card.cells.every((cell, index) => {
      if (index === 12) return true;
      return cell.number !== undefined;
    });
  }, [card.cells]);

  const getNextCellIndex = (currentIndex: number): number | null => {
    const col = currentIndex % 5;
    const row = Math.floor(currentIndex / 5);

    if (row < 4) {
      const nextIndex = (row + 1) * 5 + col;
      if (nextIndex === 12) {
        if (row + 1 < 4) return (row + 2) * 5 + col;
        return col < 4 ? col + 1 : null;
      }
      return nextIndex;
    }

    if (col < 4) return col + 1;
    return null;
  };

  const handleCellClick = (index: number) => {
    if (index === 12) return;
    setSelectedIndex(index);
  };

  const handleNumberSelect = (num: number) => {
    if (selectedIndex === null || selectedIndex === 12) return;
    onCellChange(selectedIndex, num);
    const nextIndex = getNextCellIndex(selectedIndex);
    if (nextIndex !== null) {
      setSelectedIndex(nextIndex);
    }
  };

  const handleClearCell = () => {
    if (selectedIndex === null || selectedIndex === 12) return;
    onCellChange(selectedIndex, undefined);
  };

  const getCellClasses = (index: number) => {
    const cell = card.cells[index];
    const isSelected = selectedIndex === index;

    let classes = 'w-14 h-14 flex items-center justify-center text-xl font-semibold border-2 rounded transition-all ';

    if (cell.isFree) {
      classes += 'bg-green-100 border-green-500 text-green-700 text-sm ';
    } else if (isSelected) {
      classes += `bg-gray-100 border-4 ${getColumnColorClass(cell.col).replace('bg-', 'border-')} `;
    } else if (cell.number === undefined) {
      classes += 'bg-gray-50 border-dashed border-gray-300 ';
    } else {
      classes += 'bg-white border-gray-300 cursor-pointer hover:border-gray-400 ';
    }

    return classes;
  };

  const isValid = validateCard();
  const filledCount = card.cells.filter((c, i) => i === 12 || c.number !== undefined).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-center gap-1">
        {BINGO_LETTERS.map((letter, col) => (
          <div
            key={letter}
            className={`w-14 h-10 flex flex-col items-center justify-center text-white font-bold rounded ${getColumnColorClass(col)}`}
          >
            <span>{letter}</span>
            <span className="text-xs opacity-80">{COLUMN_RANGES[col].min}-{COLUMN_RANGES[col].max}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-1 items-center">
        {Array.from({ length: 5 }, (_, row) => (
          <div key={row} className="flex gap-1">
            {Array.from({ length: 5 }, (_, col) => {
              const index = row * 5 + col;
              const cell = card.cells[index];

              return (
                <div
                  key={index}
                  className={getCellClasses(index)}
                  onClick={() => handleCellClick(index)}
                >
                  {cell.isFree ? 'FREE' : cell.number ?? ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Number Picker */}
      {selectedIndex !== null && selectedIndex !== 12 && (
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex justify-between items-center mb-3">
            <span className={`font-bold text-lg ${getColumnTextColorClass(selectedIndex % 5)}`}>
              {BINGO_LETTERS[selectedIndex % 5]} Column
            </span>
            {card.cells[selectedIndex]?.number !== undefined && (
              <button
                onClick={handleClearCell}
                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {(() => {
              const col = selectedIndex % 5;
              const range = COLUMN_RANGES[col];
              const usedNumbers = getUsedNumbersInColumn(col);
              const currentCellNumber = card.cells[selectedIndex]?.number;

              return Array.from({ length: 15 }, (_, i) => {
                const num = range.min + i;
                const isUsed = usedNumbers.has(num) && num !== currentCellNumber;
                const isCurrentValue = num === currentCellNumber;

                return (
                  <button
                    key={num}
                    onClick={() => !isUsed && handleNumberSelect(num)}
                    disabled={isUsed}
                    className={`w-12 h-10 flex items-center justify-center font-semibold rounded transition-all
                      ${isCurrentValue
                        ? `${getColumnColorClass(col)} text-white`
                        : isUsed
                          ? 'bg-gray-100 text-gray-400 line-through cursor-not-allowed'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer'
                      }`}
                  >
                    {num}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}

      {selectedIndex === null && (
        <div className="text-center text-gray-400 py-8">
          Tap a cell to edit
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            disabled={!isValid}
            className={`px-6 py-3 rounded-lg font-semibold transition-all
              ${isValid
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {isValid ? 'Save Card' : `Fill ${25 - filledCount} more cells`}
          </button>
        )}
      </div>
    </div>
  );
}
