import type { Metadata } from "next";
import PharmacyOrders from "@/components/pharmacy/PharmacyOrders";

export const metadata: Metadata = { title: "طلبات سوقك" };

export default function Page() {
  return <PharmacyOrders />;
}
