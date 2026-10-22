"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store } from "lucide-react";
import { FieldError } from "@/components/shared/ContactForm";
import { PageHeader, Panel } from "./ui";
import { useDashStore } from "@/store/pharmacyDash";
import { areasOfDistrict, districts } from "@/data/locations";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(3, "اسم الصيدلية ٣ أحرف على الأقل"),
  owner: z.string().trim().min(3, "اكتب اسم المالك"),
  phone: z.string().trim().regex(/^01[0125]\d{8}$/, "اكتب رقم موبايل مصري صحيحًا"),
  whatsapp: z.string().trim().regex(/^01[0125]\d{8}$/, "اكتب رقم واتساب مصريًا صحيحًا"),
  address: z.string().trim().min(6, "اكتب العنوان بالتفصيل"),
  districtId: z.string().min(1, "اختر المركز"),
  areaId: z.string().min(1, "اختر المنطقة"),
  hours: z.string().trim().min(3, "اكتب مواعيد العمل"),
});
type Values = z.infer<typeof schema>;

const COVERS = [
  "linear-gradient(120deg,#075E57,#0B1E31)",
  "linear-gradient(120deg,#008F73,#102A43)",
  "linear-gradient(120deg,#0EA5E9,#075E57)",
  "linear-gradient(120deg,#102A43,#2BD9B0)",
];
const HUES = [150, 165, 180, 200, 215];

export default function PharmacyProfileEditor() {
  const { profile, setProfile } = useDashStore();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      owner: profile.owner,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      address: profile.address,
      districtId: profile.districtId,
      areaId: profile.areaId,
      hours: profile.hours,
    },
  });
  const districtId = watch("districtId");
  const areaOptions = useMemo(() => areasOfDistrict(districtId), [districtId]);

  const onSubmit = (v: Values) => {
    setProfile(v);
    toast("تم حفظ ملف الصيدلية.", "success");
  };

  return (
    <>
      <PageHeader title="ملف الصيدلية" subtitle="البيانات التي يراها العملاء في صفحة صيدليتك (تجريبية)." />
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="p-name" className="mb-1.5 block text-xs font-extrabold text-muted">
                  اسم الصيدلية
                </label>
                <input id="p-name" className={cn("field", errors.name && "!border-rose-400")} {...register("name")} />
                <FieldError msg={errors.name?.message} />
              </div>
              <div>
                <label htmlFor="p-owner" className="mb-1.5 block text-xs font-extrabold text-muted">
                  المالك
                </label>
                <input id="p-owner" className={cn("field", errors.owner && "!border-rose-400")} {...register("owner")} />
                <FieldError msg={errors.owner?.message} />
              </div>
              <div>
                <label htmlFor="p-phone" className="mb-1.5 block text-xs font-extrabold text-muted">
                  الهاتف
                </label>
                <input id="p-phone" dir="ltr" className={cn("field text-start", errors.phone && "!border-rose-400")} {...register("phone")} />
                <FieldError msg={errors.phone?.message} />
              </div>
              <div>
                <label htmlFor="p-wa" className="mb-1.5 block text-xs font-extrabold text-muted">
                  واتساب
                </label>
                <input id="p-wa" dir="ltr" className={cn("field text-start", errors.whatsapp && "!border-rose-400")} {...register("whatsapp")} />
                <FieldError msg={errors.whatsapp?.message} />
              </div>
              <div>
                <label htmlFor="p-d" className="mb-1.5 block text-xs font-extrabold text-muted">
                  المركز
                </label>
                <select id="p-d" className="field" {...register("districtId", { onChange: () => setValue("areaId", "") })}>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="p-a" className="mb-1.5 block text-xs font-extrabold text-muted">
                  المنطقة
                </label>
                <select id="p-a" className={cn("field", errors.areaId && "!border-rose-400")} {...register("areaId")}>
                  <option value="">اختر المنطقة</option>
                  {areaOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.shortAr}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.areaId?.message} />
              </div>
            </div>
            <div>
              <label htmlFor="p-addr" className="mb-1.5 block text-xs font-extrabold text-muted">
                العنوان
              </label>
              <input id="p-addr" className={cn("field", errors.address && "!border-rose-400")} {...register("address")} />
              <FieldError msg={errors.address?.message} />
            </div>
            <div>
              <label htmlFor="p-hours" className="mb-1.5 block text-xs font-extrabold text-muted">
                مواعيد العمل
              </label>
              <input id="p-hours" className={cn("field", errors.hours && "!border-rose-400")} {...register("hours")} />
              <FieldError msg={errors.hours?.message} />
            </div>
            <button type="submit" disabled={!isDirty} className="btn-primary disabled:opacity-50">
              حفظ التغييرات
            </button>
          </form>
        </Panel>

        <div className="space-y-5">
          <Panel title="الشعار والغلاف">
            <div className="overflow-hidden rounded-2xl border border-navy/10">
              <div className="h-24" style={{ background: COVERS[profile.coverIdx] }} />
              <div className="relative bg-white px-4 pb-4">
                <span
                  className="-mt-7 grid size-14 place-items-center rounded-2xl border-4 border-white text-white"
                  style={{ background: `linear-gradient(135deg, hsl(${profile.logoHue} 70% 42%), hsl(${profile.logoHue + 25} 75% 28%))` }}
                >
                  <Store className="size-6" />
                </span>
                <p className="mt-2 text-sm font-black">{profile.name}</p>
              </div>
            </div>
            <p className="mb-2 mt-4 text-xs font-extrabold text-muted">لون الشعار</p>
            <div className="flex gap-2">
              {HUES.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-label={`لون ${h}`}
                  aria-pressed={profile.logoHue === h}
                  onClick={() => setProfile({ logoHue: h })}
                  className={cn("size-8 rounded-full border-2 transition", profile.logoHue === h ? "border-navy scale-110" : "border-white shadow")}
                  style={{ background: `hsl(${h} 70% 40%)` }}
                />
              ))}
            </div>
            <p className="mb-2 mt-4 text-xs font-extrabold text-muted">الغلاف</p>
            <div className="grid grid-cols-4 gap-2">
              {COVERS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`غلاف ${i + 1}`}
                  aria-pressed={profile.coverIdx === i}
                  onClick={() => setProfile({ coverIdx: i })}
                  className={cn("h-10 rounded-xl border-2 transition", profile.coverIdx === i ? "border-navy" : "border-transparent")}
                  style={{ background: c }}
                />
              ))}
            </div>
            <p className="mt-4 text-[11px] font-semibold leading-relaxed text-muted">رفع الصور الفعلي غير متاح في الديمو، فتم استبداله باختيار ألوان جاهزة.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
