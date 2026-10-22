import type { Metadata } from "next";
import AdminPharmacies from "@/components/dashboard/AdminPharmacies";

export const metadata: Metadata = { title: "إدارة الصيدليات" };

export default function Page() {
  return <AdminPharmacies />;
}
