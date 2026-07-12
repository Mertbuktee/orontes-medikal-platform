import {
  Activity,
  BookOpenText,
  Boxes,
  ClipboardList,
  FileText,
  Home,
  ImageIcon,
  LayoutDashboard,
  LockKeyhole,
  MonitorCog,
  Search,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/rbac/permissions";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
  children?: AdminNavItem[];
};

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    requiredPermission: "dashboard.view",
  },
  {
    title: "Servis Talepleri",
    href: "/admin/service-requests",
    icon: ClipboardList,
    requiredPermission: "serviceRequests.view",
  },
  {
    title: "Cihaz Grupları",
    href: "/admin/devices",
    icon: MonitorCog,
    requiredPermission: "devices.manage",
  },
  {
    title: "Hizmetler",
    href: "/admin/services",
    icon: Boxes,
    requiredPermission: "services.manage",
  },
  {
    title: "Blog",
    href: "/admin/blog",
    icon: BookOpenText,
    requiredPermission: "blog.manage",
  },
  {
    title: "Medya",
    href: "/admin/media",
    icon: ImageIcon,
    requiredPermission: "media.manage",
  },
  {
    title: "Ana Sayfa Yönetimi",
    href: "/admin/homepage",
    icon: Home,
    requiredPermission: "homepage.manage",
  },
  {
    title: "SEO",
    href: "/admin/seo",
    icon: Search,
    requiredPermission: "seo.manage",
  },
  {
    title: "Site Ayarları",
    href: "/admin/settings",
    icon: Settings,
    requiredPermission: "settings.manage",
  },
  {
    title: "Kullanıcılar",
    href: "/admin/users",
    icon: Users,
    requiredPermission: "users.manage",
  },
  {
    title: "Roller ve Yetkiler",
    href: "/admin/roles",
    icon: LockKeyhole,
    requiredPermission: "roles.manage",
  },
  {
    title: "Audit Log",
    href: "/admin/audit-log",
    icon: Activity,
    requiredPermission: "audit.view",
  },
];

export const adminQuickActionItems = [
  {
    title: "Servis Taleplerini Görüntüle",
    href: "/admin/service-requests",
    icon: ClipboardList,
  },
  {
    title: "Yeni Blog Yazısı",
    href: "/admin/blog",
    icon: FileText,
  },
  {
    title: "Cihaz Grubu Ekle",
    href: "/admin/devices",
    icon: MonitorCog,
  },
  {
    title: "Site Ayarlarını Aç",
    href: "/admin/settings",
    icon: ShieldCheck,
  },
] satisfies Array<{
  title: string;
  href: string;
  icon: LucideIcon;
}>;
