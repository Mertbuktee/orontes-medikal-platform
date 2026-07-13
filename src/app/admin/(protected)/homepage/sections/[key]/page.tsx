import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HomepageSectionForm } from "@/components/admin/homepage/HomepageSectionForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { HomepageContentRepository } from "@/lib/database/repositories/homepage-content";
import {
  homepageSectionDescriptions,
  homepageSectionLabels,
} from "@/lib/homepage/homepage-types";
import {
  homepageSectionKeySchema,
  parseHomepageSectionContent,
} from "@/lib/homepage/homepage-validation";

type EditHomepageSectionPageProps = {
  params: Promise<{ key: string }>;
};

export default async function EditHomepageSectionPage({
  params,
}: EditHomepageSectionPageProps) {
  await requirePermission("homepage.update");
  const { key } = await params;
  const parsedKey = homepageSectionKeySchema.safeParse(key);
  if (!parsedKey.success) notFound();

  const repository = new HomepageContentRepository(prisma);
  const [section, mediaItems] = await Promise.all([
    repository.getSectionByKey(parsedKey.data),
    repository.listSelectableMedia(),
  ]);
  const content = parseHomepageSectionContent(parsedKey.data, section.content);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Ana Sayfa Bölümü"
        title={homepageSectionLabels[parsedKey.data]}
        description={homepageSectionDescriptions[parsedKey.data]}
      />

      <HomepageSectionForm
        mediaItems={mediaItems}
        section={{
          key: parsedKey.data,
          title: section.title,
          eyebrow: section.eyebrow,
          description: section.description,
          order: section.order,
          isVisible: section.isVisible,
          content,
        }}
      />
    </div>
  );
}
