import type { PrismaClient, Role } from "@prisma/client";

import { hasPermission } from "@/lib/rbac/permissions";

export type PanelSearchScope = "admin" | "technical";

export type PanelSearchResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  type: string;
  updatedAt?: Date;
};

export type PanelSearchSection = {
  key: string;
  title: string;
  results: PanelSearchResult[];
};

const searchLimit = 8;

export async function searchAdminPanel(
  client: PrismaClient,
  role: Role,
  query: string
) {
  return searchPanel(client, role, "admin", query);
}

export async function searchTechnicalPanel(
  client: PrismaClient,
  role: Role,
  query: string
) {
  return searchPanel(client, role, "technical", query);
}

async function searchPanel(
  client: PrismaClient,
  role: Role,
  scope: PanelSearchScope,
  rawQuery: string
): Promise<PanelSearchSection[]> {
  const query = normalizeQuery(rawQuery);
  if (!query) return [];

  const sections = await Promise.all([
    hasPermission(role, "serviceRequests.view")
      ? searchServiceRequests(client, query, scope)
      : emptySection("serviceRequests", "Servis Talepleri"),
    hasPermission(role, "technicalCustomers.view") ||
    hasPermission(role, "serviceRequests.view")
      ? searchCustomers(client, query)
      : emptySection("customers", "Müşteriler"),
    hasPermission(role, "technicalDevices.view") ||
    hasPermission(role, "serviceRequests.view")
      ? searchCustomerDevices(client, query)
      : emptySection("customerDevices", "Cihazlar"),
    hasPermission(role, "serviceRequests.view")
      ? searchServiceHistory(client, query)
      : emptySection("history", "Servis Geçmişi"),
    scope === "admin" && hasPermission(role, "devices.view")
      ? searchDeviceGroups(client, query)
      : emptySection("deviceGroups", "Cihaz Grupları"),
    scope === "admin" && hasPermission(role, "services.view")
      ? searchServices(client, query)
      : emptySection("services", "Hizmetler"),
    scope === "admin" && hasPermission(role, "blog.view")
      ? searchBlog(client, query)
      : emptySection("blog", "Blog"),
    scope === "admin" && hasPermission(role, "media.view")
      ? searchMedia(client, query)
      : emptySection("media", "Medya"),
    scope === "admin" && hasPermission(role, "heroSlides.view")
      ? searchHeroSlides(client, query)
      : emptySection("heroSlides", "Hero Slider"),
    scope === "admin" && hasPermission(role, "users.view")
      ? searchUsers(client, query)
      : emptySection("users", "Kullanıcılar"),
    scope === "admin" && hasPermission(role, "settings.view")
      ? searchSettings(query)
      : emptySection("settings", "Site Ayarları"),
  ]);

  return sections.filter((section) => section.results.length > 0);
}

