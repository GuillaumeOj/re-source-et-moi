import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Approche } from "@/components/sections/Approche";
import { Ateliers } from "@/components/sections/Ateliers";
import { BrainGym } from "@/components/sections/BrainGym";
import { Contact } from "@/components/sections/Contact";
import { Faq } from "@/components/sections/Faq";
import { Fondatrice } from "@/components/sections/Fondatrice";
import { Hero } from "@/components/sections/Hero";
import { Newsletter } from "@/components/sections/Newsletter";
import { Temoignages } from "@/components/sections/Temoignages";

export default function HomePage() {
  return (
    <>
      <Header />
      <StepIndicator />
      <main>
        <Hero />
        <BrainGym />
        <Approche />
        <Ateliers />
        <Fondatrice />
        <Temoignages />
        <Faq />
        <Newsletter />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
