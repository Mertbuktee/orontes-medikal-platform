import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orontes Yönetim Paneli",
  description:
    "Orontes Teknoloji site içeriği, servis talepleri ve sistem ayarları yönetim alanı.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
