import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { noopServiceRequestEventPublisher } from "@/lib/domain/service-request-events";
import {
  FileValidationError,
  validateAndHardenUpload,
} from "@/lib/security/file-upload";
import { isSameOriginRequest } from "@/lib/security/origin";
import { getClientIp, serviceRequestRateLimiter } from "@/lib/security/rate-limit";
import {
  type FileStorageAdapter,
  LocalPrivateStorageAdapter,
} from "@/lib/security/storage";
import type { ServiceRequestRepository } from "@/lib/services/service-requests";
import {
  hasUnexpectedFields,
  parseServiceRequestFields,
  toFieldErrors,
} from "@/lib/validation/service-request";

export const runtime = "nodejs";

const minimumCompletionMs = 2000;
export const maxRequestSizeBytes = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const { prisma } = await import("@/lib/database/prisma");
  const { PrismaServiceRequestRepository } = await import(
    "@/lib/database/repositories/service-requests"
  );
  const storage = new LocalPrivateStorageAdapter();
  const repository = new PrismaServiceRequestRepository(prisma);

  return createServiceRequestHandler({ storage, repository })(request);
}

export function createServiceRequestHandler({
  storage,
  repository,
}: {
  storage: FileStorageAdapter;
  repository: ServiceRequestRepository;
}) {
  return async function handleServiceRequest(request: Request) {
    const requestId = randomUUID();

    try {
      if (!isSameOriginRequest(request)) {
        return jsonError(requestId, "Gönderilen istek kabul edilmedi.", 403);
      }

      const rateLimit = serviceRequestRateLimiter.check(
        getClientIp(request.headers)
      );

      if (!rateLimit.allowed) {
        return jsonError(
          requestId,
          "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.",
          429
        );
      }

      const contentLength = Number(request.headers.get("content-length"));

      if (
        Number.isFinite(contentLength) &&
        contentLength > maxRequestSizeBytes
      ) {
        return jsonError(requestId, "İstek boyutu çok büyük.", 413);
      }

      const contentType = request.headers.get("content-type") ?? "";

      if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
        return jsonError(requestId, "Gönderilen bilgiler geçersiz.", 400);
      }

      const formData = await request.formData();

      if (hasUnexpectedFields(formData)) {
        return validationError(requestId, {
          form: ["Beklenmeyen alan gönderildi."],
        });
      }

      const parsed = parseServiceRequestFields(formData);

      if (!parsed.success) {
        return validationError(requestId, toFieldErrors(parsed.error));
      }

      if (parsed.data.website) {
        return successResponse(requestId);
      }

      if (Date.now() - parsed.data.formStartedAt < minimumCompletionMs) {
        return validationError(requestId, {
          formStartedAt: ["Form çok hızlı gönderildi."],
        });
      }

      const attachments = formData
        .getAll("attachment")
        .filter(
          (value): value is File => value instanceof File && value.size > 0
        );

      if (attachments.length > 1) {
        return validationError(requestId, {
          attachment: ["En fazla bir dosya yüklenebilir."],
        });
      }

      let storedAttachment;

      if (attachments[0]) {
        try {
          const hardenedUpload = await validateAndHardenUpload(attachments[0]);
          storedAttachment = await storage.save(hardenedUpload);
        } catch (error) {
          if (error instanceof FileValidationError) {
            return validationError(requestId, {
              attachment: [
                "Bu dosya desteklenmiyor. Lütfen JPEG, PNG veya WebP yükleyin.",
              ],
            });
          }

          throw error;
        }
      }

      try {
        const savedRequest = await repository.save(parsed.data, storedAttachment);
        await noopServiceRequestEventPublisher.publish({
          type: "service_request.created",
          serviceRequestId: savedRequest.id,
          hasAttachment: Boolean(storedAttachment),
        });
        const { NotificationService } = await import(
          "@/lib/notifications/notification-service"
        );
        await new NotificationService()
          .notifyNewServiceRequest({
            serviceRequestId: savedRequest.id,
            requestShortId: savedRequest.id.slice(0, 8).toUpperCase(),
            customerLabel: parsed.data.company || parsed.data.fullName,
            hasAttachment: Boolean(storedAttachment),
          })
          .catch(() => undefined);
      } catch (error) {
        if (storedAttachment) {
          await storage
            .remove(storedAttachment.storageKey)
            .catch(() => undefined);
        }

        throw error;
      }

      console.info("service_request.accepted", {
        requestId,
        hasAttachment: Boolean(storedAttachment),
      });

      return successResponse(requestId);
    } catch {
      console.error("service_request.failed", { requestId });
      return jsonError(requestId, "İşlem şu anda tamamlanamadı.", 500);
    }
  };
}

function successResponse(requestId: string) {
  return NextResponse.json({
    success: true,
    requestId,
    message: "Servis talebiniz alınmıştır.",
  });
}

function validationError(
  requestId: string,
  fieldErrors: Record<string, string[]>
) {
  return NextResponse.json(
    {
      success: false,
      requestId,
      message: "Gönderilen bilgiler geçersiz.",
      fieldErrors,
    },
    { status: 400 }
  );
}

function jsonError(requestId: string, message: string, status: number) {
  return NextResponse.json({ success: false, requestId, message }, { status });
}
