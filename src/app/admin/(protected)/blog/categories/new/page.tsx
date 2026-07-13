import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlogCategoryForm } from "@/components/admin/blog/BlogCategoryForm";
import { requirePermission } from "@/lib/auth/admin-session";

export default async function NewBlogCategoryPage() {
  await requirePermission("blog.categories.manage");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Blog CMS"
        title="Yeni Blog Kategorisi"
        description="Blog yazıları için kategori oluşturun."
      />
      <BlogCategoryForm
        mode="create"
        category={{
          name: "",
          slug: "",
          description: "",
          seoTitle: "",
          seoDescription: "",
          order: 1,
          isActive: true,
        }}
      />
    </div>
  );
}
