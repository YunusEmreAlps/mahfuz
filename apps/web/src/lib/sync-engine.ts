import { memorizationRepository } from "@mahfuz/db";
import { db } from "@mahfuz/db";
import type { ConfidenceLevel, QualityGrade, VerseKey } from "@mahfuz/shared/types";
import { pushChanges, pullChanges } from "./sync-server-fns";
import { getSyncTimestamp, setSyncTimestamp } from "./sync-metadata";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { useReadingList } from "~/stores/useReadingList";
import type { ReadingListItem } from "~/stores/useReadingList";
import { useReadingHistory } from "~/stores/useReadingHistory";

type SyncStatus = "idle" | "syncing" | "error";

/** Keys to exclude from preferences sync (device-specific or setters) */
const PREFS_EXCLUDE_KEYS = new Set([
  "sidebarCollapsed",
  "hasSeenOnboarding",
  // All setter functions (v2 createPreferenceStore names)
  "setArabicFont", "setViewMode", "setTheme", "toggleTranslation",
  "setSelectedTranslations", "setColorizeWords", "setColorPalette",
  "setNormalShowTranslation", "setNormalShowWordHover",
  "setWbwShowTranslation", "setWbwShowWordTranslation",
  "setWbwShowWordTransliteration", "setWordTranslationSize",
  "setWordTransliterationSize", "setWbwTransliterationFirst",
  "setNormalArabicFontSize", "setNormalTranslationFontSize",
  "setWbwArabicFontSize", "setMushafArabicFontSize",
  "setTextType", "setShowLearnTab", "setShowMemorizeTab",
  "setSidebarCollapsed", "setHasSeenOnboarding",
]);

function getPrefsData(): Record<string, unknown> {
  const state = usePreferencesStore.getState();
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (!PREFS_EXCLUDE_KEYS.has(key) && typeof value !== "function") {
      data[key] = value;
    }
  }
  return data;
}

