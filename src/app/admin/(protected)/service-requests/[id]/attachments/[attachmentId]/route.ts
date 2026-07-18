import { NextResponse, type NextRequest } from "next/server";

import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";
import { LocalPrivateStorageAdapter } from "@/lib/security/storage";

export const runtime = "nodejs";

type AttachmentRouteContext = {
  params: Promise<{
    id: string;
    attachmentId: string;
  }>;
};

export async function GET(request: NextRequest, context: AttachmentRouteContext) {
  const session = await requirePermission("serviceRequests.attachments.view");
  const { id, attachmentId } = await context.params;
  const repository = new PrismaServiceRequestRepository(prisma);
  const attachment = await repository.findAttachment({
    serviceRequestId: id,
    attachmentId,
  });

  if (!attachment) {
    return notFoundResponse();
  }

  try {
    const storage = new LocalPrivateStorageAdapter();
    const buffer = await storage.read(attachment.storageKey);
    const auditRepository = new AdminAuthRepository(prisma);

    await auditRepository.appendAuditLog({
      actorId: session.userId,
      action: "UPDATE",
      entityType: "ServiceRequestAttachmentDownload",
      entityId: attachment.id,
      metadata: {
        serviceRequestId: id,
        attachmentId: attachment.id,
      },
      context: getAdminRequestContext(request.headers),
    });

    const inlinePreview = shouldPreviewInline(request, attachment.mimeType);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": `${inlinePreview ? "inline" : "attachment"}; filename="${createDownloadName(attachment)}"`,
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; object-src 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFoundResponse();
  }
}

function shouldPreviewInline(request: NextRequest, mimeType: string) {
  const preview = request.nextUrl.searchParams.get("preview") === "1";
  return preview && ["image/jpeg", "image/png", "image/webp"].includes(mimeType);
}

function notFoundResponse() {
  return NextResponse.json(
    { success: false, message: "Dosya bulunamadı." },
    { status: 404, headers: { "Cache-Control": "private, no-store" } }
  );
}

function createDownloadName(attachment: { id: string; mimeType: string }) {
  const extensionByMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionByMime[attachment.mimeType] ?? "bin";

  return `servis-talebi-ek-${attachment.id.slice(-8)}.${extension}`;
}
