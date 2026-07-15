import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadLocalEnv();

const findings = [];
const status = [];

checkEnvironment();
await checkDatabaseAndSettings();
await checkBackups();
checkMail();
checkWorkers();
checkStorage();
checkMonitoring();
checkLegal();

const blockers = findings.filter((item) => item.severity === "blocker");

console.log(
  JSON.stringify(
    {
      status: blockers.length ? "not-ready" : "ready",
      profile: process.env.PRODUCTION_PROFILE || "standard",
      checkedAt: new Date().toISOString(),
      statusItems: status,
      findings,
    },
    null,
    2
  )
);

if (blockers.length) process.exit(1);

function checkEnvironment() {
  const origin = process.env.APP_ORIGIN || "";
  addStatus("APP_ORIGIN", Boolean(origin), origin ? redactOrigin(origin) : "missing");

  if (!origin.startsWith("https://")) {
    addBlocker("APP_ORIGIN must be a production HTTPS origin.");
  }

  if (/localhost|127\.0\.0\.1|\[::1\]/.test(origin)) {
    addBlocker("APP_ORIGIN cannot be localhost for production launch.");
  }

  if (process.env.TRUST_PROXY !== "true") {
    addBlocker("TRUST_PROXY=true is required behind the production reverse proxy.");
  }

  if (!process.env.DATABASE_URL) {
    addBlocker("DATABASE_URL is required.");
  }
}

