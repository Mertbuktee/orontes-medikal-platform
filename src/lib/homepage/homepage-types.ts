export const homepageSectionKeys = [
  "HERO_SUPPORTING_CONTENT",
  "SERVICES_PREVIEW",
  "DEVICES_PREVIEW",
  "BOARD_REPAIR",
  "WHY_US",
  "PROCESS",
  "BLOG_PREVIEW",
  "FINAL_CTA",
] as const;

export type HomepageSectionKey = (typeof homepageSectionKeys)[number];

export type PreviewContent = {
  title: string;
  description: string;
  itemLimit: number;
  showViewAll: boolean;
  viewAllLabel: string;
};

export type HomepageListItem = {
  title: string;
  description: string;
  iconKey: string;
  order: number;
  isActive: boolean;
};

export type BoardRepairContent = {
  badge: string;
  title: string;
  description: string;
  featureItems: string[];
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  mediaId: string | null;
};

export type WhyUsContent = {
  title: string;
  description: string;
  items: HomepageListItem[];
};

export type ProcessContent = {
  title: string;
  description: string;
  steps: HomepageListItem[];
};

export type FinalCtaContent = {
  badge: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  trustItems: string[];
};

export type HomepageSeo = {
  title: string;
  description: string;
  openGraphImageId: string | null;
};

export type HomepageSectionContent =
  | PreviewContent
  | BoardRepairContent
  | WhyUsContent
  | ProcessContent
  | FinalCtaContent;

export type HomepageSectionSeed = {
  key: HomepageSectionKey;
  title: string;
  eyebrow: string | null;
  description: string;
  content: HomepageSectionContent;
  order: number;
  isVisible: boolean;
};

export type PublicHomepageSection = HomepageSectionSeed & {
  id: string;
  updatedAt: Date;
};

export const homepageSectionLabels: Record<HomepageSectionKey, string> = {
  HERO_SUPPORTING_CONTENT: "Hero destek içeriği",
  SERVICES_PREVIEW: "Hizmetler önizleme",
  DEVICES_PREVIEW: "Cihazlar önizleme",
  BOARD_REPAIR: "Elektronik kart tamiri",
  WHY_US: "Neden Orontes",
  PROCESS: "Servis süreci",
  BLOG_PREVIEW: "Blog önizleme",
  FINAL_CTA: "Final CTA",
};

export const homepageSectionDescriptions: Record<HomepageSectionKey, string> = {
  HERO_SUPPORTING_CONTENT:
    "Hero alanının destek metinleri ve kısa güven unsurları.",
  SERVICES_PREVIEW: "Ana sayfadaki hizmet kartlarının başlığı ve limitleri.",
  DEVICES_PREVIEW: "Ana sayfadaki cihaz grubu önizleme alanı.",
  BOARD_REPAIR: "Elektronik kart tamiri tanıtım bölümü.",
  WHY_US: "Kurumsal güven ve tercih sebepleri.",
  PROCESS: "Servis akışı ve süreç adımları.",
  BLOG_PREVIEW: "Ana sayfa blog önizleme ayarları.",
  FINAL_CTA: "Footer öncesi servis talebi çağrısı.",
};
