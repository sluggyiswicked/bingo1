// Session Store - Manages game session state with localStorage persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameSession, RuleMode } from '../core/models';
import { generateId } from '../core/models';

interface SessionState {
  currentSession: GameSession | null;
}

interface SessionActions {
  startSession: (cardIds: string[], ruleMode?: RuleMode, detectWins?: boolean) => void;
  endSession: () => void;
  toggleCalledNumber: (num: number) => void;
  setRuleMode: (mode: RuleMode) => void;
  resetMarks: () => void;
  setDetectWins: (detect: boolean) => void;
}

type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      currentSession: null,

      startSession: (cardIds, ruleMode = 'STANDARD', detectWins = true) => {
        const session: GameSession = {
          id: generateId(),
          startedAt: Date.now(),
          cardIds,
          calledNumbers: get().currentSession?.calledNumbers ?? [],
          marksByCard: {},
          ruleMode: get().currentSession?.ruleMode ?? ruleMode,
          detectWins,
        };
        set({ currentSession: session });
      },

      endSession: () => {
        set({ currentSession: null });
      },

      toggleCalledNumber: (num) => {
        set((state) => {
          if (!state.currentSession) return state;

          const calledNumbers = [...state.currentSession.calledNumbers];
          const index = calledNumbers.indexOf(num);

          if (index >= 0) {
            calledNumbers.splice(index, 1);
          } else {
            calledNumbers.push(num);
          }

          return {
            currentSession: {
              ...state.currentSession,
              calledNumbers,
            },
          };
        });
      },

      setRuleMode: (mode) => {
        set((state) => {
          if (!state.currentSession) return state;
          return {
            currentSession: {
              ...state.currentSession,
              ruleMode: mode,
            },
          };
        });
      },

      resetMarks: () => {
        set((state) => {
          if (!state.currentSession) return state;
          return {
            currentSession: {
              ...state.currentSession,
              calledNumbers: [],
              marksByCard: {},
            },
          };
        });
      },

      setDetectWins: (detect) => {
        set((state) => {
          if (!state.currentSession) return state;
          return {
            currentSession: {
              ...state.currentSession,
              detectWins: detect,
            },
          };
        });
      },
    }),
    {
      name: 'bingo-session-storage',
      partialize: (state) => ({ currentSession: state.currentSession }),
    }
  )
);
