import { Providers } from "@/components/Providers";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { listCategories } from "@/lib/catalog";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Wrap Art", template: "%s · Wrap Art" },
  description: "Device skins, screen guards, and tech accessories cut for your model.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await listCategories().catch(() => []);
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteChrome categories={categories}>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
