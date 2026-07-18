import { z } from "zod";

import { assertServerOnly } from "@/lib/auth/server-only";
import { publicAbsoluteUrl } from "@/lib/site-settings/public-site-settings";

assertServerOnly("email templates");

export const emailTemplateKeys = [
  "password-reset",
  "password-changed",
  "account-setup-link",
  "mfa-enabled",
  "mfa-disabled",
  "recovery-codes-regenerated",
  "session-revoked",
  "account-deactivated",
  "new-service-request-internal",
  "service-request-assigned",
  "service-request-status-changed-internal",
  "customer-information-requested",
  "service-request-completed",
  "service-request-cancelled",
  "blog-published",
  "scheduled-content-due",
  "media-processing-failed",
  "system-alert",
  "maintenance-mode-enabled",
  "test-email",
] as const;

export type EmailTemplateKey = (typeof emailTemplateKeys)[number];

const baseTemplateSchema = z.object({
  recipientName: z.string().trim().max(120).optional(),
  ctaLabel: z.string().trim().max(80).optional(),
  ctaHref: z.string().trim().max(300).optional(),
});

const resetTemplateSchema = baseTemplateSchema.extend({
  resetUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});

const setupTemplateSchema = baseTemplateSchema.extend({
  setupUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});

const serviceRequestTemplateSchema = baseTemplateSchema.extend({
  requestShortId: z.string().trim().max(40),
  customerLabel: z.string().trim().max(160),
  submittedAt: z.string().trim().max(80).optional(),
  hasAttachment: z.boolean().optional(),
  adminUrl: z.string().url(),
  statusLabel: z.string().trim().max(80).optional(),
});

const simpleTemplateSchema = baseTemplateSchema.extend({
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(1000),
});

export const templatePayloadSchemas = {
  "password-reset": resetTemplateSchema,
  "password-changed": simpleTemplateSchema,
  "account-setup-link": setupTemplateSchema,
  "mfa-enabled": simpleTemplateSchema,
  "mfa-disabled": simpleTemplateSchema,
  "recovery-codes-regenerated": simpleTemplateSchema,
  "session-revoked": simpleTemplateSchema,
  "account-deactivated": simpleTemplateSchema,
  "new-service-request-internal": serviceRequestTemplateSchema,
  "service-request-assigned": serviceRequestTemplateSchema,
  "service-request-status-changed-internal": serviceRequestTemplateSchema,
  "customer-information-requested": serviceRequestTemplateSchema,
  "service-request-completed": serviceRequestTemplateSchema,
  "service-request-cancelled": serviceRequestTemplateSchema,
  "blog-published": simpleTemplateSchema,
  "scheduled-content-due": simpleTemplateSchema,
  "media-processing-failed": simpleTemplateSchema,
  "system-alert": simpleTemplateSchema,
  "maintenance-mode-enabled": simpleTemplateSchema,
  "test-email": simpleTemplateSchema,
} satisfies Record<EmailTemplateKey, z.ZodType>;

export type EmailTemplatePayload = z.infer<typeof simpleTemplateSchema> &
  Record<string, unknown>;

