"use server";

import type { AuditAction, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { requirePermission } from "@/lib/auth/admin-session";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { prisma } from "@/lib/database/prisma";
import { PrismaCustomerRegistryRepository } from "@/lib/database/repositories/customer-registry";
import { assertSameOriginAction } from "@/lib/security/action-origin";

const companySchema = z.object({
  legalName: z.string().trim().min(2).max(180),
  displayName: z.string().trim().min(2).max(180),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().max(254),
  taxNumber: z.string().trim().max(50).optional(),
  taxOffice: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(4000).optional(),
  isActive: z.boolean(),
});

const locationSchema = z.object({
  customerCompanyId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  addressLine: z.string().trim().min(5).max(1000),
  department: z.string().trim().max(120).optional(),
  building: z.string().trim().max(120).optional(),
  floor: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(30).optional(),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
});

const contactSchema = z.object({
  customerCompanyId: z.string().min(1),
  customerLocationId: z.string().trim().optional(),
  fullName: z.string().trim().min(2).max(120),
  title: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().max(254).optional(),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
});

const linkSchema = z.object({
  serviceRequestId: z.string().min(1),
  customerCompanyId: z.string().min(1),
  customerLocationId: z.string().trim().optional(),
  customerContactId: z.string().trim().optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

export async function createCustomerCompany(formData: FormData) {
  const session = await requirePermission("technicalCustomers.create");
  await assertSameOriginAction();
  const parsed = companySchema.safeParse(parseCompanyForm(formData));

  if (!parsed.success) {
    redirect("/technical/customers/new?status=invalid");
  }

  const repository = new PrismaCustomerRegistryRepository(prisma);
  const company = await repository.createCompany(parsed.data);

  await appendCustomerAudit(session.userId, "CREATE", company.id, {
    customerCompanyId: company.id,
    displayName: company.displayName,
  });
  revalidateCustomers(company.id);
  redirect(`/technical/customers/${company.id}`);
}

export async function updateCustomerCompany(formData: FormData) {
  const session = await requirePermission("technicalCustomers.update");
  await assertSameOriginAction();
  const id = String(formData.get("id") ?? "");
  const parsed = companySchema.safeParse(parseCompanyForm(formData));

  if (!id || !parsed.success) {
    redirect(id ? `/technical/customers/${id}/edit?status=invalid` : "/technical/customers");
  }

  const repository = new PrismaCustomerRegistryRepository(prisma);
  const company = await repository.updateCompany(id, parsed.data);

  await appendCustomerAudit(session.userId, "UPDATE", company.id, {
    customerCompanyId: company.id,
    displayName: company.displayName,
  });
  revalidateCustomers(company.id);
  redirect(`/technical/customers/${company.id}`);
}

export async function archiveCustomerCompany(formData: FormData) {
  const session = await requirePermission("technicalCustomers.archive");
  await assertSameOriginAction();
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const repository = new PrismaCustomerRegistryRepository(prisma);
  const company = await repository.archiveCompany(parsed.data.id);

  await appendCustomerAudit(session.userId, "ARCHIVE", company.id, {
    customerCompanyId: company.id,
  });
  revalidateCustomers(company.id);
  redirect("/technical/customers");
}

export async function createCustomerLocation(formData: FormData) {
  const session = await requirePermission("technicalCustomers.update");
  await assertSameOriginAction();
  const parsed = locationSchema.safeParse(parseLocationForm(formData));

  if (!parsed.success) return;

  const repository = new PrismaCustomerRegistryRepository(prisma);
  const location = await repository.createLocation(parsed.data);

  await appendCustomerAudit(session.userId, "CREATE", parsed.data.customerCompanyId, {
    customerCompanyId: parsed.data.customerCompanyId,
    customerLocationId: location.id,
    entity: "CustomerLocation",
  });
  revalidateCustomers(parsed.data.customerCompanyId);
}

export async function archiveCustomerLocation(formData: FormData) {
  const session = await requirePermission("technicalCustomers.archive");
  await assertSameOriginAction();
  const parsed = z
    .object({ id: z.string().min(1), customerCompanyId: z.string().min(1) })
    .safeParse({
      id: formData.get("id"),
      customerCompanyId: formData.get("customerCompanyId"),
    });

  if (!parsed.success) return;

  const repository = new PrismaCustomerRegistryRepository(prisma);
  await repository.archiveLocation(parsed.data.id);

  await appendCustomerAudit(session.userId, "ARCHIVE", parsed.data.customerCompanyId, {
    customerCompanyId: parsed.data.customerCompanyId,
    customerLocationId: parsed.data.id,
    entity: "CustomerLocation",
  });
  revalidateCustomers(parsed.data.customerCompanyId);
}

export async function createCustomerContact(formData: FormData) {
  const session = await requirePermission("technicalCustomers.update");
  await assertSameOriginAction();
  const parsed = contactSchema.safeParse(parseContactForm(formData));

  if (!parsed.success) return;

  const repository = new PrismaCustomerRegistryRepository(prisma);
  const contact = await repository.createContact({
    ...parsed.data,
    customerLocationId: parsed.data.customerLocationId || null,
  });

  await appendCustomerAudit(session.userId, "CREATE", parsed.data.customerCompanyId, {
    customerCompanyId: parsed.data.customerCompanyId,
    customerContactId: contact.id,
    entity: "CustomerContact",
  });
  revalidateCustomers(parsed.data.customerCompanyId);
}

export async function archiveCustomerContact(formData: FormData) {
  const session = await requirePermission("technicalCustomers.archive");
  await assertSameOriginAction();
  const parsed = z
    .object({ id: z.string().min(1), customerCompanyId: z.string().min(1) })
    .safeParse({
      id: formData.get("id"),
      customerCompanyId: formData.get("customerCompanyId"),
    });

  if (!parsed.success) return;

  const repository = new PrismaCustomerRegistryRepository(prisma);
  await repository.archiveContact(parsed.data.id);

  await appendCustomerAudit(session.userId, "ARCHIVE", parsed.data.customerCompanyId, {
    customerCompanyId: parsed.data.customerCompanyId,
    customerContactId: parsed.data.id,
    entity: "CustomerContact",
  });
  revalidateCustomers(parsed.data.customerCompanyId);
}

export async function linkServiceRequestToCustomer(formData: FormData) {
  const session = await requirePermission("serviceRequests.update");
  await assertSameOriginAction();
  const parsed = linkSchema.safeParse({
    serviceRequestId: formData.get("serviceRequestId"),
    customerCompanyId: formData.get("customerCompanyId"),
    customerLocationId: formData.get("customerLocationId"),
    customerContactId: formData.get("customerContactId"),
  });

  if (!parsed.success) return;

  const repository = new PrismaCustomerRegistryRepository(prisma);
  await repository.linkServiceRequestToCustomer({
    ...parsed.data,
    customerLocationId: parsed.data.customerLocationId || null,
    customerContactId: parsed.data.customerContactId || null,
  });

  await appendCustomerAudit(session.userId, "UPDATE", parsed.data.customerCompanyId, {
    customerCompanyId: parsed.data.customerCompanyId,
    serviceRequestId: parsed.data.serviceRequestId,
    action: "link-service-request",
  });
  revalidateCustomers(parsed.data.customerCompanyId);
  revalidateServiceRequest(parsed.data.serviceRequestId);
}

export async function createCustomerFromServiceRequest(formData: FormData) {
  const session = await requirePermission("technicalCustomers.create");
  await assertSameOriginAction();
  const parsed = z
    .object({ serviceRequestId: z.string().min(1) })
    .safeParse({ serviceRequestId: formData.get("serviceRequestId") });

  if (!parsed.success) return;

  const repository = new PrismaCustomerRegistryRepository(prisma);
  const company = await repository.createCompanyFromServiceRequest(
    parsed.data.serviceRequestId
  );

  if (!company) return;

  await appendCustomerAudit(session.userId, "CREATE", company.id, {
    customerCompanyId: company.id,
    serviceRequestId: parsed.data.serviceRequestId,
    source: "service-request",
  });
  revalidateCustomers(company.id);
  revalidateServiceRequest(parsed.data.serviceRequestId);
}

function parseCompanyForm(formData: FormData) {
  return {
    legalName: formData.get("legalName"),
    displayName: formData.get("displayName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    taxNumber: formData.get("taxNumber") || undefined,
    taxOffice: formData.get("taxOffice") || undefined,
    notes: formData.get("notes") || undefined,
    isActive: formData.has("isActive"),
  };
}

function parseLocationForm(formData: FormData) {
  return {
    customerCompanyId: formData.get("customerCompanyId"),
    name: formData.get("name"),
    city: formData.get("city"),
    district: formData.get("district"),
    addressLine: formData.get("addressLine"),
    department: formData.get("department") || undefined,
    building: formData.get("building") || undefined,
    floor: formData.get("floor") || undefined,
    phone: formData.get("phone") || undefined,
    isPrimary: formData.get("isPrimary") === "true",
    isActive: formData.has("isActive"),
  };
}

function parseContactForm(formData: FormData) {
  return {
    customerCompanyId: formData.get("customerCompanyId"),
    customerLocationId: formData.get("customerLocationId") || undefined,
    fullName: formData.get("fullName"),
    title: formData.get("title") || undefined,
    department: formData.get("department") || undefined,
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    isPrimary: formData.get("isPrimary") === "true",
    isActive: formData.has("isActive"),
  };
}

async function appendCustomerAudit(
  actorId: string,
  action: AuditAction,
  entityId: string,
  metadata: Prisma.InputJsonValue
) {
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId,
    action,
    entityType: "CustomerCompany",
    entityId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateCustomers(id?: string) {
  revalidatePath("/technical/customers");
  if (id) {
    revalidatePath(`/technical/customers/${id}`);
    revalidatePath(`/technical/customers/${id}/edit`);
  }
}

function revalidateServiceRequest(id: string) {
  revalidatePath("/technical/service-requests");
  revalidatePath(`/technical/service-requests/${id}`);
  revalidatePath("/admin/service-requests");
  revalidatePath(`/admin/service-requests/${id}`);
}
