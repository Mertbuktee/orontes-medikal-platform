"use client";

import {
  BadgeCheck,
  Building2,
  Mail,
  MapPin,
  MessageCircle,
  Paperclip,
  Phone,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";

import {
  createSubmitLock,
  formatFileSize,
  submitServiceRequest,
  validateContactAttachment,
  type ContactFieldErrors,
} from "@/sections/Contact/contact-form-utils";

const contactCards = [
  { title: "Telefon", value: "0553 606 57 03", href: "tel:+905536065703", icon: Phone },
  {
    title: "E-posta",
    value: "info@orontesteknoloji.com",
    href: "mailto:info@orontesteknoloji.com",
    icon: Mail,
  },
  {
    title: "Adres",
    value: "Kocasinan Merkez Mh.\nGörgülü Sk. No:20/B\nBahçelievler / İstanbul",
    href: "https://maps.app.goo.gl/6RGW6dy3kK4RAax8A",
    icon: MapPin,
  },
  {
    title: "WhatsApp",
    value: "Hızlı iletişim",
    href: "https://wa.me/905536065703?text=Merhabalar%20Website%20%C3%9Czerinden%20%C4%B0leti%C5%9Fime%20Ge%C3%A7iyorum",
    icon: MessageCircle,
  },
];

const trustItems = ["Türkiye Geneli Destek", "Teknik Servis", "Elektronik Kart Tamiri"];
const formFields = [
  { name: "fullName", label: "Ad Soyad", type: "text", placeholder: "Adınız ve soyadınız", autoComplete: "name" },
  { name: "company", label: "Firma/Hastane", type: "text", placeholder: "Firma veya hastane adı", autoComplete: "organization" },
  { name: "phone", label: "Telefon", type: "tel", placeholder: "0553 606 57 03", autoComplete: "tel" },
  { name: "email", label: "E-posta", type: "email", placeholder: "ornek@firma.com", autoComplete: "email" },
] as const;

type TextFieldName = (typeof formFields)[number]["name"] | "message" | "website";
type FormFieldName = Exclude<TextFieldName, "website"> | "attachment";
type TextValues = Record<TextFieldName, string>;

const initialValues: TextValues = {
  fullName: "",
  company: "",
  phone: "",
  email: "",
  message: "",
  website: "",
};
const fieldOrder: FormFieldName[] = ["fullName", "company", "phone", "email", "message", "attachment"];

function withoutFieldError(errors: ContactFieldErrors, name: string) {
  const next = { ...errors };
  delete next[name];
  return next;
}

export default function Contact() {
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

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
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
    <section id="iletisim" className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_12%,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_92%_18%,rgba(249,115,22,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-orange-700">
            <MessageCircle className="size-3.5" aria-hidden="true" />
            İLETİŞİM
          </div>

          <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Bizimle İletişime Geçin
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Servis kapsamı, cihaz uygunluğu veya teknik destek hakkında bilgi
            almak için bizimle iletişime geçebilirsiniz.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {contactCards.map(({ title, value, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group flex min-h-28 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-950">{title}</span>
                  <span className="mt-1 block whitespace-pre-line text-sm leading-6 text-slate-600">
                    {value}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {trustItems.map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
              >
                <BadgeCheck className="size-4 text-orange-500" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/80 sm:p-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
                  <Send className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                    Servis başvurusu
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                    Hızlı İletişim
                  </h3>
                </div>
              </div>
            </div>

            <form className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6" onSubmit={handleSubmit} noValidate>
              <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
                Website
                <input
                  name="website"
                  value={values.website}
                  onChange={handleTextChange}
                  autoComplete="off"
                  tabIndex={-1}
                />
              </label>
              <input type="hidden" name="formStartedAt" value={formStartedAt} />

              {formFields.map((field) => {
                const error = getError(field.name);
                return (
                  <label key={field.name} className="grid gap-2 text-sm font-medium text-slate-700">
                    {field.label}
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
                      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 aria-invalid:border-red-300 aria-invalid:focus:border-red-400 aria-invalid:focus:ring-red-100"
                    />
                    {error && (
                      <span id={`${field.name}-error`} className="text-xs font-medium text-red-600">
                        {error}
                      </span>
                    )}
                  </label>
                );
              })}

              <label className="grid gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                Mesaj
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
                  className="min-h-32 resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 aria-invalid:border-red-300 aria-invalid:focus:border-red-400 aria-invalid:focus:ring-red-100"
                />
                {getError("message") && (
                  <span id="message-error" className="text-xs font-medium text-red-600">
                    {getError("message")}
                  </span>
                )}
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                Dosya Ekle
                <span className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 transition-colors hover:border-orange-300 hover:bg-orange-50/40 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-2">
                    <Paperclip className="size-4 text-orange-500" aria-hidden="true" />
                    Sorununuzu görsel veya PDF ile belirtin
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
                    className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
                  />
                </span>
                {attachment && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-slate-700">
                    <span className="truncate">
                      {attachment.name} ({formatFileSize(attachment.size)})
                    </span>
                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                      aria-label="Seçili dosyayı kaldır"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
                {getError("attachment") && (
                  <span id="attachment-error" className="text-xs font-medium text-red-600">
                    {getError("attachment")}
                  </span>
                )}
              </label>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:bg-orange-300 sm:w-auto"
                >
                  {isSubmitting ? "Gönderiliyor..." : "Servis Talebi Oluştur"}
                  <Send className="size-4" aria-hidden="true" />
                </button>
                <div className="mt-3 text-xs leading-5 text-slate-500" aria-live="polite">
                  {feedback ? (
                    <div className={feedback.type === "success" ? "text-emerald-700" : "text-red-600"}>
                      <p className="font-medium">{feedback.message}</p>
                      {feedback.type === "error" && feedback.requestId && (
                        <p className="mt-1 text-slate-500">Destek referansı: {feedback.requestId}</p>
                      )}
                    </div>
                  ) : (
                    "Form güvenli servis talebi altyapısına gönderilecektir."
                  )}
                </div>
              </div>
            </form>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700">
            <Building2 className="size-5 shrink-0 text-sky-700" aria-hidden="true" />
            <span>
              Cihaz gönderimi ve servis kapsamı için ekibimizle ön görüşme
              yapabilirsiniz.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
