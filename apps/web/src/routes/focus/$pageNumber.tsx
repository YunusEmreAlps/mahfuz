import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TOTAL_PAGES } from "@mahfuz/shared/constants";
import { versesByPageQueryOptions } from "~/hooks/useVerses";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { FocusLayout } from "~/components/focus/FocusLayout";
import { FocusPageContent } from "~/components/focus/FocusPageContent";
import { AnnotationCanvas } from "~/components/focus/AnnotationCanvas";
import { AnnotationToolbar } from "~/components/focus/AnnotationToolbar";
import { Loading } from "~/components/ui/Loading";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";

export const Route = createFileRoute("/focus/$pageNumber")({
  validateSearch: () => ({}),
  loader: ({ context, params }) => {
    const pageNum = Number(params.pageNumber);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > TOTAL_PAGES) {
      throw new Error(`Invalid page number: ${params.pageNumber}`);
    }
    return Promise.all([
      context.queryClient.ensureQueryData(versesByPageQueryOptions(pageNum)),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loading text="Yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `Focus · Sayfa ${params.pageNumber} | Mahfuz` }],
  }),
  component: FocusRoute,
});

function FocusRoute() {
  const { pageNumber } = Route.useParams();
  const pageNum = Number(pageNumber);

  const { data: versesData } = useSuspenseQuery(
    versesByPageQueryOptions(pageNum),
  );
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const translatedVerses = useTranslatedVerses(versesData.verses);

  return (
    <FocusLayout
      pageNumber={pageNum}
      overlay={
        <>
          <AnnotationCanvas pageNumber={pageNum} />
          <AnnotationToolbar pageNumber={pageNum} chapters={chapters} />
        </>
      }
    >
      <FocusPageContent
        pageNumber={pageNum}
        verses={translatedVerses}
        chapters={chapters}
      />
    </FocusLayout>
  );
}
