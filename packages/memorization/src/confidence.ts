import type { ConfidenceLevel } from "@mahfuz/shared/types";

/**
 * Derive confidence level from SM-2 metrics.
 */
export function deriveConfidence(
  repetition: number,
  easeFactor: number,
  _interval: number,
): ConfidenceLevel {
  if (repetition === 0 && easeFactor < 1.8) return "struggling";
  if (repetition <= 1) return "learning";
  if (repetition <= 3) return "familiar";
  if (repetition <= 5 && easeFactor >= 2.0) return "confident";
  if (repetition >= 6 && easeFactor >= 2.3) return "mastered";
  // Fallback: high rep but low EF
  if (repetition >= 6) return "confident";
  if (repetition >= 4) return "familiar";
  return "learning";
}
