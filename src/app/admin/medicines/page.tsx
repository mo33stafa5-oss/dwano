import type { Metadata } from "next";
import AdminMedicines from "@/components/dashboard/AdminMedicines";

export const metadata: Metadata = { title: "فهرس الأدوية" };

export default function Page() {
  return <AdminMedicines />;
}
