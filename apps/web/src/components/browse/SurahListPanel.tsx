import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { ChapterCard } from "~/components/quran";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

type SortType = "mushaf" | "revelation";

interface SurahListPanelProps {
  sort?: SortType;
}

export function SurahListPanel({ sort = "mushaf" }: SurahListPanelProps) {
  const { t, locale } = useTranslation();
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = chapters.filter((ch) => {
      if (!q) return true;
      return (
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        getSurahName(ch.id, ch.translated_name.name, locale).toLowerCase().includes(q) ||
        String(ch.id).startsWith(q)
      );
    });
    if (sort === "revelation") {
      return [...result].sort((a, b) => a.revelation_order - b.revelation_order);
    }
    return result;
  }, [chapters, search, sort]);

  return (
    <>
      {/* Search */}
      <div className="relative mb-3">
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
          placeholder={t.browse.searchSurah}
          className="w-full rounded-xl bg-[var(--theme-input-bg)] py-2.5 pl-10 pr-4 text-[15px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none transition-colors focus:bg-[var(--theme-bg-primary)] focus:shadow-[var(--shadow-elevated)]"
        />
      </div>

      {/* Chapter list */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-[15px] text-[var(--theme-text-secondary)]">
            {t.common.noResults}
          </p>
          <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">
            {t.browse.noResultsHint}
          </p>
        </div>
      )}
    </>
  );
}
