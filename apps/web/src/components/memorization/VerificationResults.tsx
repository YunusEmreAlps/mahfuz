import { useTranslation } from "~/hooks/useTranslation";
import type { SessionResult } from "~/stores/useMemorizationStore";

interface VerificationResultsProps {
  results: SessionResult[];
  passed: boolean;
  surahName: string;
  onContinue: () => void;
}

export function VerificationResults({
  results,
  passed,
  surahName,
  onContinue,
}: VerificationResultsProps) {
  const { t } = useTranslation();
  const total = results.length;
  const correct = results.filter((r) => r.wasCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const failedVerses = results.filter((r) => !r.wasCorrect);

  return (
    <div className="animate-scale-in rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      {/* Result icon */}
      <div className="mb-4 text-center">
        <div className="mb-3 text-5xl">{passed ? "🏅" : "📖"}</div>
        <h2 className="mb-1 text-xl font-bold text-[var(--theme-text)]">
          {passed
            ? t.memorize.verification.passTitle
            : t.memorize.verification.failTitle}
        </h2>
        <p className="text-[14px] text-[var(--theme-text-tertiary)]">
          {passed
            ? t.memorize.verification.passDesc.replace("{surah}", surahName)
            : t.memorize.verification.failDesc}
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[var(--theme-text)]">{total}</p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            {t.memorize.results.total}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-600">{correct}</p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            {t.memorize.results.correct}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-primary-600">{accuracy}%</p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            {t.memorize.results.accuracy}
          </p>
        </div>
      </div>

      {/* Failed verses list */}
      {!passed && failedVerses.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-[13px] font-medium text-[var(--theme-text-secondary)]">
            {t.memorize.verification.needsWork}
          </p>
          <div className="divide-y divide-[var(--theme-divider)] rounded-xl bg-[var(--theme-bg)] p-1">
            {failedVerses.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2"
              >
                <span className="text-[13px] tabular-nums text-[var(--theme-text-secondary)]">
                  {r.verseKey}
                </span>
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[12px] font-medium text-red-500">
                  {r.grade}/5
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full rounded-xl bg-primary-600 py-3 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98]"
      >
        {t.memorize.backToPanel}
      </button>
    </div>
  );
}
