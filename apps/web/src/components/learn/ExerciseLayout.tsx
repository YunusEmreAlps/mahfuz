import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "~/hooks/useTranslation";

interface ExerciseOption {
  key: string;
  label: ReactNode;
  isCorrect: boolean;
}

interface ExerciseLayoutProps {
  prompt: ReactNode;
  options: ExerciseOption[];
  correctAnswerDisplay?: ReactNode;
  onNext: (selectedIndex: number, isCorrect: boolean) => void;
}

type Phase = "selecting" | "checked";

export function ExerciseLayout({
  prompt,
  options,
  correctAnswerDisplay,
  onNext,
}: ExerciseLayoutProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("selecting");
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (index: number) => {
      if (phase === "checked") return;
      setSelectedIndex(index);
    },
    [phase],
  );

  const handleCheck = useCallback(() => {
    if (selectedIndex === null) return;
    setPhase("checked");
  }, [selectedIndex]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    const isCorrect = options[selectedIndex].isCorrect;
    const idx = selectedIndex;
    setSelectedIndex(null);
    setPhase("selecting");
    onNext(idx, isCorrect);
  }, [selectedIndex, options, onNext]);

  const isCorrectAnswer =
    selectedIndex !== null ? options[selectedIndex].isCorrect : false;
  const correctIndex = options.findIndex((o) => o.isCorrect);

  return (
    <div className="flex flex-col gap-4">
      {/* Prompt area */}
      {prompt}

      {/* Options — vertical full-width list */}
      <div className="flex flex-col gap-3">
        {options.map((option, index) => {
          let bg: string;
          let border: string;

          if (phase === "checked") {
            if (index === selectedIndex && option.isCorrect) {
              bg = "bg-emerald-50 dark:bg-emerald-950/30";
              border = "border-emerald-500";
            } else if (index === selectedIndex && !option.isCorrect) {
              bg = "bg-red-50 dark:bg-red-950/30";
              border = "border-red-500";
            } else if (option.isCorrect) {
              bg = "bg-emerald-50 dark:bg-emerald-950/30";
              border = "border-emerald-500";
            } else {
              bg = "bg-[var(--theme-bg)]";
              border = "border-[var(--theme-border)] opacity-50";
            }
          } else if (index === selectedIndex) {
            bg = "bg-amber-50 dark:bg-amber-950/20";
            border = "border-amber-400";
          } else {
            bg =
              "bg-[var(--theme-bg)] hover:bg-[var(--theme-hover-bg)]";
            border = "border-[var(--theme-border)]";
          }

          return (
            <button
              key={option.key}
              onClick={() => handleSelect(index)}
              disabled={phase === "checked"}
              className={`w-full rounded-xl border-2 ${border} ${bg} px-4 py-3 text-center text-[14px] font-medium text-[var(--theme-text)] transition-all ${phase === "selecting" ? "active:scale-[0.98]" : ""}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Feedback panel — only after CHECK */}
      {phase === "checked" && selectedIndex !== null && (
        <div
          className={`rounded-xl px-4 py-3 ${
            isCorrectAnswer
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          }`}
        >
          <p className="text-center text-[13px] font-semibold">
            {isCorrectAnswer ? t.learn.excellent : t.learn.incorrect}
          </p>
          {/* Show correct answer when wrong, or correctAnswerDisplay when provided */}
          {correctAnswerDisplay && (
            <div className="mt-1 text-center text-[12px] opacity-80">
              {!isCorrectAnswer && (
                <span className="font-medium">
                  {t.learn.correctAnswerLabel}{" "}
                </span>
              )}
              {correctAnswerDisplay}
            </div>
          )}
          {!correctAnswerDisplay && !isCorrectAnswer && correctIndex >= 0 && (
            <p className="mt-1 text-center text-[12px] opacity-80">
              <span className="font-medium">
                {t.learn.correctAnswerLabel}{" "}
              </span>
              {options[correctIndex].label}
            </p>
          )}
        </div>
      )}

      {/* CHECK / NEXT button */}
      {phase === "selecting" ? (
        <button
          onClick={handleCheck}
          disabled={selectedIndex === null}
          className={`w-full rounded-xl px-6 py-3 text-[14px] font-semibold transition-all active:scale-[0.98] ${
            selectedIndex === null
              ? "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
              : "bg-amber-500 text-white hover:bg-amber-600"
          }`}
        >
          {t.learn.check}
        </button>
      ) : (
        <button
          onClick={handleNext}
          className={`w-full rounded-xl px-6 py-3 text-[14px] font-semibold text-white transition-all active:scale-[0.98] ${
            isCorrectAnswer
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {t.learn.nextButton}
        </button>
      )}
    </div>
  );
}
