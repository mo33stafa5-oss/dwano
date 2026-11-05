import type { Metadata } from "next";
import AdminWarehouses from "@/components/admin/AdminWarehouses";

export const metadata: Metadata = { title: "المخازن" };

export default function Page() {
  return <AdminWarehouses />;
}
