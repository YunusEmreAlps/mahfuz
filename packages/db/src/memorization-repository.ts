import type { VerseKey } from "@mahfuz/shared/types";
import {
  db,
  type MemorizationCardEntry,
  type ReviewEntryRecord,
  type MemorizationGoalsEntry,
} from "./schema";

export class MemorizationRepository {
  /** Get a single card by userId + verseKey */
  async getCard(
    userId: string,
    verseKey: VerseKey,
  ): Promise<MemorizationCardEntry | undefined> {
    return db.memorization_cards
      .where("[userId+verseKey]")
      .equals([userId, verseKey])
      .first();
  }

  /** Get all cards due for review (nextReviewDate <= now) */
  async getDueCards(
    userId: string,
    now: number,
    limit: number,
  ): Promise<MemorizationCardEntry[]> {
    return db.memorization_cards
      .where("[userId+nextReviewDate]")
      .between([userId, Dexie.minKey], [userId, now], true, true)
      .limit(limit)
      .sortBy("nextReviewDate");
  }

  /** Get all cards for a surah */
  async getCardsBySurah(
    userId: string,
    surahId: number,
  ): Promise<MemorizationCardEntry[]> {
    // Filter by verseKey prefix since compound index doesn't cover surah
    const all = await db.memorization_cards
      .where("[userId+verseKey]")
      .between(
        [userId, `${surahId}:1`],
        [userId, `${surahId}:\uffff`],
        true,
        true,
      )
      .toArray();
    return all;
  }

  /** Get all cards for a user */
  async getAllCards(userId: string): Promise<MemorizationCardEntry[]> {
    return db.memorization_cards
      .where("[userId+verseKey]")
      .between([userId, Dexie.minKey], [userId, Dexie.maxKey])
      .toArray();
  }

  /** Upsert a single card */
  async upsertCard(card: MemorizationCardEntry): Promise<void> {
    await db.memorization_cards.put(card);
  }

  /** Bulk create cards */
  async createCards(cards: MemorizationCardEntry[]): Promise<void> {
    await db.memorization_cards.bulkPut(cards);
  }

  /** Add a review entry */
  async addReview(entry: ReviewEntryRecord): Promise<void> {
    await db.review_entries.add(entry);
  }

  /** Get reviews for today (reviewedAt >= todayStart) */
  async getReviewsToday(
    userId: string,
    todayStart: number,
  ): Promise<ReviewEntryRecord[]> {
    return db.review_entries
      .where("[userId+reviewedAt]")
      .between([userId, todayStart], [userId, Dexie.maxKey], true, true)
      .toArray();
  }

  /** Get all review dates (epoch ms) for streak calculation */
  async getReviewDates(userId: string): Promise<number[]> {
    const entries = await db.review_entries
      .where("[userId+reviewedAt]")
      .between([userId, Dexie.minKey], [userId, Dexie.maxKey])
      .toArray();
    return entries.map((e) => e.reviewedAt);
  }

  /** Get memorization goals for a user */
  async getGoals(
    userId: string,
  ): Promise<MemorizationGoalsEntry | undefined> {
    return db.memorization_goals.get(userId);
  }

  /** Set memorization goals */
  async setGoals(goals: MemorizationGoalsEntry): Promise<void> {
    await db.memorization_goals.put(goals);
  }
}

// Need Dexie import for minKey/maxKey
import Dexie from "dexie";

export const memorizationRepository = new MemorizationRepository();
