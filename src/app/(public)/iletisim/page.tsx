import type { Metadata } from 'next';

import { publicRoutes } from '@/config/site';
import { createPageMetadata } from '@/lib/seo/metadata';
import { createLocalBusinessJsonLd } from '@/lib/seo/structured-data';
import { getPublicSiteSettings } from '@/lib/site-settings/public-site-settings';
import Contact from '@/sections/Contact/Contact';

const route = publicRoutes.find((item) => item.path === '/iletisim');

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? 'İletişim',
  description:
    route?.description ?? 'Telefon, e-posta ve ofis konumu iletişim bilgileri.',
  path: '/iletisim',
});

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();

  return (
    <main>
      <Contact />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createLocalBusinessJsonLd(settings)),
        }}
      />
    </main>
  );
}
