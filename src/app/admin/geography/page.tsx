import type { Metadata } from "next";
import AdminGeography from "@/components/dashboard/AdminGeography";

export const metadata: Metadata = { title: "الجغرافيا" };

export default function Page() {
  return <AdminGeography />;
}
