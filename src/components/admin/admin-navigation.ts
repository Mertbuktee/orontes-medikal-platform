import {
  Activity,
  Bell,
  BookOpenText,
  Boxes,
  ClipboardList,
  Home,
  ImageIcon,
  Images,
  LayoutDashboard,
  LockKeyhole,
  Mail,
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
  nav("Dashboard", "/admin/dashboard", LayoutDashboard, "dashboard.view"),
  nav("Servis Talepleri", "/technical/service-requests", ClipboardList, "serviceRequests.view"),
  nav("Cihaz Grupları", "/admin/devices", MonitorCog, "devices.view"),
  nav("Hizmetler", "/admin/services", Boxes, "services.view"),
  {
    ...nav("Blog", "/admin/blog", BookOpenText, "blog.view"),
    children: [
      nav("Blog Yazıları", "/admin/blog", BookOpenText, "blog.view"),
      nav("Blog Kategorileri", "/admin/blog/categories", BookOpenText, "blog.categories.manage"),
    ],
  },
  nav("Medya", "/admin/media", ImageIcon, "media.view"),
  nav("Hero Slider", "/admin/hero-slides", Images, "heroSlides.view"),
  nav("Ana Sayfa Yönetimi", "/admin/homepage", Home, "homepage.view"),
  nav("SEO", "/admin/seo", Search, "seo.manage"),
  nav("Site Ayarları", "/admin/settings", Settings, "settings.view"),
  nav("Hesap Güvenliği", "/admin/account/security", UserCog, "account.security.manage"),
  {
    ...nav("Bildirimler", "/admin/notifications", Bell, "notifications.view"),
    children: [
      nav("Bildirim Merkezi", "/admin/notifications", Bell, "notifications.view"),
      nav(
        "E-posta Teslimatları",
        "/admin/notifications/email-deliveries",
        Mail,
        "notifications.emailDeliveries.view"
      ),
      nav(
        "Bildirim Tercihleri",
        "/admin/account/notifications",
        Bell,
        "notifications.preferences.manage.own"
      ),
    ],
  },
  nav("Kullanıcılar", "/admin/users", Users, "users.view"),
  nav("Roller ve Yetkiler", "/admin/roles", LockKeyhole, "roles.view"),
  nav("Güvenlik Merkezi", "/admin/security", ShieldCheck, "security.view"),
  nav("Audit Log", "/admin/audit", Activity, "audit.view"),
];

export const adminQuickActionItems = [
  nav("Servis Taleplerini Görüntüle", "/technical/service-requests", ClipboardList, "serviceRequests.view"),
  nav("Yeni Blog Yazısı", "/admin/blog/new", BookOpenText, "blog.create"),
  nav("Yeni Cihaz Grubu", "/admin/devices/new", MonitorCog, "devices.create"),
  nav("Yeni Hizmet", "/admin/services/new", Boxes, "services.create"),
  nav("Hero Slider Yönetimi", "/admin/hero-slides", Images, "heroSlides.view"),
  nav("Medya Yükle", "/admin/media", ImageIcon, "media.upload"),
  nav("Ana Sayfayı Düzenle", "/admin/homepage", Home, "homepage.update"),
  nav("Site Ayarları", "/admin/settings", Settings, "settings.view"),
  nav("Bildirimler", "/admin/notifications", Bell, "notifications.view"),
  nav("E-posta Teslimatları", "/admin/notifications/email-deliveries", Mail, "notifications.emailDeliveries.view"),
  nav("Kullanıcılar", "/admin/users", Users, "users.view"),
  nav("Güvenlik Merkezi", "/admin/security", ShieldCheck, "security.view"),
  nav("Audit Log", "/admin/audit", Activity, "audit.view"),
] satisfies Array<{
  title: string;
  href: string;
  icon: LucideIcon;
  requiredPermission: Permission;
}>;

function nav(
  title: string,
  href: string,
  icon: LucideIcon,
  requiredPermission: Permission
) {
  return { title, href, icon, requiredPermission };
}
