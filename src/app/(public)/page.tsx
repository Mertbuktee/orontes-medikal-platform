import type { Metadata } from 'next';

import { publicRoutes } from '@/config/site';
import { createPageMetadata } from '@/lib/seo/metadata';
import type {
  BoardRepairContent,
  FinalCtaContent,
  PreviewContent,
  ProcessContent,
  PublicHomepageSection,
  WhyUsContent,
} from '@/lib/homepage/homepage-types';
import { getPublicHomepageSections } from '@/lib/homepage/public-homepage';
import BlogPreview from '@/sections/BlogPreview/BlogPreview';
import BoardRepair from '@/sections/BoardRepair/BoardRepair';
import CTA from '@/sections/CTA/CTA';
import Devices from '@/sections/Devices/Devices';
import Hero from '@/sections/Hero/Hero';
import Process from '@/sections/Process/Process';
import Services from '@/sections/Services/Services';
import WhyUs from '@/sections/WhyUs/WhyUs';

const route = publicRoutes.find((item) => item.path === '/');

export async function generateMetadata(): Promise<Metadata> {
  const seo = await import('@/lib/homepage/public-homepage').then((module) =>
    module.getPublicHomepageSeo(),
  );

  return createPageMetadata({
    title: seo?.title ?? route?.title ?? 'Medikal Teknik Servis',
    description:
      seo?.description ??
      route?.description ??
      'Medikal cihaz teknik servisi ve elektronik kart onarımı.',
    path: '/',
  });
}

export default async function HomePage() {
  const sections = await getPublicHomepageSections();

  return (
    <main>
      <Hero />
      {sections.map((section) => (
        <HomepageSectionRenderer key={section.key} section={section} />
      ))}
    </main>
  );
}

function HomepageSectionRenderer({
  section,
}: {
  section: PublicHomepageSection;
}) {
  if (section.key === 'HERO_SUPPORTING_CONTENT') return null;

  if (section.key === 'SERVICES_PREVIEW') {
    const content = section.content as PreviewContent;
    return (
      <Services
        title={content.title}
        description={content.description}
        itemLimit={content.itemLimit}
        showViewAll={content.showViewAll}
        viewAllLabel={content.viewAllLabel}
      />
    );
  }

  if (section.key === 'DEVICES_PREVIEW') {
    const content = section.content as PreviewContent;
    return (
      <Devices
        title={content.title}
        description={content.description}
        itemLimit={content.itemLimit}
        showViewAll={content.showViewAll}
        viewAllLabel={content.viewAllLabel}
      />
    );
  }

  if (section.key === 'BOARD_REPAIR') {
    return <BoardRepair content={section.content as BoardRepairContent} />;
  }

  if (section.key === 'WHY_US') {
    return <WhyUs content={section.content as WhyUsContent} />;
  }

  if (section.key === 'PROCESS') {
    return <Process content={section.content as ProcessContent} />;
  }

  if (section.key === 'BLOG_PREVIEW') {
    const content = section.content as PreviewContent;
    return (
      <BlogPreview
        title={content.title}
        description={content.description}
        itemLimit={content.itemLimit}
        showViewAll={content.showViewAll}
        viewAllLabel={content.viewAllLabel}
      />
    );
  }

  if (section.key === 'FINAL_CTA') {
    const content = section.content as FinalCtaContent;
    return (
      <CTA
        title={content.title}
        description={content.description}
        primaryLink={{
          text: content.primaryLabel,
          href: content.primaryHref,
        }}
        secondaryLink={{
          text: content.secondaryLabel,
          href: content.secondaryHref,
        }}
        trustItems={content.trustItems}
      />
    );
  }

  return null;
}
