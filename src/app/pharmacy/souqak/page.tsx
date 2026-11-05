import type { Metadata } from "next";
import PharmacySouqak from "@/components/pharmacy/PharmacySouqak";

export const metadata: Metadata = { title: "منتجات سوقك" };

export default function Page() {
  return <PharmacySouqak />;
}