export type RenderedEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export async function renderEmailTemplate(input: {
  key: EmailTemplateKey;
  payload: unknown;
  companyName: string;
  supportEmail: string;
}): Promise<RenderedEmailTemplate> {
  const payload = templatePayloadSchemas[input.key].parse(input.payload) as EmailTemplatePayload;
  const companyName = input.companyName;
  const subject = getSubject(input.key, payload, companyName);
  const intro = getIntro(input.key, payload);
  const ctaHref = getCtaHref(payload);
  const ctaLabel = String(payload.ctaLabel ?? defaultCtaLabel(input.key));
  const supportEmail = input.supportEmail;
  const text = [
    subject,
    "",
    intro,
    ctaHref ? `${ctaLabel}: ${ctaHref}` : "",
    "",
    "Bu islemi siz yapmadiysaniz yoneticinizle iletisime gecin.",
    `${companyName} - ${supportEmail}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    text,
    html: renderEmailHtml({
      companyName,
      subject,
      intro,
      ctaHref,
      ctaLabel,
      supportEmail,
    }),
  };
}

export function validateTemplatePayload(key: EmailTemplateKey, payload: unknown) {
  return templatePayloadSchemas[key].parse(payload);
}

export async function makeAdminUrl(path: string) {
  return publicAbsoluteUrl(path.startsWith("/") ? path : `/${path}`);
}

function getSubject(
  key: EmailTemplateKey,
  payload: EmailTemplatePayload,
  companyName: string
) {
  if (key === "password-reset") return `${companyName} parola sifirlama`;
  if (key === "account-setup-link") return `${companyName} hesap kurulumu`;
  if (key === "new-service-request-internal") return "Yeni servis talebi alindi";
  if (key === "service-request-assigned") return "Size servis talebi atandi";
  if (key.includes("service-request-status")) return "Servis talebi durumu guncellendi";
  if (key === "test-email") return `${companyName} test e-postasi`;
  return String(payload.title ?? `${companyName} bildirimi`).slice(0, 180);
}

function getIntro(key: EmailTemplateKey, payload: EmailTemplatePayload) {
  if (key === "password-reset") {
    return `Parolanizi sifirlamak icin asagidaki guvenli baglantiyi kullanin. Baglanti ${formatExpiry(payload.expiresAt)} tarihine kadar gecerlidir.`;
  }
  if (key === "account-setup-link") {
    return `Yonetim paneli hesabiniz icin sifre belirleme baglantisi olusturuldu. Baglanti ${formatExpiry(payload.expiresAt)} tarihine kadar gecerlidir.`;
  }
  if (key.includes("service-request")) {
    const bits = [
      `Talep: ${payload.requestShortId}`,
      `Musteri/Firma: ${payload.customerLabel}`,
      payload.statusLabel ? `Durum: ${payload.statusLabel}` : "",
      payload.hasAttachment ? "Ek dosya: var" : "Ek dosya: yok",
    ];
    return bits.filter(Boolean).join("\n");
  }
  return String(payload.body ?? payload.title ?? "Bildirim");
}

function getCtaHref(payload: EmailTemplatePayload) {
  const href =
    payload.resetUrl ?? payload.setupUrl ?? payload.adminUrl ?? payload.ctaHref;
  return typeof href === "string" && isSafeEmailUrl(href) ? href : undefined;
}

function defaultCtaLabel(key: EmailTemplateKey) {
  if (key === "password-reset") return "Parolayı sıfırla";
  if (key === "account-setup-link") return "Hesabı kur";
  if (key.includes("service-request")) return "Admin panelde aç";
  return "Detayı aç";
}

function renderEmailHtml(input: {
  companyName: string;
  subject: string;
  intro: string;
  ctaHref?: string;
  ctaLabel: string;
  supportEmail: string;
}) {
  const intro = escapeHtml(input.intro).replace(/\n/g, "<br>");
  const cta = input.ctaHref
    ? `<p style="margin:28px 0"><a href="${escapeAttribute(input.ctaHref)}" style="background:#f97316;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;display:inline-block">${escapeHtml(input.ctaLabel)}</a></p><p style="font-size:12px;color:#64748b;word-break:break-all">${escapeHtml(input.ctaHref)}</p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:640px;background:#fff;border:1px solid #e2e8f0;border-radius:18px"><tr><td style="padding:28px"><p style="margin:0 0 16px;color:#0ea5e9;font-weight:700">${escapeHtml(input.companyName)}</p><h1 style="font-size:24px;line-height:1.25;margin:0 0 16px">${escapeHtml(input.subject)}</h1><p style="font-size:15px;line-height:1.7;color:#334155">${intro}</p>${cta}<hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0"><p style="font-size:12px;line-height:1.6;color:#64748b">Bu islemi siz yapmadiysaniz yoneticinizle iletisime gecin. ${escapeHtml(input.supportEmail)}</p></td></tr></table></td></tr></table></body></html>`;
}

function isSafeEmailUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function formatExpiry(value: unknown) {
  if (typeof value !== "string") return "belirtilen";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "belirtilen";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
