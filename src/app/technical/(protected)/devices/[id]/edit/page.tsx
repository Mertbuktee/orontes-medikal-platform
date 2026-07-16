import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaCustomerDeviceRepository } from "@/lib/database/repositories/customer-devices";
import { PrismaCustomerRegistryRepository } from "@/lib/database/repositories/customer-registry";

import { archiveCustomerDevice, updateCustomerDevice } from "../../actions";
import { DeviceForm } from "../../new/page";

type EditDevicePageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditDevicePage({ params }: EditDevicePageProps) {
  await requirePermission("technicalDevices.update");
  const { id } = await params;
  const customerRepository = new PrismaCustomerRegistryRepository(prisma);
  const deviceRepository = new PrismaCustomerDeviceRepository(prisma);
  const [device, customers, manufacturers, deviceGroups] = await Promise.all([
    deviceRepository.findDeviceById(id),
    customerRepository.listCompanyOptions(),
    deviceRepository.listManufacturers(),
    deviceRepository.listDeviceGroups(),
  ]);

  if (!device) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/technical/devices/${device.id}`}
        className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
      >
        Detaya dön
      </Link>
      <AdminPageHeader
        eyebrow="Teknik Operasyon"
        title="Cihaz Düzenle"
        description={`${device.publicCode} cihaz kartını güncelleyin.`}
      />
      <DeviceForm
        action={updateCustomerDevice}
        customers={customers}
        manufacturers={manufacturers}
        deviceGroups={deviceGroups}
        initial={device}
        submitLabel="Kaydet"
      />
      {!device.archivedAt ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
          <h2 className="text-base font-semibold text-rose-950">Arşivle</h2>
          <p className="mt-1 text-sm text-rose-800">
            Cihaz kaydı silinmez; arşive alınır ve geçmiş servis talepleri korunur.
          </p>
          <form action={archiveCustomerDevice} className="mt-4">
            <input type="hidden" name="id" value={device.id} />
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Cihazı Arşivle
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
