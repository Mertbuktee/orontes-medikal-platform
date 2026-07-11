import {
  Activity,
  Bed,
  ClipboardPlus,
  Cpu,
  HeartPulse,
  Monitor,
  MoveHorizontal,
  ScanHeart,
  Stethoscope,
  Table2,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";

export type DeviceIconKey =
  | "activity"
  | "bed"
  | "clipboard-plus"
  | "cpu"
  | "heart-pulse"
  | "monitor"
  | "move-horizontal"
  | "scan-heart"
  | "stethoscope"
  | "table"
  | "thermometer"
  | "wind";

export type DeviceGroup = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconKey: DeviceIconKey;
  capabilities: string[];
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
};

const deviceIconMap: Record<DeviceIconKey, LucideIcon> = {
  activity: Activity,
  bed: Bed,
  "clipboard-plus": ClipboardPlus,
  cpu: Cpu,
  "heart-pulse": HeartPulse,
  monitor: Monitor,
  "move-horizontal": MoveHorizontal,
  "scan-heart": ScanHeart,
  stethoscope: Stethoscope,
  table: Table2,
  thermometer: Thermometer,
  wind: Wind,
};

export const deviceGroups: DeviceGroup[] = [
  {
    id: "anesthesia-devices",
    title: "Anestezi Cihazları",
    slug: "anestezi-cihazlari",
    shortDescription: "Gaz akışı, sensör ve elektronik kontrol üniteleri için servis.",
    fullDescription:
      "Anestezi cihazlarında gaz akışı, sensör, bağlantı, elektronik kontrol ve çalışma güvenliği servis kapsamına göre değerlendirilir.",
    iconKey: "stethoscope",
    capabilities: ["Elektronik", "Bakım", "Test"],
    isFeatured: true,
    order: 1,
    isActive: true,
    seoTitle: "Anestezi Cihazı Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Anestezi cihazları için elektronik kontrol, sensör, bakım ve test süreçlerinde teknik servis desteği.",
  },
  {
    id: "ventilators",
    title: "Ventilatörler",
    slug: "ventilatorler",
    shortDescription: "Solunum desteği sağlayan sistemlerde arıza analizi ve bakım.",
    fullDescription:
      "Ventilatörlerde elektronik, mekanik ve pnömatik bileşenler servis kapsamına göre incelenir; arıza belirtisi ve test edilebilirlik birlikte değerlendirilir.",
    iconKey: "wind",
    capabilities: ["Mekanik", "Arıza Analizi", "Test"],
    isFeatured: true,
    order: 2,
    isActive: true,
    seoTitle: "Ventilatör Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Ventilatör cihazlarında elektronik, mekanik ve fonksiyonel kontroller için teknik servis desteği.",
  },
  {
    id: "patient-monitors",
    title: "Hastabaşı Monitörleri",
    slug: "hastabasi-monitorleri",
    shortDescription: "Ekran, modül, bağlantı ve ölçüm devreleri için teknik destek.",
    fullDescription:
      "Hastabaşı monitörlerinde ekran, güç, batarya, SpO2, NIBP, bağlantı ve ölçüm modülleri teknik servis sürecinde değerlendirilir.",
    iconKey: "monitor",
    capabilities: ["Elektronik", "Arıza Analizi", "Test"],
    isFeatured: true,
    order: 3,
    isActive: true,
    seoTitle: "Hastabaşı Monitörü Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Hastabaşı monitörleri için ekran, güç, batarya, modül ve ölçüm devresi arızalarında teknik servis.",
  },
  {
    id: "blood-pressure-spo2",
    title: "Tansiyon ve SpO2 Ölçerler",
    slug: "tansiyon-spo2-olcerler",
    shortDescription: "Ölçüm doğruluğunu etkileyen sensör ve devre kontrolleri.",
    fullDescription:
      "Tansiyon ve SpO2 ölçerlerde sensör, bağlantı, ölçüm doğruluğu ve elektronik devre kontrolleri servis kapsamına göre yapılır.",
    iconKey: "thermometer",
    capabilities: ["Elektronik", "Bakım", "Test"],
    isFeatured: true,
    order: 4,
    isActive: true,
    seoTitle: "Tansiyon ve SpO2 Ölçer Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Tansiyon ve SpO2 ölçer cihazlarda sensör, elektronik devre ve ölçüm sorunları için teknik servis.",
  },
  {
    id: "ecg-devices",
    title: "EKG Cihazları",
    slug: "ekg-cihazlari",
    shortDescription: "Sinyal alma, yazdırma ve bağlantı sorunlarında servis çözümü.",
    fullDescription:
      "EKG cihazlarında sinyal alma, bağlantı, yazdırma, güç ve elektronik kart sorunları teknik servis sürecinde incelenir.",
    iconKey: "heart-pulse",
    capabilities: ["Elektronik", "Arıza Analizi", "Test"],
    isFeatured: true,
    order: 5,
    isActive: true,
    seoTitle: "EKG Cihazı Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "EKG cihazlarında sinyal, yazdırma, bağlantı ve elektronik arızalar için teknik servis desteği.",
  },
  {
    id: "holter-devices",
    title: "Holter Cihazları",
    slug: "holter-cihazlari",
    shortDescription: "Kayıt, batarya, kablo ve veri aktarım problemlerinde destek.",
    fullDescription:
      "Holter cihazlarında kayıt, batarya, kablo, bağlantı ve veri aktarım problemleri servis kapsamında değerlendirilir.",
    iconKey: "scan-heart",
    capabilities: ["Elektronik", "Bakım", "Test"],
    isFeatured: true,
    order: 6,
    isActive: true,
    seoTitle: "Holter Cihazı Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Holter cihazlarında kayıt, batarya, kablo ve veri aktarım problemleri için teknik servis desteği.",
  },
  {
    id: "stress-test-devices",
    title: "Efor Cihazları",
    slug: "efor-cihazlari",
    shortDescription: "Kontrol kartı, bağlantı ve çalışma güvenliği için inceleme.",
    fullDescription:
      "Efor cihazlarında kontrol kartı, bağlantı, hareket sistemi ve çalışma güvenliği servis kapsamına göre kontrol edilir.",
    iconKey: "activity",
    capabilities: ["Elektronik", "Mekanik", "Arıza Analizi"],
    isFeatured: false,
    order: 7,
    isActive: true,
    seoTitle: "Efor Cihazı Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Efor cihazları için kontrol kartı, bağlantı, mekanik sistem ve arıza analizi teknik servis desteği.",
  },
  {
    id: "operating-tables",
    title: "Ameliyat Masaları",
    slug: "ameliyat-masalari",
    shortDescription: "Hareket mekanizması, kumanda ve elektronik kontrol servisi.",
    fullDescription:
      "Ameliyat masalarında hareket mekanizması, kumanda, motor, elektronik kontrol ve güvenli çalışma durumu teknik olarak değerlendirilir.",
    iconKey: "table",
    capabilities: ["Mekanik", "Elektronik", "Bakım"],
    isFeatured: false,
    order: 8,
    isActive: true,
    seoTitle: "Ameliyat Masası Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Ameliyat masalarında hareket mekanizması, kumanda, motor ve elektronik kontrol arızaları için teknik servis.",
  },
  {
    id: "patient-beds",
    title: "Hasta Yatakları",
    slug: "hasta-yataklari",
    shortDescription: "Motor, kumanda, mekanik aksam ve güvenlik kontrolleri.",
    fullDescription:
      "Hasta yataklarında motor, kumanda, mekanik aksam, bağlantı ve kullanım güvenliği servis sürecinde incelenir.",
    iconKey: "bed",
    capabilities: ["Mekanik", "Bakım", "Yedek Parça"],
    isFeatured: false,
    order: 9,
    isActive: true,
    seoTitle: "Hasta Yatağı Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Hasta yatakları için motor, kumanda, mekanik aksam ve yedek parça odaklı teknik servis desteği.",
  },
  {
    id: "patient-stretchers",
    title: "Hasta Sedyeleri",
    slug: "hasta-sedyeleri",
    shortDescription: "Mekanik hareket, fren ve taşıma güvenliği için bakım.",
    fullDescription:
      "Hasta sedyelerinde mekanik hareket, fren sistemi, taşıma güvenliği ve bakım ihtiyacı servis kapsamında değerlendirilir.",
    iconKey: "move-horizontal",
    capabilities: ["Mekanik", "Bakım", "Yedek Parça"],
    isFeatured: false,
    order: 10,
    isActive: true,
    seoTitle: "Hasta Sedyesi Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Hasta sedyeleri için mekanik hareket, fren sistemi ve taşıma güvenliği odaklı teknik servis.",
  },
  {
    id: "motorized-tables",
    title: "Motorlu Masalar",
    slug: "motorlu-masalar",
    shortDescription: "Motor sürücüleri, kontrol kutuları ve hareket sistemleri.",
    fullDescription:
      "Motorlu masalarda motor sürücüleri, kontrol kutuları, bağlantılar ve hareket sistemleri teknik olarak incelenir.",
    iconKey: "clipboard-plus",
    capabilities: ["Mekanik", "Elektronik", "Arıza Analizi"],
    isFeatured: false,
    order: 11,
    isActive: true,
    seoTitle: "Motorlu Masa Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Motorlu masalar için motor sürücüleri, kontrol kutuları ve hareket sistemi arızalarında teknik servis.",
  },
  {
    id: "electronic-boards",
    title: "Elektronik Kartlar",
    slug: "elektronik-kartlar",
    shortDescription: "Medikal cihaz kartlarında komponent bazlı onarım ve test.",
    fullDescription:
      "Medikal cihaz elektronik kartlarında komponent bazlı onarım, lehimleme, besleme devresi analizi ve fonksiyon testleri uygulanır.",
    iconKey: "cpu",
    capabilities: ["Kart Onarımı", "Elektronik", "Test"],
    isFeatured: false,
    order: 12,
    isActive: true,
    seoTitle: "Medikal Cihaz Elektronik Kart Teknik Servisi | Orontes Teknoloji",
    seoDescription:
      "Medikal cihaz elektronik kartlarında komponent onarımı, besleme devresi analizi ve fonksiyon testi.",
  },
];

export function getDeviceIcon(iconKey: DeviceIconKey) {
  return deviceIconMap[iconKey];
}

export function getActiveOrderedDevices(items: DeviceGroup[] = deviceGroups) {
  return items
    .filter((item) => item.isActive)
    .sort((first, second) => first.order - second.order);
}

export function getFeaturedDevices(limit = 6, items: DeviceGroup[] = deviceGroups) {
  return getActiveOrderedDevices(items)
    .filter((item) => item.isFeatured)
    .slice(0, limit);
}
