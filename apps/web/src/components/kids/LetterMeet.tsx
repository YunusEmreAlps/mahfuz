import { useTranslation } from "~/hooks/useTranslation";
import type { ArabicLetter } from "~/lib/kids-constants";

interface LetterMeetProps {
  letter: ArabicLetter;
  onComplete: () => void;
}

export function LetterMeet({ letter, onComplete }: LetterMeetProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Big letter with animation */}
      <div className="animate-[scaleIn_0.6s_ease-out_forwards] flex h-48 w-48 items-center justify-center rounded-3xl bg-white shadow-xl">
        <span className="font-arabic text-[120px] leading-none text-emerald-600" dir="rtl">
          {letter.arabic}
        </span>
      </div>

      {/* Letter info */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">{letter.name}</h2>
        <p className="mt-1 font-arabic text-xl text-gray-500" dir="rtl">{letter.nameAr}</p>
        <p className="mt-1 text-[14px] text-gray-400">#{letter.order} / 28</p>
      </div>

      {/* Forms: isolated, initial, medial, final */}
      <div className="grid grid-cols-4 gap-3">
        {["isolated", "initial", "medial", "final"].map((form) => (
          <div key={form} className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 shadow-sm">
            <span className="font-arabic text-3xl text-gray-700" dir="rtl">{letter.arabic}</span>
            <span className="text-[10px] font-medium text-gray-400 capitalize">{form}</span>
          </div>
        ))}
      </div>

      {/* Continue button */}
      <button
        onClick={onComplete}
        className="mt-4 rounded-2xl bg-emerald-500 px-10 py-4 text-lg font-bold text-white shadow-lg transition-transform active:scale-95"
      >
        {t.kids.common.next} →
      </button>

      <style>{`
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          60% { transform: scale(1.05) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
