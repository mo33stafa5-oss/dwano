import type { Metadata } from "next";
import AdminOverview from "@/components/dashboard/AdminOverview";

export const metadata: Metadata = { title: "لوحة المشرف" };

export default function Page() {
  return <AdminOverview />;
}
