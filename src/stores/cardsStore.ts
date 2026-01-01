// Cards Store - Manages bingo cards with localStorage persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, Cell } from '../core/models';
import { createEmptyCard, generateId, createCell } from '../core/models';

interface CardsState {
  cards: Card[];
}

interface CardsActions {
  addCard: (card: Omit<Card, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => string;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  getCard: (id: string) => Card | undefined;
  createNewCard: (name: string) => string;
  setCardCells: (id: string, cells: Cell[]) => void;
  setCellNumber: (cardId: string, cellIndex: number, number: number | undefined) => void;
  clearCards: () => void;
}

type CardsStore = CardsState & CardsActions;

export const useCardsStore = create<CardsStore>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (cardData) => {
        const id = cardData.id || generateId();
        const newCard: Card = {
          id,
          name: cardData.name,
          createdAt: cardData.createdAt || Date.now(),
          cells: cardData.cells,
          hasFreeCenter: cardData.hasFreeCenter ?? true,
        };

        set((state) => ({
          cards: [...state.cards, newCard],
        }));

        return id;
      },

      updateCard: (id, updates) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id ? { ...card, ...updates } : card
          ),
        }));
      },

      deleteCard: (id) => {
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
        }));
      },

      getCard: (id) => {
        return get().cards.find((card) => card.id === id);
      },

      createNewCard: (name) => {
        const id = generateId();
        const cells: Cell[] = Array.from({ length: 25 }, (_, i) => createCell(i));
        const newCard: Card = {
          id,
          name,
          createdAt: Date.now(),
          cells,
          hasFreeCenter: true,
        };

        set((state) => ({
          cards: [...state.cards, newCard],
        }));

        return id;
      },

      setCardCells: (id, cells) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id ? { ...card, cells } : card
          ),
        }));
      },

      setCellNumber: (cardId, cellIndex, number) => {
        set((state) => ({
          cards: state.cards.map((card) => {
            if (card.id !== cardId) return card;

            const newCells = [...card.cells];
            if (newCells[cellIndex]) {
              newCells[cellIndex] = {
                ...newCells[cellIndex],
                number: cellIndex === 12 ? undefined : number,
              };
            }
            return { ...card, cells: newCells };
          }),
        }));
      },

      clearCards: () => set({ cards: [] }),
    }),
    {
      name: 'bingo-cards-storage',
      partialize: (state) => ({ cards: state.cards }),
    }
  )
);
