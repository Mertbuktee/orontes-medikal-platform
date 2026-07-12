import type { Metadata } from "next";

import LegalPage from "@/components/common/LegalPage";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | Orontes Teknoloji",
  description:
    "Orontes Teknoloji servis talep ve iletişim süreçleri için KVKK aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <LegalPage
      eyebrow="KVKK"
      title="KVKK Aydınlatma Metni"
      description="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, web sitesi ve servis talebi süreçlerinde işlenen kişisel verilere ilişkin bilgilendirme metnidir."
      sections={[
        {
          title: "Veri Sorumlusu",
          paragraphs: [
            "Kişisel verileriniz, Orontes İnovasyon Endüstriyel Ürünler Sanayi Ticaret Ltd. Şti. tarafından KVKK ve ilgili mevzuata uygun şekilde işlenmektedir.",
          ],
        },
        {
          title: "İşlenen Kişisel Veriler",
          items: [
            "Kimlik ve iletişim bilgileri: ad soyad, telefon, e-posta.",
            "Kurumsal bilgiler: firma veya hastane adı.",
            "Servis bilgileri: cihaz marka, model, seri numarası, arıza açıklaması ve kullanıcı tarafından iletilen dosyalar.",
            "Teknik bilgiler: çerez tercihleri, güvenlik ve form kötüye kullanımını önlemeye yönelik sınırlı işlem kayıtları.",
          ],
        },
        {
          title: "İşleme Amaçları",
          items: [
            "Servis talebi oluşturmak, değerlendirmek ve sonuçlandırmak.",
            "Teknik destek, arıza analizi, bakım ve onarım süreçlerini yürütmek.",
            "Kullanıcıyla iletişime geçmek ve talep geçmişini yönetmek.",
            "Hukuki yükümlülükleri yerine getirmek ve web sitesi güvenliğini sağlamak.",
          ],
        },
        {
          title: "Hukuki Sebepler",
          paragraphs: [
            "Kişisel veriler; sözleşmenin kurulması veya ifası, hukuki yükümlülüklerin yerine getirilmesi, meşru menfaat ve gerekli hallerde açık rıza hukuki sebeplerine dayanarak işlenebilir.",
          ],
        },
        {
          title: "Aktarım",
          paragraphs: [
            "Kişisel veriler, hizmetin yürütülmesi için zorunlu olduğu ölçüde altyapı sağlayıcıları, teknik hizmet sağlayıcıları ve yetkili kamu kurumları ile paylaşılabilir.",
          ],
        },
        {
          title: "Haklarınız",
          items: [
            "Kişisel verilerinizin işlenip işlenmediğini öğrenme.",
            "İşlenmişse buna ilişkin bilgi talep etme.",
            "Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme.",
            "Mevzuatta öngörülen şartlarda silme veya yok edilmesini talep etme.",
            "İşleme faaliyetlerine itiraz etme ve zarar oluşması halinde tazmin talep etme.",
          ],
        },
        {
          title: "Başvuru",
          paragraphs: [
            "KVKK kapsamındaki taleplerinizi info@orontesteknoloji.com adresi üzerinden bize iletebilirsiniz. Başvurular mevzuatta öngörülen süreler içinde değerlendirilir.",
          ],
        },
      ]}
    />
  );
}