export class SyncEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private userId: string;
  private lastSyncAt: number;
  private onStatusChange: (status: SyncStatus, error?: string) => void;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(
    userId: string,
    lastSyncAt: number,
    onStatusChange: (status: SyncStatus, error?: string) => void,
  ) {
    this.userId = userId;
    this.lastSyncAt = lastSyncAt;
    this.onStatusChange = onStatusChange;
  }

  start() {
    // Sync every 5 minutes
    this.intervalId = setInterval(() => this.sync(), 5 * 60 * 1000);

    // Sync on visibility change (tab becomes visible)
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibility);
    }

    // Initial sync
    this.sync();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibility);
    }
  }

  private handleVisibility = () => {
    if (document.visibilityState === "visible") {
      this.sync();
    }
  };

  async sync(): Promise<void> {
    this.onStatusChange("syncing");

    try {
      // ── Push phase ──
      const pending = await memorizationRepository.getPendingSyncRecords();

      // Build push payload from sync queue
      const cards: any[] = [];
      const reviews: any[] = [];
      let goals: any = undefined;
      const lessonProgressItems: any[] = [];
      const learnConcepts: any[] = [];
      const questProgressItems: any[] = [];

      for (const record of pending) {
        const data = JSON.parse(record.data);
        switch (record.table) {
          case "memorization_cards":
            cards.push(data);
            break;
          case "review_entries":
            reviews.push(data);
            break;
          case "memorization_goals":
            goals = data;
            break;
          case "lesson_progress":
            lessonProgressItems.push(data);
            break;
          case "learn_concepts":
            learnConcepts.push(data);
            break;
          case "quest_progress":
            questProgressItems.push(data);
            break;
        }
      }

      // Read sync timestamps from centralized metadata
      const prefsSyncTs = getSyncTimestamp("preferences");
      const readingListSyncTs = getSyncTimestamp("readingList");
      const readingHistorySyncTs = getSyncTimestamp("readingHistory");

      // Read Zustand store state for non-queue data
      const readingListState = useReadingList.getState();
      const readingHistoryState = useReadingHistory.getState();

      // Build preferences payload
      const prefsData = getPrefsData();
      const preferencesPayload =
        prefsSyncTs > 0
          ? { data: JSON.stringify(prefsData), updatedAt: prefsSyncTs }
          : undefined;

      // Build reading list payload
      const readingListPayload =
        readingListSyncTs > 0
          ? readingListState.items.map((item) => ({
              id: `${this.userId}-${item.type}-${item.id}`,
              type: item.type,
              itemId: item.id,
              addedAt: item.addedAt,
              lastReadAt: item.lastReadAt,
              deleted: false,
              updatedAt: readingListSyncTs,
            }))
          : undefined;

      // Build reading history payload
      const readingHistoryPayload =
        readingHistorySyncTs > 0
          ? {
              lastSurahId: readingHistoryState.lastSurahId,
              lastSurahName: readingHistoryState.lastSurahName,
              lastPageNumber: readingHistoryState.lastPageNumber,
              lastJuzNumber: readingHistoryState.lastJuzNumber,
              updatedAt: readingHistorySyncTs,
            }
          : undefined;

      // Push everything
      const hasPendingQueue = pending.length > 0;
      const hasStoreData =
        preferencesPayload || readingListPayload || readingHistoryPayload;

      if (hasPendingQueue || hasStoreData) {
        await pushChanges({
          data: {
            cards,
            reviews,
            goals,
            lessonProgressItems:
              lessonProgressItems.length > 0 ? lessonProgressItems : undefined,
            learnConcepts:
              learnConcepts.length > 0 ? learnConcepts : undefined,
            questProgressItems:
              questProgressItems.length > 0 ? questProgressItems : undefined,
            preferences: preferencesPayload,
            readingListItems: readingListPayload,
            readingHistoryData: readingHistoryPayload,
          },
        });
      }

      // Mark sync queue records as synced
      if (pending.length > 0) {
        await memorizationRepository.markSynced(pending.map((r) => r.id));
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        await memorizationRepository.clearSyncedRecords(sevenDaysAgo);
      }

      // ── Pull phase ──
      const pulled = await pullChanges({ data: { since: this.lastSyncAt } });

      // Merge memorization cards (LWW)
      for (const serverCard of pulled.cards) {
        const localCard = await db.memorization_cards
          .where("[userId+verseKey]")
          .equals([this.userId, serverCard.verseKey])
          .first();

        if (!localCard || serverCard.updatedAt > localCard.updatedAt) {
          await db.memorization_cards.put({
            id: serverCard.id,
            userId: this.userId,
            verseKey: serverCard.verseKey as VerseKey,
            easeFactor: serverCard.easeFactor,
            repetition: serverCard.repetition,
            interval: serverCard.interval,
            nextReviewDate: serverCard.nextReviewDate,
            confidence: serverCard.confidence as ConfidenceLevel,
            totalReviews: serverCard.totalReviews,
            correctReviews: serverCard.correctReviews,
            createdAt: serverCard.createdAt,
            updatedAt: serverCard.updatedAt,
          });
        }
      }

      // Merge reviews (append-only)
      for (const serverReview of pulled.reviews) {
        const exists = await db.review_entries.get(serverReview.id);
        if (!exists) {
          await db.review_entries.add({
            id: serverReview.id,
            userId: this.userId,
            cardId: serverReview.cardId,
            verseKey: serverReview.verseKey as VerseKey,
            grade: serverReview.grade as QualityGrade,
            previousEaseFactor: serverReview.previousEaseFactor,
            newEaseFactor: serverReview.newEaseFactor,
            previousInterval: serverReview.previousInterval,
            newInterval: serverReview.newInterval,
            reviewedAt: serverReview.reviewedAt,
          });
        }
      }

      // Merge badges (append-only)
      for (const badge of pulled.badges) {
        await memorizationRepository.addBadge(this.userId, badge.badgeId);
      }

      // Merge lesson progress (LWW)
      for (const serverLP of pulled.lessonProgressItems) {
        const localLP = await db.lesson_progress
          .where("id")
          .equals(serverLP.id)
          .first();

        if (!localLP || serverLP.updatedAt > (localLP.updatedAt || 0)) {
          await db.lesson_progress.put({
            id: serverLP.id,
            userId: this.userId,
            stageId: serverLP.stageId,
            lessonId: serverLP.lessonId,
            status: serverLP.status as "not_started" | "in_progress" | "completed",
            score: serverLP.score,
            sevapPointEarned: serverLP.sevapPointEarned,
            completedAt: serverLP.completedAt,
            updatedAt: serverLP.updatedAt,
          });
        }
      }

      // Merge learn concepts (LWW)
      for (const serverLC of pulled.learnConcepts) {
        const localLC = await db.learn_concepts
          .where("id")
          .equals(serverLC.id)
          .first();

        if (!localLC || serverLC.updatedAt > (localLC.updatedAt || 0)) {
          await db.learn_concepts.put({
            id: serverLC.id,
            userId: this.userId,
            conceptId: serverLC.conceptId,
            correctCount: serverLC.correctCount,
            incorrectCount: serverLC.incorrectCount,
            masteryLevel: serverLC.masteryLevel as 0 | 1 | 2 | 3,
            nextReviewAt: serverLC.nextReviewAt,
            updatedAt: serverLC.updatedAt,
          });
        }
      }

      // Merge quest progress (LWW + wordsCorrect union)
      for (const serverQP of pulled.questProgressItems) {
        const localQP = await db.quest_progress
          .where("id")
          .equals(serverQP.id)
          .first();

        const serverWords: string[] =
          typeof serverQP.wordsCorrect === "string"
            ? JSON.parse(serverQP.wordsCorrect)
            : serverQP.wordsCorrect;

        if (!localQP || serverQP.updatedAt > (localQP.updatedAt || 0)) {
          // Union wordsCorrect
          const mergedWords = localQP
            ? Array.from(new Set([...localQP.wordsCorrect, ...serverWords]))
            : serverWords;

          await db.quest_progress.put({
            id: serverQP.id,
            userId: this.userId,
            questId: serverQP.questId,
            wordsCorrect: mergedWords,
            totalAttempts: serverQP.totalAttempts,
            totalCorrect: serverQP.totalCorrect,
            sessionsCompleted: serverQP.sessionsCompleted,
            bestSessionScore: serverQP.bestSessionScore,
            lastPlayedAt: serverQP.lastPlayedAt,
            updatedAt: serverQP.updatedAt,
          });
        }
      }

      // Merge preferences (LWW)
      if (pulled.preferences) {
        const localUpdatedAt = getSyncTimestamp("preferences");
        if (pulled.preferences.updatedAt > localUpdatedAt) {
          const serverPrefs = JSON.parse(pulled.preferences.data);
          setSyncTimestamp("preferences", pulled.preferences.updatedAt);
          usePreferencesStore.setState({
            ...serverPrefs,
          });
        }
      }

      // Merge reading list (LWW per item + soft delete)
      if (pulled.readingListItems.length > 0) {
        const currentItems = useReadingList.getState().items;
        const itemMap = new Map<string, ReadingListItem>();
        for (const item of currentItems) {
          itemMap.set(`${item.type}-${item.id}`, item);
        }

        let changed = false;
        for (const serverItem of pulled.readingListItems) {
          const key = `${serverItem.type}-${serverItem.itemId}`;
          const local = itemMap.get(key);

          if (serverItem.deleted === 1) {
            if (local) {
              itemMap.delete(key);
              changed = true;
            }
          } else if (!local || serverItem.updatedAt > (local.lastReadAt ?? local.addedAt)) {
            itemMap.set(key, {
              type: serverItem.type as ReadingListItem["type"],
              id: serverItem.itemId,
              addedAt: serverItem.addedAt,
              lastReadAt: serverItem.lastReadAt,
            });
            changed = true;
          }
        }

        if (changed) {
          const maxUpdatedAt = Math.max(
            ...pulled.readingListItems.map((i) => i.updatedAt),
          );
          setSyncTimestamp("readingList", maxUpdatedAt);
          useReadingList.getState()._setItems(
            Array.from(itemMap.values()),
            maxUpdatedAt,
          );
        }
      }

      // Merge reading history (LWW)
      if (pulled.readingHistoryData) {
        const localUpdatedAt = getSyncTimestamp("readingHistory");
        if (pulled.readingHistoryData.updatedAt > localUpdatedAt) {
          setSyncTimestamp("readingHistory", pulled.readingHistoryData.updatedAt);
          useReadingHistory.getState()._setAll(
            {
              lastSurahId: pulled.readingHistoryData.lastSurahId,
              lastSurahName: pulled.readingHistoryData.lastSurahName,
              lastPageNumber: pulled.readingHistoryData.lastPageNumber,
              lastJuzNumber: pulled.readingHistoryData.lastJuzNumber,
            },
            pulled.readingHistoryData.updatedAt,
          );
        }
      }

      this.lastSyncAt = Date.now();
      this.retryCount = 0;
      this.onStatusChange("idle");
    } catch (err) {
      this.retryCount++;
      const message =
        err instanceof Error ? err.message : "Sync failed";
      console.error("[SyncEngine]", message);

      if (this.retryCount >= this.maxRetries) {
        this.onStatusChange("error", "sync_failed");
      } else {
        // Will retry on next interval
        this.onStatusChange("idle");
      }
    }
  }

  getLastSyncAt(): number {
    return this.lastSyncAt;
  }
}
