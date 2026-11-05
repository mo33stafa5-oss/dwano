import type { Metadata } from "next";
import AdminOperations from "@/components/admin/AdminOperations";

export const metadata: Metadata = { title: "العمليات اليومية" };

export default function Page() {
  return <AdminOperations />;
}
