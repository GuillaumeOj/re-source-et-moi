import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Approach } from "@/components/sections/Approach";
import { BrainGym } from "@/components/sections/BrainGym";
import { Contact } from "@/components/sections/Contact";
import { Faq } from "@/components/sections/Faq";
import { Founder } from "@/components/sections/Founder";
import { Hero } from "@/components/sections/Hero";
import { Newsletter } from "@/components/sections/Newsletter";
import { Testimonials } from "@/components/sections/Testimonials";
import { Workshops } from "@/components/sections/Workshops";

export default function HomePage() {
  return (
    <>
      <Header />
      <StepIndicator />
      <main>
        <Hero />
        <BrainGym />
        <Approach />
        <Workshops />
        <Founder />
        <Testimonials />
        <Faq />
        <Newsletter />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
