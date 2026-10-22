import type { Metadata } from "next";
import AdminSettings from "@/components/dashboard/AdminSettings";

export const metadata: Metadata = { title: "إعدادات المنصة" };

export default function Page() {
  return <AdminSettings />;
}
