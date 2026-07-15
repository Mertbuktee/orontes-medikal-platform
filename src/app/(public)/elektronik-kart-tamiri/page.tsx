import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { publicRoutes } from '@/config/site';
import { createPageMetadata } from '@/lib/seo/metadata';
import BoardRepair from '@/sections/BoardRepair/BoardRepair';

const route = publicRoutes.find(
  (item) => item.path === '/elektronik-kart-tamiri',
);

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? 'Elektronik Kart Tamiri',
  description:
    route?.description ??
    'Medikal cihaz elektronik kartlarında arıza tespiti ve onarım.',
  path: '/elektronik-kart-tamiri',
});

export default function ElectronicBoardRepairPage() {
  return (
    <main>
      <section className="bg-slate-950 px-4 pt-16 text-white sm:px-6 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs
            items={[
              { name: 'Ana Sayfa', path: '/' },
              {
                name: 'Elektronik Kart Tamiri',
                path: '/elektronik-kart-tamiri',
              },
            ]}
          />
          <p className="text-sm font-semibold tracking-[0.18em] text-orange-300 uppercase">
            Elektronik kart uzmanlığı
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Medikal cihaz elektronik kart tamiri
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            Arıza kaynağını netleştiren, onarım kararını teknik olarak
            değerlendiren ve teslim öncesi kontrolü önemseyen uzman servis
            yaklaşımı.
          </p>
        </div>
      </section>
      <BoardRepair />
    </main>
  );
}
