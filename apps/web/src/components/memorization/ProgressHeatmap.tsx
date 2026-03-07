import type { ConfidenceLevel } from "@mahfuz/shared/types";
import { useState } from "react";

const CONFIDENCE_COLORS: Record<ConfidenceLevel | "none", string> = {
  none: "bg-[var(--theme-hover-bg)]",
  struggling: "bg-red-500",
  learning: "bg-orange-400",
  familiar: "bg-yellow-400",
  confident: "bg-blue-500",
  mastered: "bg-emerald-500",
};

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  struggling: "Zor",
  learning: "Öğreniyor",
  familiar: "Tanıdık",
  confident: "Emin",
  mastered: "Ezber",
};

interface ProgressHeatmapProps {
  surahId: number;
  versesCount: number;
  progressMap: Map<string, { confidence: ConfidenceLevel; nextReview: Date }>;
}

export function ProgressHeatmap({
  surahId,
  versesCount,
  progressMap,
}: ProgressHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    verseKey: string;
    confidence: ConfidenceLevel;
    nextReview: Date;
  } | null>(null);

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-[14px] font-semibold text-[var(--theme-text)]">
        Ayet Haritası
      </h3>

      <div className="flex flex-wrap gap-1">
        {Array.from({ length: versesCount }, (_, i) => {
          const verseKey = `${surahId}:${i + 1}`;
          const data = progressMap.get(verseKey);
          const colorClass = data
            ? CONFIDENCE_COLORS[data.confidence]
            : CONFIDENCE_COLORS.none;

          return (
            <div
              key={verseKey}
              className={`h-5 w-5 cursor-pointer rounded-sm ${colorClass} transition-all hover:scale-125 hover:shadow-sm`}
              onMouseEnter={() =>
                data &&
                setTooltip({
                  verseKey,
                  confidence: data.confidence,
                  nextReview: data.nextReview,
                })
              }
              onMouseLeave={() => setTooltip(null)}
              title={
                data
                  ? `${verseKey} — ${CONFIDENCE_LABELS[data.confidence]}`
                  : `${verseKey} — Eklenmedi`
              }
            />
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-3 rounded-lg bg-[var(--theme-hover-bg)] px-3 py-2 text-[12px]">
          <span className="font-medium text-[var(--theme-text)]">
            {tooltip.verseKey}
          </span>
          {" — "}
          <span className="text-[var(--theme-text-secondary)]">
            {CONFIDENCE_LABELS[tooltip.confidence]}
          </span>
          {" — "}
          <span className="text-[var(--theme-text-tertiary)]">
            Sonraki:{" "}
            {tooltip.nextReview.toLocaleDateString("tr-TR")}
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-[var(--theme-hover-bg)]" />
          <span className="text-[11px] text-[var(--theme-text-quaternary)]">
            Eklenmedi
          </span>
        </div>
        {(Object.keys(CONFIDENCE_LABELS) as ConfidenceLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-3 w-3 rounded-sm ${CONFIDENCE_COLORS[level]}`}
            />
            <span className="text-[11px] text-[var(--theme-text-quaternary)]">
              {CONFIDENCE_LABELS[level]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
