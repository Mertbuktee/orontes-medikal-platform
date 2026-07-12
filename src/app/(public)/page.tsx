import type { Metadata } from "next";

import { publicRoutes } from "@/config/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import BlogPreview from "@/sections/BlogPreview/BlogPreview";
import BoardRepair from "@/sections/BoardRepair/BoardRepair";
import CTA from "@/sections/CTA/CTA";
import Devices from "@/sections/Devices/Devices";
import Hero from "@/sections/Hero/Hero";
import Process from "@/sections/Process/Process";
import Services from "@/sections/Services/Services";
import WhyUs from "@/sections/WhyUs/WhyUs";

const route = publicRoutes.find((item) => item.path === "/");

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? "Orontes Teknoloji | Medikal Teknik Servis",
  description:
    route?.description ??
    "Medikal cihaz teknik servisi ve elektronik kart onarımı.",
  path: "/",
});

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Services />
      <Devices />
      <BoardRepair />
      <WhyUs />
      <Process />
      <BlogPreview />
      <CTA />
    </main>
  );
}
