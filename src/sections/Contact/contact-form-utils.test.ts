import { describe, expect, it } from "vitest";

import {
  createSubmitLock,
  maxClientAttachmentSize,
  submitServiceRequest,
  validateContactAttachment,
  type ContactFormValues,
  type Fetcher,
} from "@/sections/Contact/contact-form-utils";

const validValues: ContactFormValues = {
  fullName: "Test User",
  company: "Test Hospital",
  phone: "0553 606 57 03",
  email: "test@example.com",
  deviceBrand: "Mindray",
  deviceModel: "BeneView T5",
  deviceSerialNumber: "SN-12345",
  message: "Cihaz arızası hakkında servis talebi oluşturmak istiyorum.",
  website: "",
  formStartedAt: Date.now() - 3000,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("contact form helpers", () => {
  it("submits multipart form data successfully", async () => {
    let submittedFormData: FormData | undefined;
    const fetcher: Fetcher = async (_input, init) => {
      submittedFormData = init.body;
      return jsonResponse({
        success: true,
        requestId: "request-1",
        message: "Servis talebiniz alınmıştır.",
      });
    };

    const result = await submitServiceRequest(validValues, fetcher);

    expect(result.success).toBe(true);
    expect(submittedFormData?.get("fullName")).toBe(validValues.fullName);
    expect(submittedFormData?.get("deviceBrand")).toBe(validValues.deviceBrand);
    expect(submittedFormData?.get("deviceModel")).toBe(validValues.deviceModel);
    expect(submittedFormData?.get("deviceSerialNumber")).toBe(validValues.deviceSerialNumber);
    expect(submittedFormData?.get("website")).toBe("");
    expect(submittedFormData?.get("formStartedAt")).toBe(String(validValues.formStartedAt));
  });

  it("returns field validation errors from the API", async () => {
    const fetcher: Fetcher = async () =>
      jsonResponse(
        {
          success: false,
          requestId: "request-2",
          message: "Gönderilen bilgiler geçersiz.",
          fieldErrors: { fullName: ["Ad Soyad gereklidir."] },
        },
        400
      );

    const result = await submitServiceRequest(validValues, fetcher);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.fullName).toEqual(["Ad Soyad gereklidir."]);
  });

  it("rejects oversized client-side files", () => {
    const file = new File([new Uint8Array(maxClientAttachmentSize + 1)], "large.png", {
      type: "image/png",
    });

    expect(validateContactAttachment(file)).toBe("Dosya boyutu en fazla 10 MB olabilir.");
  });

  it("rejects unsupported client-side file types", () => {
    const file = new File(["bad"], "shell.php", { type: "application/x-php" });

    expect(validateContactAttachment(file)).toContain("Bu dosya desteklenmiyor");
  });

  it("maps rate-limit responses", async () => {
    const fetcher: Fetcher = async () =>
      jsonResponse(
        {
          success: false,
          requestId: "request-3",
          message: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.",
        },
        429
      );

    const result = await submitServiceRequest(validValues, fetcher);

    expect(result.success).toBe(false);
    expect(result.requestId).toBe("request-3");
    expect(result.message).toContain("Çok fazla deneme");
  });

  it("maps server error responses without internal details", async () => {
    const fetcher: Fetcher = async () => new Response("Internal stack trace", { status: 500 });

    const result = await submitServiceRequest(validValues, fetcher);

    expect(result.success).toBe(false);
    expect(result.message).toBe("İşlem şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.");
  });

  it("prevents duplicate submissions while one task is pending", async () => {
    const lock = createSubmitLock();
    let resolveFirst: (value: string) => void = () => undefined;
    const first = lock(
      () =>
        new Promise<string>((resolve) => {
          resolveFirst = resolve;
        })
    );
    const second = await lock(async () => "second");

    resolveFirst("first");

    await expect(first).resolves.toBe("first");
    expect(second).toBeUndefined();
  });
});
