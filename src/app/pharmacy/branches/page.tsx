import type { Metadata } from "next";
import BranchManager from "@/components/dashboard/BranchManager";

export const metadata: Metadata = { title: "الفروع" };

export default function BranchesPage() {
  return <BranchManager />;
}
