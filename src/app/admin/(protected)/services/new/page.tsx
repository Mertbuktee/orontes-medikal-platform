import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm } from "@/components/admin/services/ServiceForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRepository } from "@/lib/database/repositories/services";

export default async function NewServicePage() {
  await requirePermission("services.create");

  const repository = new PrismaServiceRepository(prisma);
  const [mediaItems, services] = await Promise.all([
    repository.listSelectableMedia(),
    repository.listAdminServices({
      query: undefined,
      page: 1,
      pageSize: 100,
      active: "all",
      featured: "all",
      archived: "all",
      sort: "order",
    }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Hizmetler"
        title="Yeni Hizmet Ekle"
        description="Ana sayfa önizlemesi ve hizmetler sayfasında kullanılacak yeni teknik servis içeriğini oluşturun."
      />
      <ServiceForm
        mode="create"
        mediaItems={mediaItems}
        service={{
          title: "",
          slug: "",
          shortDescription: "",
          fullDescription: "",
          iconKey: "wrench",
          imageId: null,
          openGraphImageId: null,
          isFeatured: false,
          isActive: false,
          order: services.total + 1,
          seoTitle: "",
          seoDescription: "",
          ctaLabel: null,
          ctaHref: null,
        }}
      />
    </div>
  );
}
