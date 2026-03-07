import Dexie, { type EntityTable } from "dexie";
import type { ConfidenceLevel, QualityGrade, VerseKey } from "@mahfuz/shared/types";

/** Generic cache entry stored in IndexedDB */
export interface CacheEntry {
  key: string;
  data: string;
  cachedAt: number;
}

/** Memorization card stored in IndexedDB (dates as epoch ms) */
export interface MemorizationCardEntry {
  id: string;
  userId: string;
  verseKey: VerseKey;
  easeFactor: number;
  repetition: number;
  interval: number;
  nextReviewDate: number; // epoch ms
  confidence: ConfidenceLevel;
  totalReviews: number;
  correctReviews: number;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/** Review entry stored in IndexedDB */
export interface ReviewEntryRecord {
  id: string;
  userId: string;
  cardId: string;
  verseKey: VerseKey;
  grade: QualityGrade;
  previousEaseFactor: number;
  newEaseFactor: number;
  previousInterval: number;
  newInterval: number;
  reviewedAt: number; // epoch ms
}

/** Daily memorization goals stored in IndexedDB */
export interface MemorizationGoalsEntry {
  userId: string;
  newCardsPerDay: number;
  reviewCardsPerDay: number;
}

/** Dexie database for Mahfuz offline cache + memorization */
export class MahfuzDB extends Dexie {
  cache!: EntityTable<CacheEntry, "key">;
  memorization_cards!: EntityTable<MemorizationCardEntry, "id">;
  review_entries!: EntityTable<ReviewEntryRecord, "id">;
  memorization_goals!: EntityTable<MemorizationGoalsEntry, "userId">;

  constructor() {
    super("mahfuz-cache");

    this.version(1).stores({
      cache: "key",
    });

    this.version(2).stores({
      cache: "key",
      memorization_cards:
        "id, [userId+verseKey], [userId+nextReviewDate], [userId+confidence]",
      review_entries: "id, cardId, [userId+reviewedAt]",
      memorization_goals: "userId",
    });
  }
}

export const db = new MahfuzDB();
