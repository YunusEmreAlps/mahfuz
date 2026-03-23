import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { ARABIC_LETTERS, type ArabicLetter } from "~/lib/kids-constants";
import { useKidsSound } from "~/lib/kids-sounds";

interface SoundMatchProps {
  letter: ArabicLetter;
  onComplete: () => void;
}

/**
 * Ses Eşleştirme — 4 harf göster, birinin sesini oku, çocuk doğrusunu seçsin.
 * 3 tur başarıyla tamamlanırsa onComplete çağrılır.
 */
export function SoundMatch({ letter, onComplete }: SoundMatchProps) {
  const { t } = useTranslation();
  const sound = useKidsSound();
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  const TOTAL_ROUNDS = 3;

  // Generate 4 options per round (target + 3 distractors)
  const options = useMemo(() => {
    const others = ARABIC_LETTERS.filter((l) => l.id !== letter.id);
    const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    const all = [...shuffled, letter].sort(() => Math.random() - 0.5);
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.id, round]);

  const handleSelect = useCallback(
    (opt: ArabicLetter) => {
      if (result) return; // Already answered
      setSelected(opt.id);

      if (opt.id === letter.id) {
        setResult("correct");
        sound.correct();
      } else {
        setResult("wrong");
        sound.incorrect();
      }

      // Auto-advance after feedback
      setTimeout(() => {
        if (opt.id === letter.id) {
          const next = round + 1;
          if (next >= TOTAL_ROUNDS) {
            onComplete();
          } else {
            setRound(next);
            setSelected(null);
            setResult(null);
          }
        } else {
          // Wrong answer — just reset selection so they can try again
          setSelected(null);
          setResult(null);
        }
      }, 900);
    },
    [letter.id, round, result, onComplete, sound],
  );

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <h2 className="text-xl font-bold text-purple-700">{t.kids.letters.soundMatch}</h2>

      {/* Prompt: show the target letter name as a hint */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-[14px] text-gray-500">Bu harfi bul:</p>
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-100 shadow-sm">
          <span className="text-3xl font-bold text-purple-600">{letter.name}</span>
        </div>
      </div>

      {/* Round progress */}
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-all ${
              i < round ? "bg-purple-400 scale-110" : i === round ? "bg-purple-200 scale-100" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* 4 Letter choices (2x2 grid) */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.id === letter.id;
          let bg = "bg-white";
          let ring = "ring-1 ring-gray-200";
          if (isSelected && result === "correct") {
            bg = "bg-emerald-100";
            ring = "ring-2 ring-emerald-400";
          } else if (isSelected && result === "wrong") {
            bg = "bg-orange-50";
            ring = "ring-2 ring-orange-300";
          } else if (result === "correct" && isCorrect) {
            bg = "bg-emerald-50";
            ring = "ring-2 ring-emerald-300";
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              disabled={result !== null}
              className={`flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl shadow-sm transition-transform active:scale-90 ${bg} ${ring}`}
            >
              <span className="font-arabic text-4xl leading-none text-gray-800" dir="rtl">
                {opt.arabic}
              </span>
              <span className="text-[11px] font-medium text-gray-400">{opt.name}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {result === "correct" && (
        <p className="animate-bounce text-lg font-bold text-emerald-500">{t.kids.common.great}</p>
      )}
      {result === "wrong" && (
        <p className="text-[14px] font-semibold text-orange-400">{t.kids.common.tryAgain}</p>
      )}
    </div>
  );
}
