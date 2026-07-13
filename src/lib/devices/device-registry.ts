import {
  Activity,
  Armchair,
  Bed,
  CircuitBoard,
  ClipboardPlus,
  Gauge,
  HeartPulse,
  Microscope,
  Monitor,
  ScanHeart,
  Stethoscope,
  Wind,
  type LucideIcon,
} from "lucide-react";

export const deviceIconKeys = [
  "stethoscope",
  "activity",
  "heart-pulse",
  "monitor",
  "wind",
  "gauge",
  "bed",
  "armchair",
  "circuit-board",
  "clipboard-heart",
  "scan-heart",
  "microscope",
] as const;

export type DeviceIconKey = (typeof deviceIconKeys)[number];

export const deviceCapabilityLabels = [
  "Elektronik",
  "Mekanik",
  "Kart Onarımı",
  "Bakım",
  "Arıza Analizi",
  "Test",
  "Yedek Parça",
  "Kalibrasyon",
  "Pnömatik",
] as const;

export type DeviceCapability = (typeof deviceCapabilityLabels)[number];

type DeviceIconDefinition = {
  key: DeviceIconKey;
  label: string;
  icon: LucideIcon;
};

export const deviceIconRegistry = [
  { key: "stethoscope", label: "Anestezi", icon: Stethoscope },
  { key: "activity", label: "Aktivite", icon: Activity },
  { key: "heart-pulse", label: "Kalp ritmi", icon: HeartPulse },
  { key: "monitor", label: "Monitör", icon: Monitor },
  { key: "wind", label: "Solunum", icon: Wind },
  { key: "gauge", label: "Ölçüm", icon: Gauge },
  { key: "bed", label: "Hasta yatağı", icon: Bed },
  { key: "armchair", label: "Sandalye / sedye", icon: Armchair },
  { key: "circuit-board", label: "Elektronik kart", icon: CircuitBoard },
  { key: "clipboard-heart", label: "Servis kaydı", icon: ClipboardPlus },
  { key: "scan-heart", label: "Holter / tarama", icon: ScanHeart },
  { key: "microscope", label: "Teknik inceleme", icon: Microscope },
] satisfies DeviceIconDefinition[];

const deviceIconMap = new Map(
  deviceIconRegistry.map((definition) => [definition.key, definition.icon])
);

const legacyIconMap: Record<string, DeviceIconKey> = {
  cpu: "circuit-board",
  "clipboard-plus": "clipboard-heart",
  "move-horizontal": "armchair",
  table: "armchair",
  thermometer: "gauge",
};

export function normalizeDeviceIconKey(value: string): DeviceIconKey {
  if (isDeviceIconKey(value)) return value;
  return legacyIconMap[value] ?? "stethoscope";
}

export function isDeviceIconKey(value: string): value is DeviceIconKey {
  return deviceIconKeys.includes(value as DeviceIconKey);
}

export function getDeviceIcon(iconKey: string) {
  return deviceIconMap.get(normalizeDeviceIconKey(iconKey)) ?? Stethoscope;
}

export function isDeviceCapability(value: string): value is DeviceCapability {
  return deviceCapabilityLabels.includes(value as DeviceCapability);
}

export function normalizeDeviceCapabilities(values: string[]) {
  const normalized = values
    .map((value) => value.trim())
    .filter(isDeviceCapability);

  return [...new Set(normalized)];
}
