import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeviceGroupForm } from "@/components/admin/devices/DeviceGroupForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaDeviceGroupRepository } from "@/lib/database/repositories/device-groups";

type EditDeviceGroupPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDeviceGroupPage({
  params,
}: EditDeviceGroupPageProps) {
  await requirePermission("devices.update");

  const { id } = await params;
  const repository = new PrismaDeviceGroupRepository(prisma);
  const [device, mediaItems] = await Promise.all([
    repository.getAdminDeviceGroupById(id),
    repository.listSelectableMedia(),
  ]);

  if (!device) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Cihaz Grupları"
        title="Cihaz Grubunu Düzenle"
        description={`${device.title} içeriğini, SEO alanlarını ve public görünürlüğünü güncelleyin.`}
      />
      <DeviceGroupForm
        mode="edit"
        mediaItems={mediaItems}
        device={{
          id: device.id,
          title: device.title,
          slug: device.slug,
          shortDescription: device.shortDescription,
          fullDescription: device.fullDescription,
          iconKey: device.iconKey,
          imageId: device.imageId,
          openGraphImageId: device.openGraphImageId,
          capabilities: device.capabilities,
          isFeatured: device.isFeatured,
          isActive: device.isActive,
          order: device.order,
          seoTitle: device.seoTitle,
          seoDescription: device.seoDescription,
        }}
      />
    </div>
  );
}
