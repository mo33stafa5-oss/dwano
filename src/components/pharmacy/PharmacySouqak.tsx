"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, ShoppingBag } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { EmptyState, PageHeader, Panel, Toggle } from "@/components/dashboard/ui";
import { FieldError } from "@/components/shared/ContactForm";
import { CATEGORIES, catLabel, money, type Product } from "@/components/souqak/shared";
import { api, errMsg } from "@/lib/api";
import { toast } from "@/store/toast";
import { GateNotice, PharmacyPage } from "./Gate";

interface Mine extends Omit<Product, "pharmacy"> {
  isActive: boolean;
}
const EMPTY = { name: "", description: "", category: "skincare", price: "", quantity: "0", isActive: true };

export default function PharmacySouqak() {
  return (
    <PharmacyPage>
      <Inner />
    </PharmacyPage>
  );
}

function Inner() {
  const [items, setItems] = useState<Mine[] | null>(null);
  const [gate, setGate] = useState<string>();
  const [edit, setEdit] = useState<Mine | "new" | null>(null);

  const load = useCallback(async () => {
    const r = await api<{ products: Mine[] }>("/api/pharmacy/products");
    if (r.ok) (setItems(r.data.products), setGate(undefined));
    else (setItems([]), setGate(r.error));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (p: Mine, isActive: boolean) => {
    const r = await api(`/api/pharmacy/products/${p.id}`, { method: "PATCH", json: { isActive } });
    if (!r.ok) return toast(errMsg(r.error));
    load();
  };

  return (
    <>
      <PageHeader
        title="منتجات سوقك"
        subtitle="أضف منتجات العناية والتجميل وتحكم في ظهورها للعملاء."
        actions={!gate && <button type="button" onClick={() => setEdit("new")} className="btn-primary !py-2 text-sm"><Plus className="size-4" /> منتج جديد</button>}
      />
      <GateNotice error={gate} />
      {items === null ? (
        <div className="skeleton h-48 !rounded-[1.5rem]" />
      ) : items.length === 0 ? (
        !gate && <EmptyState title="لا توجد منتجات بعد" text="أضف أول منتج ليظهر في صفحة سوقك العامة." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <Panel key={p.id}>
              <div className="flex gap-3">
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-ice">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="size-full object-cover" />
                  ) : (
                    <ShoppingBag className="size-6 text-brand/40" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-black">{p.name}</p>
                  <p className="text-xs font-semibold text-muted">{catLabel(p.category)}</p>
                  <p className="mt-1 text-sm font-black text-brand-deep">{money(p.price)} · {p.quantity.toLocaleString("ar-EG")} قطعة</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-navy/5 pt-3">
                <Toggle checked={p.isActive} onChange={(v) => toggle(p, v)} label={p.isActive ? "ظاهر للعملاء" : "مخفي"} />
                <button type="button" onClick={() => setEdit(p)} className="btn-light !py-1.5 text-xs">تعديل</button>
              </div>
            </Panel>
          ))}
        </div>
      )}
      {edit && <ProductForm product={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSaved={() => (setEdit(null), load())} />}
    </>
  );
}

function ProductForm({ product, onClose, onSaved }: { product: Mine | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(
    product ? { name: product.name, description: product.description ?? "", category: product.category, price: String(product.price), quantity: String(product.quantity), isActive: product.isActive } : EMPTY
  );
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "اكتب اسم المنتج";
    const price = Number(f.price);
    if (!(price > 0)) er.price = "اكتب سعرًا صحيحًا";
    const quantity = Number(f.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) er.quantity = "كمية غير صحيحة";
    if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) er.image = "JPG أو PNG أو WEBP فقط";
    if (file && file.size > 3 * 1024 * 1024) er.image = "الحد الأقصى ٣ ميجابايت";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.set("data", JSON.stringify({ name: f.name.trim(), description: f.description.trim(), category: f.category, price, quantity, isActive: f.isActive }));
    if (file) fd.set("image", file);
    const r = await api(product ? `/api/pharmacy/products/${product.id}` : "/api/pharmacy/products", { method: product ? "PATCH" : "POST", body: fd });
    setBusy(false);
    if (r.ok) return (toast("تم الحفظ.", "success"), onSaved());
    setErr(errMsg(r.error));
  };

  return (
    <Modal open onClose={onClose} title={product ? "تعديل المنتج" : "منتج جديد"} size="md">
      <form onSubmit={submit} noValidate className="space-y-3">
        <div>
          <label htmlFor="p-name" className="mb-1 block text-xs font-extrabold text-muted">اسم المنتج</label>
          <input id="p-name" className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <FieldError msg={errors.name} />
        </div>
        <div>
          <label htmlFor="p-desc" className="mb-1 block text-xs font-extrabold text-muted">الوصف</label>
          <textarea id="p-desc" rows={3} className="field" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="p-cat" className="mb-1 block text-xs font-extrabold text-muted">التصنيف</label>
            <select id="p-cat" className="field" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="p-price" className="mb-1 block text-xs font-extrabold text-muted">السعر (ج.م)</label>
            <input id="p-price" type="number" step="0.01" min="0" dir="ltr" className="field text-start" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
            <FieldError msg={errors.price} />
          </div>
          <div>
            <label htmlFor="p-qty" className="mb-1 block text-xs font-extrabold text-muted">الكمية</label>
            <input id="p-qty" type="number" min="0" dir="ltr" className="field text-start" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
            <FieldError msg={errors.quantity} />
          </div>
        </div>
        <div>
          <label htmlFor="p-img" className="mb-1 block text-xs font-extrabold text-muted">صورة المنتج {product?.imageUrl ? "(اتركها فارغة للإبقاء على الحالية)" : "(اختياري)"}</label>
          <input id="p-img" type="file" accept="image/jpeg,image/png,image/webp" className="field" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <FieldError msg={errors.image} />
        </div>
        <Toggle checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} label="ظاهر للعملاء" hint="يمكنك إخفاؤه مؤقتًا دون حذفه." />
        {err && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70">
          {busy && <Loader2 className="size-4 animate-spin" />} حفظ
        </button>
      </form>
    </Modal>
  );
}
