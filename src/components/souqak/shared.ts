export const CATEGORIES = [
  { id: "cosmetics", label: "مستحضرات التجميل" },
  { id: "skincare", label: "العناية بالبشرة" },
  { id: "haircare", label: "العناية بالشعر" },
  { id: "personal_care", label: "العناية الشخصية" },
] as const;
export const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
export const money = (n: number) => `${Number(n).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;
export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  pharmacy: { id: string; name: string; phone: string; district: string; area: string };
}
