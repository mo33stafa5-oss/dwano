import type { Metadata } from "next";
import WarehouseMedicines from "@/components/warehouse/WarehouseMedicines";

export const metadata: Metadata = { title: "أدوية المخزن" };

export default function Page() {
  return <WarehouseMedicines />;
}
