import {
  Activity,
  BookOpenText,
  Boxes,
  ClipboardList,
  Home,
  ImageIcon,
  Images,
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
    requiredPermission: "devices.view",
  },
  {
    title: "Hizmetler",
    href: "/admin/services",
    icon: Boxes,
    requiredPermission: "services.view",
  },
  {
    title: "Blog",
    href: "/admin/blog",
    icon: BookOpenText,
    requiredPermission: "blog.view",
    children: [
      {
        title: "Blog Yazıları",
        href: "/admin/blog",
        icon: BookOpenText,
        requiredPermission: "blog.view",
      },
      {
        title: "Blog Kategorileri",
        href: "/admin/blog/categories",
        icon: BookOpenText,
        requiredPermission: "blog.categories.manage",
      },
    ],
  },
  {
    title: "Medya",
    href: "/admin/media",
    icon: ImageIcon,
    requiredPermission: "media.view",
  },
  {
    title: "Hero Slider",
    href: "/admin/hero-slides",
    icon: Images,
    requiredPermission: "heroSlides.view",
  },
  {
    title: "Ana Sayfa Yönetimi",
    href: "/admin/homepage",
    icon: Home,
    requiredPermission: "homepage.view",
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
    title: "Medya Kütüphanesi",
    href: "/admin/media",
    icon: ImageIcon,
  },
  {
    title: "Cihaz Gruplarını Yönet",
    href: "/admin/devices",
    icon: MonitorCog,
  },
  {
    title: "Hizmetleri Yönet",
    href: "/admin/services",
    icon: Boxes,
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
