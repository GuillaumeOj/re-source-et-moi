import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Approach } from "@/components/sections/Approach";
import { Contact } from "@/components/sections/Contact";
import { EducationKinesthesique } from "@/components/sections/EducationKinesthesique";
import { Faq } from "@/components/sections/Faq";
import { Founder } from "@/components/sections/Founder";
import { Hero } from "@/components/sections/Hero";
import { Objet } from "@/components/sections/Objet";
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
        <EducationKinesthesique />
        <Approach />
        <Workshops />
        <Founder />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
