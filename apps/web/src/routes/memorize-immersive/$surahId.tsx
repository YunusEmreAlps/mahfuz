import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { memorizeWbwByChapterQueryOptions } from "~/hooks/useWbwData";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { mergeWbwIntoVerses } from "~/lib/quran-data";
import { useMemorizationStore } from "~/stores/useMemorizationStore";
import { useGradeFromMode } from "~/hooks/useMemorization";
import { ImmersiveLayout } from "~/components/memorization/ImmersiveLayout";
import { ImmersiveContent } from "~/components/memorization/ImmersiveContent";
import { Loading } from "~/components/ui/Loading";
import type { ModeResult } from "~/stores/useMemorizationStore";
import { getSession } from "~/lib/auth-session";

export const Route = createFileRoute("/memorize-immersive/$surahId")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session) {
      throw new Response("", {
        status: 302,
        headers: { Location: `/auth/login?redirect=${location.pathname}` },
      });
    }
    return { session };
  },
  loader: async ({ context, params }) => {
    const sid = Number(params.surahId);
    await Promise.all([
      context.queryClient.ensureQueryData(versesByChapterQueryOptions(sid)),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]);
    context.queryClient.prefetchQuery(memorizeWbwByChapterQueryOptions(sid));
  },
  pendingComponent: () => <Loading text="Yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `Odaklan · Sûre ${params.surahId} | Mahfuz` }],
  }),
  component: ImmersiveRoute,
});

function ImmersiveRoute() {
  const { surahId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const navigate = useNavigate();
  const sid = Number(surahId);

  const { data: chaptersData } = useSuspenseQuery(chaptersQueryOptions());
  const chapter = chaptersData.find((c) => c.id === sid);

  const { data: versesData } = useSuspenseQuery(versesByChapterQueryOptions(sid));
  const { data: wbwData } = useQuery(memorizeWbwByChapterQueryOptions(sid));
  const verses = mergeWbwIntoVerses(versesData.verses, wbwData);

  const currentVerseIndex = useMemorizationStore((s) => s.currentVerseIndex);
  const startMode = useMemorizationStore((s) => s.startMode);
  const setCurrentVerse = useMemorizationStore((s) => s.setCurrentVerse);
  const finishMode = useMemorizationStore((s) => s.finishMode);
  const resetSession = useMemorizationStore((s) => s.resetSession);
  const phase = useMemorizationStore((s) => s.phase);

  const { gradeMode } = useGradeFromMode(userId);

  useEffect(() => {
    if (phase === "idle" && verses.length > 0) {
      startMode("immersive", sid, verses.length);
    }
  }, [phase, sid, verses.length, startMode]);

  const handleClose = useCallback(() => {
    resetSession();
    navigate({ to: "/memorize/session/$surahId", params: { surahId: String(sid) } });
  }, [resetSession, navigate, sid]);

  const handleVerseChange = useCallback((idx: number) => {
    setCurrentVerse(idx);
  }, [setCurrentVerse]);

  const handleComplete = useCallback(
    async (result: ModeResult) => {
      finishMode(result);
      await gradeMode(result);
      resetSession();
      navigate({ to: "/memorize/session/$surahId", params: { surahId: String(sid) } });
    },
    [finishMode, gradeMode, resetSession, navigate, sid],
  );

  return (
    <ImmersiveLayout
      onClose={handleClose}
      verseCounter={`${currentVerseIndex + 1} / ${verses.length} · ${chapter?.name_arabic || ""}`}
    >
      <ImmersiveContent
        surahId={sid}
        verses={verses}
        onVerseChange={handleVerseChange}
        onComplete={handleComplete}
      />
    </ImmersiveLayout>
  );
}
