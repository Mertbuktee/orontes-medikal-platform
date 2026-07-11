import { BookOpenText, HeartPulse, NotebookText, type LucideIcon } from "lucide-react";

export type BlogIconKey = "book-open-text" | "heart-pulse" | "notebook-text";
export type BlogPostStatus = "draft" | "published";

export type BlogPostPreview = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentBlocks: string[];
  category: string;
  coverImageSrc?: string;
  coverImageAlt?: string;
  status: BlogPostStatus;
  publishedAt?: string;
  seoTitle: string;
  seoDescription: string;
  iconKey: BlogIconKey;
};

const blogIconMap: Record<BlogIconKey, LucideIcon> = {
  "book-open-text": BookOpenText,
  "heart-pulse": HeartPulse,
  "notebook-text": NotebookText,
};

export const blogPosts: BlogPostPreview[] = [
  {
    id: "patient-monitor-first-checks",
    title: "Hastabaşı Monitörü Arızalarında İlk Kontroller",
    slug: "hastabasi-monitoru-arizalarinda-ilk-kontroller",
    excerpt:
      "Ekran, güç, batarya, SpO2 ve NIBP modüllerinde sık görülen sorunlara genel bakış.",
    contentBlocks: [],
    category: "Hastabaşı Monitörü",
    status: "published",
    seoTitle: "Hastabaşı Monitörü Arızalarında İlk Kontroller | Orontes Teknoloji",
    seoDescription:
      "Hastabaşı monitörü arızalarında ekran, güç, batarya, SpO2 ve NIBP modülleri için ilk teknik kontrol başlıkları.",
    iconKey: "heart-pulse",
  },
  {
    id: "electronic-board-analysis",
    title: "Elektronik Kart Tamirinde Arıza Analizi Nasıl Yapılır?",
    slug: "elektronik-kart-tamirinde-ariza-analizi",
    excerpt:
      "Besleme devresi, komponent kontrolü ve fonksiyon testlerinin servis sürecindeki önemi.",
    contentBlocks: [],
    category: "Elektronik Kart Tamiri",
    status: "published",
    seoTitle: "Elektronik Kart Tamirinde Arıza Analizi | Orontes Teknoloji",
    seoDescription:
      "Elektronik kart tamirinde besleme devresi, komponent kontrolü ve fonksiyon testlerinin teknik servis sürecindeki önemi.",
    iconKey: "notebook-text",
  },
  {
    id: "periodic-maintenance",
    title: "Medikal Cihazlarda Periyodik Bakımın Önemi",
    slug: "medikal-cihazlarda-periyodik-bakim",
    excerpt:
      "Cihaz güvenliği, performans sürekliliği ve teknik uygunluk açısından bakım süreçleri.",
    contentBlocks: [],
    category: "Periyodik Bakım",
    status: "published",
    seoTitle: "Medikal Cihazlarda Periyodik Bakımın Önemi | Orontes Teknoloji",
    seoDescription:
      "Medikal cihazlarda periyodik bakım süreçlerinin cihaz güvenliği, performans sürekliliği ve teknik uygunluk açısından önemi.",
    iconKey: "book-open-text",
  },
];

export function getBlogIcon(iconKey: BlogIconKey) {
  return blogIconMap[iconKey];
}

export function getPublishedBlogPosts(items: BlogPostPreview[] = blogPosts) {
  return items.filter((item) => item.status === "published");
}

export function getBlogPostHref(slug: string) {
  return `/blog#${slug}`;
}
