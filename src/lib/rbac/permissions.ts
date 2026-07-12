export const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "SERVICE_STAFF",
  "VIEWER",
] as const;

export type Role = (typeof roles)[number];

export const permissions = [
  "dashboard.view",
  "serviceRequests.view",
  "serviceRequests.update",
  "serviceRequests.assign",
  "serviceRequests.notes.create",
  "serviceRequests.attachments.view",
  "serviceRequests.archive",
  "serviceRequests.delete",
  "devices.manage",
  "services.manage",
  "blog.manage",
  "media.view",
  "media.upload",
  "media.update",
  "media.delete",
  "heroSlides.view",
  "heroSlides.create",
  "heroSlides.update",
  "heroSlides.delete",
  "heroSlides.reorder",
  "heroSlides.publish",
  "homepage.manage",
  "seo.manage",
  "settings.manage",
  "users.manage",
  "roles.manage",
  "audit.view",
] as const;

export type Permission = (typeof permissions)[number];

export const rolePermissions: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: permissions,
  ADMIN: [
    "dashboard.view",
    "serviceRequests.view",
    "serviceRequests.update",
    "serviceRequests.assign",
    "serviceRequests.notes.create",
    "serviceRequests.attachments.view",
    "serviceRequests.archive",
    "serviceRequests.delete",
    "devices.manage",
    "services.manage",
    "blog.manage",
    "media.view",
    "media.upload",
    "media.update",
    "media.delete",
    "heroSlides.view",
    "heroSlides.create",
    "heroSlides.update",
    "heroSlides.delete",
    "heroSlides.reorder",
    "heroSlides.publish",
    "homepage.manage",
    "seo.manage",
    "settings.manage",
    "audit.view",
  ],
  EDITOR: [
    "dashboard.view",
    "devices.manage",
    "services.manage",
    "blog.manage",
    "media.view",
    "media.upload",
    "media.update",
    "heroSlides.view",
    "heroSlides.create",
    "heroSlides.update",
    "heroSlides.reorder",
    "homepage.manage",
    "seo.manage",
  ],
  SERVICE_STAFF: [
    "dashboard.view",
    "serviceRequests.view",
    "serviceRequests.update",
    "serviceRequests.notes.create",
    "serviceRequests.attachments.view",
  ],
  VIEWER: ["dashboard.view", "serviceRequests.view"],
};

const adminRoutePermissions: Array<{
  prefix: string;
  permission: Permission;
}> = [
  { prefix: "/admin/dashboard", permission: "dashboard.view" },
  { prefix: "/admin/service-requests", permission: "serviceRequests.view" },
  { prefix: "/admin/devices", permission: "devices.manage" },
  { prefix: "/admin/services", permission: "services.manage" },
  { prefix: "/admin/blog", permission: "blog.manage" },
  { prefix: "/admin/media", permission: "media.view" },
  { prefix: "/admin/hero-slides", permission: "heroSlides.view" },
  { prefix: "/admin/homepage", permission: "homepage.manage" },
  { prefix: "/admin/seo", permission: "seo.manage" },
  { prefix: "/admin/settings", permission: "settings.manage" },
  { prefix: "/admin/users", permission: "users.manage" },
  { prefix: "/admin/roles", permission: "roles.manage" },
  { prefix: "/admin/audit-log", permission: "audit.view" },
];

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function canAccessAdminRoute(role: Role, pathname: string) {
  const normalizedPath = normalizeAdminPath(pathname);

  if (normalizedPath === "/admin/login") {
    return true;
  }

  if (normalizedPath === "/admin") {
    return hasPermission(role, "dashboard.view");
  }

  const routePermission = adminRoutePermissions.find(
    ({ prefix }) =>
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  );

  if (!routePermission) {
    return false;
  }

  return hasPermission(role, routePermission.permission);
}

export function getAdminRoutePermission(pathname: string) {
  const normalizedPath = normalizeAdminPath(pathname);
  return adminRoutePermissions.find(
    ({ prefix }) =>
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  )?.permission;
}

function normalizeAdminPath(pathname: string) {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  return pathname.replace(/\/+$/, "") || "/";
}
