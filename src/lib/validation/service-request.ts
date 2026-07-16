import { z } from "zod";

const phoneAllowedCharactersPattern = /^\+?[\d\s().-]+$/;

export const serviceRequestPhoneSchema = z
  .string()
  .trim()
  .min(1, "Telefon numarası zorunludur.")
  .max(30, "Telefon numarası çok uzun.")
  .refine((value) => phoneAllowedCharactersPattern.test(value), {
    message: "Geçerli bir telefon numarası girin.",
  })
  .refine((value) => isValidTurkishPhoneNumber(value), {
    message: "Telefon numarası 10 haneli Türkiye numarası olmalıdır.",
  });

export const serviceRequestFieldNames = [
  "fullName",
  "company",
  "phone",
  "email",
  "deviceBrand",
  "deviceModel",
  "deviceSerialNumber",
  "message",
  "attachment",
  "website",
  "formStartedAt",
] as const;

export const serviceRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  company: z.string().trim().min(2).max(150),
  phone: serviceRequestPhoneSchema,
  email: z.string().trim().email().max(254),
  deviceBrand: z.string().trim().max(120).optional(),
  deviceModel: z.string().trim().max(120).optional(),
  deviceSerialNumber: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10).max(3000),
  website: z.string().trim().optional(),
  formStartedAt: z.coerce.number().finite().positive(),
});

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;

export function hasUnexpectedFields(formData: FormData) {
  const allowed = new Set<string>(serviceRequestFieldNames);
  return [...formData.keys()].some((key) => !allowed.has(key));
}

export function parseServiceRequestFields(formData: FormData) {
  return serviceRequestSchema.safeParse({
    fullName: formData.get("fullName"),
    company: formData.get("company"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    deviceBrand: formData.get("deviceBrand") || undefined,
    deviceModel: formData.get("deviceModel") || undefined,
    deviceSerialNumber: formData.get("deviceSerialNumber") || undefined,
    message: formData.get("message"),
    website: formData.get("website") || undefined,
    formStartedAt: formData.get("formStartedAt"),
  });
}

export function toFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  return fieldErrors;
}

export function isValidTurkishPhoneNumber(value: string) {
  if (value.includes("+") && !value.trim().startsWith("+")) {
    return false;
  }

  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("0090")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("90") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  return /^[2-5]\d{9}$/.test(digits);
}
