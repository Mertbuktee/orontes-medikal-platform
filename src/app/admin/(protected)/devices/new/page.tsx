import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeviceGroupForm } from "@/components/admin/devices/DeviceGroupForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaDeviceGroupRepository } from "@/lib/database/repositories/device-groups";

export default async function NewDeviceGroupPage() {
  await requirePermission("devices.create");

  const repository = new PrismaDeviceGroupRepository(prisma);
  const [mediaItems, devices] = await Promise.all([
    repository.listSelectableMedia(),
    repository.listAdminDeviceGroups({
      query: undefined,
      page: 1,
      pageSize: 100,
      active: "all",
      featured: "all",
      archived: "all",
      capability: undefined,
      sort: "order",
    }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Cihaz Grupları"
        title="Yeni Cihaz Grubu Ekle"
        description="Public cihaz sayfasında ve ana sayfa önizlemesinde kullanılacak yeni cihaz içeriğini oluşturun."
      />
      <DeviceGroupForm
        mode="create"
        mediaItems={mediaItems}
        device={{
          title: "",
          slug: "",
          shortDescription: "",
          fullDescription: "",
          iconKey: "stethoscope",
          imageId: null,
          openGraphImageId: null,
          capabilities: ["Elektronik"],
          isFeatured: false,
          isActive: false,
          order: devices.total + 1,
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </div>
  );
}
