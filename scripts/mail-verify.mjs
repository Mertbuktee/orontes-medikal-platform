import { existsSync, readFileSync } from "node:fs";
import nodemailer from "nodemailer";

loadLocalEnv();

const config = getMailRuntimeConfig();
const result = {
  provider: config.provider,
  fromAddressConfigured: Boolean(config.fromAddress),
  smtpHostConfigured: Boolean(config.smtp.host),
  smtpPortConfigured: Boolean(config.smtp.port),
  smtpAuthConfigured: Boolean(config.smtp.user && config.smtp.password),
  status: "unknown",
  errorCode: undefined,
};

if (config.production && config.provider === "development") {
  result.status = "failed";
  result.errorCode = "MAIL_PROVIDER_DEVELOPMENT_IN_PRODUCTION";
  finish(result, 1);
}

if (config.provider !== "smtp") {
  result.status = config.production ? "failed" : "manual-not-required";
  result.errorCode = config.production ? "SMTP_PROVIDER_NOT_CONFIGURED" : undefined;
  finish(result, config.production ? 1 : 0);
}

if (!config.smtp.host || !config.smtp.port || !config.fromAddress) {
  result.status = "failed";
  result.errorCode = "SMTP_REQUIRED_FIELDS_MISSING";
  finish(result, 1);
}

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth:
    config.smtp.user && config.smtp.password
      ? { user: config.smtp.user, pass: config.smtp.password }
      : undefined,
});

try {
  await transporter.verify();
  result.status = "ok";
  finish(result, 0);
} catch (error) {
  result.status = "failed";
  result.errorCode = getErrorCode(error);
  finish(result, 1);
}

function getMailRuntimeConfig() {
  return {
    production: process.env.APP_ENV === "production" || process.env.VERCEL_ENV === "production",
    provider: process.env.MAIL_PROVIDER || "development",
    fromAddress: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_FROM,
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    },
  };
}

function finish(value, code) {
  console.log(JSON.stringify(value, null, 2));
  process.exit(code);
}

function getErrorCode(error) {
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code).slice(0, 80);
  }
  return "SMTP_VERIFY_FAILED";
}

function loadLocalEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
