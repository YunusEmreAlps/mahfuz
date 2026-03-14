import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ReadingHistoryState {
  lastSurahId: number | null;
  lastSurahName: string | null;
  lastPageNumber: number | null;
  lastJuzNumber: number | null;

  visitSurah: (id: number, name?: string) => void;
  visitPage: (page: number) => void;
  visitJuz: (juz: number) => void;
  _setAll: (data: {
    lastSurahId: number | null;
    lastSurahName: string | null;
    lastPageNumber: number | null;
    lastJuzNumber: number | null;
  }, syncUpdatedAt: number) => void;
}

export const useReadingHistory = create<ReadingHistoryState>()(
  persist(
    (set) => ({
      lastSurahId: null,
      lastSurahName: null,
      lastPageNumber: null,
      lastJuzNumber: null,

      visitSurah: (id, name) => set({ lastSurahId: id, lastSurahName: name ?? null }),
      visitPage: (page) => set({ lastPageNumber: page }),
      visitJuz: (juz) => set({ lastJuzNumber: juz }),
      _setAll: (data) => set({ ...data }),
    }),
    { name: "mahfuz-reading-history" },
  ),
);
