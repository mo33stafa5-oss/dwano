import type { Metadata } from "next";
import PharmacySettings from "@/components/dashboard/PharmacySettings";

export const metadata: Metadata = { title: "الإعدادات" };

export default function SettingsPage() {
  return <PharmacySettings />;
}
