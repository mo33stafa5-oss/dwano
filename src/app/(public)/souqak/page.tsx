import type { Metadata } from "next";
import SouqakStore from "@/components/souqak/SouqakStore";

export const metadata: Metadata = { title: "سوقك", description: "منتجات العناية والتجميل من صيدليات الفيوم المعتمدة." };

export default function SouqakPage() {
  return <SouqakStore />;
}
