import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlogPostForm } from "@/components/admin/blog/BlogPostForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaBlogRepository } from "@/lib/database/repositories/blog";

export default async function NewBlogPostPage() {
  await requirePermission("blog.create");
  const repository = new PrismaBlogRepository(prisma);
  const [categories, authors, mediaItems] = await Promise.all([
    repository.listAdminCategories(),
    repository.listAuthorOptions(),
    repository.listSelectableMedia(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Blog CMS"
        title="Yeni Blog Yazısı"
        description="Güvenli blok editörüyle teknik bilgi içeriği oluşturun. Yayınlama ayrıca server-side izin kontrolünden geçer."
      />
      <BlogPostForm
        mode="create"
        categories={categories}
        authors={authors}
        mediaItems={mediaItems}
        post={{
          title: "",
          slug: "",
          excerpt: "",
          content: [],
          status: "DRAFT",
          categoryId: null,
          coverImageId: null,
          openGraphImageId: null,
          authorId: null,
          seoTitle: "",
          seoDescription: "",
          isFeatured: false,
          scheduledFor: null,
        }}
      />
    </div>
  );
}