async function searchServiceRequests(
  client: PrismaClient,
  query: string,
  scope: PanelSearchScope
): Promise<PanelSearchSection> {
  const items = await client.serviceRequest.findMany({
    where: {
      OR: [
        { id: { contains: query, mode: "insensitive" } },
        { fullName: { contains: query, mode: "insensitive" } },
        { company: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { deviceBrand: { contains: query, mode: "insensitive" } },
        { deviceModel: { contains: query, mode: "insensitive" } },
        { deviceSerialNumber: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: searchLimit,
    select: {
      id: true,
      fullName: true,
      company: true,
      status: true,
      deviceBrand: true,
      deviceModel: true,
      updatedAt: true,
    },
  });

  return {
    key: "serviceRequests",
    title: "Servis Talepleri",
    results: items.map((item) => ({
      id: item.id,
      title: `${item.fullName} - ${item.status}`,
      description: [item.company, item.deviceBrand, item.deviceModel]
        .filter(Boolean)
        .join(" / "),
      href: `/${scope}/service-requests/${item.id}`,
      type: "Servis talebi",
      updatedAt: item.updatedAt,
    })),
  };
}

async function searchCustomers(
  client: PrismaClient,
  query: string
): Promise<PanelSearchSection> {
  const items = await client.customerCompany.findMany({
    where: {
      archivedAt: null,
      OR: [
        { legalName: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { taxNumber: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: searchLimit,
    select: {
      id: true,
      displayName: true,
      legalName: true,
      phone: true,
      email: true,
      updatedAt: true,
    },
  });

  return {
    key: "customers",
    title: "Müşteriler",
    results: items.map((item) => ({
      id: item.id,
      title: item.displayName,
      description: [item.legalName, item.phone, item.email].filter(Boolean).join(" / "),
      href: `/technical/customers/${item.id}`,
      type: "Müşteri",
      updatedAt: item.updatedAt,
    })),
  };
}

async function searchCustomerDevices(
  client: PrismaClient,
  query: string
): Promise<PanelSearchSection> {
  const items = await client.customerDevice.findMany({
    where: {
      archivedAt: null,
      OR: [
        { publicCode: { contains: query, mode: "insensitive" } },
        { serialNumber: { contains: query, mode: "insensitive" } },
        { assetTag: { contains: query, mode: "insensitive" } },
        { hospitalInventoryNumber: { contains: query, mode: "insensitive" } },
        { customManufacturer: { contains: query, mode: "insensitive" } },
        { customModel: { contains: query, mode: "insensitive" } },
        { manufacturer: { name: { contains: query, mode: "insensitive" } } },
        { deviceModel: { name: { contains: query, mode: "insensitive" } } },
        { customerCompany: { displayName: { contains: query, mode: "insensitive" } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: searchLimit,
    include: {
      customerCompany: { select: { displayName: true } },
      manufacturer: { select: { name: true } },
      deviceModel: { select: { name: true } },
    },
  });

  return {
    key: "customerDevices",
    title: "Cihazlar",
    results: items.map((item) => ({
      id: item.id,
      title: `${item.publicCode} - ${item.serialNumber}`,
      description: [
        item.customerCompany.displayName,
        item.manufacturer?.name ?? item.customManufacturer,
        item.deviceModel?.name ?? item.customModel,
      ]
        .filter(Boolean)
        .join(" / "),
      href: `/technical/devices/${item.id}`,
      type: "Cihaz",
      updatedAt: item.updatedAt,
    })),
  };
}

async function searchServiceHistory(
  client: PrismaClient,
  query: string
): Promise<PanelSearchSection> {
  const items = await client.deviceServiceHistory.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { company: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { deviceBrand: { contains: query, mode: "insensitive" } },
        { deviceModel: { contains: query, mode: "insensitive" } },
        { deviceSerialNumber: { contains: query, mode: "insensitive" } },
        { serviceSummary: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { completedAt: "desc" },
    take: searchLimit,
    select: {
      id: true,
      serviceRequestId: true,
      fullName: true,
      company: true,
      deviceBrand: true,
      deviceModel: true,
      completedAt: true,
    },
  });

  return {
    key: "history",
    title: "Servis Geçmişi",
    results: items.map((item) => ({
      id: item.id,
      title: `${item.fullName} - ${item.deviceBrand ?? "Cihaz"}`,
      description: [item.company, item.deviceModel].filter(Boolean).join(" / "),
      href: `/technical/service-requests/${item.serviceRequestId}`,
      type: "Servis geçmişi",
      updatedAt: item.completedAt,
    })),
  };
}

async function searchDeviceGroups(
  client: PrismaClient,
  query: string
): Promise<PanelSearchSection> {
  const items = await client.deviceGroup.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
        { shortDescription: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: searchLimit,
    select: { id: true, title: true, slug: true, updatedAt: true },
  });

  return {
    key: "deviceGroups",
    title: "Cihaz Grupları",
    results: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.slug,
      href: `/admin/devices/${item.id}`,
      type: "Cihaz grubu",
      updatedAt: item.updatedAt,
    })),
  };
}

async function searchServices(
  client: PrismaClient,
  query: string
): Promise<PanelSearchSection> {
  const items = await client.service.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
        { shortDescription: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: searchLimit,
    select: { id: true, title: true, slug: true, updatedAt: true },
  });

  return {
    key: "services",
    title: "Hizmetler",
    results: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.slug,
      href: `/admin/services/${item.id}`,
      type: "Hizmet",
      updatedAt: item.updatedAt,
    })),
  };
}

async function searchBlog(
  client: PrismaClient,
  query: string
): Promise<PanelSearchSection> {
  const items = await client.blogPost.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: searchLimit,
    select: { id: true, title: true, status: true, slug: true, updatedAt: true },
  });

  return {
    key: "blog",
    title: "Blog",
    results: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: `${item.status} / ${item.slug}`,
      href: `/admin/blog/${item.id}`,
      type: "Blog yazısı",
      updatedAt: item.updatedAt,
    })),
  };
}

