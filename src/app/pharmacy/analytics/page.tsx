import type { Metadata } from "next";
import PharmacyAnalytics from "@/components/dashboard/PharmacyAnalytics";

export const metadata: Metadata = { title: "التحليلات" };

export default function AnalyticsPage() {
  return <PharmacyAnalytics />;
}
