import type { VerseKey } from "@mahfuz/shared/types";
import {
  db,
  type MemorizationCardEntry,
  type ReviewEntryRecord,
  type MemorizationGoalsEntry,
  type SyncQueueRecord,
  type UserBadgeEntry,
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
    await db.transaction("rw", db.memorization_cards, db.sync_queue, async () => {
      await db.memorization_cards.put(card);
      await this.enqueueSync("memorization_cards", card.id, "upsert", card);
    });
  }

  /** Bulk create cards */
  async createCards(cards: MemorizationCardEntry[]): Promise<void> {
    await db.transaction("rw", db.memorization_cards, db.sync_queue, async () => {
      await db.memorization_cards.bulkPut(cards);
      for (const card of cards) {
        await this.enqueueSync("memorization_cards", card.id, "upsert", card);
      }
    });
  }

  /** Remove duplicate cards — keep the one with most reviews per verseKey */
  async deduplicateCards(userId: string): Promise<number> {
    const all = await this.getAllCards(userId);
    const byKey = new Map<string, MemorizationCardEntry[]>();
    for (const card of all) {
      const group = byKey.get(card.verseKey) || [];
      group.push(card);
      byKey.set(card.verseKey, group);
    }
    const toDelete: string[] = [];
    for (const group of byKey.values()) {
      if (group.length <= 1) continue;
      // Keep the card with most reviews (or latest updatedAt as tiebreaker)
      group.sort(
        (a, b) =>
          b.totalReviews - a.totalReviews || b.updatedAt - a.updatedAt,
      );
      for (let i = 1; i < group.length; i++) {
        toDelete.push(group[i].id);
      }
    }
    if (toDelete.length > 0) {
      await db.memorization_cards.bulkDelete(toDelete);
    }
    return toDelete.length;
  }

  /** Add a review entry */
  async addReview(entry: ReviewEntryRecord): Promise<void> {
    await db.transaction("rw", db.review_entries, db.sync_queue, async () => {
      await db.review_entries.add(entry);
      await this.enqueueSync("review_entries", entry.id, "upsert", entry);
    });
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
    await db.transaction("rw", db.memorization_goals, db.sync_queue, async () => {
      await db.memorization_goals.put(goals);
      await this.enqueueSync("memorization_goals", goals.userId, "upsert", goals);
    });
  }

  // ── Badge methods ──

  /** Get all unlocked badges for a user */
  async getUnlockedBadges(userId: string): Promise<UserBadgeEntry[]> {
    return db.user_badges
      .where("userId")
      .equals(userId)
      .toArray();
  }

  /** Add a badge for a user */
  async addBadge(userId: string, badgeId: string): Promise<void> {
    const existing = await db.user_badges
      .where("[userId+badgeId]")
      .equals([userId, badgeId])
      .first();
    if (existing) return; // Already unlocked

    const entry: UserBadgeEntry = {
      id: crypto.randomUUID(),
      userId,
      badgeId,
      unlockedAt: Date.now(),
    };
    await db.user_badges.add(entry);
  }

  // ── Sync queue helpers ──

  private async enqueueSync(
    table: SyncQueueRecord["table"],
    recordId: string,
    action: SyncQueueRecord["action"],
    data: unknown,
  ): Promise<void> {
    const record: SyncQueueRecord = {
      id: crypto.randomUUID(),
      table,
      recordId,
      action,
      data: JSON.stringify(data),
      synced: 0,
      createdAt: Date.now(),
    };
    await db.sync_queue.add(record);
  }

  /** Get pending sync queue records */
  async getPendingSyncRecords(): Promise<SyncQueueRecord[]> {
    return db.sync_queue
      .where("[table+synced]")
      .between([Dexie.minKey, 0], [Dexie.maxKey, 0], true, true)
      .toArray();
  }

  /** Mark sync records as synced */
  async markSynced(ids: string[]): Promise<void> {
    await db.sync_queue
      .where("id")
      .anyOf(ids)
      .modify({ synced: 1 });
  }

  /** Clear synced records older than given timestamp */
  async clearSyncedRecords(olderThan: number): Promise<void> {
    await db.sync_queue
      .where("createdAt")
      .below(olderThan)
      .and((r) => r.synced === 1)
      .delete();
  }

  /** Bulk mark all verses of a surah as mastered */
  async bulkMasterSurah(
    userId: string,
    surahId: number,
    verseCount: number,
  ): Promise<void> {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    await db.transaction("rw", db.memorization_cards, db.sync_queue, async () => {
      for (let v = 1; v <= verseCount; v++) {
        const verseKey = `${surahId}:${v}` as VerseKey;
        const existing = await db.memorization_cards
          .where("[userId+verseKey]")
          .equals([userId, verseKey])
          .first();

        const card: MemorizationCardEntry = {
          id: existing?.id || crypto.randomUUID(),
          userId,
          verseKey,
          easeFactor: 2.5,
          repetition: 7,
          interval: 30,
          nextReviewDate: now + thirtyDaysMs,
          confidence: "mastered" as const,
          totalReviews: existing?.totalReviews || 0,
          correctReviews: existing?.correctReviews || 0,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };
        await db.memorization_cards.put(card);
        await this.enqueueSync("memorization_cards", card.id, "upsert", card);
      }
    });
  }
}

// Need Dexie import for minKey/maxKey
import Dexie from "dexie";

export const memorizationRepository = new MemorizationRepository();
