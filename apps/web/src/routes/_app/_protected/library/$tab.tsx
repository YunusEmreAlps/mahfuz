import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { Suspense, useMemo, useState, useEffect } from "react";
import { CURRICULUM } from "@mahfuz/shared/data/learn/curriculum";
import { SIDE_QUESTS } from "@mahfuz/shared/data/learn/quests";
import { useLearnDashboard, useStageUnlockStatus } from "~/hooks/useLearn";
import { useQuestDashboard } from "~/hooks/useQuest";
import { useMemorizationDashboard } from "~/hooks/useMemorization";
import { StatsOverview, SurahSelector, GoalsSettings } from "~/components/memorization";
import { memorizationRepository, type MemorizationCardEntry } from "@mahfuz/db";
import { LibraryCourseCard } from "~/components/library/LibraryCourseCard";
import { LibraryTrackCard } from "~/components/library/LibraryTrackCard";
import { useTranslation } from "~/hooks/useTranslation";
import { Skeleton } from "~/components/ui/Skeleton";
import { Button } from "~/components/ui/Button";

const VALID_TABS = ["courses", "tracks", "memorize"] as const;
type TabType = (typeof VALID_TABS)[number];

export const Route = createFileRoute("/_app/_protected/library/$tab")({
  beforeLoad: ({ params }) => {
    if (!VALID_TABS.includes(params.tab as TabType)) {
      throw redirect({ to: "/library/courses" });
    }
  },
  component: LibraryPage,
});

