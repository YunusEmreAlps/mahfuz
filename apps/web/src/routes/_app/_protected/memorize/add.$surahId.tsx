import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState, useCallback } from "react";
import { chapterQueryOptions } from "~/hooks/useChapters";
import { useAddVerses, useSurahProgress } from "~/hooks/useMemorization";
import type { ConfidenceLevel } from "@mahfuz/shared/types";

export const Route = createFileRoute(
  "/_app/_protected/memorize/add/$surahId",
)({
  component: AddVersesPage,
});

function AddVersesPage() {
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const { surahId } = Route.useParams();
  const surahNum = Number(surahId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-fade-in">
      <Suspense
        fallback={
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        }
      >
        <AddContent userId={userId} surahId={surahNum} />
      </Suspense>
    </div>
  );
}

const CONFIDENCE_BADGE: Record<ConfidenceLevel, { label: string; color: string }> = {
  struggling: { label: "Zor", color: "bg-red-100 text-red-700" },
  learning: { label: "Öğreniyor", color: "bg-orange-100 text-orange-700" },
  familiar: { label: "Tanıdık", color: "bg-yellow-100 text-yellow-700" },
  confident: { label: "Emin", color: "bg-blue-100 text-blue-700" },
  mastered: { label: "Ezber", color: "bg-emerald-100 text-emerald-700" },
};

function AddContent({
  userId,
  surahId,
}: {
  userId: string;
  surahId: number;
}) {
  const { data: chapter } = useSuspenseQuery(chapterQueryOptions(surahId));
  const { progressMap, refresh } = useSurahProgress(userId, surahId);
  const { addVerses, isAdding } = useAddVerses(userId);
  const navigate = useNavigate();

  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Verses not yet added
  const availableVerses: number[] = [];
  for (let i = 1; i <= chapter.verses_count; i++) {
    const key = `${surahId}:${i}`;
    if (!progressMap.has(key)) {
      availableVerses.push(i);
    }
  }

  const toggleVerse = useCallback((num: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }, []);

  const selectAll = () => setSelected(new Set(availableVerses));
  const selectNone = () => setSelected(new Set());
  const selectFirst = (n: number) =>
    setSelected(new Set(availableVerses.slice(0, n)));

  const handleAdd = async () => {
    if (selected.size === 0) return;
    await addVerses(surahId, Array.from(selected).sort((a, b) => a - b));
    await refresh();
    navigate({ to: "/memorize/review", search: { surahId } });
  };

  return (
    <>
      <div className="mb-6">
        <Link
          to="/memorize/progress/$surahId"
          params={{ surahId: String(surahId) }}
          className="mb-2 inline-block text-[13px] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
        >
          &larr; {chapter.name_simple}
        </Link>
        <h1 className="text-2xl font-bold text-[var(--theme-text)]">
          Ayet Ekle — {chapter.name_simple}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--theme-text-tertiary)]">
          {availableVerses.length} ayet eklenebilir,{" "}
          {progressMap.size} ayet zaten mevcut
        </p>
      </div>

      {availableVerses.length === 0 ? (
        <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-[var(--theme-text-secondary)]">
            Bu sûrenin tüm ayetleri zaten eklenmiş.
          </p>
          <Link
            to="/memorize/progress/$surahId"
            params={{ surahId: String(surahId) }}
            className="mt-4 inline-block rounded-xl bg-primary-600 px-5 py-2 text-[14px] font-medium text-white"
          >
            İlerlemeye Bak
          </Link>
        </div>
      ) : (
        <>
          {/* Bulk actions */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-primary-600 hover:bg-primary-50"
              >
                Tümünü Seç
              </button>
              <button
                onClick={selectNone}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)]"
              >
                Temizle
              </button>
            </div>
            <span className="text-[13px] tabular-nums text-[var(--theme-text-tertiary)]">
              {selected.size} seçili
            </span>
          </div>

          {/* Quick select */}
          {availableVerses.length > 5 && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[12px] text-[var(--theme-text-tertiary)]">
                Hızlı seç:
              </span>
              {[5, 10, 20]
                .filter((n) => n <= availableVerses.length)
                .map((n) => (
                  <button
                    key={n}
                    onClick={() => selectFirst(n)}
                    className="rounded-lg bg-[var(--theme-hover-bg)] px-2.5 py-1 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
                  >
                    İlk {n}
                  </button>
                ))}
            </div>
          )}

          {/* Verse grid */}
          <div className="mb-6 rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)]">
            <div className="divide-y divide-[var(--theme-divider)]">
              {Array.from({ length: chapter.verses_count }, (_, i) => i + 1).map(
                (num) => {
                  const key = `${surahId}:${num}`;
                  const existing = progressMap.get(key);
                  const isAvailable = !existing;
                  const isSelected = selected.has(num);

                  return (
                    <div
                      key={num}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors ${
                        isSelected
                          ? "bg-primary-50"
                          : "hover:bg-[var(--theme-hover-bg)]"
                      } ${!isAvailable ? "opacity-50" : ""}`}
                      onClick={() => isAvailable && toggleVerse(num)}
                    >
                      {isAvailable ? (
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                            isSelected
                              ? "border-primary-600 bg-primary-600"
                              : "border-[var(--theme-border)]"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="h-3 w-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ) : (
                        <div className="h-5 w-5" />
                      )}
                      <span className="text-[14px] tabular-nums text-[var(--theme-text)]">
                        Ayet {num}
                      </span>
                      {existing && (
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${CONFIDENCE_BADGE[existing.confidence].color}`}
                        >
                          {CONFIDENCE_BADGE[existing.confidence].label}
                        </span>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Add button */}
          {selected.size > 0 && (
            <div className="sticky bottom-6">
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className="w-full rounded-xl bg-primary-600 py-3 text-[15px] font-semibold text-white shadow-lg transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-60"
              >
                {isAdding
                  ? "Ekleniyor..."
                  : `${selected.size} Ayeti Ezberle`}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
