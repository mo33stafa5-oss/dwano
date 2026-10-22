import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MedicineDetail from "@/components/pharmacy/MedicineDetail";
import { getMedicine, medicines } from "@/data/medicines";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return medicines.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = getMedicine(id);
  return { title: m ? `${m.nameAr} — ${m.strength}` : "دواء غير موجود" };
}

export default async function MedicinePage({ params }: Props) {
  const { id } = await params;
  const medicine = getMedicine(id);
  if (!medicine) notFound();
  return <MedicineDetail medicine={medicine} />;
}
