import type { Card } from '../core/models';
import { BINGO_LETTERS, getColumnColorClass } from '../core/models';

interface BingoCardProps {
  card: Card;
  marks: boolean[];
  winningIndices?: Set<number>;
  onCellClick?: (index: number) => void;
  isWinner?: boolean;
  showName?: boolean;
}

export function BingoCard({
  card,
  marks,
  winningIndices,
  onCellClick,
  isWinner = false,
  showName = true,
}: BingoCardProps) {
  const getCellClasses = (index: number) => {
    const cell = card.cells[index];
    const isMarked = marks[index];
    const isWinning = winningIndices?.has(index);

    let classes = 'w-12 h-12 flex items-center justify-center text-lg font-semibold border-2 rounded transition-all ';

    if (cell.isFree) {
      classes += 'bg-green-100 dark:bg-green-900/50 border-green-500 text-green-700 dark:text-green-300 text-sm ';
    } else if (isWinning) {
      classes += 'bg-yellow-200 dark:bg-yellow-700/50 border-yellow-500 text-yellow-800 dark:text-yellow-200 ';
    } else if (isMarked) {
      classes += 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300 ';
    } else {
      classes += 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 ';
    }

    if (onCellClick && !cell.isFree) {
      classes += 'cursor-pointer hover:opacity-80 ';
    }

    return classes;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md ${isWinner ? 'ring-4 ring-yellow-400' : ''}`}>
      {showName && (
        <div className="text-center font-semibold text-gray-800 dark:text-gray-100 mb-2">{card.name}</div>
      )}

      {/* Header */}
      <div className="flex justify-center gap-1 mb-1">
        {BINGO_LETTERS.map((letter, col) => (
          <div
            key={letter}
            className={`w-12 h-8 flex items-center justify-center text-white font-bold rounded ${getColumnColorClass(col)}`}
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }, (_, row) => (
          <div key={row} className="flex justify-center gap-1">
            {Array.from({ length: 5 }, (_, col) => {
              const index = row * 5 + col;
              const cell = card.cells[index];

              return (
                <div
                  key={index}
                  className={getCellClasses(index)}
                  onClick={() => onCellClick?.(index)}
                >
                  {cell.isFree ? 'FREE' : cell.number ?? ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {isWinner && (
        <div className="mt-2 text-center">
          <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-700/50 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full font-bold">
            BINGO!
          </span>
        </div>
      )}
    </div>
  );
}
