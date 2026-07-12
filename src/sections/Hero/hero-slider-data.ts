import type { HeroSlide } from "./hero-slider-types";

export const heroSlides = [
  {
    id: "electronic-board-repair",
    imageSrc: "/images/services/service-electronic-board.jpg",
    badge: "ELEKTRONİK KART ONARIMI",
    title: "Hassas Elektronik Kart Müdahaleleri",
    description:
      "Arıza tespiti, komponent değişimi, lehimleme ve fonksiyon testleri kontrollü şekilde uygulanır.",
    imageAlt:
      "Elektronik kart üzerinde teknik inceleme ve kontrollü onarım çalışması.",
    order: 1,
    isActive: true,
    includeInAutoplay: true,
    objectPosition: "center",
  },
  {
    id: "monitor-repair",
    imageSrc: "/images/services/service-monitor-repair.jpg",
    badge: "MEDİKAL CİHAZ SERVİSİ",
    title: "Hastabaşı Monitörü Teknik Servisi",
    description:
      "Ekran, güç, batarya, bağlantı ve ölçüm modülleri teknik olarak değerlendirilir.",
    imageAlt:
      "Hastabaşı monitörü üzerinde bakım, ölçüm ve teknik servis uygulaması.",
    order: 2,
    isActive: true,
    includeInAutoplay: true,
    objectPosition: "center",
  },
  {
    id: "ventilator-service",
    imageSrc: "/images/services/service-ventilator.jpg",
    badge: "SOLUNUM CİHAZLARI",
    title: "Ventilatör Bakım ve Onarım Süreçleri",
    description:
      "Elektronik, mekanik ve pnömatik bileşenler servis kapsamına göre incelenir.",
    imageAlt:
      "Ventilatör cihazında elektronik, mekanik ve fonksiyonel servis kontrolü.",
    order: 3,
    isActive: true,
    includeInAutoplay: true,
    objectPosition: "center",
  },
  {
    id: "measurement-and-testing",
    imageSrc: "/images/services/service-measurement.jpg",
    badge: "TEST VE ÖLÇÜM",
    title: "Kontrollü Fonksiyon Testleri",
    description:
      "Onarım sonrasında cihaz ve kartlar uygun test ekipmanlarıyla doğrulanır.",
    imageAlt:
      "Medikal cihaz ve elektronik kart üzerinde test ve ölçüm uygulaması.",
    order: 4,
    isActive: true,
    includeInAutoplay: true,
    objectPosition: "center",
  },
  {
    id: "technical-workshop",
    imageSrc: "/images/services/service-workshop.jpg",
    badge: "TEKNİK ATÖLYE",
    title: "Profesyonel Servis Altyapısı",
    description:
      "Servis işlemleri uygun ekipman, kontrollü çalışma alanı ve planlı teknik adımlarla yürütülür.",
    imageAlt:
      "Medikal cihaz teknik servis işlemlerinin yürütüldüğü profesyonel atölye ortamı.",
    order: 5,
    isActive: true,
    includeInAutoplay: true,
    objectPosition: "center",
  },
] satisfies HeroSlide[];
