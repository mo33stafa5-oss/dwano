"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Phone, Search, ShoppingBag, Store } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { FieldError } from "@/components/shared/ContactForm";
import { EmptyState } from "@/components/dashboard/ui";
import { api, errMsg } from "@/lib/api";
import { normalizeEgPhone } from "@/lib/requests";
import { cn } from "@/lib/utils";
import { CATEGORIES, catLabel, money, type Product } from "./shared";

export default function SouqakStore() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Product | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (cat) sp.set("category", cat);
      const r = await api<{ products: Product[] }>(`/api/souqak/products?${sp}`);
      if (r.ok) (setItems(r.data.products), setError(""));
      else (setItems([]), setError(errMsg(r.error)));
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat]);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-mint text-brand-deep"><ShoppingBag className="size-6" /></span>
        <div>
          <h1 className="text-3xl font-black">سوقك</h1>
          <p className="mt-1 text-sm font-medium text-muted">منتجات العناية والتجميل من صيدليات الفيوم المعتمدة. اطلب المنتج وتتواصل معك الصيدلية للتسليم والدفع عند الاستلام.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-brand" />
          <label htmlFor="sq-q" className="sr-only">ابحث عن منتج</label>
          <input id="sq-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج…" className="field !ps-11" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="التصنيف">
        {[{ id: "", label: "الكل" }, ...CATEGORIES].map((c) => (
          <button key={c.id} type="button" onClick={() => setCat(c.id)} aria-pressed={cat === c.id} className={cn("rounded-full border px-4 py-1.5 text-xs font-extrabold transition", cat === c.id ? "border-brand bg-brand text-white" : "border-navy/10 bg-white text-muted hover:text-navy")}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {items === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-72 !rounded-[1.75rem]" />)}</div>
        ) : error ? (
          <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</p>
        ) : items.length === 0 ? (
          <EmptyState title="لا توجد منتجات مطابقة" text="جرّب كلمة بحث أخرى أو تصنيفًا مختلفًا." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-[1.75rem] border border-navy/[0.07] bg-white shadow-soft">
                <button type="button" onClick={() => setOpen(p)} className="block w-full text-start">
                  <div className="grid aspect-[4/3] place-items-center bg-ice">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} loading="lazy" className="size-full object-cover" />
                    ) : (
                      <ShoppingBag className="size-10 text-brand/40" />
                    )}
                  </div>
                  <div className="p-4">
                    <span className="rounded-full bg-brand-mint px-2.5 py-0.5 text-[11px] font-extrabold text-brand-deep">{catLabel(p.category)}</span>
                    <p className="mt-2 line-clamp-1 text-base font-black">{p.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted"><Store className="size-3.5" /> {p.pharmacy.name}</p>
                    <p className="mt-3 text-lg font-black text-brand-deep">{money(p.price)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {open && <ProductModal product={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ProductModal({ product: p, onClose }: { product: Product; onClose: () => void }) {
  const [form, setForm] = useState({ customerName: "", phone: "", address: "", notes: "", quantity: 1 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [orderId, setOrderId] = useState("");
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (form.customerName.trim().length < 2) er.customerName = "اكتب اسمك";
    const phone = normalizeEgPhone(form.phone);
    if (!/^01[0125]\d{8}$/.test(phone)) er.phone = "اكتب رقم موبايل مصري صحيحًا";
    if (form.address.trim().length < 3) er.address = "اكتب عنوان التسليم";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    setErr("");
    const r = await api<{ id: string }>("/api/souqak/orders", { method: "POST", json: { productId: p.id, quantity: form.quantity, customerName: form.customerName.trim(), phone, address: form.address.trim(), notes: form.notes.trim() || undefined } });
    setBusy(false);
    if (r.ok) return setOrderId(r.data.id);
    setErr(errMsg(r.error));
  };

  return (
    <Modal open onClose={onClose} title={p.name} description={`${catLabel(p.category)} · ${p.pharmacy.name}`} size="md">
      {orderId ? (
        <div className="py-4 text-center" role="status">
          <CheckCircle2 className="mx-auto size-12 text-brand" />
          <p className="mt-3 text-lg font-black">تم تسجيل طلبك</p>
          <p className="mt-1 text-sm font-medium text-muted">رقم الطلب: <b dir="ltr" className="font-mono">{orderId}</b></p>
          <p className="mx-auto mt-2 max-w-sm text-xs font-semibold leading-relaxed text-muted">الطلب لم يُؤكَّد بعد. ستتواصل معك الصيدلية لتأكيده وترتيب التسليم والدفع عند الاستلام.</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-3">
          {p.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} className="max-h-56 w-full rounded-2xl object-cover" />
          )}
          {p.description && <p className="text-sm font-medium leading-relaxed text-muted">{p.description}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ice p-3 text-sm">
            <span className="text-lg font-black text-brand-deep">{money(p.price)}</span>
            <span className="flex items-center gap-1 text-xs font-bold text-muted"><MapPin className="size-3.5" /> {[p.pharmacy.district, p.pharmacy.area].filter(Boolean).join(" - ") || p.pharmacy.name}</span>
            <a href={`tel:${p.pharmacy.phone}`} className="flex items-center gap-1 text-xs font-extrabold text-brand"><Phone className="size-3.5" /> <span dir="ltr">{p.pharmacy.phone}</span></a>
          </div>
          <div>
            <label htmlFor="o-name" className="mb-1 block text-xs font-extrabold text-muted">الاسم</label>
            <input id="o-name" className={cn("field", errors.customerName && "!border-rose-400")} value={form.customerName} onChange={(e) => set("customerName", e.target.value)} autoComplete="name" />
            <FieldError msg={errors.customerName} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="o-phone" className="mb-1 block text-xs font-extrabold text-muted">رقم الموبايل</label>
              <input id="o-phone" dir="ltr" inputMode="tel" className={cn("field text-start", errors.phone && "!border-rose-400")} value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
              <FieldError msg={errors.phone} />
            </div>
            <div>
              <label htmlFor="o-qty" className="mb-1 block text-xs font-extrabold text-muted">الكمية (المتاح {p.quantity.toLocaleString("ar-EG")})</label>
              <input id="o-qty" type="number" min={1} max={Math.min(20, p.quantity)} className="field" value={form.quantity} onChange={(e) => set("quantity", Math.max(1, Math.min(Math.min(20, p.quantity), Number(e.target.value) || 1)))} />
            </div>
          </div>
          <div>
            <label htmlFor="o-addr" className="mb-1 block text-xs font-extrabold text-muted">عنوان التسليم</label>
            <input id="o-addr" className={cn("field", errors.address && "!border-rose-400")} value={form.address} onChange={(e) => set("address", e.target.value)} />
            <FieldError msg={errors.address} />
          </div>
          <div>
            <label htmlFor="o-notes" className="mb-1 block text-xs font-extrabold text-muted">ملاحظات (اختياري)</label>
            <input id="o-notes" className="field" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          {err && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{err}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70">
            {busy && <Loader2 className="size-4 animate-spin" />} إرسال الطلب · الإجمالي {money(p.price * form.quantity)}
          </button>
          <p className="text-center text-[11px] font-semibold text-muted">لا يوجد دفع إلكتروني. الدفع عند الاستلام باتفاقك مع الصيدلية.</p>
        </form>
      )}
    </Modal>
  );
}
