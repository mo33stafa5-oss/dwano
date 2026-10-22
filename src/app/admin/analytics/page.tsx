import type { Metadata } from "next";
import AdminAnalytics from "@/components/dashboard/AdminAnalytics";

export const metadata: Metadata = { title: "تحليلات المنصة" };

export default function Page() {
  return <AdminAnalytics />;
}
