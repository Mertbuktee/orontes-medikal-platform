import { assertServerOnly } from "@/lib/auth/server-only";
import { getTransactionalEmailProvider } from "@/lib/notifications/email-provider";
import { renderEmailTemplate } from "@/lib/notifications/email-templates";
import { getMailConfig } from "@/lib/notifications/mail-config";
import { getPublicSiteSettingsUncached } from "@/lib/site-settings/public-site-settings";

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
    const settings = await getPublicSiteSettingsUncached();
    const supportEmail =
      config.supportEmail || settings.contact.emailSupport || settings.contact.emailPrimary;
    const provider = getTransactionalEmailProvider(config);
    const rendered = await renderEmailTemplate({
      key: "password-reset",
      payload: {
        recipientName: input.recipientName,
        resetUrl: input.resetUrl,
        expiresAt: input.expiresAt.toISOString(),
      },
      companyName: settings.general.companyName,
      supportEmail,
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
