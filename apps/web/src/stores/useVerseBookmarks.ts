import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface VerseBookmark {
  verseKey: string;
  addedAt: number;
}

interface VerseBookmarksState {
  bookmarks: VerseBookmark[];
  addBookmark: (verseKey: string) => void;
  removeBookmark: (verseKey: string) => void;
  isBookmarked: (verseKey: string) => boolean;
  toggleBookmark: (verseKey: string) => boolean;
}

export const useVerseBookmarks = create<VerseBookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (verseKey) => {
        const { bookmarks } = get();
        if (bookmarks.some((b) => b.verseKey === verseKey)) return;
        set({ bookmarks: [...bookmarks, { verseKey, addedAt: Date.now() }] });
      },
      removeBookmark: (verseKey) => {
        set({ bookmarks: get().bookmarks.filter((b) => b.verseKey !== verseKey) });
      },
      isBookmarked: (verseKey) => get().bookmarks.some((b) => b.verseKey === verseKey),
      toggleBookmark: (verseKey) => {
        const { bookmarks } = get();
        const exists = bookmarks.some((b) => b.verseKey === verseKey);
        if (exists) {
          set({ bookmarks: bookmarks.filter((b) => b.verseKey !== verseKey) });
          return false;
        }
        set({ bookmarks: [...bookmarks, { verseKey, addedAt: Date.now() }] });
        return true;
      },
    }),
    { name: "mahfuz-verse-bookmarks" },
  ),
);
