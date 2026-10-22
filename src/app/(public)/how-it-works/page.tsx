import type { Metadata } from "next";
import HowItWorks from "@/components/home/HowItWorks";
import FinalCta from "@/components/home/FinalCta";

export const metadata: Metadata = {
  title: "كيف تعمل دوانو",
  description: "ثلاث خطوات: ابحث عن الدواء، اعرف الصيدليات اللي أعلنت توفره، وتواصل معها.",
};

export default function HowItWorksPage() {
  return (
    <>
      <div className="pt-16">
        <HowItWorks />
      </div>
      <FinalCta />
    </>
  );
}
