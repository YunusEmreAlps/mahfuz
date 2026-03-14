import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { resolveNestedKey } from "~/lib/i18n-utils";

interface LibraryCourseCardProps {
  stageId: number;
  titleKey: string;
  descriptionKey: string;
  lessonCount: number;
  completedCount: number;
  isUnlocked: boolean;
}

const STAGE_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", bar: "bg-blue-500" },
  { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", bar: "bg-violet-500" },
  { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", bar: "bg-rose-500" },
  { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", bar: "bg-amber-500" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", bar: "bg-emerald-500" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400", bar: "bg-cyan-500" },
  { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", bar: "bg-orange-500" },
  { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-400", bar: "bg-teal-500" },
];

export function LibraryCourseCard({
  stageId,
  titleKey,
  descriptionKey,
  lessonCount,
  completedCount,
  isUnlocked,
}: LibraryCourseCardProps) {
  const { t } = useTranslation();
  const progress = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;
  const isComplete = completedCount >= lessonCount && lessonCount > 0;
  const title = resolveNestedKey(t.learn as Record<string, any>, titleKey) || titleKey;
  const description = resolveNestedKey(t.learn as Record<string, any>, descriptionKey) || descriptionKey;
  const color = STAGE_COLORS[(stageId - 1) % STAGE_COLORS.length];

  const card = (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all ${
        isComplete
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
          : isUnlocked
            ? "border-[var(--theme-border)] bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5"
            : "border-[var(--theme-border)] bg-[var(--theme-bg)] opacity-50"
      }`}
    >
      {/* Color band top */}
      <div className={`h-1.5 w-full ${isComplete ? "bg-emerald-500" : isUnlocked ? color.bar : "bg-[var(--theme-border)]"}`} />

      <div className="flex flex-1 flex-col p-4">
        {/* Icon / number */}
        <div className="mb-3 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold ${
              isComplete
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                : isUnlocked
                  ? `${color.bg} ${color.text}`
                  : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-quaternary)]"
            }`}
          >
            {isComplete ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : isUnlocked ? (
              stageId
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
          </div>
          {!isUnlocked && (
            <span className="text-[11px] font-medium text-[var(--theme-text-quaternary)]">
              {t.learn.locked}
            </span>
          )}
        </div>

        {/* Title + description */}
        <h3 className="text-[15px] font-semibold leading-snug text-[var(--theme-text)]">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--theme-text-tertiary)]">
          {description}
        </p>

        {/* Progress area */}
        <div className="mt-auto pt-3">
          {isUnlocked && lessonCount > 0 ? (
            <>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-[var(--theme-text-quaternary)]">
                  {completedCount}/{lessonCount} {t.learn.lessons}
                </span>
                {progress > 0 && (
                  <span className="font-medium text-[var(--theme-text-tertiary)]">
                    %{progress}
                  </span>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-bg)]">
                <div
                  className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-500" : color.bar}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-bg)]">
              <div className="h-full w-0 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isUnlocked) return card;

  return (
    <Link to="/learn/stage/$stageId" params={{ stageId: String(stageId) }}>
      {card}
    </Link>
  );
}
