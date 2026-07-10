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
} from "lucide-react";
import Link from "next/link";
import { type ChangeEvent } from "react";

const contactCards = [
  {
    title: "Telefon",
    value: "0553 606 57 03",
    href: "tel:+905536065703",
    icon: Phone,
  },
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
const allowedImageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".jfif"];
const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];
const formFields = [["Ad Soyad", "text", "Adınız ve soyadınız"], ["Firma/Hastane", "text", "Firma veya hastane adı"], ["Telefon", "tel", "0553 606 57 03"], ["E-posta", "email", "ornek@firma.com"]];

async function hasAllowedImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return isPng || isJpeg || isWebp;
}

export default function Contact() {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const extension = file ? `.${file.name.split(".").pop()?.toLowerCase() ?? ""}` : "";

    if (!file) {
      event.target.setCustomValidity("");
      return;
    }

    const isAllowed =
      allowedImageExtensions.includes(extension) &&
      allowedImageTypes.includes(file.type) &&
      (await hasAllowedImageSignature(file));

    if (isAllowed) {
      event.target.setCustomValidity("");
      return;
    }

    const error = "Bu dosya desteklenmiyor. Lütfen bir görsel dosyası yükleyin.";
    event.target.value = "";
    event.target.setCustomValidity(error);
    event.target.reportValidity();
  };

  return (
    <section
      id="iletisim"
      className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
    >
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
            {contactCards.map(({ title, value, href, icon: Icon }) => {
              const content = (
                <>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">
                      {title}
                    </span>
                    <span className="mt-1 block whitespace-pre-line text-sm leading-6 text-slate-600">
                      {value}
                    </span>
                  </span>
                </>
              );

              if (href) {
                return (
                  <Link
                    key={title}
                    href={href}
                    className="group flex min-h-28 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={title}
                  className="flex min-h-28 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70"
                >
                  {content}
                </div>
              );
            })}
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

            <form className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              {formFields.map(([label, type, placeholder]) => (
                <label key={label} className="grid gap-2 text-sm font-medium text-slate-700">
                  {label}
                  <input
                    type={type}
                    placeholder={placeholder}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </label>
              ))}
              <label className="grid gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                Mesaj
                <textarea
                  placeholder="Cihaz modeli, arıza belirtisi veya servis talebiniz hakkında kısa bilgi yazabilirsiniz."
                  className="min-h-32 resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                Fotoğraf Ekle
                <span className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 transition-colors hover:border-orange-300 hover:bg-orange-50/40 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-2">
                    <Paperclip className="size-4 text-orange-500" aria-hidden="true" />
                    Sorununuzu görsel ile belirtin
                  </span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.jfif"
                    onChange={handleFileChange}
                    className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
                  />
                </span>
              </label>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:w-auto"
                >
                  Servis Talebi Oluştur
                  <Send className="size-4" aria-hidden="true" />
                </button>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Form altyapısı yönetim paneli ile birlikte aktif olacaktır.
                </p>
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
