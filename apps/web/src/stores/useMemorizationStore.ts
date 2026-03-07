import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  MemorizationCard,
  MemorizationStats,
  QualityGrade,
} from "@mahfuz/shared/types";

export type SessionPhase = "idle" | "selecting" | "reviewing" | "results";

export interface SessionResult {
  cardId: string;
  verseKey: string;
  grade: QualityGrade;
  wasCorrect: boolean;
}

interface MemorizationStoreState {
  // Session
  phase: SessionPhase;
  sessionCards: MemorizationCard[];
  currentCardIndex: number;
  sessionResults: SessionResult[];

  // Stats (loaded from DB)
  stats: MemorizationStats | null;

  // Reveal state
  revealedWords: number;
  totalWords: number;

  // Goals (persisted)
  newCardsPerDay: number;
  reviewCardsPerDay: number;

  // Actions
  startSession: (cards: MemorizationCard[]) => void;
  setRevealState: (revealed: number, total: number) => void;
  revealNextWord: () => void;
  revealAll: () => void;
  gradeCard: (grade: QualityGrade) => void;
  nextCard: () => void;
  finishSession: () => void;
  resetSession: () => void;
  setStats: (stats: MemorizationStats) => void;
  setGoals: (newCards: number, reviewCards: number) => void;
}

export const useMemorizationStore = create<MemorizationStoreState>()(
  persist(
    (set, get) => ({
      // Session state
      phase: "idle",
      sessionCards: [],
      currentCardIndex: 0,
      sessionResults: [],
      stats: null,
      revealedWords: 0,
      totalWords: 0,

      // Defaults
      newCardsPerDay: 5,
      reviewCardsPerDay: 20,

      startSession: (cards) =>
        set({
          phase: "reviewing",
          sessionCards: cards,
          currentCardIndex: 0,
          sessionResults: [],
          revealedWords: 0,
          totalWords: 0,
        }),

      setRevealState: (revealed, total) =>
        set({ revealedWords: revealed, totalWords: total }),

      revealNextWord: () => {
        const { revealedWords, totalWords } = get();
        if (revealedWords < totalWords) {
          set({ revealedWords: revealedWords + 1 });
        }
      },

      revealAll: () => {
        const { totalWords } = get();
        set({ revealedWords: totalWords });
      },

      gradeCard: (grade) => {
        const { sessionCards, currentCardIndex, sessionResults } = get();
        const card = sessionCards[currentCardIndex];
        if (!card) return;

        set({
          sessionResults: [
            ...sessionResults,
            {
              cardId: card.id,
              verseKey: card.verseKey,
              grade,
              wasCorrect: grade >= 3,
            },
          ],
        });
      },

      nextCard: () => {
        const { currentCardIndex, sessionCards } = get();
        const next = currentCardIndex + 1;
        if (next >= sessionCards.length) {
          set({ phase: "results" });
        } else {
          set({
            currentCardIndex: next,
            revealedWords: 0,
            totalWords: 0,
          });
        }
      },

      finishSession: () => set({ phase: "results" }),

      resetSession: () =>
        set({
          phase: "idle",
          sessionCards: [],
          currentCardIndex: 0,
          sessionResults: [],
          revealedWords: 0,
          totalWords: 0,
        }),

      setStats: (stats) => set({ stats }),

      setGoals: (newCards, reviewCards) =>
        set({ newCardsPerDay: newCards, reviewCardsPerDay: reviewCards }),
    }),
    {
      name: "mahfuz-memorization",
      partialize: (state) => ({
        newCardsPerDay: state.newCardsPerDay,
        reviewCardsPerDay: state.reviewCardsPerDay,
      }),
    },
  ),
);
