import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlogCategoryForm } from "@/components/admin/blog/BlogCategoryForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaBlogRepository } from "@/lib/database/repositories/blog";

type EditBlogCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBlogCategoryPage({
  params,
}: EditBlogCategoryPageProps) {
  await requirePermission("blog.categories.manage");
  const { id } = await params;
  const category = await new PrismaBlogRepository(prisma).getAdminCategoryById(id);

  if (!category) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Blog CMS"
        title={category.name}
        description="Kategori adını, slug yapısını, SEO alanlarını ve aktiflik durumunu düzenleyin."
      />
      <BlogCategoryForm
        mode="edit"
        category={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          seoTitle: category.seoTitle,
          seoDescription: category.seoDescription,
          order: category.order,
          isActive: category.isActive,
        }}
      />
    </div>
  );
}
