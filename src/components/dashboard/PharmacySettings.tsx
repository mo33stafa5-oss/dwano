"use client";

import { useState } from "react";
import { PageHeader, Panel, Toggle } from "./ui";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LangSwitch from "@/components/shared/LangSwitch";
import { useDashStore } from "@/store/pharmacyDash";
import { toast } from "@/store/toast";

export default function PharmacySettings() {
  const { settings, setSettings } = useDashStore();
  const [reset, setReset] = useState(false);

  return (
    <>
      <PageHeader title="الإعدادات" subtitle="تُحفظ تلقائيًا في متصفحك (ديمو)." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="الإشعارات">
          <div className="divide-y divide-navy/5">
            <Toggle checked={settings.staleReminders} onChange={(v) => setSettings({ staleReminders: v })} label="تذكير بالبيانات القديمة" hint="تنبيه عند مرور ٧٢ ساعة بدون تحديث." />
            <Toggle checked={settings.lowStockAlerts} onChange={(v) => setSettings({ lowStockAlerts: v })} label="تنبيهات الكميات المحدودة" />
            <Toggle checked={settings.weeklyDigest} onChange={(v) => setSettings({ weeklyDigest: v })} label="ملخص أسبوعي" hint="مجرد تفضيل تجريبي، لا يتم إرسال بريد فعلي." />
          </div>
        </Panel>
        <Panel title="ما يراه العملاء">
          <div className="divide-y divide-navy/5">
            <Toggle checked={settings.showPhone} onChange={(v) => setSettings({ showPhone: v })} label="إظهار زر الاتصال" />
            <Toggle checked={settings.showWhatsapp} onChange={(v) => setSettings({ showWhatsapp: v })} label="إظهار زر واتساب" />
          </div>
        </Panel>
        <Panel title="اللغة">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">اللغة والاتجاه (عربي RTL / English LTR)</p>
            <LangSwitch className="border border-navy/10" />
          </div>
        </Panel>
        <Panel title="بيانات الديمو">
          <p className="text-sm font-medium leading-loose text-muted">كل بيانات اللوحة محفوظة في متصفحك فقط. يمكنك مسحها وإعادة البدء من البيانات الأصلية.</p>
          <button type="button" onClick={() => setReset(true)} className="btn mt-4 bg-rose-50 text-rose-700 hover:bg-rose-100">
            مسح بيانات اللوحة
          </button>
        </Panel>
      </div>
      <ConfirmDialog
        open={reset}
        title="مسح بيانات اللوحة؟"
        message="سيتم حذف المخزون والفروع والإعدادات المحفوظة وإعادة تحميل الصفحة."
        confirmLabel="مسح"
        danger
        onClose={() => setReset(false)}
        onConfirm={() => {
          localStorage.removeItem("dwano-pharmacy-dash");
          toast("تم المسح. جاري إعادة التحميل…", "success");
          setTimeout(() => window.location.reload(), 600);
        }}
      />
    </>
  );
}
