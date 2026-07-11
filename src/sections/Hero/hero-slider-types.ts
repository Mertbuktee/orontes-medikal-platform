export type HeroSlide = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  badge?: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  includeInAutoplay: boolean;
};
