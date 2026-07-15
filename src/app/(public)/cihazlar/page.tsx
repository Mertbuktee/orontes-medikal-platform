import type { Metadata } from 'next';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createElement } from 'react';

import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { publicRoutes } from '@/config/site';
import { getDeviceIcon } from '@/lib/devices/device-registry';
import { getPublicActiveDevices } from '@/lib/devices/public-devices';
import { createPageMetadata } from '@/lib/seo/metadata';

const route = publicRoutes.find((item) => item.path === '/cihazlar');

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? 'Medikal Cihaz Teknik Servisi',
  description:
    route?.description ??
    'Medikal cihaz grupları için teknik servis çözümleri.',
  path: '/cihazlar',
});

const trustItems = [
  'Elektronik kart onarımı',
  'Mekanik servis',
  'Arıza analizi',
  'Türkiye geneli cihaz kabulü',
];

export default async function DevicesPage() {
  const devices = await getPublicActiveDevices();

  return (
    <main className="bg-slate-50">
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(249,115,22,0.16),transparent_28%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Ana Sayfa', path: '/' },
              { name: 'Cihazlar', path: '/cihazlar' },
            ]}
          />

          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
              Cihaz kapsamı
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Desteklediğimiz Medikal Cihaz Grupları
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              Elektronik ve mekanik teknik servis kapsamında farklı medikal
              cihaz gruplarına bakım, onarım, arıza analizi ve teknik destek
              sağlıyoruz.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
              <div
                key={item}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 shadow-sm"
              >
                <CheckCircle2
                  className="size-4 text-orange-500"
                  aria-hidden="true"
                />
                <span className="text-center">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {devices.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {devices.map(
                ({
                  id,
                  title,
                  slug,
                  shortDescription,
                  capabilities,
                  iconKey,
                  imageUrl,
                }) => {
                  return (
                    <article
                      id={slug}
                      key={id}
                      className="group relative overflow-hidden rounded-2xl border border-white bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-900/10"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-500 via-orange-400 to-orange-500" />
                      {imageUrl ? (
                        <div className="relative -mx-5 -mt-5 mb-5 aspect-[16/10] overflow-hidden bg-slate-100">
                          <Image
                            src={imageUrl}
                            alt={`${title} teknik servis görseli`}
                            fill
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : null}
                      <div className="flex size-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 group-hover:bg-orange-50 group-hover:text-orange-600">
                        {createElement(getDeviceIcon(iconKey), {
                          className: 'size-6',
                          'aria-hidden': true,
                        })}
                      </div>
                      <h2 className="mt-6 text-base font-semibold text-slate-950">
                        {title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {shortDescription}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {capabilities.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-xl font-semibold text-slate-950">
                Cihaz grubu henüz yayınlanmadı.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Servis kapsamı hakkında bilgi almak için bizimle iletişime
                geçebilirsiniz.
              </p>
            </div>
          )}

          <div className="mt-12 rounded-3xl border border-sky-100 bg-white p-6 shadow-xl shadow-slate-900/5 sm:flex sm:items-center sm:justify-between sm:gap-8 lg:p-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Aradığınız cihaz listede yok mu?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Cihaz modelini ve arıza belirtisini paylaşın, servis kapsamı
                için teknik ön değerlendirme yapalım.
              </p>
              <Link
                href="/hizmetler"
                className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-sky-700 transition hover:text-orange-600 focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:outline-none"
              >
                Hizmet kapsamını inceleyin
              </Link>
            </div>
            <Link
              href="/servis-talebi"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:outline-none sm:mt-0 sm:w-auto"
            >
              Servis Talebi Oluştur
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
