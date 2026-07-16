import type { ReactNode } from "react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaCustomerDeviceRepository } from "@/lib/database/repositories/customer-devices";
import { PrismaCustomerRegistryRepository } from "@/lib/database/repositories/customer-registry";

import { createCustomerDevice } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCustomerDevicePage() {
  await requirePermission("technicalDevices.create");
  const customerRepository = new PrismaCustomerRegistryRepository(prisma);
  const deviceRepository = new PrismaCustomerDeviceRepository(prisma);
  const [customers, manufacturers, deviceGroups] = await Promise.all([
    customerRepository.listCompanyOptions(),
    deviceRepository.listManufacturers(),
    deviceRepository.listDeviceGroups(),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/technical/devices"
        className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
      >
        Cihazlara dön
      </Link>
      <AdminPageHeader
        eyebrow="Teknik Operasyon"
        title="Yeni Cihaz"
        description="Gerçek fiziksel müşteri cihazını seri numarası ve lokasyonuyla kaydedin."
      />
      <DeviceForm
        action={createCustomerDevice}
        customers={customers}
        manufacturers={manufacturers}
        deviceGroups={deviceGroups}
        submitLabel="Cihaz Oluştur"
      />
    </div>
  );
}

export function DeviceForm({
  action,
  customers,
  manufacturers,
  deviceGroups,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  customers: Array<{
    id: string;
    displayName: string;
    locations: Array<{ id: string; name: string }>;
  }>;
  manufacturers: Array<{
    id: string;
    name: string;
    deviceModels: Array<{ id: string; name: string }>;
  }>;
  deviceGroups: Array<{ id: string; title: string }>;
  initial?: {
    id?: string;
    customerCompanyId?: string;
    customerLocationId?: string;
    deviceGroupId?: string | null;
    manufacturerId?: string | null;
    deviceModelId?: string | null;
    customManufacturer?: string | null;
    customModel?: string | null;
    serialNumber?: string;
    assetTag?: string | null;
    hospitalInventoryNumber?: string | null;
    department?: string | null;
    room?: string | null;
    installationDate?: Date | null;
    purchaseDate?: Date | null;
    warrantyEndDate?: Date | null;
    status?: string;
    criticality?: string;
    notes?: string | null;
    isActive?: boolean;
  };
  submitLabel: string;
}) {
  const allLocations = customers.flatMap((customer) =>
    customer.locations.map((location) => ({
      ...location,
      customerName: customer.displayName,
      customerId: customer.id,
    }))
  );
  const allModels = manufacturers.flatMap((manufacturer) =>
    manufacturer.deviceModels.map((model) => ({
      ...model,
      manufacturerName: manufacturer.name,
      manufacturerId: manufacturer.id,
    }))
  );

  return (
    <form action={action} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Select name="customerCompanyId" label="Müşteri" value={initial?.customerCompanyId ?? ""} required>
          <option value="">Müşteri seç</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.displayName}</option>
          ))}
        </Select>
        <Select name="customerLocationId" label="Lokasyon" value={initial?.customerLocationId ?? ""} required>
          <option value="">Lokasyon seç</option>
          {allLocations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.customerName} - {location.name}
            </option>
          ))}
        </Select>
        <Select name="deviceGroupId" label="Public Cihaz Grubu" value={initial?.deviceGroupId ?? ""}>
          <option value="">Bağlama</option>
          {deviceGroups.map((group) => (
            <option key={group.id} value={group.id}>{group.title}</option>
          ))}
        </Select>
        <Select name="manufacturerId" label="Üretici" value={initial?.manufacturerId ?? ""}>
          <option value="">Custom üretici kullan</option>
          {manufacturers.map((manufacturer) => (
            <option key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</option>
          ))}
        </Select>
        <Select name="deviceModelId" label="Model" value={initial?.deviceModelId ?? ""}>
          <option value="">Custom model kullan</option>
          {allModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.manufacturerName} - {model.name}
            </option>
          ))}
        </Select>
        <Field name="customManufacturer" label="Custom Üretici" defaultValue={initial?.customManufacturer} />
        <Field name="customModel" label="Custom Model" defaultValue={initial?.customModel} />
        <Field name="serialNumber" label="Seri No" defaultValue={initial?.serialNumber} required />
        <Field name="assetTag" label="Demirbaş Etiketi" defaultValue={initial?.assetTag} />
        <Field name="hospitalInventoryNumber" label="Hastane Envanter No" defaultValue={initial?.hospitalInventoryNumber} />
        <Field name="department" label="Departman" defaultValue={initial?.department} />
        <Field name="room" label="Oda" defaultValue={initial?.room} />
        <Field name="installationDate" label="Kurulum Tarihi" type="date" defaultValue={formatDateInput(initial?.installationDate)} />
        <Field name="purchaseDate" label="Satın Alma Tarihi" type="date" defaultValue={formatDateInput(initial?.purchaseDate)} />
        <Field name="warrantyEndDate" label="Garanti Bitiş" type="date" defaultValue={formatDateInput(initial?.warrantyEndDate)} />
        <Select name="status" label="Durum" value={initial?.status ?? "ACTIVE"}>
          <option value="ACTIVE">Aktif</option>
          <option value="UNDER_SERVICE">Serviste</option>
          <option value="OUT_OF_SERVICE">Kullanım Dışı</option>
          <option value="RETIRED">Emekli</option>
          <option value="ARCHIVED">Arşiv</option>
        </Select>
        <Select name="criticality" label="Kritiklik" value={initial?.criticality ?? "MEDIUM"}>
          <option value="LOW">Düşük</option>
          <option value="MEDIUM">Orta</option>
          <option value="HIGH">Yüksek</option>
          <option value="CRITICAL">Kritik</option>
        </Select>
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-semibold text-slate-800">Notlar</span>
        <textarea
          name="notes"
          defaultValue={initial?.notes ?? ""}
          maxLength={4000}
          className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
        />
      </label>
      <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-800">
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={initial?.isActive ?? true}
          className="size-4 rounded border-slate-300 text-cyan-600"
        />
        Aktif kayıt
      </label>
      <button
        type="submit"
        className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Select({
  name,
  label,
  value,
  required = false,
  children,
}: {
  name: string;
  label: string;
  value: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <select
        name={name}
        required={required}
        defaultValue={value}
        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
      >
        {children}
      </select>
    </label>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  );
}

function formatDateInput(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}