function LibraryPage() {
  const { tab } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const currentTab = tab as TabType;

  const TAB_OPTIONS = [
    { value: "courses" as TabType, label: t.library.courses },
    { value: "tracks" as TabType, label: t.library.tracks },
    { value: "memorize" as TabType, label: t.library.memorize },
  ];

  const setTab = (value: TabType) => {
    navigate({
      to: "/library/$tab",
      params: { tab: value },
      replace: true,
    });
  };

  return (
    <div className="mx-auto max-w-[960px] px-5 py-5 sm:px-6 sm:py-10 lg:max-w-[1200px]">
      {/* Header */}
      <h1 className="mb-1 text-2xl font-bold text-[var(--theme-text)]">
        {t.nav.library}
      </h1>
      <p className="mb-5 text-[14px] text-[var(--theme-text-secondary)]">
        {t.library.subtitle}
      </p>

      {/* Tabs — sticky underline style (same as browse) */}
      <div className="sticky top-0 z-10 -mx-5 mb-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-5 sm:-mx-6 sm:mb-6 sm:px-6">
        <nav className="flex gap-0" role="tablist">
          {TAB_OPTIONS.map((opt) => {
            const active = currentTab === opt.value;
            return (
              <button
                key={opt.value}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(opt.value)}
                className={`relative px-4 py-3 text-[14px] font-medium transition-colors ${
                  active
                    ? "text-[var(--theme-text)]"
                    : "text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
                }`}
              >
                {opt.label}
                {active && (
                  <span className="absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-primary-600" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-20" />
            ))}
          </div>
        }
      >
        {currentTab === "courses" && <CoursesTab userId={userId} />}
        {currentTab === "tracks" && <TracksTab userId={userId} />}
        {currentTab === "memorize" && <MemorizeTab userId={userId} />}
      </Suspense>
    </div>
  );
}

// ── Courses Tab ──────────────────────────────────────────────

function CoursesTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { stageProgress, totalSevapPoint, isLoading } = useLearnDashboard(userId);
  const { unlockedStages } = useStageUnlockStatus(userId);

  return (
    <>
      {/* Stats bar */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-primary-600">{totalSevapPoint}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.pointLabel}</p>
        </div>
        <div className="h-8 w-px bg-[var(--theme-border)]" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-[var(--theme-text)]">
            {CURRICULUM.reduce((sum, s) => {
              const sp = stageProgress.get(s.id);
              return sum + (sp?.completed || 0);
            }, 0)}
          </p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.completedLessons}</p>
        </div>
        <div className="h-8 w-px bg-[var(--theme-border)]" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-[var(--theme-text)]">{CURRICULUM.length}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.totalStages}</p>
        </div>
      </div>

      {/* Card grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {CURRICULUM.map((stage) => {
            const sp = stageProgress.get(stage.id);
            return (
              <LibraryCourseCard
                key={stage.id}
                stageId={stage.id}
                titleKey={stage.titleKey}
                descriptionKey={stage.descriptionKey}
                lessonCount={stage.lessons.length}
                completedCount={sp?.completed || 0}
                isUnlocked={unlockedStages.has(stage.id)}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Tracks Tab ───────────────────────────────────────────────

function TracksTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { quests, progressMap: questProgressMap } = useQuestDashboard(userId);

  const questStats = useMemo(() => {
    let wordsLearned = 0;
    let totalWords = 0;
    let sessions = 0;
    for (const quest of SIDE_QUESTS) {
      totalWords += quest.wordBank.length;
      const p = questProgressMap.get(quest.id);
      if (p) {
        wordsLearned += p.wordsCorrect.length;
        sessions += p.sessionsCompleted;
      }
    }
    return { wordsLearned, totalWords, sessions };
  }, [questProgressMap]);

  return (
    <>
      {/* Stats bar */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-amber-500">{questStats.wordsLearned}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.quests.wordsLearnedLabel}</p>
        </div>
        <div className="h-8 w-px bg-[var(--theme-border)]" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-[var(--theme-text)]">{questStats.totalWords}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.quests.totalWords}</p>
        </div>
        <div className="h-8 w-px bg-[var(--theme-border)]" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-[var(--theme-text)]">{questStats.sessions}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.quests.sessionsLabel}</p>
        </div>
      </div>

      {/* Description */}
      <p className="mb-4 text-[13px] text-[var(--theme-text-secondary)]">
        {t.learn.quests.sectionDesc}
      </p>

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {quests.map((quest) => (
          <LibraryTrackCard
            key={quest.id}
            quest={quest}
            progress={questProgressMap.get(quest.id)}
          />
        ))}
      </div>
    </>
  );
}

// ── Memorize Tab ─────────────────────────────────────────────

function MemorizeTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, isLoading } = useMemorizationDashboard(userId);
  const [allCards, setAllCards] = useState<MemorizationCardEntry[]>([]);

  useEffect(() => {
    memorizationRepository.getAllCards(userId).then(setAllCards);
  }, [userId, stats]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          {stats && stats.totalCards > 0 && (
            <Button
              variant="secondary"
              onClick={() => navigate({ to: "/memorize/practice" })}
            >
              {t.memorize.practice.button}
            </Button>
          )}
          {stats && stats.dueToday > 0 && (
            <Button
              onClick={() => navigate({ to: "/memorize/review" })}
            >
              {t.memorize.startReview} ({stats.dueToday})
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 animate-fade-in">
        {isLoading ? (
          <div className="space-y-4 rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton lines={2} />
          </div>
        ) : stats && stats.totalCards === 0 ? (
          <div className="animate-fade-in rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
            <p className="mb-2 text-lg font-semibold text-[var(--theme-text)]">
              {t.memorize.emptyTitle}
            </p>
            <p className="text-[14px] text-[var(--theme-text-tertiary)]">
              {t.memorize.emptyDesc}
            </p>
          </div>
        ) : stats ? (
          <>
            <StatsOverview stats={stats} cards={allCards} />
            <details className="group">
              <summary className="cursor-pointer list-none px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                {t.memorize.goals}
                <span className="ml-1 inline-block transition-transform group-open:rotate-90">›</span>
              </summary>
              <GoalsSettings userId={userId} />
            </details>
          </>
        ) : null}

        {stats && stats.totalCards === 0 && <GoalsSettings userId={userId} />}

        <Suspense
          fallback={
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="card" className="h-20" />
              ))}
            </div>
          }
        >
          <SurahSelector userId={userId} />
        </Suspense>
      </div>
    </>
  );
}
