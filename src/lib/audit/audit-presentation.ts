import type { AuditAction } from "@prisma/client";

export type AuditCategory =
  | "AUTHENTICATION"
  | "SESSION"
  | "USER_MANAGEMENT"
  | "SERVICE_REQUEST"
  | "CONTENT"
  | "SYSTEM"
  | "UNKNOWN";

export type AuditSeverity = "INFO" | "NOTICE" | "WARNING" | "CRITICAL";

export type AuditSuccess = "success" | "failure" | "unknown";

export type SafeMetadataItem = {
  label: string;
  value: string;
};

export type AuditPresentation = {
  category: AuditCategory;
  severity: AuditSeverity;
  label: string;
  summary: string;
  safeMetadata: SafeMetadataItem[];
  success: AuditSuccess;
};

export type AuditPresentationInput = {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
};

const forbiddenKeyFragments = [
  "password",
  "passwordhash",
  "token",
  "tokenhash",
  "secret",
  "authorization",
  "cookie",
  "session",
  "recoverycode",
  "mfasecret",
  "encryptionkey",
  "databaseurl",
  "smtp",
  "storagekey",
  "path",
  "message",
  "phone",
  "email",
  "filename",
];

const allowedMetadataLabels: Record<string, string> = {
  fromStatus: "Onceki durum",
  toStatus: "Yeni durum",
  status: "Durum",
  fromRole: "Onceki rol",
  toRole: "Yeni rol",
  role: "Rol",
  active: "Aktif durum",
  revokedCount: "Iptal edilen oturum",
  sessionsRevoked: "Oturumlar iptal edildi",
  selfService: "Kendi hesabi",
  crossUser: "Farkli kullanici",
  forced: "Zorunlu islem",
  setup: "Kurulum akisi",
  delivery: "Teslimat durumu",
  category: "Kategori",
  mimeType: "MIME",
  size: "Boyut",
  variantCount: "Varyant sayisi",
  duplicateReused: "Tekrar kullanim",
  changedFields: "Degisen alanlar",
  slug: "Slug",
  oldSlug: "Eski slug",
  newSlug: "Yeni slug",
  fromOrder: "Onceki sira",
  toOrder: "Yeni sira",
  mediaId: "Medya ID",
  targetUserId: "Hedef kullanici",
  reasonProvided: "Neden girildi",
  clearedLock: "Kilit temizlendi",
  onboarding: "Onboarding",
  remembered: "Remember me",
  revokedOtherSessions: "Diger oturumlar",
  filtersApplied: "Filtre uygulandi",
  rowCount: "Satir sayisi",
};

export function presentAuditEvent(
  input: AuditPresentationInput
): AuditPresentation {
  const category = deriveAuditCategory(input.action, input.entityType);
  const severity = deriveAuditSeverity(
    input.action,
    input.entityType,
    input.metadata
  );
  const label = deriveAuditLabel(input.action, input.entityType);
  const safeMetadata = sanitizeAuditMetadata(input.metadata);
  const success = deriveSuccess(input.action, safeMetadata);

  return {
    category,
    severity,
    label,
    success,
    safeMetadata,
    summary: createAuditSummary({
      label,
      entityType: input.entityType,
      entityId: input.entityId,
      safeMetadata,
    }),
  };
}

export function sanitizeAuditMetadata(metadata: unknown): SafeMetadataItem[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  return Object.entries(metadata as Record<string, unknown>)
    .filter(([key]) => isAllowedMetadataKey(key))
    .slice(0, 20)
    .map(([key, value]) => ({
      label: allowedMetadataLabels[key] ?? key,
      value: formatSafeMetadataValue(value),
    }))
    .filter((item) => item.value.length > 0);
}

