import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { ModePicker } from "~/components/memorization/ModePicker";
import { Loading } from "~/components/ui/Loading";

export const Route = createFileRoute("/_app/_protected/memorize/session/$surahId")({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(chaptersQueryOptions());
  },
  pendingComponent: () => <Loading text="Yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `Ezberleme · Sûre ${params.surahId} | Mahfuz` }],
  }),
  component: SessionRoute,
});

function SessionRoute() {
  const { surahId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const sid = Number(surahId);

  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const chapter = chapters.find((c) => c.id === sid);

  if (!chapter) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[var(--theme-text-tertiary)]">Sûre bulunamadı</p>
      </div>
    );
  }

  return (
    <ModePicker
      surahId={sid}
      surahName={chapter.name_arabic}
      versesCount={chapter.verses_count}
      userId={userId}
    />
  );
}
