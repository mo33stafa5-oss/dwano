import type { Metadata } from "next";
import PharmacyProfileEditor from "@/components/dashboard/PharmacyProfileEditor";

export const metadata: Metadata = { title: "ملف الصيدلية" };

export default function ProfilePage() {
  return <PharmacyProfileEditor />;
}
