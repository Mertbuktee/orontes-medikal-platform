import { assertServerOnly } from "@/lib/auth/server-only";
import { getTransactionalEmailProvider } from "@/lib/notifications/email-provider";
import { renderEmailTemplate } from "@/lib/notifications/email-templates";
import { getMailConfig } from "@/lib/notifications/mail-config";

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

export class ProviderBackedTransactionalEmailService
  implements TransactionalEmailService
{
  async sendPasswordResetEmail(input: PasswordResetEmailInput) {
    const config = getMailConfig();
    const provider = getTransactionalEmailProvider(config);
    const rendered = await renderEmailTemplate({
      key: "password-reset",
      payload: {
        recipientName: input.recipientName,
        resetUrl: input.resetUrl,
        expiresAt: input.expiresAt.toISOString(),
      },
      supportEmail: config.supportEmail,
    });

    const result = await provider.send({
      to: [{ email: input.recipientEmail, name: input.recipientName }],
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: ["password-reset"],
    });

    if (!result.accepted) {
      throw new Error(result.errorCode ?? "MAIL_DELIVERY_FAILED");
    }
  }
}

export function getTransactionalEmailService(): TransactionalEmailService {
  return new ProviderBackedTransactionalEmailService();
}
