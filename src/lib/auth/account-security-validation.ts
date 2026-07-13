import { z } from "zod";

import { validateAdminPassword } from "@/lib/auth/password";

export const genericForgotPasswordMessage =
  "Eğer bu e-posta adresine bağlı aktif bir yönetici hesabı varsa parola sıfırlama bağlantısı gönderilecektir.";

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(1).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .superRefine((value, context) => {
    const policyError = validateAdminPassword(value.newPassword);
    if (policyError) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: policyError,
      });
    }
    if (value.newPassword !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Yeni şifre tekrarı eşleşmiyor.",
      });
    }
    if (value.currentPassword === value.newPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Yeni şifre mevcut şifreden farklı olmalıdır.",
      });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
});

export const resetTokenSchema = z
  .string()
  .trim()
  .min(32)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+$/);

export const resetPasswordSchema = z
  .object({
    token: resetTokenSchema,
    newPassword: z.string().min(1).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .superRefine((value, context) => {
    const policyError = validateAdminPassword(value.newPassword);
    if (policyError) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: policyError,
      });
    }
    if (value.newPassword !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Yeni şifre tekrarı eşleşmiyor.",
      });
    }
  });

export const revokeSessionSchema = z.object({
  sessionId: z.string().cuid(),
});

export const mfaCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/);

export const recoveryCodeSchema = z
  .string()
  .trim()
  .min(8)
  .max(64)
  .regex(/^[A-Z0-9-]+$/i);
