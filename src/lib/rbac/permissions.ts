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
  "devices.view",
  "devices.create",
  "devices.update",
  "devices.delete",
  "devices.reorder",
  "devices.publish",
  "devices.seo.manage",
  "devices.manage",
  "services.view",
  "services.create",
  "services.update",
  "services.delete",
  "services.reorder",
  "services.publish",
  "services.seo.manage",
  "services.manage",
  "blog.view",
  "blog.create",
  "blog.update",
  "blog.delete",
  "blog.publish",
  "blog.schedule",
  "blog.categories.manage",
  "blog.seo.manage",
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
  "homepage.view",
  "homepage.update",
  "homepage.reorder",
  "homepage.publish",
  "homepage.seo.manage",
  "homepage.manage",
  "seo.manage",
  "settings.view",
  "settings.update",
  "settings.seo.manage",
  "settings.manage",
  "account.security.manage",
  "sessions.manage.own",
  "mfa.manage.own",
  "users.view",
  "users.create",
  "users.update",
  "users.activate",
  "users.deactivate",
  "users.assignRole",
  "users.sessions.revoke",
  "users.password.forceReset",
  "users.manage",
  "roles.view",
  "roles.manage",
  "audit.view",
  "audit.export",
  "security.view",
  "security.sessions.view",
  "security.accounts.view",
  "security.events.view",
  "notifications.view",
  "notifications.preferences.manage.own",
  "notifications.emailDeliveries.view",
  "notifications.emailDeliveries.retry",
  "notifications.emailDeliveries.cancel",
  "notifications.settings.view",
  "notifications.settings.update",
  "notifications.testEmail.send",
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
    "devices.view",
    "devices.create",
    "devices.update",
    "devices.delete",
    "devices.reorder",
    "devices.publish",
    "devices.seo.manage",
    "devices.manage",
    "services.view",
    "services.create",
    "services.update",
    "services.delete",
    "services.reorder",
    "services.publish",
    "services.seo.manage",
    "services.manage",
    "blog.view",
    "blog.create",
    "blog.update",
    "blog.delete",
    "blog.publish",
    "blog.schedule",
    "blog.categories.manage",
    "blog.seo.manage",
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
    "homepage.view",
    "homepage.update",
    "homepage.reorder",
    "homepage.publish",
    "homepage.seo.manage",
    "homepage.manage",
    "seo.manage",
    "settings.view",
    "settings.update",
    "settings.seo.manage",
    "settings.manage",
    "account.security.manage",
    "sessions.manage.own",
    "mfa.manage.own",
    "users.view",
    "users.create",
    "users.update",
    "users.activate",
    "users.deactivate",
    "users.assignRole",
    "users.sessions.revoke",
    "users.password.forceReset",
    "roles.view",
    "audit.view",
    "security.view",
    "security.sessions.view",
    "security.accounts.view",
    "security.events.view",
    "notifications.view",
    "notifications.preferences.manage.own",
    "notifications.emailDeliveries.view",
    "notifications.emailDeliveries.retry",
    "notifications.emailDeliveries.cancel",
    "notifications.settings.view",
    "notifications.settings.update",
    "notifications.testEmail.send",
  ],
  EDITOR: [
    "dashboard.view",
    "devices.view",
    "devices.create",
    "devices.update",
    "devices.reorder",
    "devices.seo.manage",
    "devices.manage",
    "services.view",
    "services.create",
    "services.update",
    "services.reorder",
    "services.seo.manage",
    "services.manage",
    "blog.view",
    "blog.create",
    "blog.update",
    "blog.categories.manage",
    "blog.seo.manage",
    "blog.manage",
    "media.view",
    "media.upload",
    "media.update",
    "heroSlides.view",
    "heroSlides.create",
    "heroSlides.update",
    "heroSlides.reorder",
    "homepage.view",
    "homepage.update",
    "homepage.reorder",
    "homepage.seo.manage",
    "homepage.manage",
    "seo.manage",
    "settings.view",
    "settings.update",
    "settings.seo.manage",
    "account.security.manage",
    "sessions.manage.own",
    "mfa.manage.own",
    "notifications.view",
    "notifications.preferences.manage.own",
  ],
  SERVICE_STAFF: [
    "dashboard.view",
    "serviceRequests.view",
    "serviceRequests.update",
    "serviceRequests.notes.create",
    "serviceRequests.attachments.view",
    "devices.view",
    "services.view",
    "account.security.manage",
    "sessions.manage.own",
    "mfa.manage.own",
    "notifications.view",
    "notifications.preferences.manage.own",
  ],
  VIEWER: [
    "dashboard.view",
    "serviceRequests.view",
    "account.security.manage",
    "sessions.manage.own",
    "mfa.manage.own",
    "notifications.view",
    "notifications.preferences.manage.own",
  ],
};

const adminRoutePermissions: Array<{
  prefix: string;
  permission: Permission;
}> = [
  { prefix: "/admin/dashboard", permission: "dashboard.view" },
  { prefix: "/admin/service-requests", permission: "serviceRequests.view" },
  { prefix: "/admin/devices", permission: "devices.view" },
  { prefix: "/admin/services", permission: "services.view" },
  { prefix: "/admin/blog", permission: "blog.view" },
  { prefix: "/admin/media", permission: "media.view" },
  { prefix: "/admin/hero-slides", permission: "heroSlides.view" },
  { prefix: "/admin/homepage", permission: "homepage.view" },
  { prefix: "/admin/seo", permission: "seo.manage" },
  { prefix: "/admin/settings/email", permission: "notifications.settings.view" },
  { prefix: "/admin/settings", permission: "settings.view" },
  { prefix: "/admin/account/security", permission: "account.security.manage" },
  { prefix: "/admin/users", permission: "users.view" },
  { prefix: "/admin/roles", permission: "roles.view" },
  { prefix: "/admin/audit", permission: "audit.view" },
  { prefix: "/admin/audit-log", permission: "audit.view" },
  { prefix: "/admin/security", permission: "security.view" },
  { prefix: "/admin/notifications/email-deliveries", permission: "notifications.emailDeliveries.view" },
  { prefix: "/admin/notifications", permission: "notifications.view" },
  { prefix: "/admin/account/notifications", permission: "notifications.preferences.manage.own" },
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