async function checkDatabaseAndSettings() {
  if (!process.env.DATABASE_URL) return;
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$queryRaw`SELECT 1`;
    addStatus("database", true, "reachable");

    const migration = await run("node", ["node_modules/prisma/build/index.js", "migrate", "status"]);
    addStatus("migrations", migration.code === 0, migration.code === 0 ? "up-to-date" : "check-failed");
    if (migration.code !== 0) addBlocker("Prisma migration status check failed.");

    const settings = await readSettings(prisma);
    checkRequiredText(settings.general?.companyName, "site.general.companyName");
    checkRequiredText(settings.general?.legalCompanyName, "site.general.legalCompanyName");
    checkRequiredText(settings.contact?.phonePrimary, "site.contact.phonePrimary");
    checkRequiredText(settings.contact?.emailPrimary, "site.contact.emailPrimary");
    checkRequiredText(settings.contact?.emailSupport, "site.contact.emailSupport");
    checkRequiredText(settings.whatsapp?.whatsappNumber, "site.whatsapp.whatsappNumber");
    checkRequiredText(settings.address?.addressLine, "site.address.addressLine");

    await checkMedia(prisma, settings.branding?.logoMediaId, "production logo");
    await checkMedia(prisma, settings.branding?.faviconMediaId, "favicon");
    await checkMedia(prisma, settings.branding?.appleTouchIconMediaId, "apple-touch icon");
    await checkMedia(prisma, settings.branding?.defaultOgImageMediaId, "default Open Graph image");

    addStatus(
      "social-links",
      Boolean(settings.social?.instagram && settings.social?.linkedin),
      settings.social?.instagram && settings.social?.linkedin ? "configured" : "manual"
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function readSettings(prisma) {
  const rows = await prisma.siteSetting.findMany();
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    general: map.get("site.general"),
    contact: map.get("site.contact"),
    whatsapp: map.get("site.whatsapp"),
    address: map.get("site.address"),
    branding: map.get("site.branding"),
    social: map.get("site.social"),
  };
}

async function checkMedia(prisma, id, label) {
  if (!id) {
    addBlocker(`${label} must be selected in Site Settings.`);
    addStatus(label, false, "missing");
    return;
  }

  const media = await prisma.media.findFirst({
    where: {
      id,
      archivedAt: null,
      mimeType: { in: ["image/jpeg", "image/png", "image/webp"] },
    },
    select: { id: true, variants: { select: { variant: true }, take: 1 } },
  });

  if (!media || media.variants.length === 0) {
    addBlocker(`${label} must reference an active image Media record with variants.`);
    addStatus(label, false, "invalid");
    return;
  }

  addStatus(label, true, "configured");
}

async function checkBackups() {
  const backupDir = path.resolve(process.env.BACKUP_DIR || "backups/database");
  const latestDump = latestFile(backupDir, ".dump");
  const latestMetadata = latestFile(backupDir, ".json");
  addStatus("database-backup", Boolean(latestDump && latestMetadata), latestDump ? "local-backup-present" : "missing");
  if (!latestDump || !latestMetadata) addBlocker("A verified local database backup is required before launch.");

  const offHostConfigured = Boolean(process.env.BACKUP_REMOTE_URL || process.env.BACKUP_S3_BUCKET);
  addStatus("off-host-backup", offHostConfigured, offHostConfigured ? "configured" : "manual");
  if (!offHostConfigured) addBlocker("Off-host backup destination is not configured.");
}

function checkMail() {
  const provider = process.env.MAIL_PROVIDER || "development";
  addStatus("mail-provider", provider === "smtp", provider);
  if (provider !== "smtp") addBlocker("MAIL_PROVIDER=smtp is required when production mail is promised.");
  for (const name of ["SMTP_HOST", "SMTP_PORT", "MAIL_FROM_ADDRESS", "SMTP_USER", "SMTP_PASSWORD"]) {
    if (!process.env[name]) addBlocker(`${name} is required for production SMTP readiness.`);
  }
  if (!process.env.MAIL_FROM_NAME) addWarning("MAIL_FROM_NAME should be explicitly set.");
  addStatus("spf-dkim-dmarc", false, "manual-dns-validation-required");
}

function checkWorkers() {
  addStatus(
    "mail-worker",
    process.env.MAIL_WORKER_ENABLED === "true",
    process.env.MAIL_WORKER_ENABLED === "true" ? "declared-enabled" : "manual"
  );
  if (process.env.MAIL_WORKER_ENABLED !== "true") addBlocker("Mail worker scheduling is not declared enabled.");

  addStatus(
    "blog-scheduler",
    process.env.BLOG_SCHEDULER_ENABLED === "true",
    process.env.BLOG_SCHEDULER_ENABLED === "true" ? "declared-enabled" : "manual"
  );
  if (process.env.BLOG_SCHEDULER_ENABLED !== "true") addBlocker("Blog scheduler is not declared enabled.");
}

function checkStorage() {
  const provider = process.env.STORAGE_PROVIDER || "local";
  addStatus("storage-provider", true, provider);
  if (provider === "local") {
    const singleInstance = process.env.PRODUCTION_PROFILE === "single-instance";
    if (!singleInstance) addBlocker("Local storage requires PRODUCTION_PROFILE=single-instance.");
    if (!process.env.PRIVATE_STORAGE_ROOT) addBlocker("PRIVATE_STORAGE_ROOT is required.");
    if (!process.env.PRIVATE_STORAGE_BACKUP_ENABLED) {
      addBlocker("Private storage off-host backup must be configured for local volume storage.");
    }
    return;
  }

  if (provider === "s3-compatible") {
    for (const name of ["S3_ENDPOINT", "S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]) {
      if (!process.env[name]) addBlocker(`${name} is required for S3-compatible storage.`);
    }
    addBlocker("S3-compatible runtime adapter is not enabled in this release.");
    return;
  }

  addBlocker("STORAGE_PROVIDER must be local or s3-compatible.");
}

function checkMonitoring() {
  addStatus(
    "monitoring",
    Boolean(process.env.MONITORING_PROVIDER || process.env.ERROR_MONITORING_DSN),
    process.env.MONITORING_PROVIDER ? "configured" : "manual"
  );
  if (!process.env.MONITORING_PROVIDER && !process.env.ERROR_MONITORING_DSN) {
    addBlocker("Production monitoring/alerting provider is not configured.");
  }
}

function checkLegal() {
  addStatus(
    "legal-approval",
    process.env.LEGAL_APPROVAL_CONFIRMED === "true",
    process.env.LEGAL_APPROVAL_CONFIRMED === "true" ? "confirmed" : "manual"
  );
  if (process.env.LEGAL_APPROVAL_CONFIRMED !== "true") addBlocker("Legal/business content approval is not confirmed.");
}

function checkRequiredText(value, key) {
  if (typeof value !== "string" || !value.trim()) addBlocker(`${key} is required.`);
}

function addStatus(name, ok, detail) {
  status.push({ name, ok, detail });
}

function addBlocker(message) {
  findings.push({ severity: "blocker", message });
}

function addWarning(message) {
  findings.push({ severity: "warning", message });
}

function latestFile(directory, extension) {
  try {
    return readdirSync(directory)
      .filter((file) => file.endsWith(extension))
      .sort()
      .at(-1);
  } catch {
    return undefined;
  }
}

function redactOrigin(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "invalid";
  }
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    child.on("error", (error) => resolve({ code: 1, stderr: error.message }));
    child.on("close", (code) => resolve({ code: code ?? 1 }));
  });
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
