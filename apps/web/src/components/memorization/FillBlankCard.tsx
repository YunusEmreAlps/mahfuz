import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MemorizationCard, QualityGrade } from "@mahfuz/shared/types";
import { verseByKeyQueryOptions } from "~/hooks/useVerses";
import { useTranslation } from "~/hooks/useTranslation";

// Fallback Arabic words for short verses with <4 words
const FALLBACK_WORDS = [
  "ٱللَّهِ",
  "ٱلرَّحْمَـٰنِ",
  "ٱلرَّحِيمِ",
  "ٱلْحَمْدُ",
  "رَبِّ",
  "ٱلْعَـٰلَمِينَ",
  "مَـٰلِكِ",
  "يَوْمِ",
  "ٱلدِّينِ",
  "إِيَّاكَ",
  "نَعْبُدُ",
  "نَسْتَعِينُ",
  "ٱهْدِنَا",
  "ٱلصِّرَ‌ٰطَ",
  "ٱلْمُسْتَقِيمَ",
];

interface FillBlankCardProps {
  card: MemorizationCard;
  onGrade: (grade: QualityGrade) => void;
}

export function FillBlankCard({ card, onGrade }: FillBlankCardProps) {
  const { data: verseData, isLoading } = useQuery(
    verseByKeyQueryOptions(card.verseKey),
  );
  const { t } = useTranslation();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const verse = verseData;
  const words = useMemo(
    () =>
      verse?.words?.filter((w: any) => w.char_type_name === "word") || [],
    [verse],
  );

  // Pick a random blank index and build options (memoized per card)
  const { blankIndex, options, correctOptionIndex } = useMemo(() => {
    if (words.length === 0)
      return { blankIndex: -1, options: [] as string[], correctOptionIndex: -1 };

    const bIdx = Math.floor(Math.random() * words.length);
    const correctWord = words[bIdx].text_uthmani;

    // Gather distractors from other words in the verse
    const otherWords = words
      .filter((_: any, i: number) => i !== bIdx)
      .map((w: any) => w.text_uthmani);

    // Deduplicate
    const uniqueDistractors = [...new Set(otherWords)].filter(
      (w) => w !== correctWord,
    );

    // If not enough distractors, pull from fallback pool
    while (uniqueDistractors.length < 3) {
      const fallback =
        FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
      if (fallback !== correctWord && !uniqueDistractors.includes(fallback)) {
        uniqueDistractors.push(fallback);
      }
    }

    // Pick 3 random distractors
    const shuffledDistractors = uniqueDistractors.sort(
      () => Math.random() - 0.5,
    );
    const picked = shuffledDistractors.slice(0, 3);

    // Build and shuffle options
    const allOptions = [correctWord, ...picked];
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    return {
      blankIndex: bIdx,
      options: allOptions,
      correctOptionIndex: allOptions.indexOf(correctWord),
    };
  }, [words]);

  const handleSelect = useCallback(
    (optIdx: number) => {
      if (answered) return;
      setSelectedIndex(optIdx);
      setAnswered(true);

      const isCorrect = optIdx === correctOptionIndex;
      const delay = isCorrect ? 1000 : 1500;
      setTimeout(() => onGrade(isCorrect ? 5 : 1), delay);
    },
    [answered, correctOptionIndex, onGrade],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!verse || words.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-[var(--theme-text-tertiary)]">
          {t.memorize.review.verseLoadError}: {card.verseKey}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      {/* Verse key */}
      <div className="mb-4 text-center">
        <span className="text-[12px] tabular-nums text-[var(--theme-text-quaternary)]">
          {card.verseKey}
        </span>
        <p className="mt-1 text-[11px] text-[var(--theme-text-quaternary)]">
          {t.memorize.verification.fillBlank}
        </p>
      </div>

      {/* Arabic verse with blank */}
      <div className="mb-6" dir="rtl">
        <p
          className="arabic-text text-center leading-[2.6] text-[var(--theme-text)]"
          style={{ fontSize: "calc(1.65rem * 1.1)" }}
        >
          {words.map((w: any, i: number) => {
            if (i === blankIndex) {
              return (
                <span
                  key={w.id}
                  className="inline-block border-b-2 border-dashed border-primary-400 px-2"
                >
                  {answered ? (
                    <span
                      className={
                        selectedIndex === correctOptionIndex
                          ? "text-emerald-600"
                          : "text-red-500 line-through"
                      }
                    >
                      {w.text_uthmani}
                    </span>
                  ) : (
                    <span className="text-primary-400">{"______"}</span>
                  )}{" "}
                </span>
              );
            }
            return (
              <span key={w.id} className="inline-block opacity-100">
                {w.text_uthmani}{" "}
              </span>
            );
          })}
        </p>
      </div>

      {/* Instruction */}
      <p className="mb-4 text-center text-[13px] text-[var(--theme-text-tertiary)]">
        {t.memorize.verification.selectWord}
      </p>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((word, idx) => {
          let btnClass =
            "rounded-xl border-2 px-4 py-3 text-center transition-all active:scale-[0.97] arabic-text text-[18px]";

          if (!answered) {
            btnClass +=
              " border-[var(--theme-divider)] bg-[var(--theme-bg-primary)] text-[var(--theme-text)] hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer";
          } else if (idx === correctOptionIndex) {
            btnClass +=
              " border-emerald-500 bg-emerald-50 text-emerald-700";
          } else if (idx === selectedIndex) {
            btnClass += " border-red-500 bg-red-50 text-red-700";
          } else {
            btnClass +=
              " border-[var(--theme-divider)] bg-[var(--theme-bg-primary)] text-[var(--theme-text-tertiary)] opacity-50";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={btnClass}
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <p
          className={`mt-4 text-center text-[14px] font-medium ${
            selectedIndex === correctOptionIndex
              ? "text-emerald-600"
              : "text-red-500"
          }`}
        >
          {selectedIndex === correctOptionIndex
            ? t.memorize.verification.correct
            : t.memorize.verification.wrong}
        </p>
      )}
    </div>
  );
}
