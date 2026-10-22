import type { Metadata } from "next";
import Faq from "@/components/home/Faq";
import FinalCta from "@/components/home/FinalCta";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description: "إجابات واضحة عن دوانو، توافر الأدوية، وتسجيل الصيدليات.",
};

export default function FaqPage() {
  return (
    <>
      <div className="pt-16">
        <Faq />
      </div>
      <FinalCta />
    </>
  );
}
