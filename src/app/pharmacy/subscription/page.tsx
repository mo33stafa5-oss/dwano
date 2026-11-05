import type { Metadata } from "next";
import PharmacySubscription from "@/components/pharmacy/PharmacySubscription";

export const metadata: Metadata = { title: "اشتراكي" };

export default function Page() {
  return <PharmacySubscription />;
}
