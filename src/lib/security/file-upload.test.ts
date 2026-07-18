import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  FileValidationError,
  maxUploadSizeBytes,
  validateAndHardenUpload,
} from "@/lib/security/file-upload";

async function imageFile(format: "jpeg" | "png" | "webp", name: string, type: string) {
  const buffer = await sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: "#ffffff",
    },
  })
    .toFormat(format)
    .toBuffer();

  return new File([buffer], name, { type });
}

function pdfFile(name = "report.pdf", type = "application/pdf") {
  return new File(
    [Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF")],
    name,
    { type }
  );
}

describe("validateAndHardenUpload", () => {
  it("rejects oversized files", async () => {
    const file = new File([new Uint8Array(maxUploadSizeBytes + 1)], "large.png", {
      type: "image/png",
    });

    await expect(validateAndHardenUpload(file)).rejects.toBeInstanceOf(FileValidationError);
  });

  it("rejects re-encoded image output over the configured limit", async () => {
    const file = await imageFile("png", "image.png", "image/png");

    await expect(validateAndHardenUpload(file, { maxOutputSizeBytes: 1 })).rejects.toBeInstanceOf(
      FileValidationError
    );
  });

  it("rejects disallowed extensions", async () => {
    const file = await imageFile("png", "image.gif", "image/png");
    await expect(validateAndHardenUpload(file)).rejects.toBeInstanceOf(FileValidationError);
  });

  it("rejects spoofed MIME types", async () => {
    const file = await imageFile("png", "image.png", "text/plain");
    await expect(validateAndHardenUpload(file)).rejects.toBeInstanceOf(FileValidationError);
  });

  it("rejects invalid magic bytes", async () => {
    const file = new File([Buffer.from("not an image")], "image.png", { type: "image/png" });
    await expect(validateAndHardenUpload(file)).rejects.toBeInstanceOf(FileValidationError);
  });

  it("rejects SVG files", async () => {
    const file = new File([Buffer.from("<svg></svg>")], "image.svg", {
      type: "image/svg+xml",
    });
    await expect(validateAndHardenUpload(file)).rejects.toBeInstanceOf(FileValidationError);
  });

  it("rejects PDF files", async () => {
    await expect(validateAndHardenUpload(pdfFile())).rejects.toBeInstanceOf(FileValidationError);
  });

  it("sanitizes path traversal filenames", async () => {
    const file = await imageFile("png", "../../evil.png", "image/png");
    const result = await validateAndHardenUpload(file);

    expect(result.originalName).toBe("evil.png");
    expect(result.serverFileName).toMatch(/^[a-f0-9-]+\.png$/);
  });

  it("accepts valid JPEG files", async () => {
    const file = await imageFile("jpeg", "monitor.jpg", "image/jpeg");
    const result = await validateAndHardenUpload(file);

    expect(result.detectedMime).toBe("image/jpeg");
    expect(result.serverFileName).toMatch(/\.jpg$/);
  });

  it("accepts valid PNG files", async () => {
    const file = await imageFile("png", "monitor.png", "image/png");
    const result = await validateAndHardenUpload(file);

    expect(result.detectedMime).toBe("image/png");
    expect(result.serverFileName).toMatch(/\.png$/);
  });

  it("accepts valid WebP files", async () => {
    const file = await imageFile("webp", "monitor.webp", "image/webp");
    const result = await validateAndHardenUpload(file);

    expect(result.detectedMime).toBe("image/webp");
    expect(result.serverFileName).toMatch(/\.webp$/);
  });

});
