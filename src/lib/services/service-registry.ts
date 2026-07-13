import {
  Activity,
  CircuitBoard,
  ClipboardCheck,
  Gauge,
  Headset,
  Microscope,
  PackageCheck,
  ScanSearch,
  Settings,
  ShieldCheck,
  Stethoscope,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const serviceIconKeys = [
  "circuit-board",
  "wrench",
  "settings",
  "gauge",
  "microscope",
  "headset",
  "package-check",
  "clipboard-check",
  "stethoscope",
  "shield-check",
  "activity",
  "scan-search",
] as const;

export type ServiceIconKey = (typeof serviceIconKeys)[number];

type ServiceIconDefinition = {
  key: ServiceIconKey;
  label: string;
  icon: LucideIcon;
};

export const serviceIconRegistry = [
  { key: "circuit-board", label: "Elektronik kart", icon: CircuitBoard },
  { key: "wrench", label: "Onarım", icon: Wrench },
  { key: "settings", label: "Teknik servis", icon: Settings },
  { key: "gauge", label: "Kalibrasyon", icon: Gauge },
  { key: "microscope", label: "Arıza analizi", icon: Microscope },
  { key: "headset", label: "Teknik destek", icon: Headset },
  { key: "package-check", label: "Yedek parça", icon: PackageCheck },
  { key: "clipboard-check", label: "Kontrol", icon: ClipboardCheck },
  { key: "stethoscope", label: "Medikal bakım", icon: Stethoscope },
  { key: "shield-check", label: "Güvenlik", icon: ShieldCheck },
  { key: "activity", label: "Performans", icon: Activity },
  { key: "scan-search", label: "İnceleme", icon: ScanSearch },
] satisfies ServiceIconDefinition[];

const serviceIconMap = new Map(
  serviceIconRegistry.map((definition) => [definition.key, definition.icon])
);

const legacyIconMap: Record<string, ServiceIconKey> = {
  "package-check": "package-check",
};

export function normalizeServiceIconKey(value: string): ServiceIconKey {
  if (isServiceIconKey(value)) return value;
  return legacyIconMap[value] ?? "settings";
}

export function isServiceIconKey(value: string): value is ServiceIconKey {
  return serviceIconKeys.includes(value as ServiceIconKey);
}

export function getServiceIcon(iconKey: string) {
  return serviceIconMap.get(normalizeServiceIconKey(iconKey)) ?? Settings;
}
