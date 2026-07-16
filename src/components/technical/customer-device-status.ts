import type { CustomerDeviceStatus } from "@prisma/client";

export const deviceStatusOptions: Array<{
  value: CustomerDeviceStatus;
  label: string;
  className: string;
}> = [
  {
    value: "ACTIVE",
    label: "Aktif",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    value: "UNDER_SERVICE",
    label: "Serviste",
    className: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  {
    value: "OUT_OF_SERVICE",
    label: "Kullanım Dışı",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  {
    value: "RETIRED",
    label: "Emekli",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  {
    value: "ARCHIVED",
    label: "Arşiv",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
];

export function getDeviceStatusMeta(status: CustomerDeviceStatus) {
  return (
    deviceStatusOptions.find((option) => option.value === status) ??
    deviceStatusOptions[0]
  );
}
