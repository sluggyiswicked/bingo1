import { BINGO_LETTERS, COLUMN_RANGES, getColumnColorClass, getColumnForNumber } from '../core/models';

interface NumberPickerProps {
  calledNumbers: number[];
  onToggle: (num: number) => void;
}

export function NumberPicker({ calledNumbers, onToggle }: NumberPickerProps) {
  const calledSet = new Set(calledNumbers);

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      {/* Header */}
      <div className="flex justify-center gap-1 mb-2">
        {BINGO_LETTERS.map((letter, col) => (
          <div
            key={letter}
            className={`flex-1 max-w-[60px] h-10 flex items-center justify-center text-white font-bold rounded ${getColumnColorClass(col)}`}
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Number Grid - 15 rows x 5 columns */}
      <div className="flex flex-col gap-1">
        {Array.from({ length: 15 }, (_, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {BINGO_LETTERS.map((_, col) => {
              const num = COLUMN_RANGES[col].min + rowIndex;
              const isCalled = calledSet.has(num);

              return (
                <button
                  key={num}
                  onClick={() => onToggle(num)}
                  className={`flex-1 max-w-[60px] h-9 flex items-center justify-center font-semibold rounded transition-all
                    ${isCalled
                      ? `${getColumnColorClass(col)} text-white`
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

interface RecentlyCalledProps {
  calledNumbers: number[];
  onRemove: (num: number) => void;
  maxDisplay?: number;
}

export function RecentlyCalled({ calledNumbers, onRemove, maxDisplay = 10 }: RecentlyCalledProps) {
  if (calledNumbers.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        No numbers called yet
      </div>
    );
  }

  const recent = [...calledNumbers].reverse().slice(0, maxDisplay);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {recent.map((num, index) => {
        const col = getColumnForNumber(num);

        return (
          <button
            key={num}
            onClick={() => onRemove(num)}
            className={`flex flex-col items-center px-3 py-1 rounded border-2 transition-all hover:opacity-80
              ${index === 0 ? 'bg-gray-100' : 'bg-white'}
              ${col === 0 ? 'border-red-500' : ''}
              ${col === 1 ? 'border-orange-500' : ''}
              ${col === 2 ? 'border-green-500' : ''}
              ${col === 3 ? 'border-blue-500' : ''}
              ${col === 4 ? 'border-purple-500' : ''}
            `}
          >
            <span className="text-xs text-gray-500">{BINGO_LETTERS[col]}</span>
            <span className={`text-lg font-bold
              ${col === 0 ? 'text-red-500' : ''}
              ${col === 1 ? 'text-orange-500' : ''}
              ${col === 2 ? 'text-green-500' : ''}
              ${col === 3 ? 'text-blue-500' : ''}
              ${col === 4 ? 'text-purple-500' : ''}
            `}>
              {num}
            </span>
          </button>
        );
      })}
      {calledNumbers.length > maxDisplay && (
        <span className="text-gray-400 text-sm">
          +{calledNumbers.length - maxDisplay} more
        </span>
      )}
    </div>
  );
}
