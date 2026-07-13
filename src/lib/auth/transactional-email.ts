import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { assertServerOnly } from "@/lib/auth/server-only";

assertServerOnly("transactional email");

export type PasswordResetEmailInput = {
  recipientEmail: string;
  recipientName: string;
  resetUrl: string;
  expiresAt: Date;
};

export interface TransactionalEmailService {
  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
}

export class DevelopmentPasswordResetEmailService
  implements TransactionalEmailService
{
  constructor(
    private readonly root = path.join(
      process.cwd(),
      "storage",
      "private",
      "auth",
      "password-reset-emails"
    )
  ) {}

  async sendPasswordResetEmail(input: PasswordResetEmailInput) {
    await mkdir(this.root, { recursive: true });
    const fileName = `${Date.now()}-${safeEmailFilePart(input.recipientEmail)}.txt`;
    await writeFile(
      path.join(this.root, fileName),
      [
        "DEVELOPMENT PASSWORD RESET EMAIL",
        `Recipient: ${input.recipientEmail}`,
        `Name: ${input.recipientName}`,
        `Expires: ${input.expiresAt.toISOString()}`,
        `Reset URL: ${input.resetUrl}`,
        "",
        "This file is a development-only sink. Do not use it in production.",
      ].join("\n"),
      { flag: "wx" }
    );
  }
}

export class UnconfiguredProductionEmailService
  implements TransactionalEmailService
{
  async sendPasswordResetEmail() {
    throw new Error("Transactional email provider is not configured.");
  }
}

export function getTransactionalEmailService(
  env: NodeJS.ProcessEnv = process.env
): TransactionalEmailService {
  if (env.MAIL_PROVIDER === "development" || env.APP_ENV !== "production") {
    return new DevelopmentPasswordResetEmailService();
  }

  return new UnconfiguredProductionEmailService();
}

function safeEmailFilePart(email: string) {
  return email.toLowerCase().replace(/[^a-z0-9._-]/g, "_").slice(0, 80);
}
