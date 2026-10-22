import { Suspense } from "react";
import type { Metadata } from "next";
import MedicineRequestExperience from "@/components/search/MedicineRequestExperience";

export const metadata: Metadata = {
  title: "ابحث عن دواء",
  description: "اكتب اسم دواءك وسجّل طلبك.",
};

function SearchFallback() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <div className="skeleton h-10 w-56" />
      <div className="skeleton mt-6 h-20 !rounded-[1.75rem]" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-44 !rounded-[1.75rem]" />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <MedicineRequestExperience />
    </Suspense>
  );
}
