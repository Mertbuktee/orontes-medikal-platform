export type PublicRoute = {
  path: string;
  title: string;
  description: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
};

export const siteConfig = {
  name: "Orontes Teknoloji",
  legalName: "Orontes İnovasyon Endüstriyel Ürünler Sanayi Ticaret Ltd. Şti.",
  description:
    "Medikal cihaz bakım, onarım, elektronik kart tamiri ve teknik servis çözümleri.",
  phone: "+905536065703",
  displayPhone: "0553 606 57 03",
  email: "info@orontesteknoloji.com",
  address: {
    streetAddress: "Kocasinan Merkez Mh. Görgülü Sk. No:20/B",
    addressLocality: "Bahçelievler",
    addressRegion: "İstanbul",
    addressCountry: "TR",
  },
  origin: resolveSiteOrigin(process.env),
};

export const publicRoutes: PublicRoute[] = [
  {
    path: "/",
    title: "Orontes Teknoloji | Medikal Teknik Servis",
    description:
      "Medikal cihaz teknik servisi, elektronik kart onarımı, mekanik bakım ve periyodik bakım hizmetleri.",
    priority: 1,
    changeFrequency: "weekly",
  },
  {
    path: "/hizmetler",
    title: "Medikal Cihaz Teknik Servis Hizmetleri | Orontes Teknoloji",
    description:
      "Orontes Teknoloji medikal cihaz bakım, onarım, elektronik kart tamiri, arıza analizi, kalibrasyon yönlendirmesi ve teknik destek hizmetleri sunar.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/cihazlar",
    title: "Medikal Cihaz Teknik Servisi | Orontes Teknoloji",
    description:
      "Anestezi cihazları, ventilatörler, hastabaşı monitörleri, EKG, holter, hasta yatakları, ameliyat masaları ve diğer medikal cihaz grupları için teknik servis çözümleri.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/elektronik-kart-tamiri",
    title: "Elektronik Kart Tamiri | Orontes Teknoloji",
    description:
      "Medikal cihaz elektronik kartlarında arıza tespiti, komponent değişimi, besleme devresi analizi, lehimleme ve fonksiyon testleri.",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "/hakkimizda",
    title: "Hakkımızda | Orontes Teknoloji",
    description:
      "Orontes Teknoloji medikal cihaz bakım, onarım, elektronik kart tamiri ve teknik servis süreçlerinde güvenilir çözüm ortağıdır.",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/servis-sureci",
    title: "Medikal Cihaz Servis Süreci | Orontes Teknoloji",
    description:
      "Orontes Teknoloji cihaz kabul, arıza analizi, onarım, fonksiyon testi, kalite kontrol ve teslim adımlarını planlı şekilde yürütür.",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/blog",
    title: "Teknik Bilgi ve Servis Notları | Orontes Teknoloji",
    description:
      "Medikal cihaz bakım, onarım, elektronik kart tamiri ve arıza analizi hakkında teknik servis notları.",
    priority: 0.7,
    changeFrequency: "weekly",
  },
  {
    path: "/iletisim",
    title: "İletişim | Orontes Teknoloji",
    description:
      "Orontes Teknoloji telefon, e-posta, WhatsApp ve Bahçelievler İstanbul ofis konumu iletişim bilgileri.",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/servis-talebi",
    title: "Servis Talebi Oluştur | Orontes Teknoloji",
    description:
      "Medikal cihaz arızası, bakım ihtiyacı veya elektronik kart tamiri için güvenli servis talebi formu.",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/cerez-politikasi",
    title: "Çerez Politikası | Orontes Teknoloji",
    description:
      "Orontes Teknoloji web sitesi çerez kullanımı, çerez kategorileri ve tercih yönetimi hakkında bilgilendirme.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    path: "/gizlilik-politikasi",
    title: "Gizlilik Politikası | Orontes Teknoloji",
    description:
      "Orontes Teknoloji web sitesi ve servis talebi süreçleri için gizlilik politikası bilgilendirmesi.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    path: "/kvkk",
    title: "KVKK Aydınlatma Metni | Orontes Teknoloji",
    description:
      "Orontes Teknoloji kişisel verilerin korunması ve servis talebi süreçleri için KVKK aydınlatma metni.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
];

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.origin).toString();
}

export function resolveSiteOrigin(env: NodeJS.ProcessEnv) {
  const normalizedOrigin = normalizeOrigin(env.APP_ORIGIN);
  const isProduction = isProductionDeployment(env);

  if (!isProduction) {
    return normalizedOrigin ?? "http://localhost:3000";
  }

  if (!normalizedOrigin) {
    throw new Error("APP_ORIGIN is required for production deployments.");
  }

  const url = new URL(normalizedOrigin);

  if (url.protocol !== "https:") {
    throw new Error("APP_ORIGIN must use HTTPS in production deployments.");
  }

  if (isLocalhost(url.hostname)) {
    throw new Error("APP_ORIGIN cannot be localhost in production deployments.");
  }

  return normalizedOrigin;
}

export function isProductionDeployment(env: NodeJS.ProcessEnv) {
  return env.APP_ENV === "production" || env.VERCEL_ENV === "production";
}

function normalizeOrigin(value: string | undefined) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return undefined;
  }
}

function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
