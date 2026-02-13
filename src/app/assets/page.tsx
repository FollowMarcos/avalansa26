import { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { AssetsPage } from "@/components/assets/assets-page";

export const metadata: Metadata = {
  title: "Assets",
  description:
    "Manage your uploaded reference images. Upload, organize, rename, and delete images used for AI generation.",
  alternates: {
    canonical: "/assets",
  },
  openGraph: {
    title: "Assets | Avalansa",
    description:
      "Manage your uploaded reference images. Upload, organize, rename, and delete images used for AI generation.",
    url: "/assets",
    type: "website",
    locale: "en_US",
  },
};

export default function AssetsRoute() {
  return (
    <PageShell showDock={true} dockPosition="bottom">
      <AssetsPage />
    </PageShell>
  );
}
