import type { SessionResult } from "~/stores/useMemorizationStore";

interface SessionResultsProps {
  results: SessionResult[];
  onContinue: () => void;
}

export function SessionResults({ results, onContinue }: SessionResultsProps) {
  const total = results.length;
  const correct = results.filter((r) => r.wasCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="animate-scale-in rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h2 className="mb-6 text-center text-xl font-bold text-[var(--theme-text)]">
        Oturum Tamamlandı
      </h2>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[var(--theme-text)]">
            {total}
          </p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            Toplam
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-600">{correct}</p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            Doğru
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-primary-600">{accuracy}%</p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            Doğruluk
          </p>
        </div>
      </div>

      {/* Per-card breakdown */}
      <div className="mb-6 divide-y divide-[var(--theme-divider)] rounded-xl bg-[var(--theme-bg)] p-1">
        {results.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2"
          >
            <span className="text-[13px] tabular-nums text-[var(--theme-text-secondary)]">
              {r.verseKey}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                r.wasCorrect
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {r.grade}/5
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        className="w-full rounded-xl bg-primary-600 py-3 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98]"
      >
        Devam Et
      </button>
    </div>
  );
}
