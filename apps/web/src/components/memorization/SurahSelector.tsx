import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import type { MemorizationCardEntry } from "@mahfuz/db";
import { useState, useEffect, useMemo, useCallback } from "react";
import { memorizationRepository } from "@mahfuz/db";
import type { ConfidenceLevel, VerseKey } from "@mahfuz/shared/types";
import { SM2_DEFAULTS } from "@mahfuz/shared/constants";
import { useTranslation } from "~/hooks/useTranslation";

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  struggling: "bg-red-500",
  learning: "bg-orange-400",
  familiar: "bg-yellow-400",
  confident: "bg-blue-500",
  mastered: "bg-emerald-500",
};

const CONFIDENCE_BADGE_STYLES: Record<
  ConfidenceLevel,
  { bg: string; text: string }
> = {
  struggling: { bg: "bg-red-50", text: "text-red-700" },
  learning: { bg: "bg-orange-50", text: "text-orange-700" },
  familiar: { bg: "bg-yellow-50", text: "text-yellow-700" },
  confident: { bg: "bg-blue-50", text: "text-blue-700" },
  mastered: { bg: "bg-emerald-50", text: "text-emerald-700" },
};

interface SurahSelectorProps {
  userId: string;
}

interface SurahProgress {
  total: number;
  byConfidence: Partial<Record<ConfidenceLevel, number>>;
}

function getDominantConfidence(
  byConfidence: Partial<Record<ConfidenceLevel, number>>,
): ConfidenceLevel {
  // Exclude "mastered" — we only show this badge for non-mastered surahs,
  // so the dominant should reflect what still needs work.
  let max = 0;
  let dominant: ConfidenceLevel = "learning";
  for (const [level, count] of Object.entries(byConfidence)) {
    if (level === "mastered") continue;
    if (count && count > max) {
      max = count;
      dominant = level as ConfidenceLevel;
    }
  }
  return dominant;
}

