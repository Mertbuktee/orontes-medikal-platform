import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { assertServerOnly } from "@/lib/auth/server-only";
import { getMailConfig, getMailFrom, type MailConfig } from "./mail-config";

assertServerOnly("email provider");

export type EmailRecipient = {
  email: string;
  name?: string;
};

export type SendEmailInput = {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  tags?: string[];
  idempotencyKey?: string;
};

export type SendEmailResult = {
  providerMessageId?: string;
  accepted: boolean;
  transientFailure: boolean;
  errorCode?: string;
};

export type EmailProviderHealth = {
  ok: boolean;
  provider: string;
  errorCode?: string;
};

export interface TransactionalEmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>;
  verifyConnection?(): Promise<EmailProviderHealth>;
}

export class DevelopmentCaptureEmailProvider implements TransactionalEmailProvider {
  constructor(
    private readonly root = path.join(
      process.cwd(),
      "storage",
      "private",
      "mail-capture"
    )
  ) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    await mkdir(this.root, { recursive: true });
    const id = `${Date.now()}-${safeFilePart(input.subject)}`;
    const base = path.join(this.root, id);
    await writeFile(
      `${base}.json`,
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          subject: input.subject,
          to: input.to.map((recipient) => redactRecipient(recipient.email)),
          cc: input.cc?.map((recipient) => redactRecipient(recipient.email)),
          bccCount: input.bcc?.length ?? 0,
          textPreview: input.text.slice(0, 800),
          tags: input.tags,
          idempotencyKey: input.idempotencyKey,
        },
        null,
        2
      ),
      { flag: "wx" }
    );
    await writeFile(`${base}.html`, input.html, { flag: "wx" });
    await writeFile(`${base}.txt`, input.text, { flag: "wx" });

    return {
      providerMessageId: id,
      accepted: true,
      transientFailure: false,
    };
  }

  async verifyConnection(): Promise<EmailProviderHealth> {
    await mkdir(this.root, { recursive: true });
    return { ok: true, provider: "development" };
  }
}

export class DisabledEmailProvider implements TransactionalEmailProvider {
  async send(): Promise<SendEmailResult> {
    return {
      accepted: false,
      transientFailure: true,
      errorCode: "MAIL_DISABLED",
    };
  }

  async verifyConnection(): Promise<EmailProviderHealth> {
    return { ok: false, provider: "disabled", errorCode: "MAIL_DISABLED" };
  }
}

export class SmtpEmailProvider implements TransactionalEmailProvider {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: MailConfig) {
    type SmtpOptionsWithPool = SMTPTransport.Options & {
      pool?: boolean;
      maxConnections?: number;
      maxMessages?: number;
    };
    const options: SmtpOptionsWithPool = {
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth:
        config.smtp.user && config.smtp.password
          ? {
              user: config.smtp.user,
              pass: config.smtp.password,
            }
          : undefined,
      pool: config.smtp.pool,
      maxConnections: config.smtp.maxConnections,
      maxMessages: config.smtp.maxMessages,
    };
    this.transporter = nodemailer.createTransport(options);
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: getMailFrom(this.config),
        to: input.to.map(formatRecipient).join(", "),
        cc: input.cc?.map(formatRecipient).join(", "),
        bcc: input.bcc?.map(formatRecipient).join(", "),
        replyTo: input.replyTo ?? this.config.replyTo,
        subject: input.subject,
        html: input.html,
        text: input.text,
        headers: input.headers,
      });
      return {
        providerMessageId: String(info.messageId ?? ""),
        accepted: Array.isArray(info.accepted) ? info.accepted.length > 0 : true,
        transientFailure: false,
      };
    } catch (error) {
      return normalizeProviderError(error);
    }
  }

  async verifyConnection(): Promise<EmailProviderHealth> {
    try {
      await this.transporter.verify();
      return { ok: true, provider: "smtp" };
    } catch (error) {
      return {
        ok: false,
        provider: "smtp",
        errorCode: getProviderErrorCode(error),
      };
    }
  }
}

export function getTransactionalEmailProvider(
  config = getMailConfig()
): TransactionalEmailProvider {
  if (config.disableDelivery) return new DisabledEmailProvider();
  if (config.provider === "smtp") return new SmtpEmailProvider(config);
  return new DevelopmentCaptureEmailProvider(config.captureDirectory);
}

function normalizeProviderError(error: unknown): SendEmailResult {
  const code = getProviderErrorCode(error);
  return {
    accepted: false,
    transientFailure: isTransientProviderError(code),
    errorCode: code,
  };
}

function getProviderErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: unknown }).code).slice(0, 80);
  }
  return "MAIL_PROVIDER_ERROR";
}

function isTransientProviderError(code: string) {
  return [
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNECTION",
    "EENVELOPE",
    "MAIL_PROVIDER_ERROR",
  ].includes(code);
}

function formatRecipient(recipient: EmailRecipient) {
  return recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email;
}

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, "_").slice(0, 80);
}

function redactRecipient(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "[redacted]";
  return `${name.slice(0, 2)}***@${domain}`;
}
