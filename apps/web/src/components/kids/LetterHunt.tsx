import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { ARABIC_LETTERS, type ArabicLetter } from "~/lib/kids-constants";
import { useKidsSound } from "~/lib/kids-sounds";

interface LetterHuntProps {
  letter: ArabicLetter;
  onComplete: () => void;
}

interface Cell {
  id: number;
  arabic: string;
  letterId: string;
  found: boolean;
}

/**
 * Harf Avı — Karışık harfler arasından hedef harfi bul ve dokun.
 * 4x4 ızgarada 3-4 hedef harf gizli, geri kalan rastgele.
 * Tüm hedefleri bulunca onComplete çağrılır.
 */
export function LetterHunt({ letter, onComplete }: LetterHuntProps) {
  const { t } = useTranslation();
  const sound = useKidsSound();

  const TARGET_COUNT = 4;
  const GRID_SIZE = 16; // 4x4

  // Build the grid once per letter
  const initialGrid = useMemo(() => {
    const distractors = ARABIC_LETTERS.filter((l) => l.id !== letter.id);
    const cells: Cell[] = [];

    // Place targets
    const targetPositions = new Set<number>();
    while (targetPositions.size < TARGET_COUNT) {
      targetPositions.add(Math.floor(Math.random() * GRID_SIZE));
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      if (targetPositions.has(i)) {
        cells.push({ id: i, arabic: letter.arabic, letterId: letter.id, found: false });
      } else {
        const rand = distractors[Math.floor(Math.random() * distractors.length)];
        cells.push({ id: i, arabic: rand.arabic, letterId: rand.id, found: false });
      }
    }
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.id]);

  const [grid, setGrid] = useState<Cell[]>(initialGrid);
  const [mistakes, setMistakes] = useState(0);
  const [shakeId, setShakeId] = useState<number | null>(null);

  const foundCount = grid.filter((c) => c.found).length;
  const allFound = foundCount >= TARGET_COUNT;

  const handleTap = useCallback(
    (cell: Cell) => {
      if (cell.found || allFound) return;

      if (cell.letterId === letter.id) {
        // Correct — mark found
        sound.star();
        setGrid((prev) => prev.map((c) => (c.id === cell.id ? { ...c, found: true } : c)));

        // Check if all done
        if (foundCount + 1 >= TARGET_COUNT) {
          sound.correct();
          setTimeout(onComplete, 800);
        }
      } else {
        // Wrong — shake
        sound.incorrect();
        setMistakes((m) => m + 1);
        setShakeId(cell.id);
        setTimeout(() => setShakeId(null), 500);
      }
    },
    [letter.id, foundCount, allFound, onComplete, sound],
  );

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <h2 className="text-xl font-bold text-blue-700">{t.kids.letters.letterHunt}</h2>

      {/* Target indicator */}
      <div className="flex items-center gap-3">
        <p className="text-[14px] text-gray-500">Bul:</p>
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
          <span className="font-arabic text-3xl text-blue-600" dir="rtl">{letter.arabic}</span>
        </div>
        <p className="text-[14px] font-semibold text-blue-500">
          {foundCount}/{TARGET_COUNT}
        </p>
      </div>

      {/* 4x4 Grid */}
      <div className="grid grid-cols-4 gap-2">
        {grid.map((cell) => {
          const isTarget = cell.letterId === letter.id;
          let bg = "bg-white";
          let ring = "";
          if (cell.found) {
            bg = "bg-emerald-100";
            ring = "ring-2 ring-emerald-300";
          }

          return (
            <button
              key={cell.id}
              onClick={() => handleTap(cell)}
              disabled={cell.found}
              className={`flex h-16 w-16 items-center justify-center rounded-xl shadow-sm transition-transform ${bg} ${ring} ${
                shakeId === cell.id ? "animate-[shake_0.3s_ease-in-out]" : ""
              } ${cell.found ? "" : "active:scale-90"}`}
            >
              {cell.found ? (
                <span className="text-2xl">⭐</span>
              ) : (
                <span className="font-arabic text-2xl text-gray-700" dir="rtl">{cell.arabic}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {allFound && (
        <p className="animate-bounce text-lg font-bold text-emerald-500">{t.kids.common.great}</p>
      )}
      {mistakes > 0 && !allFound && (
        <p className="text-[12px] text-gray-400">
          {mistakes} {t.kids.common.tryAgain.toLowerCase()}
        </p>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
        }
      `}</style>
    </div>
  );
}
