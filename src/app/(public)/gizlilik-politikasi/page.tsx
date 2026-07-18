import type { Metadata } from "next";

import LegalPage from "@/components/common/LegalPage";
import { getPublicSiteSettings } from "@/lib/site-settings/public-site-settings";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Orontes Teknoloji",
  description:
    "Orontes Teknoloji web sitesi ve servis talep süreçleri için gizlilik politikası.",
};

export default async function PrivacyPolicyPage() {
  const settings = await getPublicSiteSettings();

  return (
    <LegalPage
      eyebrow="Gizlilik"
      title="Gizlilik Politikası"
      description="Bu politika, Orontes Teknoloji web sitesi üzerinden paylaşılan kişisel verilerin hangi amaçlarla işlendiğini ve nasıl korunduğunu açıklar."
      sections={[
        {
          title: "Veri Sorumlusu",
          paragraphs: [
            "Orontes İnovasyon Endüstriyel Ürünler Sanayi Ticaret Ltd. Şti., web sitesi ve servis talep süreçlerinde paylaşılan kişisel verilerin korunmasına önem verir.",
          ],
        },
        {
          title: "Toplanan Bilgiler",
          items: [
            "İletişim formu üzerinden ad soyad, firma veya hastane bilgisi, telefon, e-posta ve mesaj içeriği alınabilir.",
            "Servis talebi kapsamında cihaz marka, model, seri numarası ve kullanıcı tarafından eklenen görsel dosyalar işlenebilir.",
            "Web sitesi güvenliği, çerez tercihleri ve kötüye kullanımın önlenmesi için sınırlı teknik kayıtlar tutulabilir.",
          ],
        },
        {
          title: "Kullanım Amaçları",
          items: [
            "Servis talebini değerlendirmek ve kullanıcıyla iletişime geçmek.",
            "Cihaz uygunluğu, arıza ön değerlendirmesi ve teknik destek süreçlerini yürütmek.",
            "Web sitesinin güvenliğini sağlamak ve kötüye kullanımı önlemek.",
            "Kullanıcının çerez tercihlerini hatırlamak.",
          ],
        },
        {
          title: "Verilerin Korunması",
          paragraphs: [
            "Servis formu üzerinden gönderilen dosyalar public web kökü dışında özel alanda saklanır. Dosyalar doğrudan herkese açık indirme bağlantısı olarak sunulmaz.",
            "Kişisel veriler, yetkisiz erişimi önlemek amacıyla teknik ve idari tedbirlerle korunur. Üretim ortamında ek erişim kontrolü, kayıt denetimi ve saklama politikaları uygulanacaktır.",
          ],
        },
        {
          title: "Üçüncü Taraflar",
          paragraphs: [
            "Zorunlu haller dışında kişisel veriler üçüncü kişilerle paylaşılmaz. Harita, e-posta, hosting veya güvenlik hizmetleri gibi altyapı sağlayıcıları veri işleme süreçlerinde rol alabilir.",
          ],
        },
        {
          title: "İletişim",
          paragraphs: [
            `Gizlilik politikası ve kişisel verilerinizle ilgili talepleriniz için ${settings.contact.emailPrimary} adresinden bizimle iletişime geçebilirsiniz.`,
          ],
        },
      ]}
    />
  );
}
