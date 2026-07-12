import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HeroSlideForm } from "@/components/admin/hero-slides/HeroSlideForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaHeroSlideRepository } from "@/lib/database/repositories/hero-slides";

export default async function NewHeroSlidePage() {
  await requirePermission("heroSlides.create");

  const repository = new PrismaHeroSlideRepository(prisma);
  const mediaItems = await repository.listSelectableMedia();
  const slides = await repository.listAdminSlides();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Hero Slider"
        title="Yeni Slayt Ekle"
        description="Ana sayfa Hero slider için yeni bir servis görseli ve metni oluşturun."
      />
      <HeroSlideForm
        mode="create"
        mediaItems={mediaItems}
        slide={{
          badge: "",
          title: "",
          description: "",
          imageId: mediaItems[0]?.id ?? "",
          imageAlt: mediaItems[0]?.altText ?? "",
          linkLabel: "",
          linkUrl: "",
          objectPosition: "center",
          order: slides.length + 1,
          isActive: true,
          includeInAutoplay: true,
        }}
      />
    </div>
  );
}