export function SurahSelector({ userId }: SurahSelectorProps) {
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const { t } = useTranslation();

  const [progress, setProgress] = useState<Map<number, SurahProgress>>(
    new Map(),
  );

  useEffect(() => {
    async function loadProgress() {
      const allCards = await memorizationRepository.getAllCards(userId);
      const map = new Map<number, SurahProgress>();

      for (const card of allCards) {
        const surahId = parseInt(card.verseKey.split(":")[0]);
        let p = map.get(surahId);
        if (!p) {
          p = { total: 0, byConfidence: {} };
          map.set(surahId, p);
        }
        p.total++;
        p.byConfidence[card.confidence] =
          (p.byConfidence[card.confidence] || 0) + 1;
      }

      setProgress(map);
    }
    loadProgress();
  }, [userId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return chapters;
    return chapters.filter(
      (ch) =>
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        String(ch.id).startsWith(q),
    );
  }, [chapters, search]);

  const completedChapters = useMemo(() => {
    return chapters.filter((ch) => {
      const p = progress.get(ch.id);
      return p && p.byConfidence.mastered === ch.verses_count;
    });
  }, [chapters, progress]);

  const inProgressChapters = useMemo(() => {
    return chapters.filter((ch) => {
      const p = progress.get(ch.id);
      return p && p.total > 0 && p.byConfidence.mastered !== ch.verses_count;
    });
  }, [chapters, progress]);

  const [markingId, setMarkingId] = useState<number | null>(null);

  const markAsMastered = useCallback(
    async (ch: (typeof chapters)[number]) => {
      setMarkingId(ch.id);
      try {
        const existing = await memorizationRepository.getCardsBySurah(userId, ch.id);
        const existingKeys = new Set(existing.map((c) => c.verseKey));
        const now = Date.now();

        // Update existing cards to mastered
        for (const card of existing) {
          if (card.confidence !== "mastered") {
            await memorizationRepository.upsertCard({
              ...card,
              confidence: "mastered",
              updatedAt: now,
            });
          }
        }

        // Create missing verses as mastered
        const newCards: MemorizationCardEntry[] = [];
        for (let v = 1; v <= ch.verses_count; v++) {
          const key = `${ch.id}:${v}` as VerseKey;
          if (!existingKeys.has(key)) {
            newCards.push({
              id: crypto.randomUUID(),
              userId,
              verseKey: key,
              easeFactor: SM2_DEFAULTS.INITIAL_EASE_FACTOR,
              repetition: 5,
              interval: 30,
              nextReviewDate: now + 30 * 24 * 60 * 60 * 1000,
              confidence: "mastered",
              totalReviews: 5,
              correctReviews: 5,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
        if (newCards.length > 0) {
          await memorizationRepository.createCards(newCards);
        }

        // Update local progress state
        setProgress((prev) => {
          const next = new Map(prev);
          next.set(ch.id, {
            total: ch.verses_count,
            byConfidence: { mastered: ch.verses_count },
          });
          return next;
        });
        setExpandedId(null);
      } finally {
        setMarkingId(null);
      }
    },
    [userId],
  );

  const renderRow = (ch: (typeof chapters)[number], highlighted: boolean) => {
    const p = progress.get(ch.id);
    const hasProgress = p && p.total > 0;
    const isMastered = hasProgress && p.byConfidence.mastered === ch.verses_count;
    const canAddMore = hasProgress && p.total < ch.verses_count;
    const isExpanded = expandedId === ch.id;

    // Rows without progress — expandable with Add / Mark as Mastered
    if (!hasProgress) {
      return (
        <div key={highlighted ? `added-${ch.id}` : ch.id}>
          <button
            type="button"
            onClick={() => setExpandedId(isExpanded ? null : ch.id)}
            className="flex w-full items-center gap-3 px-6 py-4 transition-colors hover:bg-[var(--theme-hover-bg)] active:bg-[var(--theme-hover-bg)] cursor-pointer text-left"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold tabular-nums bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)]">
              {ch.id}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-[var(--theme-text)]">
                  {ch.name_simple}
                </span>
                <span className="text-[13px] text-[var(--theme-text-tertiary)]">
                  {ch.name_arabic}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[13px] font-semibold tabular-nums text-[var(--theme-text-secondary)]">
                {ch.verses_count}
              </span>
              <span
                className={`text-[16px] text-[var(--theme-text-quaternary)] transition-transform ${isExpanded ? "rotate-90" : ""}`}
              >
                ›
              </span>
            </div>
          </button>

          {isExpanded && (
            <div className="flex flex-wrap gap-2 px-6 pb-4 pt-0 animate-fade-in">
              <Link
                to="/memorize/add/$surahId"
                params={{ surahId: String(ch.id) }}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3.5 py-2 text-[13px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t.memorize.surahSelector.add}
              </Link>
              <button
                type="button"
                disabled={markingId === ch.id}
                onClick={() => markAsMastered(ch)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {markingId === ch.id
                  ? t.common.loading
                  : t.memorize.surahSelector.markMastered}
              </button>
            </div>
          )}
        </div>
      );
    }

    // Rows with progress expand/collapse on click
    return (
      <div key={highlighted ? `added-${ch.id}` : ch.id}>
        <button
          type="button"
          onClick={() => setExpandedId(isExpanded ? null : ch.id)}
          className="flex w-full items-center gap-3 px-6 py-4 transition-colors hover:bg-[var(--theme-hover-bg)] active:bg-[var(--theme-hover-bg)] cursor-pointer text-left"
        >
          {/* Surah number */}
          <span
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold tabular-nums ${
              highlighted
                ? "bg-primary-50 text-primary-700"
                : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)]"
            }`}
          >
            {ch.id}
          </span>

          {/* Name + progress bar */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[var(--theme-text)]">
                {ch.name_simple}
              </span>
              <span className="text-[13px] text-[var(--theme-text-tertiary)]">
                {ch.name_arabic}
              </span>
            </div>
            <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
              {(Object.keys(CONFIDENCE_COLORS) as ConfidenceLevel[]).map(
                (level) => {
                  const count = p.byConfidence[level] || 0;
                  const pct = (count / ch.verses_count) * 100;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={level}
                      className={`${CONFIDENCE_COLORS[level]} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                },
              )}
            </div>
          </div>

          {/* Right side: count + badge + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[13px] font-semibold tabular-nums text-[var(--theme-text-secondary)]">
              {p.total}/{ch.verses_count}
            </span>

            {isMastered && (
              <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700">
                ✓ {t.memorize.confidence.mastered}
              </span>
            )}

            {!isMastered && (() => {
              const dominant = getDominantConfidence(p.byConfidence);
              const style = CONFIDENCE_BADGE_STYLES[dominant];
              return (
                <span
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}
                >
                  {t.memorize.confidence[dominant]}
                </span>
              );
            })()}

            <span
              className={`text-[16px] text-[var(--theme-text-quaternary)] transition-transform ${isExpanded ? "rotate-90" : ""}`}
            >
              ›
            </span>
          </div>
        </button>

        {/* Expanded action buttons */}
        {isExpanded && (
          <div className="flex flex-wrap gap-2 px-6 pb-4 pt-0 animate-fade-in">
            <Link
              to="/memorize/progress/$surahId"
              params={{ surahId: String(ch.id) }}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3.5 py-2 text-[13px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              {t.memorize.surahSelector.progress}
            </Link>

            {!isMastered && (
              <Link
                to="/memorize/practice"
                search={{ surahId: ch.id }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-[13px] font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                {t.memorize.practice.button}
              </Link>
            )}

            {canAddMore && (
              <Link
                to="/memorize/add/$surahId"
                params={{ surahId: String(ch.id) }}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-hover-bg)] px-3.5 py-2 text-[13px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t.memorize.surahSelector.add}
              </Link>
            )}

            {p.total === ch.verses_count && (
              <Link
                to="/memorize/verify/$surahId"
                params={{ surahId: String(ch.id) }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.memorize.surahSelector.verify}
              </Link>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--theme-divider)] px-6 py-4">
        <h2 className="mb-3 text-base font-semibold text-[var(--theme-text)]">
          {t.memorize.surahSelector.surahs}
        </h2>
        {/* Search */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-tertiary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.memorize.surahSelector.searchPlaceholder}
            className="w-full rounded-xl bg-[var(--theme-input-bg)] py-2.5 pl-10 pr-4 text-[15px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none transition-colors focus:bg-[var(--theme-bg-primary)] focus:shadow-[var(--shadow-elevated)]"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[15px] text-[var(--theme-text-secondary)]">
            {t.memorize.surahSelector.noResults}
          </p>
          <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">
            {t.memorize.surahSelector.noResultsHint}
          </p>
        </div>
      ) : (
      <div className="divide-y divide-[var(--theme-divider)]">
        {search === "" && completedChapters.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setCompletedOpen((v) => !v)}
              className="flex w-full items-center gap-2 border-b border-[var(--theme-divider)] bg-[var(--theme-hover-bg)] px-6 py-3 cursor-pointer"
            >
              <span className="h-4 w-1 rounded-full bg-emerald-500" />
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                {t.memorize.surahSelector.completedSurahs} ({completedChapters.length})
              </span>
              <span
                className={`ml-auto text-[14px] text-[var(--theme-text-quaternary)] transition-transform ${completedOpen ? "rotate-90" : ""}`}
              >
                ›
              </span>
            </button>
            {completedOpen && completedChapters.map((ch) => renderRow(ch, true))}
          </>
        )}
        {search === "" && inProgressChapters.length > 0 && (
          <>
            <div className="flex items-center gap-2 border-b border-[var(--theme-divider)] bg-[var(--theme-hover-bg)] px-6 py-3">
              <span className="h-4 w-1 rounded-full bg-amber-500" />
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                {t.memorize.surahSelector.inProgressSurahs} ({inProgressChapters.length})
              </span>
            </div>
            {inProgressChapters.map((ch) => renderRow(ch, true))}
          </>
        )}
        {search === "" && (completedChapters.length > 0 || inProgressChapters.length > 0) && (
          <div className="flex items-center gap-2 border-b border-[var(--theme-divider)] bg-[var(--theme-hover-bg)] px-6 py-3">
            <span className="h-4 w-1 rounded-full bg-[var(--theme-text-quaternary)]" />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
              {t.memorize.surahSelector.allSurahs}
            </span>
          </div>
        )}
        {(search === "" ? chapters : filtered).map((ch) => renderRow(ch, false))}
      </div>
      )}
    </div>
  );
}
