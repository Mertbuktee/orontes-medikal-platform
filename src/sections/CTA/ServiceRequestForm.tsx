"use client";

import { Paperclip, Send, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";

import {
  createSubmitLock,
  formatFileSize,
  submitServiceRequest,
  validateContactAttachment,
  type ContactFieldErrors,
} from "@/sections/Contact/contact-form-utils";

const formFields = [
  { name: "fullName", label: "Ad Soyad", type: "text", placeholder: "Adınız ve soyadınız", autoComplete: "name", required: true },
  { name: "company", label: "Firma/Hastane", type: "text", placeholder: "Firma veya hastane adı", autoComplete: "organization", required: true },
  { name: "phone", label: "Telefon", type: "tel", placeholder: "0553 606 57 03", autoComplete: "tel", required: true },
  { name: "email", label: "E-posta", type: "email", placeholder: "ornek@firma.com", autoComplete: "email", required: true },
  { name: "deviceBrand", label: "Cihazın Markası", type: "text", placeholder: "Marka", autoComplete: "off", required: false },
  { name: "deviceModel", label: "Cihazın Modeli", type: "text", placeholder: "Model", autoComplete: "off", required: false },
  { name: "deviceSerialNumber", label: "Cihazın Seri No", type: "text", placeholder: "Seri No", autoComplete: "off", required: false },
] as const;

type TextFieldName = (typeof formFields)[number]["name"] | "message" | "website";
type FormFieldName = Exclude<TextFieldName, "website"> | "attachment";
type TextValues = Record<TextFieldName, string>;

const initialValues: TextValues = {
  fullName: "",
  company: "",
  phone: "",
  email: "",
  deviceBrand: "",
  deviceModel: "",
  deviceSerialNumber: "",
  message: "",
  website: "",
};
const fieldOrder: FormFieldName[] = [
  "fullName",
  "company",
  "phone",
  "email",
  "deviceBrand",
  "deviceModel",
  "deviceSerialNumber",
  "message",
  "attachment",
];

function withoutFieldError(errors: ContactFieldErrors, name: string) {
  const next = { ...errors };
  delete next[name];
  return next;
}

export default function ServiceRequestForm() {
  const [values, setValues] = useState<TextValues>(initialValues);
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [attachment, setAttachment] = useState<File>();
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string; requestId?: string }>();
  const fieldRefs = useRef<Partial<Record<FormFieldName, HTMLInputElement | HTMLTextAreaElement>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitLock = useRef(createSubmitLock());

  const getError = (name: FormFieldName) => fieldErrors[name]?.[0];
  const describedBy = (name: FormFieldName) => (getError(name) ? `${name}-error` : undefined);

  const handleTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => withoutFieldError(current, name));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setAttachment(undefined);
      setFieldErrors((current) => withoutFieldError(current, "attachment"));
      return;
    }

    const error = validateContactAttachment(file);

    if (error) {
      setAttachment(undefined);
      setFieldErrors((current) => ({ ...current, attachment: [error] }));
      event.target.value = "";
      return;
    }

    setAttachment(file);
    setFieldErrors((current) => withoutFieldError(current, "attachment"));
  };

  const removeAttachment = () => {
    setAttachment(undefined);
    setFieldErrors((current) => withoutFieldError(current, "attachment"));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void submitLock.current(async () => {
      setIsSubmitting(true);
      setFieldErrors({});
      setFeedback(undefined);

      try {
        const result = await submitServiceRequest({ ...values, formStartedAt, attachment });

        if (result.success) {
          setValues(initialValues);
          setAttachment(undefined);
          setFormStartedAt(Date.now());
          setFeedback({ type: "success", message: result.message });

          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          const nextErrors = result.fieldErrors ?? {};
          const firstInvalid = fieldOrder.find((field) => nextErrors[field]?.length);
          setFieldErrors(nextErrors);
          setFeedback({ type: "error", message: result.message, requestId: result.requestId });
          fieldRefs.current[firstInvalid ?? "fullName"]?.focus();
        }
      } catch {
        setFeedback({
          type: "error",
          message: "İstek gönderilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.",
        });
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div id="servis-talebi-form" className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5">
      <div className="border-b border-white/10 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">
          Servis başvurusu
        </p>
        <h3 className="mt-1 text-xl font-semibold text-white sm:text-2xl">Teknik Servis Talebi</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Cihaz ve arıza detaylarını güvenli form üzerinden ekibimize iletin.
        </p>
      </div>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
        <label className="sr-only">
          Website
          <input name="website" value={values.website} onChange={handleTextChange} autoComplete="off" tabIndex={-1} />
        </label>
        <input type="hidden" name="formStartedAt" value={formStartedAt} />

        {formFields.map((field) => {
          const error = getError(field.name);
          return (
            <label key={field.name} className="grid gap-2 text-sm font-medium text-slate-200">
              <span>
                {field.label}
                {field.required && <span className="text-orange-300"> *</span>}
              </span>
              <input
                ref={(element) => {
                  fieldRefs.current[field.name] = element ?? undefined;
                }}
                id={field.name}
                name={field.name}
                type={field.type}
                value={values[field.name]}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                onChange={handleTextChange}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy(field.name)}
                className="h-11 rounded-xl border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-400/10 aria-invalid:border-red-300"
              />
              {error && <span id={`${field.name}-error`} className="text-xs font-medium text-red-300">{error}</span>}
            </label>
          );
        })}

        <label className="grid gap-2 text-sm font-medium text-slate-200 sm:col-span-2">
          <span>
            Mesaj
            <span className="text-orange-300"> *</span>
          </span>
          <textarea
            ref={(element) => {
              fieldRefs.current.message = element ?? undefined;
            }}
            id="message"
            name="message"
            value={values.message}
            onChange={handleTextChange}
            placeholder="Cihaz modeli, arıza belirtisi veya servis talebiniz hakkında kısa bilgi yazabilirsiniz."
            aria-invalid={Boolean(getError("message"))}
            aria-describedby={describedBy("message")}
            className="min-h-28 resize-y rounded-xl border border-white/10 bg-slate-950/45 px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-400/10 aria-invalid:border-red-300"
          />
          {getError("message") && <span id="message-error" className="text-xs font-medium text-red-300">{getError("message")}</span>}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-200 sm:col-span-2">
          Dosya Ekle
          <span className="flex min-w-0 flex-col gap-3 rounded-xl border border-dashed border-white/20 bg-slate-950/35 px-3 py-4 text-sm text-slate-300 transition-colors hover:border-orange-300/50 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <span className="inline-flex min-w-0 items-center gap-2">
              <Paperclip className="size-4 text-orange-300" aria-hidden="true" />
              <span className="min-w-0">Sorununuzu görsel veya PDF ile belirtin</span>
            </span>
            <input
              ref={(element) => {
                fileInputRef.current = element;
                fieldRefs.current.attachment = element ?? undefined;
              }}
              id="attachment"
              name="attachment"
              type="file"
              accept=".jpg,.jpeg,.jfif,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              aria-invalid={Boolean(getError("attachment"))}
              aria-describedby={describedBy("attachment")}
              className="w-full min-w-0 max-w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-400/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sky-100 hover:file:bg-sky-400/20 sm:w-auto"
            />
          </span>
          {attachment && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-300/15 bg-sky-400/10 px-3 py-2 text-sm text-slate-200">
              <span className="truncate">{attachment.name} ({formatFileSize(attachment.size)})</span>
              <button type="button" onClick={removeAttachment} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300" aria-label="Seçili dosyayı kaldır">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {getError("attachment") && <span id="attachment-error" className="text-xs font-medium text-red-300">{getError("attachment")}</span>}
        </label>

        <div className="sm:col-span-2">
          <button type="submit" disabled={isSubmitting} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:bg-orange-300">
            {isSubmitting ? "Gönderiliyor..." : "Servis Talebi Oluştur"}
            <Send className="size-4" aria-hidden="true" />
          </button>
          <div className="mt-3 text-xs leading-5 text-slate-300" aria-live="polite">
            {feedback ? (
              <div className={feedback.type === "success" ? "text-emerald-300" : "text-red-300"}>
                <p className="font-medium">{feedback.message}</p>
                {feedback.type === "error" && feedback.requestId && <p className="mt-1 text-slate-400">Destek referansı: {feedback.requestId}</p>}
              </div>
            ) : (
              "Form güvenli servis talebi altyapısına gönderilecektir."
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
