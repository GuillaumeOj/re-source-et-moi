import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { BrainGym } from "@/components/sections/BrainGym";
import { Contact } from "@/components/sections/Contact";
import { Founder } from "@/components/sections/Founder";
import { Hero } from "@/components/sections/Hero";
import { Objet } from "@/components/sections/Objet";
import { SoiEnMouvement } from "@/components/sections/SoiEnMouvement";
import { Testimonials } from "@/components/sections/Testimonials";
import { Workshops } from "@/components/sections/Workshops";

export default function HomePage() {
  return (
    <>
      <Header />
      <StepIndicator />
      <main>
        <Hero />
        <Objet />
        <BrainGym />
        <SoiEnMouvement />
        <Workshops />
        <Founder />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
