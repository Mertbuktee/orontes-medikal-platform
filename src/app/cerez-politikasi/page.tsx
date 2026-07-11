import type { Metadata } from "next";

import LegalPage from "@/components/common/LegalPage";

export const metadata: Metadata = {
  title: "Çerez Politikası | Orontes Teknoloji",
  description:
    "Orontes Teknoloji web sitesi çerez kategorileri ve tercih yönetimi politikası.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Çerezler"
      title="Çerez Politikası"
      description="Bu politika, Orontes Teknoloji web sitesinde kullanılan çerez kategorilerini, tercihlerin nasıl kaydedildiğini ve kullanıcıların seçimlerini nasıl yönetebileceğini açıklar."
      sections={[
        {
          title: "Çerez Nedir?",
          paragraphs: [
            "Çerezler, web sitesinin çalışması, güvenliği ve kullanıcı tercihlerini hatırlaması için tarayıcıda saklanan küçük veri parçalarıdır.",
          ],
        },
        {
          title: "Kullandığımız Çerez Kategorileri",
          items: [
            "Zorunlu çerezler: Site güvenliği, form koruması, oturum güvenliği ve çerez tercihlerinin saklanması için kullanılır.",
            "Fonksiyonel çerezler: Kullanıcı tercihlerini ve deneyim ayarlarını hatırlamak için kullanılabilir.",
            "Analitik çerezler: Site performansını, sayfa kullanımını ve iyileştirme alanlarını anlamak için kullanılır. Kullanıcının onayına tabidir.",
            "Pazarlama çerezleri: İleride reklam, kampanya ve dönüşüm ölçümleme süreçleri için kullanılabilir. Kullanıcının onayına tabidir.",
          ],
        },
        {
          title: "Tercihlerin Saklanması",
          paragraphs: [
            "Çerez tercihleri tarayıcıda saklanır ve aynı kullanıcıya tekrar tekrar tercih sorulmaması için kullanılır. Sistem ayrıca tercih kaydını ileride kullanıcı hesabı veya anonim kullanıcı kimliği ile veritabanında saklanabilecek şekilde tasarlanmıştır.",
          ],
        },
        {
          title: "Zorunlu Çerezler",
          paragraphs: [
            "Zorunlu çerezler web sitesinin güvenli ve kararlı çalışması için gereklidir. Bu çerezler kapatılamaz; ancak tarayıcı ayarları üzerinden tüm çerezleri engellemeniz halinde bazı özellikler çalışmayabilir.",
          ],
        },
        {
          title: "Tercihleri Değiştirme",
          paragraphs: [
            "Kullanıcılar tarayıcı ayarlarından çerezleri silebilir veya engelleyebilir. İleride yönetim paneli ve kullanıcı hesabı altyapısı tamamlandığında tercihlerin merkezi olarak güncellenmesi desteklenecektir.",
          ],
        },
        {
          title: "Üçüncü Taraf Hizmetler",
          paragraphs: [
            "Google Maps gibi harici hizmetler kendi çerez ve gizlilik politikalarına tabi olabilir. Harici hizmetlerle etkileşime geçildiğinde ilgili sağlayıcının politikaları geçerli olabilir.",
          ],
        },
        {
          title: "İletişim",
          paragraphs: [
            "Çerez politikası hakkında sorularınız için info@orontesteknoloji.com adresinden bizimle iletişime geçebilirsiniz.",
          ],
        },
      ]}
    />
  );
}
