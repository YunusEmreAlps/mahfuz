import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useReviewSession, useMemorizationDashboard } from "~/hooks/useMemorization";
import { ReviewCard, SessionResults } from "~/components/memorization";
import { useTranslation } from "~/hooks/useTranslation";

interface PracticeSearch {
  surahId?: number;
}

export const Route = createFileRoute("/_app/_protected/memorize/practice")({
  component: PracticePage,
  validateSearch: (search: Record<string, unknown>): PracticeSearch => ({
    surahId: search.surahId ? Number(search.surahId) : undefined,
  }),
});

function PracticePage() {
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const { surahId } = Route.useSearch();
  const navigate = useNavigate();

  const {
    phase,
    sessionCards,
    currentCardIndex,
    sessionResults,
    revealedWords,
    totalWords,
    startReview,
    gradeCurrentCard,
    nextCard,
    revealNextWord,
    revealAll,
    setRevealState,
    resetSession,
  } = useReviewSession(userId);

  const { refreshStats } = useMemorizationDashboard(userId);
  const { t } = useTranslation();

  // Reset stale session on mount or surahId change
  useEffect(() => {
    resetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahId]);

  // Auto-start practice session after reset
  useEffect(() => {
    if (phase === "idle" && surahId) {
      startReview(surahId, "practice");
    }
  }, [phase, surahId, startReview]);

  const currentCard = sessionCards[currentCardIndex];

  const handleGrade = async (grade: 0 | 1 | 2 | 3 | 4 | 5) => {
    await gradeCurrentCard(grade);
    nextCard();
  };

  const handleContinue = () => {
    resetSession();
    refreshStats();
    navigate({ to: "/memorize" });
  };

  // Results screen
  if (phase === "results") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
        <SessionResults results={sessionResults} onContinue={handleContinue} />
      </div>
    );
  }

  // Empty state — no cards for this surah
  if (phase === "reviewing" && !currentCard) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="animate-scale-in rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
          <p className="mb-2 text-lg font-semibold text-[var(--theme-text)]">
            {t.memorize.practice.noCards}
          </p>
          <p className="mb-6 text-[var(--theme-text-tertiary)]">
            {t.memorize.practice.noCardsDesc}
          </p>
          <button
            onClick={() => navigate({ to: "/memorize" })}
            className="rounded-xl bg-primary-600 px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-primary-700"
          >
            {t.memorize.backToPanel}
          </button>
        </div>
      </div>
    );
  }

  // Loading state
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
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-medium text-amber-700">
            {t.memorize.practice.label}
          </span>
          <span className="text-[13px] tabular-nums text-[var(--theme-text-tertiary)]">
            {currentCardIndex + 1} / {sessionCards.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{
              width: `${((currentCardIndex + 1) / sessionCards.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div key={currentCard.id} className="animate-fade-in">
        <ReviewCard
          card={currentCard}
          revealedWords={revealedWords}
          totalWords={totalWords}
          onRevealNext={revealNextWord}
          onRevealAll={revealAll}
          onGrade={handleGrade}
          onSetRevealState={setRevealState}
        />
      </div>
    </div>
  );
}
