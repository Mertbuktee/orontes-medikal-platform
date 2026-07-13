import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { PrismaMediaRepository } from "@/lib/database/repositories/media";
import { PrismaServiceRepository } from "@/lib/database/repositories/services";

const baseService = {
  id: "service-1",
  title: "Teknik Servis",
  slug: "teknik-servis",
  shortDescription: "Planlı teknik servis",
  fullDescription: "Planlı teknik servis açıklaması",
  iconKey: "wrench",
  image: null,
  imageId: null,
  openGraphImageId: null,
  isFeatured: true,
  isActive: true,
  order: 1,
  seoTitle: "Teknik Servis",
  seoDescription: "Planlı teknik servis hizmeti.",
  ctaLabel: null,
  ctaHref: null,
  archivedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  createdById: null,
  updatedById: null,
};

function createMockServiceClient(
  services = [
    baseService,
    {
      ...baseService,
      id: "service-2",
      slug: "pasif",
      isActive: false,
      isFeatured: true,
      order: 2,
    },
    {
      ...baseService,
      id: "service-3",
      slug: "arsiv",
      archivedAt: new Date("2026-01-02T00:00:00.000Z"),
      order: 3,
    },
  ]
) {
  const client = {
    service: {
      findMany: vi.fn(({ where, take }: { where?: Record<string, unknown>; take?: number }) => {
        let items = [...services];
        if (where?.isActive !== undefined) {
          items = items.filter((item) => item.isActive === where.isActive);
        }
        if (where?.isFeatured !== undefined) {
          items = items.filter((item) => item.isFeatured === where.isFeatured);
        }
        if (where?.archivedAt === null) {
          items = items.filter((item) => item.archivedAt === null);
        }
        items.sort((a, b) => a.order - b.order);
        return Promise.resolve(take ? items.slice(0, take) : items);
      }),
      count: vi.fn(() => Promise.resolve(0)),
      create: vi.fn(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...baseService, ...data })
      ),
      update: vi.fn(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
        Promise.resolve({ ...baseService, id: where.id, ...data })
      ),
      findUnique: vi.fn(() => Promise.resolve({ archivedAt: new Date() })),
      findFirst: vi.fn(() => Promise.resolve(baseService)),
      delete: vi.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve({ ...baseService, id: where.id })
      ),
    },
    media: {
      findFirst: vi.fn(() => Promise.resolve({ id: "media-1" })),
    },
    $transaction: vi.fn((operations: Array<Promise<unknown>>) =>
      Promise.all(operations)
    ),
  };

  return client as unknown as PrismaClient;
}

const validServiceInput = {
  title: "Yeni Teknik Servis",
  slug: "yeni-teknik-servis",
  shortDescription: "Medikal cihazlar için planlı teknik servis süreci.",
  fullDescription:
    "Medikal cihazlar için kabul, arıza analizi, onarım ve teslim süreçlerini kapsayan teknik servis hizmeti.",
  iconKey: "wrench",
  imageId: null,
  openGraphImageId: null,
  isFeatured: true,
  isActive: true,
  order: 1,
  seoTitle: "Yeni Teknik Servis",
  seoDescription: "Medikal cihazlar için planlı teknik servis hizmeti.",
  ctaLabel: null,
  ctaHref: null,
};

describe("PrismaServiceRepository", () => {
  it("returns only active non-archived services publicly", async () => {
    const repository = new PrismaServiceRepository(createMockServiceClient());

    const items = await repository.listPublicActiveServices();

    expect(items).toHaveLength(1);
    expect(items[0]?.slug).toBe("teknik-servis");
  });

  it("respects featured public limit and active filtering", async () => {
    const repository = new PrismaServiceRepository(createMockServiceClient());

    const items = await repository.listPublicFeaturedServices(1);

    expect(items).toHaveLength(1);
    expect(items[0]?.isFeatured).toBe(true);
  });

  it("creates and updates services with explicit DTO input", async () => {
    const client = createMockServiceClient();
    const repository = new PrismaServiceRepository(client);

    const created = await repository.createService(validServiceInput, "user-1");
    const updated = await repository.updateService(
      created.id,
      { ...validServiceInput, title: "Güncel Teknik Servis" },
      "user-1"
    );

    expect(created.slug).toBe("yeni-teknik-servis");
    expect(updated.title).toBe("Güncel Teknik Servis");
  });

  it("rejects duplicate slugs during create", async () => {
    const client = createMockServiceClient();
    vi.mocked(client.service.count).mockResolvedValueOnce(1);
    const repository = new PrismaServiceRepository(client);

    await expect(
      repository.createService(validServiceInput, "user-1")
    ).rejects.toThrow("Service slug already exists.");
  });

  it("archives and restores services without hard deleting media", async () => {
    const repository = new PrismaServiceRepository(createMockServiceClient());

    const archived = await repository.archiveService("service-1", "user-1");
    const restored = await repository.restoreService("service-1", "user-1");

    expect(archived.archivedAt).toBeInstanceOf(Date);
    expect(restored.archivedAt).toBeNull();
    expect(restored.isActive).toBe(false);
  });
});

describe("Service media usage", () => {
  it("exposes Service and Service Open Graph usage in media detail data", () => {
    const repository = new PrismaMediaRepository(createMockServiceClient());
    const usage = repository.getUsage({
      id: "media-1",
      heroSlides: [],
      blogPostCovers: [],
      deviceGroups: [],
      deviceGroupOpenGraphs: [],
      services: [{ id: "service-1", title: "Teknik Servis" }],
      serviceOpenGraphs: [{ id: "service-2", title: "SEO Hizmeti" }],
    });

    expect(usage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: "Service",
          adminUrl: "/admin/services/service-1",
        }),
        expect.objectContaining({
          entityType: "ServiceOpenGraph",
          adminUrl: "/admin/services/service-2/edit",
        }),
      ])
    );
  });
});