export function stripForbiddenAuditMetadata(metadata: unknown): unknown {
  if (!metadata || typeof metadata !== "object") return metadata;
  if (Array.isArray(metadata)) {
    return metadata.slice(0, 50).map(stripForbiddenAuditMetadata);
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
    if (isForbiddenKey(key)) continue;
    if (value && typeof value === "object") {
      output[key] = stripForbiddenAuditMetadata(value);
    } else if (typeof value === "string") {
      output[key] = redactSensitiveString(value);
    } else {
      output[key] = value;
    }
  }

  return limitAuditMetadataSize(output);
}

export function summarizeUserAgent(userAgent: string | null | undefined) {
  if (!userAgent) return "Bilinmeyen istemci";
  if (userAgent.includes("Edg")) return "Edge tabanli tarayici";
  if (userAgent.includes("Chrome")) return "Chrome tabanli tarayici";
  if (userAgent.includes("Firefox")) return "Firefox tarayici";
  if (userAgent.includes("Safari")) return "Safari tarayici";
  return "Admin istemcisi";
}

export function redactIpAddress(ipAddress: string | null | undefined) {
  if (!ipAddress) return "-";
  if (ipAddress.includes(":")) return `${ipAddress.slice(0, 6)}...`;
  const parts = ipAddress.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
  return "redacted";
}

export function getAuditCategoryLabel(category: AuditCategory) {
  const labels: Record<AuditCategory, string> = {
    AUTHENTICATION: "Kimlik dogrulama",
    SESSION: "Oturum",
    USER_MANAGEMENT: "Kullanici yonetimi",
    SERVICE_REQUEST: "Servis talepleri",
    CONTENT: "Icerik",
    SYSTEM: "Sistem",
    UNKNOWN: "Diger",
  };
  return labels[category];
}

export function getAuditSeverityLabel(severity: AuditSeverity) {
  const labels: Record<AuditSeverity, string> = {
    INFO: "Bilgi",
    NOTICE: "Dikkat",
    WARNING: "Uyari",
    CRITICAL: "Kritik",
  };
  return labels[severity];
}

function deriveAuditCategory(
  action: AuditAction,
  entityType: string
): AuditCategory {
  if (
    [
      "LOGIN",
      "LOGIN_FAILURE",
      "LOGOUT",
      "ACCOUNT_LOCKED",
      "PASSWORD_CHANGED",
      "PASSWORD_RESET_REQUESTED",
      "PASSWORD_RESET_COMPLETED",
      "MFA_ENROLLMENT_STARTED",
      "MFA_ENABLED",
      "MFA_DISABLED",
      "MFA_RECOVERY_CODES_REGENERATED",
      "MFA_CHALLENGE_SUCCESS",
      "MFA_CHALLENGE_FAILURE",
      "RECOVERY_CODE_USED",
    ].includes(action)
  ) {
    return "AUTHENTICATION";
  }

  if (action === "SESSION_REVOKED" || action === "ALL_SESSIONS_REVOKED") {
    return "SESSION";
  }

  if (entityType === "User" || entityType === "AdminSession") {
    return "USER_MANAGEMENT";
  }

  if (entityType.startsWith("ServiceRequest")) {
    return "SERVICE_REQUEST";
  }

  if (
    [
      "Media",
      "HeroSlide",
      "DeviceGroup",
      "Service",
      "HomepageSection",
      "BlogPost",
      "BlogCategory",
      "SiteSetting",
      "AuditExport",
    ].includes(entityType)
  ) {
    return "CONTENT";
  }

  if (entityType === "System" || entityType === "Bootstrap") return "SYSTEM";
  return "UNKNOWN";
}

function deriveAuditSeverity(
  action: AuditAction,
  entityType: string,
  metadata: unknown
): AuditSeverity {
  if (hasMetadataFlag(metadata, "critical")) return "CRITICAL";
  if (
    action === "ACCOUNT_LOCKED" ||
    action === "MFA_CHALLENGE_FAILURE" ||
    action === "LOGIN_FAILURE"
  ) {
    return "WARNING";
  }
  if (
    action === "ALL_SESSIONS_REVOKED" ||
    (entityType === "User" && action === "STATUS_CHANGE") ||
    action === "PUBLISH" ||
    action === "ARCHIVE"
  ) {
    return "NOTICE";
  }
  return "INFO";
}

