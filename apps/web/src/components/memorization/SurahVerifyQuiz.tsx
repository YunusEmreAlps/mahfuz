import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { useTranslation } from "~/hooks/useTranslation";

// Fallback Arabic words for distractor generation
const FALLBACK_WORDS = [
  "\u0671\u0644\u0644\u0651\u064E\u0647\u0650",
  "\u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650",
  "\u0671\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650",
  "\u0671\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F",
  "\u0631\u064E\u0628\u0651\u0650",
  "\u0671\u0644\u0652\u0639\u064E\u0640\u0670\u0644\u064E\u0645\u0650\u064A\u0646\u064E",
  "\u0645\u064E\u0640\u0670\u0644\u0650\u0643\u0650",
  "\u064A\u064E\u0648\u0652\u0645\u0650",
  "\u0671\u0644\u062F\u0651\u0650\u064A\u0646\u0650",
  "\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E",
  "\u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F",
  "\u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F",
  "\u0671\u0647\u0652\u062F\u0650\u0646\u064E\u0627",
  "\u0671\u0644\u0635\u0651\u0650\u0631\u064E\u200C\u0670\u0637\u064E",
  "\u0671\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E",
  "\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652",
  "\u0623\u064E\u0646\u0639\u064E\u0645\u0652\u062A\u064E",
  "\u0648\u064E\u0644\u064E\u0627",
  "\u0671\u0644\u0636\u0651\u064E\u0627\u0644\u0651\u0650\u064A\u0646\u064E",
  "\u0623\u064E\u0639\u064F\u0648\u0630\u064F",
];

interface BlankSlot {
  flatIdx: number;
  verseIdx: number;
  wordIdx: number;
  verseKey: string;
  wordPosition: number;
  correctWord: string;
  options: string[];
}

export interface BlankResult {
  verseKey: string;
  wordPosition: number;
  correctWord: string;
  selectedWord: string;
  isCorrect: boolean;
}

interface SurahVerifyQuizProps {
  surahId: number;
  onComplete: (results: {
    total: number;
    correct: number;
    results: BlankResult[];
  }) => void;
  onCancel: () => void;
}

interface WordMeta {
  verseIdx: number;
  wordIdx: number;
  verseKey: string;
  wordPosition: number;
  text: string;
}

