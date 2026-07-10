export const maxClientAttachmentSize = 10 * 1024 * 1024;

const allowedExtensions = [".jpg", ".jpeg", ".jfif", ".png", ".webp", ".pdf"];
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export type ContactFormValues = {
  fullName: string;
  company: string;
  phone: string;
  email: string;
  message: string;
  website: string;
  formStartedAt: number;
  attachment?: File;
};

export type ContactFieldErrors = Record<string, string[]>;

export type ContactApiResult =
  | { success: true; requestId: string; message: string }
  | {
      success: false;
      requestId?: string;
      message: string;
      fieldErrors?: ContactFieldErrors;
    };

export type Fetcher = (
  input: string,
  init: { method: "POST"; body: FormData }
) => Promise<Response>;

type ContactApiResponseBody = {
  success?: boolean;
  requestId?: string;
  message?: string;
  fieldErrors?: ContactFieldErrors;
};

export function validateContactAttachment(file: File) {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;

  if (file.size > maxClientAttachmentSize) {
    return "Dosya boyutu en fazla 10 MB olabilir.";
  }

  if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(file.type)) {
    return "Bu dosya desteklenmiyor. Lütfen JPEG, PNG, WebP veya PDF yükleyin.";
  }

  return "";
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function createServiceRequestFormData(values: ContactFormValues) {
  const formData = new FormData();

  formData.set("fullName", values.fullName);
  formData.set("company", values.company);
  formData.set("phone", values.phone);
  formData.set("email", values.email);
  formData.set("message", values.message);
  formData.set("website", values.website);
  formData.set("formStartedAt", String(values.formStartedAt));

  if (values.attachment) {
    formData.set("attachment", values.attachment);
  }

  return formData;
}

export async function submitServiceRequest(values: ContactFormValues, fetcher: Fetcher = fetch) {
  const response = await fetcher("/api/service-requests", {
    method: "POST",
    body: createServiceRequestFormData(values),
  });
  const fallback = messageForStatus(response.status);
  const body = await readJsonResponse(response);

  if (body.success === true) {
    return {
      success: true,
      requestId: body.requestId ?? "",
      message: body.message || "Servis talebiniz alınmıştır.",
    } satisfies ContactApiResult;
  }

  return {
    success: false,
    requestId: body.requestId,
    message: body.message || fallback,
    fieldErrors: body.fieldErrors,
  } satisfies ContactApiResult;
}

export function createSubmitLock() {
  let locked = false;

  return async function run<T>(task: () => Promise<T>) {
    if (locked) {
      return undefined;
    }

    locked = true;

    try {
      return await task();
    } finally {
      locked = false;
    }
  };
}

function messageForStatus(status: number) {
  if (status === 413) {
    return "Dosya veya istek boyutu çok büyük.";
  }

  if (status === 429) {
    return "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.";
  }

  if (status === 403) {
    return "Güvenlik nedeniyle istek kabul edilmedi.";
  }

  if (status >= 500) {
    return "İşlem şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.";
  }

  return "Gönderilen bilgiler kontrol edilemedi.";
}

async function readJsonResponse(response: Response) {
  try {
    return (await response.json()) as ContactApiResponseBody;
  } catch {
    return {};
  }
}
