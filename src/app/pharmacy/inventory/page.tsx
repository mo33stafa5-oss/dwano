import type { Metadata } from "next";
import InventoryManager from "@/components/dashboard/InventoryManager";

export const metadata: Metadata = { title: "المخزون" };

export default function InventoryPage() {
  return <InventoryManager />;
}
