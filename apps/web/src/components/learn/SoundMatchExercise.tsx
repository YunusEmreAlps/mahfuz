import { useState, useMemo } from "react";
import type { Exercise, ExerciseAttempt } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { useLearnAudio } from "~/hooks/useLearnAudio";

interface SoundMatchExerciseProps {
  exercise: Exercise;
  onAnswer: (attempt: ExerciseAttempt) => void;
  exerciseNumber: number;
  totalExercises: number;
}

export function SoundMatchExercise({
  exercise,
  onAnswer,
  exerciseNumber,
  totalExercises,
}: SoundMatchExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const { t } = useTranslation();
  const { playAudioRef, isPlaying } = useLearnAudio();

  const shuffledOptions = useMemo(() => {
    const arr = [...exercise.options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [exercise.id]);

  const handlePlay = () => {
    if (exercise.audioRef) {
      playAudioRef(exercise.audioRef);
    }
  };

  const handleSelect = (index: number) => {
    if (answered) return;

    setSelectedIndex(index);
    setAnswered(true);

    const isCorrect = shuffledOptions[index].isCorrect;

    // Record attempt after brief delay for feedback
    setTimeout(() => {
      onAnswer({
        exerciseId: exercise.id,
        selectedOptionIndex: index,
        isCorrect,
        timestamp: Date.now(),
      });
      // Reset for next exercise
      setSelectedIndex(null);
      setAnswered(false);
    }, 1200);
  };

  const promptText =
    (t.learn.exercises as Record<string, string>)[
      exercise.promptKey.replace("exercises.", "")
    ] || exercise.promptKey;

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      {/* Exercise counter */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12px] text-[var(--theme-text-tertiary)]">
          {exerciseNumber}/{totalExercises}
        </span>
        <span className="text-[12px] font-medium text-primary-600">
          +{exercise.sevapPointReward} {t.learn.pointLabel}
        </span>
      </div>

      {/* Prompt */}
      <p className="mb-4 text-[14px] font-medium text-[var(--theme-text)]">
        {promptText}
      </p>

      {/* Play button */}
      <div className="mb-6 flex items-center justify-center">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className={`flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all ${
            isPlaying
              ? "border-primary-400 bg-primary-50 dark:bg-primary-950/30"
              : "border-[var(--theme-border)] bg-[var(--theme-bg)] hover:border-primary-400 hover:bg-primary-50 active:scale-[0.95] dark:hover:bg-primary-950/30"
          }`}
          aria-label="Play audio"
        >
          {isPlaying ? (
            <svg
              className="h-8 w-8 animate-pulse text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5.586v12.828a1 1 0 01-1.707.707L5.586 15z"
              />
            </svg>
          ) : (
            <svg
              className="h-8 w-8 text-[var(--theme-text-secondary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494m0 0A5.978 5.978 0 017.5 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h3.5A5.978 5.978 0 0112 6.253z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3">
        {shuffledOptions.map((option, index) => {
          let bg = "bg-[var(--theme-bg)] hover:bg-[var(--theme-hover-bg)]";
          let border = "border-[var(--theme-border)]";
          let textColor = "text-[var(--theme-text)]";

          if (answered && selectedIndex === index) {
            if (option.isCorrect) {
              bg = "bg-emerald-50 dark:bg-emerald-950/30";
              border = "border-emerald-500";
              textColor = "text-emerald-700 dark:text-emerald-400";
            } else {
              bg = "bg-red-50 dark:bg-red-950/30";
              border = "border-red-500";
              textColor = "text-red-700 dark:text-red-400";
            }
          } else if (answered && option.isCorrect) {
            bg = "bg-emerald-50 dark:bg-emerald-950/30";
            border = "border-emerald-500";
            textColor = "text-emerald-700 dark:text-emerald-400";
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={answered}
              className={`rounded-xl border-2 ${border} ${bg} px-4 py-3 text-center text-[14px] font-medium ${textColor} transition-all ${!answered ? "active:scale-[0.97]" : ""}`}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && selectedIndex !== null && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-center text-[13px] font-medium ${
            shuffledOptions[selectedIndex].isCorrect
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          }`}
        >
          {exercise.options[selectedIndex].isCorrect
            ? t.learn.correct
            : t.learn.incorrect}
        </div>
      )}
    </div>
  );
}
