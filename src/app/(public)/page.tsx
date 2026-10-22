import Hero from "@/components/hero/Hero";
import IntroCurtain from "@/components/animations/IntroCurtain";
import ProductPreview from "@/components/home/ProductPreview";
import Problem from "@/components/home/Problem";
import HowItWorks from "@/components/home/HowItWorks";
import PatientBenefits from "@/components/home/PatientBenefits";
import PharmacyBenefits from "@/components/home/PharmacyBenefits";
import Coverage from "@/components/home/Coverage";
import Faq from "@/components/home/Faq";
import FinalCta from "@/components/home/FinalCta";

export default function HomePage() {
  return (
    <>
      <IntroCurtain />
      <Hero />
      <ProductPreview />
      <Problem />
      <HowItWorks />
      <PatientBenefits />
      <PharmacyBenefits />
      <Coverage />
      <Faq />
      <FinalCta />
    </>
  );
}
