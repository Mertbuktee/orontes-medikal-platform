import {
  ClipboardList,
  History,
  LayoutDashboard,
  MonitorCog,
  Search,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/rbac/permissions";

export type TechnicalNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredPermission: Permission;
};

export const technicalNavItems: TechnicalNavItem[] = [
  {
    title: "Dashboard",
    href: "/technical/dashboard",
    icon: LayoutDashboard,
    requiredPermission: "dashboard.view",
  },
  {
    title: "Genel Arama",
    href: "/technical/search",
    icon: Search,
    requiredPermission: "dashboard.view",
  },
  {
    title: "Servis Talepleri",
    href: "/technical/service-requests",
    icon: ClipboardList,
    requiredPermission: "serviceRequests.view",
  },
  {
    title: "Müşteriler",
    href: "/technical/customers",
    icon: UsersRound,
    requiredPermission: "serviceRequests.view",
  },
  {
    title: "Cihazlar",
    href: "/technical/devices",
    icon: MonitorCog,
    requiredPermission: "serviceRequests.view",
  },
  {
    title: "Servis Geçmişi",
    href: "/technical/history",
    icon: History,
    requiredPermission: "serviceRequests.view",
  },
];
