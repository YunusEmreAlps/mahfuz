import type {
  MemorizationCard,
  QualityGrade,
  ConfidenceLevel,
} from "@mahfuz/shared/types";
import { SM2_DEFAULTS } from "@mahfuz/shared/constants";
import { deriveConfidence } from "./confidence";

export interface SM2Result {
  easeFactor: number;
  repetition: number;
  interval: number;
  nextReviewDate: Date;
  confidence: ConfidenceLevel;
}

/**
 * SM-2 spaced repetition algorithm.
 * Pure function — no side effects.
 */
export function calculateSM2(
  card: Pick<MemorizationCard, "easeFactor" | "repetition" | "interval">,
  grade: QualityGrade,
  now: Date = new Date(),
): SM2Result {
  let { easeFactor, repetition, interval } = card;

  if (grade < SM2_DEFAULTS.PASSING_GRADE) {
    // Failed — reset repetition, start from 1 day
    repetition = 0;
    interval = SM2_DEFAULTS.INITIAL_INTERVAL;
  } else {
    // Passed
    if (repetition === 0) {
      interval = SM2_DEFAULTS.INITIAL_INTERVAL;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  }

  // Update ease factor
  const g = grade;
  easeFactor = easeFactor + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02));
  easeFactor = Math.max(easeFactor, SM2_DEFAULTS.MINIMUM_EASE_FACTOR);

  // Next review date
  const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  const confidence = deriveConfidence(repetition, easeFactor, interval);

  return { easeFactor, repetition, interval, nextReviewDate, confidence };
}
