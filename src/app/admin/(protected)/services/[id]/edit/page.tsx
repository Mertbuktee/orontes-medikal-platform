import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm } from "@/components/admin/services/ServiceForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRepository } from "@/lib/database/repositories/services";

type EditServicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditServicePage({ params }: EditServicePageProps) {
  await requirePermission("services.update");

  const { id } = await params;
  const repository = new PrismaServiceRepository(prisma);
  const [service, mediaItems] = await Promise.all([
    repository.getAdminServiceById(id),
    repository.listSelectableMedia(),
  ]);

  if (!service) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Hizmetler"
        title="Hizmeti Düzenle"
        description={`${service.title} içeriğini, SEO alanlarını ve public görünürlüğünü güncelleyin.`}
      />
      <ServiceForm
        mode="edit"
        mediaItems={mediaItems}
        service={{
          id: service.id,
          title: service.title,
          slug: service.slug,
          shortDescription: service.shortDescription,
          fullDescription: service.fullDescription,
          iconKey: service.iconKey,
          imageId: service.imageId,
          openGraphImageId: service.openGraphImageId,
          isFeatured: service.isFeatured,
          isActive: service.isActive,
          order: service.order,
          seoTitle: service.seoTitle,
          seoDescription: service.seoDescription,
          ctaLabel: service.ctaLabel,
          ctaHref: service.ctaHref,
        }}
      />
    </div>
  );
}
