import { Outlet, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { useKidsStore, useActiveKidsProfile } from "~/stores/useKidsStore";
import { KidsTabBar } from "./KidsTabBar";
import { AvatarDisplay } from "./AvatarDisplay";
import { FloatingMascot } from "./Mascot";
import { CelebrationOverlay } from "./CelebrationOverlay";
import { KIDS_LEVELS } from "~/lib/kids-constants";

export function KidsLayout() {
  const { t } = useTranslation();
  const profile = useActiveKidsProfile();
  const level = useKidsStore((s) => s.level);
  const stars = useKidsStore((s) => s.stars);
  const gems = useKidsStore((s) => s.gems);
  const streak = useKidsStore((s) => s.streak);
  const startSession = useKidsStore((s) => s.startSession);
  const tickSession = useKidsStore((s) => s.tickSession);
  const sessionTimeSpent = useKidsStore((s) => s.sessionTimeSpent);
  const dailyTimeLimit = useKidsStore((s) => s.dailyTimeLimit);

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Session timer
  useEffect(() => {
    startSession();
    timerRef.current = setInterval(tickSession, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startSession, tickSession]);

  const currentLevel = KIDS_LEVELS.find((l) => l.id === level) ?? KIDS_LEVELS[0];
  const nextLevel = KIDS_LEVELS[level] ?? null; // level is 1-indexed
  const progressToNext = nextLevel
    ? Math.min(((stars - currentLevel.starsRequired) / (nextLevel.starsRequired - currentLevel.starsRequired)) * 100, 100)
    : 100;

  // Level-up celebration
  const [celebration, setCelebration] = useState<{ type: "levelUp"; message: string } | null>(null);
  const prevLevelRef = useRef(level);
  useEffect(() => {
    if (level > prevLevelRef.current) {
      const lvl = KIDS_LEVELS.find((l) => l.id === level);
      setCelebration({
        type: "levelUp",
        message: `${t.kids.mascot.levelUp} ${lvl ? t.kids.levels[lvl.key as keyof typeof t.kids.levels] : ""}`,
      });
    }
    prevLevelRef.current = level;
  }, [level, t]);

  // Mascot messages
  const mascotMessages = useMemo(() => [
    t.kids.mascot.keepGoing,
    t.kids.mascot.streakReminder,
    t.kids.mascot.greatJob,
  ], [t]);

  const timeLimitReached = dailyTimeLimit > 0 && sessionTimeSpent >= dailyTimeLimit * 60;

  if (timeLimitReached) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-amber-50 to-emerald-50 p-8 text-center">
        <div className="text-6xl">🌙</div>
        <h1 className="text-2xl font-bold text-emerald-700">{t.kids.session.timeUp}</h1>
        <p className="text-lg text-emerald-600">{t.kids.session.timeUpMessage}</p>
        <Link
          to="/browse"
          className="mt-4 rounded-2xl bg-emerald-500 px-8 py-3 text-lg font-bold text-white shadow-lg active:scale-95"
        >
          {t.kids.nav.backToApp}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 to-emerald-50">
      {/* Kids Header */}
      <header className="sticky top-0 z-20 border-b-2 border-emerald-200 bg-white/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left: Back to main app */}
          <Link
            to="/browse"
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[13px] font-medium text-emerald-600 hover:bg-emerald-50 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="hidden sm:inline">{t.kids.nav.backToApp}</span>
          </Link>

          {/* Center: Avatar + Level progress */}
          <div className="flex items-center gap-2">
            {profile && (
              <AvatarDisplay
                name={profile.name}
                avatarId={profile.avatarId}
                level={level}
                size="sm"
                showLevel
              />
            )}
            <div className="hidden sm:block">
              <div className="text-[12px] font-semibold text-emerald-700">
                {t.kids.levels[currentLevel.key as keyof typeof t.kids.levels]}
              </div>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Stars + Gems + Streak */}
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-[13px] font-bold text-orange-500">
                🔥 {streak}
              </span>
            )}
            <span className="hidden items-center gap-1 text-[13px] font-bold text-amber-500 sm:flex">
              ⭐ {stars}
            </span>
            <span className="hidden items-center gap-1 text-[13px] font-bold text-indigo-400 sm:flex">
              💎 {gems}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-[120px] lg:pb-6">
        <Outlet />
      </main>

      {/* Floating Mascot */}
      <FloatingMascot messages={mascotMessages} mood="happy" />

      {/* Celebration Overlay */}
      {celebration && (
        <CelebrationOverlay
          type={celebration.type}
          visible
          message={celebration.message}
          onComplete={() => setCelebration(null)}
        />
      )}

      {/* Bottom Tab Bar */}
      <KidsTabBar />
    </div>
  );
}
