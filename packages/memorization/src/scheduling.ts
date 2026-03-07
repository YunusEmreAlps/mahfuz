import type { MemorizationCard, VerseKey } from "@mahfuz/shared/types";

/**
 * Get cards due for review, sorted most-overdue-first.
 */
export function getCardsForReview(
  cards: MemorizationCard[],
  limit: number,
  now: Date = new Date(),
): MemorizationCard[] {
  const nowMs = now.getTime();

  return cards
    .filter((c) => c.nextReviewDate.getTime() <= nowMs)
    .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime())
    .slice(0, limit);
}

/**
 * Get verse keys for a surah that don't have cards yet.
 */
export function getNewVerseKeys(
  existingCards: MemorizationCard[],
  surahId: number,
  totalVerses: number,
  limit: number,
): VerseKey[] {
  const existing = new Set(existingCards.map((c) => c.verseKey));
  const newKeys: VerseKey[] = [];

  for (let i = 1; i <= totalVerses && newKeys.length < limit; i++) {
    const key = `${surahId}:${i}` as VerseKey;
    if (!existing.has(key)) {
      newKeys.push(key);
    }
  }

  return newKeys;
}
