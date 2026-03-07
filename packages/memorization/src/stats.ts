import type {
  MemorizationCard,
  MemorizationStats,
  ConfidenceLevel,
} from "@mahfuz/shared/types";

const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  "struggling",
  "learning",
  "familiar",
  "confident",
  "mastered",
];

/**
 * Compute memorization stats from cards and review data.
 */
export function computeStats(
  cards: MemorizationCard[],
  reviewedToday: number,
  streak: number,
  now: Date = new Date(),
): MemorizationStats {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const byConfidence = Object.fromEntries(
    CONFIDENCE_LEVELS.map((c) => [c, 0]),
  ) as Record<ConfidenceLevel, number>;

  let dueToday = 0;
  let totalCorrect = 0;
  let totalReviews = 0;

  for (const card of cards) {
    byConfidence[card.confidence] = (byConfidence[card.confidence] || 0) + 1;
    totalCorrect += card.correctReviews;
    totalReviews += card.totalReviews;

    if (card.nextReviewDate.getTime() <= now.getTime()) {
      dueToday++;
    }
  }

  // Count cards created today as "new today"
  const newToday = cards.filter((c) => c.createdAt.getTime() >= todayStart).length;

  const averageAccuracy = totalReviews > 0 ? totalCorrect / totalReviews : 0;

  return {
    totalCards: cards.length,
    dueToday,
    newToday,
    reviewedToday,
    byConfidence,
    averageAccuracy,
    currentStreak: streak,
  };
}

/**
 * Compute consecutive-day streak from review dates.
 * Expects sorted epoch-ms timestamps (one per review).
 * Returns number of consecutive days ending at today.
 */
export function computeStreak(reviewDates: number[], now: Date = new Date()): number {
  if (reviewDates.length === 0) return 0;

  // Build a set of unique date strings
  const daySet = new Set<string>();
  for (const ts of reviewDates) {
    const d = new Date(ts);
    daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  // Walk backwards from today
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (daySet.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
