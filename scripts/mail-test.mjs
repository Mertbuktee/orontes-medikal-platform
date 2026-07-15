import { existsSync, readFileSync } from "node:fs";
import nodemailer from "nodemailer";

loadLocalEnv();

const recipient = process.env.MAIL_TEST_RECIPIENT;
const confirmed = process.env.MAIL_TEST_CONFIRM === "SEND_TEST_EMAIL";

if (!recipient || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) {
  console.error("MAIL_TEST_RECIPIENT must be an explicit recipient address.");
  process.exit(1);
}

if (!confirmed) {
  console.error("Set MAIL_TEST_CONFIRM=SEND_TEST_EMAIL to send a test email.");
  process.exit(1);
}

const provider = process.env.MAIL_PROVIDER || "development";
if (provider !== "smtp") {
  console.error("MAIL_PROVIDER=smtp is required for real test delivery.");
  process.exit(1);
}

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const from = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_FROM;

if (!host || !port || !from) {
  console.error("SMTP_HOST, SMTP_PORT and MAIL_FROM_ADDRESS are required.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASSWORD
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
});

try {
  const info = await transporter.sendMail({
    from,
    to: recipient,
    subject: "Orontes production mail test",
    text: "This is an operator-triggered Orontes mail configuration test.",
    html: "<p>This is an operator-triggered Orontes mail configuration test.</p>",
  });
  console.log(
    JSON.stringify(
      {
        status: "sent",
        provider: "smtp",
        messageId: String(info.messageId ?? "").slice(0, 120),
        acceptedCount: Array.isArray(info.accepted) ? info.accepted.length : undefined,
      },
      null,
      2
    )
  );
} catch (error) {
  console.log(
    JSON.stringify(
      {
        status: "failed",
        provider: "smtp",
        errorCode:
          error && typeof error === "object" && "code" in error
            ? String(error.code).slice(0, 80)
            : "SMTP_TEST_FAILED",
      },
      null,
      2
    )
  );
  process.exit(1);
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
