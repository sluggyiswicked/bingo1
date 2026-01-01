// Bingo Assistant - Rules Engine
// Pure functions for computing marks and detecting wins

import type {
  Card,
  Cell,
  RuleMode,
  LineId,
  WinResult,
} from './models';
import { LINE_INDICES, PERIMETER_INDICES } from './models';

/**
 * Compute which cells should be marked based on called numbers.
 * FREE center is always marked.
 */
export function computeMarks(card: Card, calledNumbers: number[]): boolean[] {
  const calledSet = new Set(calledNumbers);
  return card.cells.map((cell: Cell) => {
    if (cell.isFree) return true;
    return cell.number !== undefined && calledSet.has(cell.number);
  });
}

/**
 * Check if a specific line is complete (all indices marked).
 */
export function isLineComplete(marks: boolean[], lineId: LineId): boolean {
  const indices = LINE_INDICES[lineId];
  return indices.every((i) => marks[i]);
}

/**
 * Get all completed lines.
 */
export function getCompletedLines(marks: boolean[]): LineId[] {
  const allLines = Object.keys(LINE_INDICES) as LineId[];
  return allLines.filter((lineId) => isLineComplete(marks, lineId));
}

/**
 * Check if perimeter (box) is complete.
 */
export function isBoxComplete(marks: boolean[]): boolean {
  return PERIMETER_INDICES.every((i) => marks[i]);
}

/**
 * Check if both diagonals are complete (X pattern).
 */
export function isXComplete(marks: boolean[]): boolean {
  return isLineComplete(marks, 'diagMain') && isLineComplete(marks, 'diagAnti');
}

/**
 * Check if all 25 cells are marked (blackout).
 */
export function isBlackout(marks: boolean[]): boolean {
  return marks.every((m) => m);
}

/**
 * Detect wins based on the rule mode.
 */
export function detectWins(
  card: Card,
  marks: boolean[],
  ruleMode: RuleMode
): WinResult {
  if (ruleMode === 'NONE') {
    return { isWin: false };
  }

  const completedLines = getCompletedLines(marks);
  const completedCount = completedLines.length;

  switch (ruleMode) {
    case 'STANDARD': {
      if (completedCount >= 1) {
        return {
          isWin: true,
          winType: 'Standard Bingo',
          winningLines: completedLines,
          completedLineCount: completedCount,
        };
      }
      return { isWin: false, completedLineCount: 0 };
    }

    case 'DOUBLE': {
      if (completedCount >= 2) {
        return {
          isWin: true,
          winType: 'Double Bingo',
          winningLines: completedLines,
          completedLineCount: completedCount,
        };
      }
      return { isWin: false, completedLineCount: completedCount };
    }

    case 'BOX': {
      if (isBoxComplete(marks)) {
        return {
          isWin: true,
          winType: 'Box Bingo',
          completedLineCount: completedCount,
        };
      }
      return { isWin: false, completedLineCount: completedCount };
    }

    case 'X': {
      if (isXComplete(marks)) {
        return {
          isWin: true,
          winType: 'X Bingo',
          winningLines: ['diagMain', 'diagAnti'],
          completedLineCount: completedCount,
        };
      }
      return { isWin: false, completedLineCount: completedCount };
    }

    case 'BLACKOUT': {
      if (isBlackout(marks)) {
        return {
          isWin: true,
          winType: 'Blackout',
          completedLineCount: completedCount,
        };
      }
      return { isWin: false, completedLineCount: completedCount };
    }

    default:
      return { isWin: false };
  }
}