async function searchMedia(
  client: PrismaClient,
  query: string
): Promise<PanelSearchSection> {
  const items = await client.media.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { originalName: { contains: query, mode: "insensitive" } },
        { altText: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: searchLimit,
    select: { id: true, title: true, mimeType: true, originalName: true, updatedAt: true },
  });

  return {
    key: "media",
    title: "Medya",
    results: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: [item.originalName, item.mimeType].filter(Boolean).join(" / "),
      href: `/admin/media/${item.id}`,
      type: "Medya",
      updatedAt: item.updatedAt,
    })),
  };
}

async function searchHeroSlides(
  client: PrismaClient,
  query: string
): Promise<PanelSearchSection> {
  const items = await client.heroSlide.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { badge: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: searchLimit,
    select: { id: true, title: true, badge: true, updatedAt: true },
  });

  return {
    key: "heroSlides",
    title: "Hero Slider",
    results: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.badge ?? "Hero slaytı",
      href: `/admin/hero-slides/${item.id}`,
      type: "Hero slaytı",
      updatedAt: item.updatedAt,
    })),
  };
}

async function searchUsers(
  client: PrismaClient,
  query: string
): Promise<PanelSearchSection> {
  const items = await client.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: searchLimit,
    select: { id: true, name: true, email: true, role: true, updatedAt: true },
  });

  return {
    key: "users",
    title: "Kullanıcılar",
    results: items.map((item) => ({
      id: item.id,
      title: item.name,
      description: `${item.email} / ${item.role}`,
      href: `/admin/users/${item.id}`,
      type: "Kullanıcı",
      updatedAt: item.updatedAt,
    })),
  };
}

function searchSettings(query: string): PanelSearchSection {
  const settings: PanelSearchResult[] = [
    ["Genel Site Ayarları", "Şirket adı, açıklama ve slogan", "/admin/settings#general"],
    ["Footer", "Footer açıklaması, powered-by, harita ve alt alanlar", "/admin/settings#footer"],
    ["Harita", "Google Maps embed, place link ve koordinatlar", "/admin/settings#map"],
    ["Sosyal Medya", "Instagram, LinkedIn ve diğer sosyal linkler", "/admin/settings#social"],
    ["SEO", "Global title, description ve canonical origin", "/admin/settings#seo"],
  ]
    .filter(([title, description]) =>
      `${title} ${description}`.toLocaleLowerCase("tr-TR").includes(
        query.toLocaleLowerCase("tr-TR")
      )
    )
    .map(([title, description, href], index) => ({
      id: `settings-${index}`,
      title,
      description,
      href,
      type: "Site ayarı",
    }));

  return { key: "settings", title: "Site Ayarları", results: settings };
}

function emptySection(key: string, title: string): Promise<PanelSearchSection> {
  return Promise.resolve({ key, title, results: [] });
}

function normalizeQuery(query: string) {
  return query.trim().replace(/\s+/g, " ").slice(0, 120);
}
