import {
  ClipboardCheck,
  Cpu,
  FileCheck2,
  PackageCheck,
  ScanSearch,
  Settings,
  ShieldCheck,
  Stethoscope,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { homepageIconKeys } from "@/lib/homepage/homepage-validation";

export type HomepageIconKey = (typeof homepageIconKeys)[number];

const homepageIconMap: Record<HomepageIconKey, LucideIcon> = {
  ShieldCheck,
  ClipboardCheck,
  Cpu,
  FileCheck2,
  Wrench,
  Settings,
  PackageCheck,
  ScanSearch,
  Truck,
  Stethoscope,
};

export function getHomepageIcon(iconKey: string) {
  return homepageIconMap[iconKey as HomepageIconKey] ?? ShieldCheck;
}
