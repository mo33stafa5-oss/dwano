import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PharmacyProfile from "@/components/pharmacy/PharmacyProfile";
import { getPharmacy, pharmacies } from "@/data/pharmacies";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return pharmacies.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = getPharmacy(id);
  return { title: p ? `${p.nameAr} (بيانات تجريبية)` : "صيدلية غير موجودة" };
}

export default async function PharmacyPage({ params }: Props) {
  const { id } = await params;
  const pharmacy = getPharmacy(id);
  if (!pharmacy) notFound();
  return <PharmacyProfile pharmacy={pharmacy} />;
}
