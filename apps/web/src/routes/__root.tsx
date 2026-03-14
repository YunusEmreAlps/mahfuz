import { useEffect } from "react";
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getSession } from "~/lib/auth-session";
import type { Session } from "~/lib/auth";
import { migrateV1ToV2 } from "~/lib/store-migration";
import appCss from "~/styles/app.css?url";

interface RouterContext {
  queryClient: QueryClient;
  session: Session | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const session = await getSession();
    return { session };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mahfuz v2 | Kuran-ı Kerim" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: ({ children }: { children: ReactNode }) => (
    <RootLayout>{children}</RootLayout>
  ),
});

function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    migrateV1ToV2();
  }, []);

  return (
    <html lang="tr">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
