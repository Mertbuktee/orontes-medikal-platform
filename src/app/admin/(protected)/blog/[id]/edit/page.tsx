import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlogPostForm } from "@/components/admin/blog/BlogPostForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaBlogRepository } from "@/lib/database/repositories/blog";

type EditBlogPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  await requirePermission("blog.update");
  const { id } = await params;
  const repository = new PrismaBlogRepository(prisma);
  const [post, categories, authors, mediaItems] = await Promise.all([
    repository.getAdminPostById(id),
    repository.listAdminCategories({ includeArchived: true }),
    repository.listAuthorOptions(),
    repository.listSelectableMedia(),
  ]);

  if (!post) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Blog CMS"
        title={post.title}
        description="Blog yazısı içeriğini, medya seçimlerini, yayın durumunu ve SEO alanlarını düzenleyin."
      />
      <BlogPostForm
        mode="edit"
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          status: post.status,
          categoryId: post.categoryId,
          coverImageId: post.coverImageId,
          openGraphImageId: post.openGraphImageId,
          authorId: post.authorId,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          isFeatured: post.isFeatured,
          scheduledFor: post.scheduledFor?.toISOString() ?? null,
        }}
        categories={categories}
        authors={authors}
        mediaItems={mediaItems}
      />
    </div>
  );
}
