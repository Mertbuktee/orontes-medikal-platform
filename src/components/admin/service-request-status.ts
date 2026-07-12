import type { ServiceRequestStatus } from "@prisma/client";

export const serviceRequestStatusOptions: Array<{
  value: ServiceRequestStatus;
  label: string;
  description: string;
}> = [
  {
    value: "NEW",
    label: "Yeni",
    description: "Talep yeni alındı.",
  },
  {
    value: "REVIEWING",
    label: "İncelemede",
    description: "Teknik ekip ön değerlendirme yapıyor.",
  },
  {
    value: "WAITING_FOR_CUSTOMER",
    label: "Müşteri Bekleniyor",
    description: "Ek bilgi veya onay bekleniyor.",
  },
  {
    value: "APPROVED",
    label: "Onaylandı",
    description: "Servis süreci başlatılabilir.",
  },
  {
    value: "IN_REPAIR",
    label: "Onarımda",
    description: "Cihaz teknik işlemde.",
  },
  {
    value: "COMPLETED",
    label: "Tamamlandı",
    description: "Servis süreci tamamlandı.",
  },
  {
    value: "CANCELLED",
    label: "İptal",
    description: "Talep iptal edildi.",
  },
  {
    value: "ARCHIVED",
    label: "Arşiv",
    description: "Talep arşive alındı.",
  },
];

export function getServiceRequestStatusMeta(status: ServiceRequestStatus) {
  return (
    serviceRequestStatusOptions.find((option) => option.value === status) ??
    serviceRequestStatusOptions[0]
  );
}

export function getServiceRequestStatusClassName(status: ServiceRequestStatus) {
  const classes: Record<ServiceRequestStatus, string> = {
    NEW: "bg-sky-50 text-sky-700 ring-sky-200",
    REVIEWING: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    WAITING_FOR_CUSTOMER: "bg-amber-50 text-amber-800 ring-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    IN_REPAIR: "bg-orange-50 text-orange-700 ring-orange-200",
    COMPLETED: "bg-teal-50 text-teal-700 ring-teal-200",
    CANCELLED: "bg-rose-50 text-rose-700 ring-rose-200",
    ARCHIVED: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return classes[status];
}

export function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
