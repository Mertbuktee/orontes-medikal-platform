import type { Role } from "@prisma/client";

export type UserManagementOperation =
  | "create"
  | "update"
  | "assignRole"
  | "activate"
  | "deactivate"
  | "forcePasswordReset"
  | "revokeSessions"
  | "clearLock";

export type UserPolicyActor = {
  id: string;
  role: Role;
};

export type UserPolicyTarget = {
  id: string;
  role: Role;
  isActive: boolean;
};

const roleRank: Record<Role, number> = {
  VIEWER: 1,
  SERVICE_STAFF: 2,
  EDITOR: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

export function canAssignRole(actor: UserPolicyActor, role: Role) {
  if (actor.role === "SUPER_ADMIN") return true;
  if (actor.role !== "ADMIN") return false;
  return role !== "SUPER_ADMIN" && roleRank[role] <= roleRank.ADMIN;
}

export function canManageUser(
  actor: UserPolicyActor,
  target: UserPolicyTarget | null,
  operation: UserManagementOperation,
  input?: { nextRole?: Role; activeSuperAdminCount?: number }
) {
  if (actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN") {
    return false;
  }

  if (operation === "create") {
    return input?.nextRole ? canAssignRole(actor, input.nextRole) : true;
  }

  if (!target) return false;

  const isSelf = actor.id === target.id;
  const targetIsSuperAdmin = target.role === "SUPER_ADMIN";
  const lastActiveSuperAdmin =
    targetIsSuperAdmin &&
    target.isActive &&
    (input?.activeSuperAdminCount ?? 2) <= 1;

  if (actor.role === "ADMIN" && targetIsSuperAdmin) {
    return false;
  }

  if (operation === "assignRole") {
    if (isSelf) return false;
    if (!input?.nextRole || !canAssignRole(actor, input.nextRole)) return false;
    if (lastActiveSuperAdmin && input.nextRole !== "SUPER_ADMIN") return false;
    return true;
  }

  if (operation === "deactivate") {
    if (isSelf) return false;
    if (lastActiveSuperAdmin) return false;
    return true;
  }

  if (operation === "activate") {
    return true;
  }

  if (operation === "update") {
    if (isSelf && input?.nextRole && input.nextRole !== target.role) {
      return false;
    }
    return true;
  }

  if (
    operation === "forcePasswordReset" ||
    operation === "revokeSessions" ||
    operation === "clearLock"
  ) {
    return true;
  }

  return false;
}

export function getAssignableRolesForActor(actor: UserPolicyActor): Role[] {
  if (actor.role === "SUPER_ADMIN") {
    return ["SUPER_ADMIN", "ADMIN", "EDITOR", "SERVICE_STAFF", "VIEWER"];
  }

  if (actor.role === "ADMIN") {
    return ["ADMIN", "EDITOR", "SERVICE_STAFF", "VIEWER"];
  }

  return [];
}

export function getRoleLabel(role: Role) {
  const labels = {
    SUPER_ADMIN: "Süper Admin",
    ADMIN: "Admin",
    EDITOR: "Editör",
    SERVICE_STAFF: "Servis Personeli",
    VIEWER: "Görüntüleyici",
  } satisfies Record<Role, string>;

  return labels[role];
}

export function getRoleDescription(role: Role) {
  const descriptions = {
    SUPER_ADMIN: "Tüm yönetim paneli, güvenlik ve kritik sistem işlemlerine erişir.",
    ADMIN: "İçerik, servis talepleri, medya, ayarlar ve normal kullanıcı yönetimini yapar.",
    EDITOR: "İçerik, blog, medya ve public sayfa yönetimi yapar; kullanıcı yönetemez.",
    SERVICE_STAFF: "Servis taleplerini inceler, durum günceller ve not ekler.",
    VIEWER: "Yetkili olduğu alanlarda sadece okuma odaklı sınırlı erişime sahiptir.",
  } satisfies Record<Role, string>;

  return descriptions[role];
}
