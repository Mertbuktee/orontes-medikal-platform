import type {
  HomepageSectionSeed,
  HomepageSeo,
} from "@/lib/homepage/homepage-types";

export const defaultHomepageSections: HomepageSectionSeed[] = [
  {
    key: "HERO_SUPPORTING_CONTENT",
    title: "Medikal Cihazlarınız İçin Güvenilir Teknik Servis Çözümleri",
    eyebrow: null,
    description:
      "Türkiye genelindeki sağlık kuruluşlarına medikal cihaz bakım, onarım, elektronik kart tamiri ve teknik destek hizmetleri sunuyoruz.",
    content: {
      title: "Hero destek alanı",
      description: "Ana sayfanın ilk alanındaki destekleyici metinler.",
      itemLimit: 3,
      showViewAll: true,
      viewAllLabel: "Hizmetlerimizi İnceleyin",
    },
    order: 1,
    isVisible: true,
  },
  {
    key: "SERVICES_PREVIEW",
    title: "Hizmetlerimiz",
    eyebrow: null,
    description:
      "Medikal cihazların yaşam döngüsünü destekleyen profesyonel teknik servis çözümleri.",
    content: {
      title: "Hizmetlerimiz",
      description:
        "Medikal cihazların yaşam döngüsünü destekleyen profesyonel teknik servis çözümleri.",
      itemLimit: 6,
      showViewAll: true,
      viewAllLabel: "Tüm Hizmetleri Gör",
    },
    order: 2,
    isVisible: true,
  },
  {
    key: "DEVICES_PREVIEW",
    title: "Desteklediğimiz Medikal Cihaz Grupları",
    eyebrow: null,
    description:
      "Türkiye genelinden tarafımıza gönderilen medikal cihazlara elektronik kart tamiri, mekanik bakım, arıza analizi ve teknik servis desteği sunuyoruz.",
    content: {
      title: "Desteklediğimiz Medikal Cihaz Grupları",
      description:
        "Türkiye genelinden tarafımıza gönderilen medikal cihazlara elektronik kart tamiri, mekanik bakım, arıza analizi ve teknik servis desteği sunuyoruz.",
      itemLimit: 6,
      showViewAll: true,
      viewAllLabel: "Tüm Cihaz Gruplarını Gör",
    },
    order: 3,
    isVisible: true,
  },
  {
    key: "BOARD_REPAIR",
    title: "Elektronik Kart Tamirinde Uzman Teknik Servis",
    eyebrow: "Elektronik Kart Tamiri",
    description:
      "Medikal cihazlara ait elektronik kartlarda arıza tespiti, komponent değişimi, lehimleme, besleme devresi analizi ve fonksiyon testlerini profesyonel ekipmanlarla gerçekleştiriyoruz.",
    content: {
      badge: "Elektronik Kart Tamiri",
      title: "Elektronik Kart Tamirinde Uzman Teknik Servis",
      description:
        "Medikal cihazlara ait elektronik kartlarda arıza tespiti, komponent değişimi, lehimleme, besleme devresi analizi ve fonksiyon testlerini profesyonel ekipmanlarla gerçekleştiriyoruz.",
      featureItems: [
        "Cihaz değişim maliyetini azaltır",
        "Arıza kaynağı netleşir",
        "Kart ömrü uzatılır",
        "Gereksiz parça değişimi önlenir",
        "Servis süreci hızlanır",
        "Sürdürülebilir çözüm sağlar",
      ],
      primaryCtaLabel: "Servis Talebi",
      primaryCtaHref: "/servis-talebi",
      secondaryCtaLabel: "İletişime Geç",
      secondaryCtaHref: "/iletisim",
      mediaId: null,
    },
    order: 4,
    isVisible: true,
  },
  {
    key: "WHY_US",
    title: "Neden Orontes?",
    eyebrow: "Orontes Yaklaşımı",
    description:
      "Teknik servis sürecini yalnızca onarım olarak değil; doğru tespit, açık iletişim, kontrollü uygulama ve güvenli teslimden oluşan uçtan uca bir hizmet deneyimi olarak ele alıyoruz.",
    content: {
      title: "Neden Orontes?",
      description:
        "Teknik servis sürecini yalnızca onarım olarak değil; doğru tespit, açık iletişim, kontrollü uygulama ve güvenli teslimden oluşan uçtan uca bir hizmet deneyimi olarak ele alıyoruz.",
      items: [
        {
          title: "Arızaya Bütüncül Bakış",
          description:
            "Elektronik kart, mekanik aksam, bağlantılar ve kullanım koşullarını birlikte değerlendiririz.",
          iconKey: "Cpu",
          order: 1,
          isActive: true,
        },
        {
          title: "Şeffaf Servis İletişimi",
          description:
            "Tespit edilen arıza, uygulanacak işlem ve servis kapsamı anlaşılır şekilde paylaşılır.",
          iconKey: "ClipboardCheck",
          order: 2,
          isActive: true,
        },
        {
          title: "Kontrollü Teslim Hazırlığı",
          description:
            "Cihaz veya kart teslim öncesi son kontrollerden geçirilir.",
          iconKey: "ShieldCheck",
          order: 3,
          isActive: true,
        },
        {
          title: "Kurumsal Servis Disiplini",
          description:
            "Her işi planlı ve izlenebilir bir teknik servis yaklaşımıyla ele alırız.",
          iconKey: "FileCheck2",
          order: 4,
          isActive: true,
        },
      ],
    },
    order: 5,
    isVisible: true,
  },
  {
    key: "PROCESS",
    title: "Cihazınız Güvenli ve Planlı Bir Süreçten Geçer",
    eyebrow: "Servis Süreci",
    description:
      "Tarafımıza ulaşan her cihaz aynı teknik disiplin içinde değerlendirilir. Arıza tespiti, onarım, test ve teslim süreçleri kayıt altına alınarak uygulanır.",
    content: {
      title: "Cihazınız Güvenli ve Planlı Bir Süreçten Geçer",
      description:
        "Tarafımıza ulaşan her cihaz aynı teknik disiplin içinde değerlendirilir. Arıza tespiti, onarım, test ve teslim süreçleri kayıt altına alınarak uygulanır.",
      steps: [
        {
          title: "Cihaz Kabul",
          description: "Cihaz kayıt altına alınır ve ilk fiziksel kontrol yapılır.",
          iconKey: "ClipboardCheck",
          order: 1,
          isActive: true,
        },
        {
          title: "Arıza Analizi",
          description: "Elektronik ve mekanik incelemeler gerçekleştirilir.",
          iconKey: "ScanSearch",
          order: 2,
          isActive: true,
        },
        {
          title: "Onarım",
          description: "Arızalı komponentler ve mekanik parçalar onarılır.",
          iconKey: "Wrench",
          order: 3,
          isActive: true,
        },
        {
          title: "Fonksiyon Testleri",
          description: "Kart ve cihaz gerçek çalışma koşullarında test edilir.",
          iconKey: "Settings",
          order: 4,
          isActive: true,
        },
        {
          title: "Kalite Kontrol",
          description: "Son kontroller gerçekleştirilerek güvenlik doğrulanır.",
          iconKey: "ShieldCheck",
          order: 5,
          isActive: true,
        },
        {
          title: "Teslim",
          description: "Cihaz müşteriye güvenli şekilde teslim edilir.",
          iconKey: "PackageCheck",
          order: 6,
          isActive: true,
        },
      ],
    },
    order: 6,
    isVisible: true,
  },
  {
    key: "BLOG_PREVIEW",
    title: "Teknik Bilgi ve Servis Notları",
    eyebrow: null,
    description:
      "Medikal cihaz bakım, onarım ve arıza süreçleri hakkında bilgilendirici içerikler.",
    content: {
      title: "Teknik Bilgi ve Servis Notları",
      description:
        "Medikal cihaz bakım, onarım ve arıza süreçleri hakkında bilgilendirici içerikler.",
      itemLimit: 3,
      showViewAll: true,
      viewAllLabel: "Blog Yazılarını Gör",
    },
    order: 7,
    isVisible: true,
  },
  {
    key: "FINAL_CTA",
    title: "Medikal Cihazınız İçin Teknik Destek Alın",
    eyebrow: "Teknik Servis Desteği",
    description:
      "Arıza, bakım, elektronik kart onarımı veya servis kapsamı hakkında bilgi almak için cihaz detaylarını ekibimizle paylaşın.",
    content: {
      badge: "Teknik Servis Desteği",
      title: "Medikal Cihazınız İçin Teknik Destek Alın",
      description:
        "Arıza, bakım, elektronik kart onarımı veya servis kapsamı hakkında bilgi almak için cihaz detaylarını ekibimizle paylaşın.",
      primaryLabel: "Servis Talebi Oluştur",
      primaryHref: "/servis-talebi",
      secondaryLabel: "WhatsApp",
      secondaryHref:
        "https://wa.me/905536065703?text=Merhabalar%20Website%20%C3%9Czerinden%20%C4%B0leti%C5%9Fime%20Ge%C3%A7iyorum",
      trustItems: [
        "Elektronik ve Mekanik Çözümler",
        "Türkiye Geneli Cihaz Kabulü",
        "Kontrollü Onarım Süreci",
      ],
    },
    order: 8,
    isVisible: true,
  },
];

export const defaultHomepageSeo: HomepageSeo = {
  title: "Orontes Teknoloji | Medikal Cihaz Teknik Servisi",
  description:
    "Orontes Teknoloji; medikal cihaz bakım, onarım, elektronik kart tamiri ve teknik servis çözümleri sunar.",
  openGraphImageId: null,
};
