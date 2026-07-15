import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orontes Teknik Operasyon",
  description:
    "Orontes servis talepleri, müşteri kayıtları, cihazlar ve servis geçmişi operasyon paneli.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TechnicalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
