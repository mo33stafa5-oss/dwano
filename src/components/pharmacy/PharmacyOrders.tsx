"use client";

import { useCallback, useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import { money } from "@/components/souqak/shared";
import { api, errMsg } from "@/lib/api";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";
import { GateNotice, PharmacyPage } from "./Gate";

interface Order {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  customerName: string;
  phone: string;
  address: string;
  notes: string | null;
  status: "new" | "confirmed" | "delivered" | "cancelled";
  createdAt: string;
}
const LABEL = { new: "جديد", confirmed: "مؤكد", delivered: "تم التسليم", cancelled: "ملغي" } as const;
const TONE = { new: "bg-sky-50 text-sky-700", confirmed: "bg-brand-mint text-brand-deep", delivered: "bg-emerald-50 text-emerald-700", cancelled: "bg-rose-50 text-rose-700" } as const;

export default function PharmacyOrders() {
  return (
    <PharmacyPage>
      <Inner />
    </PharmacyPage>
  );
}

function Inner() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [gate, setGate] = useState<string>();
  const load = useCallback(async () => {
    const r = await api<{ orders: Order[] }>("/api/pharmacy/orders");
    if (r.ok) (setOrders(r.data.orders), setGate(undefined));
    else (setOrders([]), setGate(r.error));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const move = async (o: Order, status: string) => {
    const r = await api(`/api/pharmacy/orders/${o.id}`, { method: "PATCH", json: { status } });
    if (!r.ok) toast(errMsg(r.error));
    load();
  };

  return (
    <>
      <PageHeader title="طلبات سوقك" subtitle="تأكيد الطلب يحجز الكمية من المخزون، وإلغاء الطلب المؤكد يعيدها." />
      <GateNotice error={gate} />
      {orders === null ? (
        <div className="skeleton h-48 !rounded-[1.5rem]" />
      ) : orders.length === 0 ? (
        !gate && <EmptyState title="لا توجد طلبات" text="ستظهر هنا طلبات العملاء على منتجاتك." />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Panel key={o.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black">{o.productName} × {o.quantity.toLocaleString("ar-EG")}</p>
                  <p dir="ltr" className="text-start font-mono text-xs font-bold text-muted">{o.id}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-extrabold", TONE[o.status])}>{LABEL[o.status]}</span>
              </div>
              <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                <div className="font-extrabold">{o.customerName}</div>
                <a href={`tel:${o.phone}`} className="flex items-center gap-2 text-brand"><Phone className="size-4" /><span dir="ltr">{o.phone}</span></a>
                <div className="text-muted sm:col-span-2">{o.address}</div>
                {o.notes && <div className="text-muted sm:col-span-2">ملاحظات: {o.notes}</div>}
                <div className="font-black text-brand-deep">الإجمالي {money(o.unitPrice * o.quantity)}</div>
              </dl>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-navy/5 pt-3">
                <p className="text-[11px] font-semibold text-muted">{new Date(o.createdAt).toLocaleString("ar-EG")}</p>
                <div className="flex gap-2">
                  {o.status === "new" && <button type="button" onClick={() => move(o, "confirmed")} className="btn-primary !py-1.5 text-xs">تأكيد</button>}
                  {o.status === "confirmed" && <button type="button" onClick={() => move(o, "delivered")} className="btn-primary !py-1.5 text-xs">تم التسليم</button>}
                  {(o.status === "new" || o.status === "confirmed") && <button type="button" onClick={() => move(o, "cancelled")} className="btn-light !py-1.5 text-xs text-rose-600">إلغاء</button>}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
