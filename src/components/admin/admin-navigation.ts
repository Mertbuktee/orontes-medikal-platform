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
  UserCog,
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
    requiredPermission: "settings.view",
  },
  {
    title: "Hesap Güvenliği",
    href: "/admin/account/security",
    icon: UserCog,
    requiredPermission: "account.security.manage",
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
    requiredPermission: "serviceRequests.view",
  },
  {
    title: "Yeni Blog Yazısı",
    href: "/admin/blog/new",
    icon: BookOpenText,
    requiredPermission: "blog.create",
  },
  {
    title: "Yeni Cihaz Grubu",
    href: "/admin/devices/new",
    icon: MonitorCog,
    requiredPermission: "devices.create",
  },
  {
    title: "Yeni Hizmet",
    href: "/admin/services/new",
    icon: Boxes,
    requiredPermission: "services.create",
  },
  {
    title: "Hero Slider Yönetimi",
    href: "/admin/hero-slides",
    icon: Images,
    requiredPermission: "heroSlides.view",
  },
  {
    title: "Medya Yükle",
    href: "/admin/media",
    icon: ImageIcon,
    requiredPermission: "media.upload",
  },
  {
    title: "Ana Sayfayı Düzenle",
    href: "/admin/homepage",
    icon: Home,
    requiredPermission: "homepage.update",
  },
  {
    title: "Site Ayarları",
    href: "/admin/settings",
    icon: ShieldCheck,
    requiredPermission: "settings.view",
  },
  {
    title: "Kullanıcılar",
    href: "/admin/users",
    icon: Users,
    requiredPermission: "users.view",
  },
  {
    title: "Roller ve Yetkiler",
    href: "/admin/roles",
    icon: LockKeyhole,
    requiredPermission: "roles.view",
  },
] satisfies Array<{
  title: string;
  href: string;
  icon: LucideIcon;
  requiredPermission: Permission;
}>;
