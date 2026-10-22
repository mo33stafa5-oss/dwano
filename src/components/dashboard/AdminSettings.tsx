"use client";

import { PageHeader, Panel, Toggle } from "./ui";
import { useAdminStore } from "@/store/adminDash";
import { demoUsers, type DemoRole } from "@/data/users";
import { toast } from "@/store/toast";

const ROLE_LABEL: Record<DemoRole, string> = { patient: "مستخدم", pharmacy: "صيدلية", admin: "مشرف" };

export default function AdminSettings() {
  const { settings, setSettings, roles, setRole } = useAdminStore();
  return (
    <>
      <PageHeader title="إعدادات المنصة" subtitle="إعدادات تجريبية تُحفظ في متصفحك." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="عام">
          <div className="divide-y divide-navy/5">
            <Toggle checked={settings.verifyNewPharmacies} onChange={(v) => setSettings({ verifyNewPharmacies: v })} label="مراجعة الصيدليات الجديدة" hint="الطلبات الجديدة تبقى «قيد المراجعة» حتى اعتمادها." />
            <Toggle checked={settings.showDemoBanner} onChange={(v) => setSettings({ showDemoBanner: v })} label="إظهار شارة «نسخة تجريبية»" />
            <Toggle checked={settings.maintenance} onChange={(v) => (setSettings({ maintenance: v }), toast(v ? "وضع الصيانة مفعّل (تجريبي، لا يؤثر على الموقع)." : "تم إيقاف وضع الصيانة."))} label="وضع الصيانة" hint="مجرد مفتاح تجريبي." />
          </div>
          <div className="mt-4 border-t border-navy/5 pt-4">
            <label htmlFor="stale" className="text-sm font-extrabold">
              اعتبار البيانات قديمة بعد (ساعة)
            </label>
            <input
              id="stale"
              type="number"
              min={12}
              max={240}
              value={settings.staleAfterHours}
              onChange={(e) => setSettings({ staleAfterHours: Math.min(240, Math.max(12, Number(e.target.value) || 72)) })}
              className="field mt-2 !w-32"
            />
            <p className="mt-2 text-xs font-medium text-muted">القيمة المعروضة للموقع العام ثابتة على ٧٢ ساعة في هذا الديمو.</p>
          </div>
        </Panel>
        <Panel title="أدوار الحسابات التجريبية">
          <ul className="divide-y divide-navy/5">
            {demoUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm font-extrabold">{u.name}</span>
                <select aria-label={`دور ${u.name}`} value={roles[u.id] ?? u.role} onChange={(e) => setRole(u.id, e.target.value as DemoRole)} className="field !w-auto !py-1.5 text-sm">
                  {(Object.keys(ROLE_LABEL) as DemoRole[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-medium leading-relaxed text-muted">لا توجد كلمات مرور ولا حسابات حقيقية. تسجيل الدخول محاكاة بالكامل.</p>
        </Panel>
      </div>
    </>
  );
}