export function SurahVerifyQuiz({
  surahId,
  onComplete,
  onCancel,
}: SurahVerifyQuizProps) {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(
    versesByChapterQueryOptions(surahId, 1, { perPage: 300 }),
  );

  const verses = data.verses;

  // Extract all words from all verses
  const allWords: WordMeta[] = useMemo(() => {
    const result: WordMeta[] = [];
    verses.forEach((verse, vIdx) => {
      const words =
        verse.words?.filter((w) => w.char_type_name === "word") || [];
      words.forEach((w, wIdx) => {
        result.push({
          verseIdx: vIdx,
          wordIdx: wIdx,
          verseKey: verse.verse_key,
          wordPosition: w.position,
          text: w.text_uthmani || w.text,
        });
      });
    });
    return result;
  }, [verses]);

  // Build blank slots on mount
  const blanks: BlankSlot[] = useMemo(() => {
    if (allWords.length === 0) return [];

    const totalWords = allWords.length;
    const blankRatio = totalWords <= 20 ? 0.4 : 0.25;
    let blankCount = Math.max(1, Math.round(totalWords * blankRatio));
    blankCount = Math.min(blankCount, 40);

    // Ensure at least 1 blank per verse (if verse has >= 3 words)
    const verseWordCounts = new Map<number, number>();
    allWords.forEach((w) => {
      verseWordCounts.set(
        w.verseIdx,
        (verseWordCounts.get(w.verseIdx) || 0) + 1,
      );
    });

    // Collect mandatory blanks (1 per verse with >= 3 words)
    const mandatoryIndices = new Set<number>();
    const verseFirstIdx = new Map<number, number>();
    allWords.forEach((w, i) => {
      if (!verseFirstIdx.has(w.verseIdx)) {
        verseFirstIdx.set(w.verseIdx, i);
      }
    });

    for (const [vIdx, count] of verseWordCounts) {
      if (count >= 3) {
        const start = verseFirstIdx.get(vIdx)!;
        const candidates = allWords
          .map((_, i) => i)
          .filter((i) => allWords[i].verseIdx === vIdx);
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        mandatoryIndices.add(pick);
      }
    }

    // Fill remaining blanks randomly
    const selectedIndices = new Set(mandatoryIndices);
    const available = allWords
      .map((_, i) => i)
      .filter((i) => !selectedIndices.has(i));
    // Shuffle available
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }
    let idx = 0;
    while (selectedIndices.size < blankCount && idx < available.length) {
      selectedIndices.add(available[idx]);
      idx++;
    }

    // Sort by position for sequential filling
    const sortedIndices = [...selectedIndices].sort((a, b) => a - b);

    // Build slots with options
    return sortedIndices.map((flatIdx) => {
      const word = allWords[flatIdx];
      const correct = word.text;

      // Gather distractors: same verse + neighboring verses
      const sameVerse = allWords.filter(
        (w, i) => w.verseIdx === word.verseIdx && i !== flatIdx,
      );
      const neighborVerses = allWords.filter(
        (w, i) =>
          Math.abs(w.verseIdx - word.verseIdx) <= 2 &&
          w.verseIdx !== word.verseIdx &&
          i !== flatIdx,
      );

      const pool = [...sameVerse, ...neighborVerses].map((w) => w.text);
      const unique = [...new Set(pool)].filter((w) => w !== correct);

      // If not enough, add from fallback
      while (unique.length < 4) {
        const fb =
          FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
        if (fb !== correct && !unique.includes(fb)) {
          unique.push(fb);
        }
      }

      // Shuffle and pick 3-4 distractors
      for (let i = unique.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unique[i], unique[j]] = [unique[j], unique[i]];
      }
      const distractors = unique.slice(0, Math.random() > 0.5 ? 3 : 4);

      // Build options and shuffle
      const options = [correct, ...distractors];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        flatIdx,
        verseIdx: word.verseIdx,
        wordIdx: word.wordIdx,
        verseKey: word.verseKey,
        wordPosition: word.wordPosition,
        correctWord: correct,
        options,
      };
    });
  }, [allWords]);

  const [currentBlankIdx, setCurrentBlankIdx] = useState(0);
  const [answers, setAnswers] = useState<
    Map<number, { selected: string; correct: boolean }>
  >(new Map());
  const [phase, setPhase] = useState<"quiz" | "complete">("quiz");

  const blankRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  // Auto-scroll to current blank
  useEffect(() => {
    if (phase !== "quiz" || blanks.length === 0) return;
    const el = blankRefs.current.get(blanks[currentBlankIdx]?.flatIdx);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentBlankIdx, phase, blanks]);

  const handlePickOption = useCallback(
    (word: string) => {
      if (phase !== "quiz") return;
      const blank = blanks[currentBlankIdx];
      if (!blank) return;

      const isCorrect = word === blank.correctWord;
      const next = new Map(answers);
      next.set(blank.flatIdx, { selected: word, correct: isCorrect });
      setAnswers(next);

      // Auto-advance after brief delay
      const delay = isCorrect ? 600 : 1000;
      setTimeout(() => {
        if (currentBlankIdx + 1 < blanks.length) {
          setCurrentBlankIdx(currentBlankIdx + 1);
        } else {
          // All blanks filled
          setPhase("complete");
          const results: BlankResult[] = blanks.map((b) => {
            const ans = next.get(b.flatIdx);
            return {
              verseKey: b.verseKey,
              wordPosition: b.wordPosition,
              correctWord: b.correctWord,
              selectedWord: ans?.selected || "",
              isCorrect: ans?.correct || false,
            };
          });
          const correct = results.filter((r) => r.isCorrect).length;
          onComplete({ total: results.length, correct, results });
        }
      }, delay);
    },
    [phase, blanks, currentBlankIdx, answers, onComplete],
  );

  // Build a set of blank flatIndices for quick lookup
  const blankSet = useMemo(
    () => new Set(blanks.map((b) => b.flatIdx)),
    [blanks],
  );

  const currentBlank = blanks[currentBlankIdx];
  const answeredCount = answers.size;
  const totalBlanks = blanks.length;

  if (blanks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 200px)" }}>
      {/* Header: progress bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="text-[13px] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
          >
            {t.common.close}
          </button>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[12px] font-medium text-emerald-500">
            {t.memorize.verification.quizTitle}
          </span>
          <span className="text-[13px] tabular-nums text-[var(--theme-text-tertiary)]">
            {answeredCount} / {totalBlanks}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${((answeredCount) / totalBlanks) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Surah text with blanks */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)] sm:p-6"
        dir="rtl"
      >
        {verses.map((verse, vIdx) => {
          const words =
            verse.words?.filter((w) => w.char_type_name === "word") || [];
          return (
            <p
              key={verse.verse_key}
              className="arabic-text mb-3 leading-[2.6] text-[var(--theme-text)]"
              style={{ fontSize: "calc(1.65rem * 1.05)" }}
            >
              {words.map((w, wIdx) => {
                // Find the flat index for this word
                const flatIdx = allWords.findIndex(
                  (aw) => aw.verseIdx === vIdx && aw.wordIdx === wIdx,
                );
                const isBlank = blankSet.has(flatIdx);
                const answer = answers.get(flatIdx);

                if (!isBlank) {
                  return (
                    <span key={w.id} className="inline-block">
                      {w.text_uthmani || w.text}{" "}
                    </span>
                  );
                }

                // Blank pill
                const isCurrent =
                  phase === "quiz" && currentBlank?.flatIdx === flatIdx;
                const isAnswered = answer !== undefined;

                let pillClass =
                  "inline-block rounded-lg px-1.5 py-0.5 mx-0.5 transition-all cursor-pointer ";
                if (isAnswered) {
                  pillClass += answer.correct
                    ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                    : "bg-red-500/15 text-red-500 border border-red-500/30";
                } else if (isCurrent) {
                  pillClass +=
                    "bg-primary-500/15 border-2 border-primary-500 text-primary-500 animate-pulse";
                } else {
                  pillClass +=
                    "bg-[var(--theme-hover-bg)] border border-dashed border-[var(--theme-text-quaternary)] text-[var(--theme-text-quaternary)]";
                }

                return (
                  <span
                    key={w.id}
                    ref={(el) => {
                      if (el) blankRefs.current.set(flatIdx, el);
                    }}
                    className={pillClass}
                    onClick={() => {
                      // Allow tapping unfilled blanks to jump to them
                      if (!isAnswered && phase === "quiz") {
                        const blankIdx = blanks.findIndex(
                          (b) => b.flatIdx === flatIdx,
                        );
                        if (blankIdx >= 0) setCurrentBlankIdx(blankIdx);
                      }
                    }}
                  >
                    {isAnswered ? (
                      answer.correct ? (
                        w.text_uthmani || w.text
                      ) : (
                        <span className="line-through">{answer.selected}</span>
                      )
                    ) : (
                      "..."
                    )}{" "}
                  </span>
                );
              })}
              {/* Verse number marker */}
              <span className="inline-block text-[0.65em] text-[var(--theme-text-quaternary)]">
                {" "}
                ﴿{verse.verse_number}﴾
              </span>
            </p>
          );
        })}
      </div>

      {/* Bottom options bar */}
      {phase === "quiz" && currentBlank && !answers.has(currentBlank.flatIdx) && (
        <div className="sticky bottom-0 mt-3 rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)]">
          <p className="mb-3 text-center text-[12px] text-[var(--theme-text-tertiary)]">
            {t.memorize.verification.pickWord}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {currentBlank.options.map((word, idx) => (
              <button
                key={idx}
                onClick={() => handlePickOption(word)}
                className="arabic-text rounded-xl border-2 border-[var(--theme-divider)] bg-[var(--theme-bg-primary)] px-3 py-2.5 text-center text-[17px] text-[var(--theme-text)] transition-all hover:border-primary-400 hover:bg-primary-500/10 active:scale-[0.97]"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback flash when just answered */}
      {phase === "quiz" &&
        currentBlank &&
        answers.has(currentBlank.flatIdx) && (
          <div className="mt-3 rounded-2xl bg-[var(--theme-bg-primary)] p-4 text-center shadow-[var(--shadow-card)]">
            <p
              className={`text-[15px] font-medium ${
                answers.get(currentBlank.flatIdx)!.correct
                  ? "text-emerald-600"
                  : "text-red-500"
              }`}
            >
              {answers.get(currentBlank.flatIdx)!.correct
                ? t.memorize.verification.correct
                : t.memorize.verification.wrong}
            </p>
          </div>
        )}
    </div>
  );
}
