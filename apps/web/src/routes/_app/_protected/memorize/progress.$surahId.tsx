import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { chapterQueryOptions } from "~/hooks/useChapters";
import { useSurahProgress } from "~/hooks/useMemorization";
import { ProgressHeatmap } from "~/components/memorization";

export const Route = createFileRoute(
  "/_app/_protected/memorize/progress/$surahId",
)({
  component: ProgressPage,
});

function ProgressPage() {
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const { surahId } = Route.useParams();
  const surahNum = Number(surahId);
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-fade-in">
      <Suspense
        fallback={
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        }
      >
        <ProgressContent userId={userId} surahId={surahNum} />
      </Suspense>
    </div>
  );
}

function ProgressContent({
  userId,
  surahId,
}: {
  userId: string;
  surahId: number;
}) {
  const { data: chapter } = useSuspenseQuery(chapterQueryOptions(surahId));
  const { progressMap, isLoading } = useSurahProgress(userId, surahId);

  const cardCount = progressMap.size;
  const dueCount = Array.from(progressMap.values()).filter(
    (v) => v.nextReview.getTime() <= Date.now(),
  ).length;

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/memorize"
          className="mb-2 inline-block text-[13px] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
        >
          &larr; Ezberleme
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--theme-text)]">
              {chapter.name_simple}
            </h1>
            <p className="text-[14px] text-[var(--theme-text-tertiary)]">
              {cardCount} / {chapter.verses_count} ayet eklendi
            </p>
          </div>
          <div className="flex gap-2">
            {dueCount > 0 && (
              <Link
                to="/memorize/review"
                search={{ surahId }}
                className="rounded-xl bg-primary-600 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-primary-700"
              >
                Tekrar ({dueCount})
              </Link>
            )}
            <Link
              to="/memorize/add/$surahId"
              params={{ surahId: String(surahId) }}
              className="rounded-xl bg-[var(--theme-hover-bg)] px-4 py-2 text-[13px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-pill-bg)]"
            >
              Ayet Ekle
            </Link>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : (
        <ProgressHeatmap
          surahId={surahId}
          versesCount={chapter.verses_count}
          progressMap={progressMap}
        />
      )}
    </>
  );
}
