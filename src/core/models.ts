// Bingo Assistant - Core Data Models
// 75-ball bingo: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)

export interface Cell {
  index: number;
  row: number;
  col: number;
  number?: number;
  isFree: boolean;
}

export interface Card {
  id: string;
  name: string;
  createdAt: number;
  cells: Cell[];
  hasFreeCenter: boolean;
}

export type RuleMode = 'STANDARD' | 'DOUBLE' | 'BOX' | 'X' | 'BLACKOUT' | 'NONE';

export const RULE_MODES: RuleMode[] = ['STANDARD', 'DOUBLE', 'BOX', 'X', 'BLACKOUT', 'NONE'];

export const RULE_MODE_LABELS: Record<RuleMode, { name: string; description: string }> = {
  STANDARD: { name: 'Single Line', description: 'Any row, column, or diagonal' },
  DOUBLE: { name: 'Double Bingo', description: 'Complete 2 lines' },
  BOX: { name: 'Picture Frame', description: 'All 16 outer edge squares' },
  X: { name: 'X Pattern', description: 'Both diagonals' },
  BLACKOUT: { name: 'Blackout', description: 'All 25 squares' },
  NONE: { name: 'Free Play', description: 'No win detection' },
};

export interface GameSession {
  id: string;
  startedAt: number;
  cardIds: string[];
  calledNumbers: number[];
  marksByCard: Record<string, boolean[]>;
  ruleMode: RuleMode;
  detectWins: boolean;
}

export type LineId =
  | 'row0' | 'row1' | 'row2' | 'row3' | 'row4'
  | 'col0' | 'col1' | 'col2' | 'col3' | 'col4'
  | 'diagMain' | 'diagAnti';

export interface WinResult {
  isWin: boolean;
  winType?: string;
  winningLines?: LineId[];
  completedLineCount?: number;
}

export const COLUMN_RANGES: Record<number, { min: number; max: number; letter: string }> = {
  0: { min: 1, max: 15, letter: 'B' },
  1: { min: 16, max: 30, letter: 'I' },
  2: { min: 31, max: 45, letter: 'N' },
  3: { min: 46, max: 60, letter: 'G' },
  4: { min: 61, max: 75, letter: 'O' },
};

export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;

export const LINE_INDICES: Record<LineId, number[]> = {
  row0: [0, 1, 2, 3, 4],
  row1: [5, 6, 7, 8, 9],
  row2: [10, 11, 12, 13, 14],
  row3: [15, 16, 17, 18, 19],
  row4: [20, 21, 22, 23, 24],
  col0: [0, 5, 10, 15, 20],
  col1: [1, 6, 11, 16, 21],
  col2: [2, 7, 12, 17, 22],
  col3: [3, 8, 13, 18, 23],
  col4: [4, 9, 14, 19, 24],
  diagMain: [0, 6, 12, 18, 24],
  diagAnti: [4, 8, 12, 16, 20],
};

export const PERIMETER_INDICES = [
  0, 1, 2, 3, 4,
  20, 21, 22, 23, 24,
  5, 10, 15,
  9, 14, 19,
];

export function createCell(index: number, number?: number): Cell {
  const row = Math.floor(index / 5);
  const col = index % 5;
  const isFree = index === 12;
  return {
    index,
    row,
    col,
    number: isFree ? undefined : number,
    isFree,
  };
}

export function createEmptyCard(id: string, name: string): Card {
  const cells: Cell[] = Array.from({ length: 25 }, (_, i) => createCell(i));
  return {
    id,
    name,
    createdAt: Date.now(),
    cells,
    hasFreeCenter: true,
  };
}

export function isValidNumberForColumn(num: number, col: number): boolean {
  const range = COLUMN_RANGES[col];
  if (!range) return false;
  return num >= range.min && num <= range.max;
}

export function getColumnForNumber(num: number): number {
  if (num < 1 || num > 75) return -1;
  return Math.floor((num - 1) / 15);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getColumnColorClass(col: number): string {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'];
  return colors[col] || 'bg-gray-500';
}

export function getColumnTextColorClass(col: number): string {
  const colors = ['text-red-500', 'text-orange-500', 'text-green-500', 'text-blue-500', 'text-purple-500'];
  return colors[col] || 'text-gray-500';
}

export function getColumnBorderColorClass(col: number): string {
  const colors = ['border-red-500', 'border-orange-500', 'border-green-500', 'border-blue-500', 'border-purple-500'];
  return colors[col] || 'border-gray-500';
}
