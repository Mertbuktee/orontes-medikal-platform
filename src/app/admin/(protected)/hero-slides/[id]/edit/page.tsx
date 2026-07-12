import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HeroSlideForm } from "@/components/admin/hero-slides/HeroSlideForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaHeroSlideRepository } from "@/lib/database/repositories/hero-slides";

type EditHeroSlidePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditHeroSlidePage({
  params,
}: EditHeroSlidePageProps) {
  await requirePermission("heroSlides.update");

  const { id } = await params;
  const repository = new PrismaHeroSlideRepository(prisma);
  const [slide, mediaItems] = await Promise.all([
    repository.getAdminSlideById(id),
    repository.listSelectableMedia(),
  ]);

  if (!slide) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Hero Slider"
        title="Slaytı Düzenle"
        description="Hero slider içeriğini, görselini, sıralamasını ve yayın durumunu güncelleyin."
      />
      <HeroSlideForm
        mode="edit"
        mediaItems={mediaItems}
        slide={{
          id: slide.id,
          badge: slide.badge,
          title: slide.title,
          description: slide.description,
          imageId: slide.imageId,
          imageAlt: slide.imageAlt,
          linkLabel: slide.linkLabel,
          linkUrl: slide.linkUrl,
          objectPosition: slide.objectPosition,
          order: slide.order,
          isActive: slide.isActive,
          includeInAutoplay: slide.includeInAutoplay,
        }}
      />
    </div>
  );
}
