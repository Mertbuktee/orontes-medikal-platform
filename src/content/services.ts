export type ServiceIconKey =
  | "circuit-board"
  | "wrench"
  | "settings"
  | "gauge"
  | "microscope"
  | "headset"
  | "package-check"
  | "clipboard-check"
  | "stethoscope"
  | "shield-check"
  | "activity"
  | "scan-search";

export type ServiceItem = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconKey: ServiceIconKey;
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
};

export const services: ServiceItem[] = [
  {
    id: "electronic-board-repair",
    title: "Elektronik Kart Tamiri",
    slug: "elektronik-kart-tamiri",
    shortDescription:
      "Medikal cihaz kartlarında arıza tespiti, komponent değişimi ve test süreçleri.",
    fullDescription:
      "Besleme devresi, komponent, lehim, bağlantı ve fonksiyon testleri kontrollü bir servis akışıyla değerlendirilir.",
    iconKey: "circuit-board",
    isFeatured: true,
    order: 1,
    isActive: true,
    seoTitle: "Elektronik Kart Tamiri | Orontes Teknoloji",
    seoDescription:
      "Medikal cihaz elektronik kartlarında arıza tespiti, komponent değişimi, lehimleme ve fonksiyon testi.",
    ctaLabel: "Detayları İncele",
    ctaHref: "/elektronik-kart-tamiri",
  },
  {
    id: "medical-device-maintenance",
    title: "Medikal Cihaz Bakımı",
    slug: "medikal-cihaz-bakimi",
    shortDescription:
      "Cihaz performansını koruyan planlı bakım, kontrol ve servis uygulamaları.",
    fullDescription:
      "Kullanım yoğunluğu, mekanik durum, bağlantılar ve çalışma güvenliği dikkate alınarak bakım süreci planlanır.",
    iconKey: "stethoscope",
    isFeatured: true,
    order: 2,
    isActive: true,
    seoTitle: "Medikal Cihaz Bakımı | Orontes Teknoloji",
    seoDescription:
      "Medikal cihazlarda bakım, kontrol, çalışma güvenliği ve teknik servis süreçleri.",
  },
  {
    id: "calibration",
    title: "Kalibrasyon",
    slug: "kalibrasyon",
    shortDescription:
      "Ölçüm doğruluğunu destekleyen cihaz kontrolü ve kalibrasyon yönlendirmesi.",
    fullDescription:
      "Ölçüm performansını etkileyen cihaz gruplarında teknik uygunluk ve kontrol ihtiyacı değerlendirilir.",
    iconKey: "gauge",
    isFeatured: true,
    order: 3,
    isActive: true,
    seoTitle: "Medikal Cihaz Kalibrasyon Yönlendirmesi | Orontes Teknoloji",
    seoDescription:
      "Medikal cihazlarda ölçüm doğruluğu, teknik kontrol ve kalibrasyon yönlendirme süreçleri.",
  },
  {
    id: "technical-support",
    title: "Teknik Destek",
    slug: "teknik-destek",
    shortDescription:
      "Sağlık kuruluşları için hızlı değerlendirme ve uygulanabilir servis desteği.",
    fullDescription:
      "Servis kapsamı, cihaz uygunluğu, gönderim hazırlığı ve arıza ön değerlendirmesi için net yönlendirme sağlanır.",
    iconKey: "headset",
    isFeatured: true,
    order: 4,
    isActive: true,
    seoTitle: "Medikal Cihaz Teknik Destek | Orontes Teknoloji",
    seoDescription:
      "Sağlık kuruluşları için medikal cihaz servis kapsamı, arıza ön değerlendirmesi ve teknik destek.",
  },
  {
    id: "fault-analysis",
    title: "Arıza Analizi",
    slug: "ariza-analizi",
    shortDescription:
      "Elektronik ve mekanik kaynaklı sorunlar için sistematik arıza incelemesi.",
    fullDescription:
      "Belirti, tekrar durumu, fiziksel izler ve test edilebilirlik birlikte incelenerek servis kararı netleştirilir.",
    iconKey: "microscope",
    isFeatured: true,
    order: 5,
    isActive: true,
    seoTitle: "Medikal Cihaz Arıza Analizi | Orontes Teknoloji",
    seoDescription:
      "Medikal cihazlarda elektronik ve mekanik arızalar için sistematik teknik analiz ve servis değerlendirmesi.",
  },
  {
    id: "spare-parts",
    title: "Yedek Parça Temini",
    slug: "yedek-parca-temini",
    shortDescription:
      "Servis sürecini tamamlayan uygun parça tespiti ve tedarik desteği.",
    fullDescription:
      "Onarımın sürdürülebilir olması için uygun komponent, mekanik parça ve servis alternatifi değerlendirilir.",
    iconKey: "package-check",
    isFeatured: true,
    order: 6,
    isActive: true,
    seoTitle: "Medikal Cihaz Yedek Parça Temini | Orontes Teknoloji",
    seoDescription:
      "Medikal cihaz servis sürecinde komponent, mekanik parça ve yedek parça temini desteği.",
  },
];

export function getActiveOrderedServices(items: ServiceItem[] = services) {
  return items
    .filter((item) => item.isActive)
    .sort((first, second) => first.order - second.order);
}

export function getFeaturedServices(limit = 6, items: ServiceItem[] = services) {
  return getActiveOrderedServices(items)
    .filter((item) => item.isFeatured)
    .slice(0, limit);
}
