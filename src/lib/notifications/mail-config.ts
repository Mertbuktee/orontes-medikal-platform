import { z } from "zod";

import { assertServerOnly } from "@/lib/auth/server-only";

assertServerOnly("mail config");

const boolEnvSchema = z
  .string()
  .optional()
  .transform((value) => value === "true");

export const mailConfigSchema = z.object({
  provider: z.enum(["development", "smtp"]).default("development"),
  fromName: z.string().trim().min(1).default("Orontes Teknoloji"),
  fromAddress: z.string().trim().email().optional(),
  replyTo: z.string().trim().email().optional(),
  disableDelivery: boolEnvSchema,
  captureDirectory: z.string().trim().optional(),
  smtp: z.object({
    host: z.string().trim().optional(),
    port: z.coerce.number().int().min(1).max(65535).optional(),
    secure: boolEnvSchema,
    user: z.string().trim().optional(),
    password: z.string().optional(),
    pool: boolEnvSchema,
    maxConnections: z.coerce.number().int().min(1).max(20).default(3),
    maxMessages: z.coerce.number().int().min(1).max(1000).default(100),
  }),
  supportEmail: z.string().trim().email().optional(),
  operationsEmail: z.string().trim().email().optional(),
});

export type MailConfig = z.infer<typeof mailConfigSchema>;

export function getMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig {
  const parsed = mailConfigSchema.parse({
    provider: env.MAIL_PROVIDER || "development",
    fromName: env.MAIL_FROM_NAME || "Orontes Teknoloji",
    fromAddress: env.MAIL_FROM_ADDRESS || env.MAIL_FROM || undefined,
    replyTo: env.MAIL_REPLY_TO || undefined,
    disableDelivery: env.MAIL_DISABLE_DELIVERY,
    captureDirectory: env.MAIL_CAPTURE_DIRECTORY,
    smtp: {
      host: env.SMTP_HOST || undefined,
      port: env.SMTP_PORT || undefined,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER || undefined,
      password: env.SMTP_PASSWORD || undefined,
      pool: env.SMTP_POOL,
      maxConnections: env.SMTP_MAX_CONNECTIONS,
      maxMessages: env.SMTP_MAX_MESSAGES,
    },
    supportEmail: env.APP_SUPPORT_EMAIL || undefined,
    operationsEmail: env.APP_OPERATIONS_EMAIL || undefined,
  });

  assertProductionMailSafety(parsed, env);
  return parsed;
}

export function assertProductionMailSafety(
  config: MailConfig,
  env: NodeJS.ProcessEnv = process.env
) {
  const isProductionDeployment =
    env.APP_ENV === "production" || env.VERCEL_ENV === "production";
  if (!isProductionDeployment) return;

  if (config.provider === "development") {
    throw new Error("MAIL_PROVIDER=development is not allowed in production.");
  }

  if (config.disableDelivery) {
    throw new Error("MAIL_DISABLE_DELIVERY is not allowed in production.");
  }

  if (!config.fromAddress) {
    throw new Error("MAIL_FROM_ADDRESS is required in production.");
  }

  if (config.provider === "smtp") {
    if (!config.smtp.host || !config.smtp.port) {
      throw new Error("SMTP_HOST and SMTP_PORT are required in production.");
    }
    if (!config.smtp.user || !config.smtp.password) {
      throw new Error("SMTP_USER and SMTP_PASSWORD are required in production.");
    }
    if (config.smtp.secure && config.smtp.port === 587) {
      throw new Error("SMTP_SECURE=true is inconsistent with port 587.");
    }
  }
}

export function getMailFrom(config = getMailConfig()) {
  if (!config.fromAddress) return undefined;
  return `${config.fromName} <${config.fromAddress}>`;
}
