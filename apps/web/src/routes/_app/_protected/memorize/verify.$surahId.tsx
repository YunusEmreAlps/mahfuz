import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { chapterQueryOptions } from "~/hooks/useChapters";
import { useReviewSession, useMemorizationDashboard } from "~/hooks/useMemorization";
import { FillBlankCard } from "~/components/memorization";
import { VerificationResults } from "~/components/memorization/VerificationResults";
import { memorizationRepository } from "@mahfuz/db";
import type { MemorizationCard, ConfidenceLevel, VerseKey } from "@mahfuz/shared/types";
import { SM2_DEFAULTS } from "@mahfuz/shared/constants";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute(
  "/_app/_protected/memorize/verify/$surahId",
)({
  component: VerifyPage,
});

function VerifyPage() {
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const { surahId: surahIdStr } = Route.useParams();
  const surahId = Number(surahIdStr);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: chapter } = useSuspenseQuery(chapterQueryOptions(surahId));
  const { refreshStats } = useMemorizationDashboard(userId);

  const {
    phase,
    sessionCards,
    currentCardIndex,
    sessionResults,
    resetSession,
  } = useReviewSession(userId);

  const [verified, setVerified] = useState(false);
  const [passed, setPassed] = useState(false);

  // Build verification cards: random subset of surah verses
  const startVerification = useCallback(async () => {
    if (!userId || !chapter) return;

    const versesCount = chapter.verses_count;
    const testCount = Math.min(10, Math.ceil(versesCount * 0.15));

    // Generate random verse indices
    const allIndices = Array.from({ length: versesCount }, (_, i) => i + 1);
    // Shuffle and pick
    for (let i = allIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }
    const selectedVerses = allIndices.slice(0, testCount).sort((a, b) => a - b);

    const now = Date.now();
    const cards: MemorizationCard[] = selectedVerses.map((num) => ({
      id: crypto.randomUUID(),
      userId,
      verseKey: `${surahId}:${num}` as VerseKey,
      easeFactor: SM2_DEFAULTS.INITIAL_EASE_FACTOR,
      repetition: 0,
      interval: 0,
      nextReviewDate: new Date(now),
      confidence: "learning" as ConfidenceLevel,
      totalReviews: 0,
      correctReviews: 0,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }));

    // Use store's startSession directly with verification type
    const { useMemorizationStore } = await import(
      "~/stores/useMemorizationStore"
    );
    useMemorizationStore.getState().startSession(cards, "verification");
  }, [userId, chapter, surahId]);

  // Reset any leftover session and start fresh on mount / surahId change
  useEffect(() => {
    resetSession();
  }, [surahId, resetSession]);

  // Start verification once session is idle
  useEffect(() => {
    if (phase === "idle") {
      startVerification();
    }
  }, [phase, startVerification]);

  const currentCard = sessionCards[currentCardIndex];

  const handleGrade = async (grade: 0 | 1 | 2 | 3 | 4 | 5) => {
    // In verification mode, we don't persist to DB (these are test cards)
    // Just record the grade in session results
    const { useMemorizationStore } = await import(
      "~/stores/useMemorizationStore"
    );
    useMemorizationStore.getState().gradeCard(grade);
    useMemorizationStore.getState().nextCard();
  };

  // Process results when phase becomes "results"
  useEffect(() => {
    if (phase === "results" && !verified && sessionResults.length > 0) {
      const avgGrade =
        sessionResults.reduce((sum, r) => sum + r.grade, 0) /
        sessionResults.length;
      const didPass = avgGrade >= 3;
      setPassed(didPass);
      setVerified(true);

      if (didPass && chapter) {
        // Mark all surah verses as mastered
        memorizationRepository.bulkMasterSurah(
          userId,
          surahId,
          chapter.verses_count,
        );
      }
    }
  }, [phase, verified, sessionResults, userId, surahId, chapter]);

  const handleContinue = () => {
    resetSession();
    refreshStats();
    navigate({ to: "/memorize" });
  };

  // Verification results
  if (phase === "results" && verified) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
        <VerificationResults
          results={sessionResults}
          passed={passed}
          surahName={chapter?.name_simple || ""}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  // Loading
  if (phase === "idle" || !currentCard) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={handleContinue}
            className="text-[13px] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
          >
            {t.common.close}
          </button>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-medium text-emerald-700">
            {t.memorize.verification.label}
          </span>
          <span className="text-[13px] tabular-nums text-[var(--theme-text-tertiary)]">
            {currentCardIndex + 1} / {sessionCards.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${((currentCardIndex + 1) / sessionCards.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div key={currentCard.id} className="animate-fade-in">
        <FillBlankCard
          card={currentCard}
          onGrade={handleGrade}
        />
      </div>
    </div>
  );
}
