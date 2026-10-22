import type { Metadata } from "next";
import AdminRequests from "@/components/dashboard/AdminRequests";

export const metadata: Metadata = { title: "طلبات الأدوية" };

export default function Page() {
  return <AdminRequests />;
}
