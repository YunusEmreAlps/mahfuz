import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { memorizeWbwByChapterQueryOptions } from "~/hooks/useWbwData";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { mergeWbwIntoVerses } from "~/lib/quran-data";
import type { ChapterAudioData } from "@mahfuz/audio-engine";
import { useAudioStore } from "~/stores/useAudioStore";
import { useMemorizationStore } from "~/stores/useMemorizationStore";
import { useGradeFromMode } from "~/hooks/useMemorization";
import { ModeLayout } from "~/components/memorization/ModeLayout";
import { LearnMode } from "~/components/memorization/LearnMode";
import { ListenMode } from "~/components/memorization/ListenMode";
import { TestMode } from "~/components/memorization/TestMode";
import { TypeMode } from "~/components/memorization/TypeMode";
import { SessionResults } from "~/components/memorization/SessionResults";
import { VerseRangeSelector } from "~/components/memorization/VerseRangeSelector";
import { Loading } from "~/components/ui/Loading";
import type { MemorizeMode, ModeResult } from "~/stores/useMemorizationStore";

interface ModeSearch {
  mode: MemorizeMode;
}

export const Route = createFileRoute("/_app/_protected/memorize/mode/$surahId")({
  validateSearch: (search: Record<string, unknown>): ModeSearch => ({
    mode: (search.mode as MemorizeMode) || "learn",
  }),
  loader: async ({ context, params }) => {
    const sid = Number(params.surahId);
    await Promise.all([
      context.queryClient.ensureQueryData(versesByChapterQueryOptions(sid)),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
      context.queryClient.ensureQueryData(memorizeWbwByChapterQueryOptions(sid)),
    ]);
  },
  pendingComponent: () => <Loading text="Yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `Ezberleme · Sûre ${params.surahId} | Mahfuz` }],
  }),
  component: () => (
    <Suspense fallback={<Loading text="Yükleniyor..." />}>
      <ModeRoute />
    </Suspense>
  ),
});

function ModeRoute() {
  const { surahId } = Route.useParams();
  const { mode } = Route.useSearch();
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const navigate = useNavigate();
  const sid = Number(surahId);
  const reciterId = useAudioStore((s) => s.reciterId);

  const { data: chaptersData } = useSuspenseQuery(chaptersQueryOptions());
  const chapter = chaptersData.find((c) => c.id === sid);
  const surahName = chapter?.name_arabic || `Sûre ${sid}`;

  // Static verses
  const { data: versesData } = useSuspenseQuery(versesByChapterQueryOptions(sid));
  // WBW data
  const { data: wbwData } = useQuery(memorizeWbwByChapterQueryOptions(sid));
  // Audio data (for listen mode) — transform QDCAudioFile → ChapterAudioData
  const { data: rawAudioData } = useQuery(chapterAudioQueryOptions(reciterId, sid));
  const audioData: ChapterAudioData | null = rawAudioData
    ? {
        audioUrl: rawAudioData.audio_url,
        verseTimings: rawAudioData.verse_timings.map((t) => ({
          verseKey: t.verse_key,
          from: t.timestamp_from,
          to: t.timestamp_to,
          segments: t.segments,
        })),
      }
    : null;

  // Merge WBW into verses
  const verses = mergeWbwIntoVerses(versesData.verses, wbwData);

  // Verse range selection — skip picker for short surahs (≤10 verses)
  const [selectedRange, setSelectedRange] = useState<{ from: number; to: number } | null>(() => {
    if (verses?.length && verses.length <= 10) return { from: 1, to: verses.length };
    return null;
  });

  // Store state
  const phase = useMemorizationStore((s) => s.phase);
  const currentVerseIndex = useMemorizationStore((s) => s.currentVerseIndex);
  const lastModeResult = useMemorizationStore((s) => s.lastModeResult);
  const startMode = useMemorizationStore((s) => s.startMode);
  const setCurrentVerse = useMemorizationStore((s) => s.setCurrentVerse);
  const finishMode = useMemorizationStore((s) => s.finishMode);
  const resetSession = useMemorizationStore((s) => s.resetSession);

  const { gradeMode } = useGradeFromMode(userId);

  // Slice verses and audioData based on selected range
  const selectedVerses = selectedRange && verses?.length
    ? verses.slice(selectedRange.from - 1, selectedRange.to)
    : verses ?? [];
  const selectedAudioData = selectedRange && audioData?.verseTimings
    ? {
        ...audioData,
        verseTimings: audioData.verseTimings.slice(selectedRange.from - 1, selectedRange.to),
      }
    : audioData ?? null;

  // Start mode once when range is selected
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current && selectedRange && selectedVerses.length > 0) {
      startedRef.current = true;
      startMode(mode, sid, selectedVerses.length);
    }
  }, [selectedRange, selectedVerses.length, startMode, mode, sid]);

  const handleVerseChange = useCallback((idx: number) => {
    setCurrentVerse(idx);
  }, [setCurrentVerse]);

  const handleComplete = useCallback(
    async (result: ModeResult) => {
      finishMode(result);
      // Grade via SM-2
      await gradeMode(result);
    },
    [finishMode, gradeMode],
  );

  const handleClose = useCallback(() => {
    resetSession();
    navigate({ to: "/memorize/session/$surahId", params: { surahId: String(sid) } });
  }, [resetSession, navigate, sid]);

  const handleResultsContinue = useCallback(() => {
    resetSession();
    navigate({ to: "/memorize/session/$surahId", params: { surahId: String(sid) } });
  }, [resetSession, navigate, sid]);

  const handleRangeBack = useCallback(() => {
    resetSession();
    navigate({ to: "/memorize/session/$surahId", params: { surahId: String(sid) } });
  }, [resetSession, navigate, sid]);

  // Show range selector if no range selected yet
  if (!selectedRange && phase === "idle") {
    return (
      <VerseRangeSelector
        versesCount={verses.length}
        surahName={surahName}
        mode={mode}
        onSelect={setSelectedRange}
        onBack={handleRangeBack}
      />
    );
  }

  // Results screen
  if (phase === "results" && lastModeResult) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <SessionResults
          result={lastModeResult}
          onContinue={handleResultsContinue}
        />
      </div>
    );
  }

  return (
    <ModeLayout
      mode={mode}
      surahName={surahName}
      currentVerseIndex={currentVerseIndex}
      totalVerses={selectedVerses.length}
      onClose={handleClose}
    >
      {mode === "learn" && (
        <LearnMode
          surahId={sid}
          verses={selectedVerses}
          onVerseChange={handleVerseChange}
          onComplete={handleComplete}
        />
      )}
      {mode === "listen" && selectedAudioData && (
        <ListenMode
          surahId={sid}
          surahName={surahName}
          verses={selectedVerses}
          audioData={selectedAudioData}
          onVerseChange={handleVerseChange}
          onComplete={handleComplete}
        />
      )}
      {mode === "listen" && !selectedAudioData && (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      )}
      {mode === "test" && (
        <TestMode
          surahId={sid}
          verses={selectedVerses}
          onVerseChange={handleVerseChange}
          onComplete={handleComplete}
        />
      )}
      {mode === "type" && (
        <TypeMode
          surahId={sid}
          verses={selectedVerses}
          onVerseChange={handleVerseChange}
          onComplete={handleComplete}
        />
      )}
    </ModeLayout>
  );
}