function deriveAuditLabel(action: AuditAction, entityType: string) {
  const labels: Partial<Record<AuditAction, string>> = {
    LOGIN: "Basarili giris",
    LOGIN_FAILURE: "Basarisiz giris",
    LOGOUT: "Cikis",
    CREATE: "Kayit olusturuldu",
    UPDATE: "Kayit guncellendi",
    DELETE: "Kayit silindi",
    PUBLISH: "Yayinlandi",
    ARCHIVE: "Arsivlendi",
    STATUS_CHANGE: "Durum degisti",
    SESSION_REVOKED: "Oturum iptal edildi",
    ALL_SESSIONS_REVOKED: "Tum oturumlar iptal edildi",
    PASSWORD_CHANGED: "Parola degisti",
    PASSWORD_RESET_REQUESTED: "Parola sifirlama istendi",
    PASSWORD_RESET_COMPLETED: "Parola sifirlandi",
    MFA_ENROLLMENT_STARTED: "MFA kurulumu basladi",
    MFA_ENABLED: "MFA etkinlestirildi",
    MFA_DISABLED: "MFA kapatildi",
    MFA_RECOVERY_CODES_REGENERATED: "MFA kurtarma kodlari yenilendi",
    MFA_CHALLENGE_SUCCESS: "MFA dogrulandi",
    MFA_CHALLENGE_FAILURE: "MFA dogrulama basarisiz",
    RECOVERY_CODE_USED: "Kurtarma kodu kullanildi",
    ACCOUNT_LOCKED: "Hesap kilitlendi",
  };

  return labels[action] ?? `Yeni audit olayi (${entityType})`;
}

function createAuditSummary(input: {
  label: string;
  entityType: string;
  entityId?: string | null;
  safeMetadata: SafeMetadataItem[];
}) {
  const entity = input.entityId
    ? `${input.entityType} - ${shortId(input.entityId)}`
    : input.entityType;
  const metadata = input.safeMetadata
    .slice(0, 2)
    .map((item) => `${item.label}: ${item.value}`);
  return [input.label, entity, ...metadata].join(" - ");
}

function deriveSuccess(
  action: AuditAction,
  metadata: SafeMetadataItem[]
): AuditSuccess {
  if (action === "LOGIN_FAILURE" || action === "MFA_CHALLENGE_FAILURE") {
    return "failure";
  }
  if (
    metadata.some(
      (item) => item.label === "Teslimat durumu" && item.value === "failed"
    )
  ) {
    return "failure";
  }
  return "success";
}

function isAllowedMetadataKey(key: string) {
  return Boolean(allowedMetadataLabels[key]) && !isForbiddenKey(key);
}

function isForbiddenKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return forbiddenKeyFragments.some((fragment) => normalized.includes(fragment));
}

function formatSafeMetadataValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Evet" : "Hayir";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return redactSensitiveString(value).slice(0, 160);
  if (Array.isArray(value)) {
    return value.map(formatSafeMetadataValue).join(", ").slice(0, 160);
  }
  if (value === null || value === undefined) return "";
  return "[ozetlenmis]";
}

function redactSensitiveString(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email-redacted]")
    .replace(/\b\d{10,}\b/g, "[number-redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]");
}

function limitAuditMetadataSize(value: Record<string, unknown>) {
  const json = JSON.stringify(value);
  if (json.length <= 4000) return value;
  return { truncated: true };
}

function hasMetadataFlag(metadata: unknown, key: string) {
  return Boolean(
    metadata &&
      typeof metadata === "object" &&
      !Array.isArray(metadata) &&
      (metadata as Record<string, unknown>)[key]
  );
}

function shortId(id: string) {
  return id.length <= 10 ? id : `${id.slice(0, 8)}...`;
}
