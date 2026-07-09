import Hero from "@/sections/Hero/Hero";
import Services from "@/sections/Services/Services";
import Devices from "@/sections/Devices/Devices";
import BoardRepair from "@/sections/BoardRepair/BoardRepair";
import WhyUs from "@/sections/WhyUs/WhyUs";
import Process from "@/sections/Process/Process";
import BlogPreview from "@/sections/BlogPreview/BlogPreview";
import Contact from "@/sections/Contact/Contact";
import CTA from "@/sections/CTA/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Devices />
      <BoardRepair />
      <WhyUs />
      <Process />
      <BlogPreview />
      <Contact />
      <CTA />
    </>
  );
}