import type { Metadata } from "next";
import PharmacyWarehouses from "@/components/pharmacy/PharmacyWarehouses";

export const metadata: Metadata = { title: "بحث المخازن" };

export default function Page() {
  return <PharmacyWarehouses />;
}
