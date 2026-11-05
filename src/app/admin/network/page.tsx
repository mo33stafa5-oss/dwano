import type { Metadata } from "next";
import AdminNetwork from "@/components/admin/AdminNetwork";

export const metadata: Metadata = { title: "الصيدليات المسجلة" };

export default function Page() {
  return <AdminNetwork />;
}
