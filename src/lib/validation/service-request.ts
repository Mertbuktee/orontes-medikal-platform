import { z } from "zod";

export const serviceRequestFieldNames = [
  "fullName",
  "company",
  "phone",
  "email",
  "message",
  "attachment",
  "website",
  "formStartedAt",
] as const;

export const serviceRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  company: z.string().trim().max(150).optional(),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().max(254),
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
    company: formData.get("company") || undefined,
    phone: formData.get("phone"),
    email: formData.get("email"),
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
