import type { Metadata } from "next";

import { publicRoutes } from "@/config/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import { createLocalBusinessJsonLd } from "@/lib/seo/structured-data";
import Contact from "@/sections/Contact/Contact";

const route = publicRoutes.find((item) => item.path === "/iletisim");

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? "İletişim | Orontes Teknoloji",
  description:
    route?.description ??
    "Orontes Teknoloji iletişim bilgileri ve ofis konumu.",
  path: "/iletisim",
});

export default function ContactPage() {
  return (
    <main>
      <Contact />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createLocalBusinessJsonLd()),
        }}
      />
    </main>
  );
}
