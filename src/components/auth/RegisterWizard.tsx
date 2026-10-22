"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import { FieldError } from "@/components/shared/ContactForm";
import { areasOfDistrict, districts, getArea, getDistrict } from "@/data/locations";
import { useAdminStore } from "@/store/adminDash";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const phone = z.string().trim().regex(/^01[0125]\d{8}$/, "اكتب رقم موبايل مصري صحيحًا (١١ رقم)");

const schema = z.object({
  nameAr: z.string().trim().min(3, "اسم الصيدلية ٣ أحرف على الأقل"),
  owner: z.string().trim().min(3, "اكتب اسم المسؤول"),
  districtId: z.string().min(1, "اختر المركز"),
  areaId: z.string().min(1, "اختر المنطقة"),
  address: z.string().trim().min(6, "اكتب العنوان بالتفصيل"),
  phone,
  email: z.string().trim().email("اكتب بريدًا إلكترونيًا صحيحًا"),
  hours: z.string().trim().min(3, "اكتب مواعيد العمل"),
  agree: z.literal(true, { errorMap: () => ({ message: "لازم توافق على الإقرار" }) }),
});
type Values = z.infer<typeof schema>;

const STEPS: { title: string; fields: FieldPath<Values>[] }[] = [
  { title: "بيانات الصيدلية", fields: ["nameAr", "owner"] },
  { title: "الموقع", fields: ["districtId", "areaId", "address"] },
  { title: "التواصل والمواعيد", fields: ["phone", "email", "hours"] },
  { title: "المراجعة", fields: ["agree"] },
];

export default function RegisterWizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [doneId, setDoneId] = useState<string | null>(null);
  const registerPharmacy = useAdminStore((s) => s.registerPharmacy);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { districtId: "", areaId: "", hours: "٩:٠٠ ص - ١٠:٠٠ م" },
  });

  const districtId = watch("districtId");
  const areaOptions = useMemo(() => (districtId ? areasOfDistrict(districtId) : []), [districtId]);
  const values = watch();

  const go = async (n: number) => {
    if (n > step) {
      const ok = await trigger(STEPS[step].fields);
      if (!ok) return;
    }
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const onSubmit = async (v: Values) => {
    await new Promise((r) => setTimeout(r, 500));
    const id = registerPharmacy({
      nameAr: v.nameAr,
      owner: v.owner,
      phone: v.phone,
      districtId: v.districtId,
      areaId: v.areaId,
      address: v.address,
    });
    setDoneId(id);
  };

  if (doneId)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE }} className="text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-brand-mint text-brand">
          <PartyPopper className="size-10" />
        </span>
        <h1 className="mt-6 text-3xl font-black">تم إرسال الطلب (ديمو)</h1>
        <p className="mt-3 text-sm font-medium leading-loose text-muted">
          تم حفظ الطلب في متصفحك فقط، وهيظهر كـ «قيد المراجعة» في لوحة المشرف التجريبية. لم يتم إرسال أي بيانات لخادم.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href="/admin/pharmacies" className="btn-primary">
            شوف الطلب في لوحة المشرف
          </Link>
          <Link href="/" className="btn-light">
            الرئيسية
          </Link>
        </div>
      </motion.div>
    );

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div>
      <h1 className="text-3xl font-black">سجّل صيدليتك</h1>
      <p className="mt-2 text-sm font-medium text-muted">أربع خطوات بسيطة. (نموذج تجريبي: لا يوجد تحقق فعلي من الترخيص.)</p>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="text-brand">
            الخطوة {(step + 1).toLocaleString("ar-EG")} من {STEPS.length.toLocaleString("ar-EG")}
          </span>
          <span className="text-muted">{STEPS[step].title}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy/10">
          <motion.div className="h-full rounded-full bg-gradient-to-l from-brand-glow to-brand" animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: EASE }} />
        </div>
        <ol className="mt-4 flex justify-between">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border text-xs font-black transition-all duration-300",
                  i < step && "border-brand bg-brand text-white",
                  i === step && "border-brand bg-brand-mint text-brand-deep",
                  i > step && "border-navy/10 bg-white text-muted"
                )}
              >
                {i < step ? <Check className="size-4" /> : (i + 1).toLocaleString("ar-EG")}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6">
        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * 40 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="space-y-4"
            >
              {step === 0 && (
                <>
                  <div>
                    <label htmlFor="g-name" className="mb-1.5 block text-xs font-extrabold text-muted">
                      اسم الصيدلية
                    </label>
                    <input id="g-name" className={cn("field", errors.nameAr && "!border-rose-400")} {...register("nameAr")} />
                    <FieldError msg={errors.nameAr?.message} />
                  </div>
                  <div>
                    <label htmlFor="g-owner" className="mb-1.5 block text-xs font-extrabold text-muted">
                      اسم المسؤول
                    </label>
                    <input id="g-owner" className={cn("field", errors.owner && "!border-rose-400")} {...register("owner")} />
                    <FieldError msg={errors.owner?.message} />
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <div>
                    <label htmlFor="g-d" className="mb-1.5 block text-xs font-extrabold text-muted">
                      المركز (محافظة الفيوم)
                    </label>
                    <select
                      id="g-d"
                      className={cn("field", errors.districtId && "!border-rose-400")}
                      {...register("districtId", { onChange: () => setValue("areaId", "") })}
                    >
                      <option value="">اختر المركز</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameAr}
                        </option>
                      ))}
                    </select>
                    <FieldError msg={errors.districtId?.message} />
                  </div>
                  <div>
                    <label htmlFor="g-a" className="mb-1.5 block text-xs font-extrabold text-muted">
                      المنطقة
                    </label>
                    <select id="g-a" disabled={!districtId} className={cn("field", errors.areaId && "!border-rose-400")} {...register("areaId")}>
                      <option value="">{districtId ? "اختر المنطقة" : "اختر المركز أولًا"}</option>
                      {areaOptions.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.shortAr}
                        </option>
                      ))}
                    </select>
                    <FieldError msg={errors.areaId?.message} />
                  </div>
                  <div>
                    <label htmlFor="g-addr" className="mb-1.5 block text-xs font-extrabold text-muted">
                      العنوان
                    </label>
                    <input id="g-addr" className={cn("field", errors.address && "!border-rose-400")} {...register("address")} />
                    <FieldError msg={errors.address?.message} />
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div>
                    <label htmlFor="g-phone" className="mb-1.5 block text-xs font-extrabold text-muted">
                      رقم الموبايل
                    </label>
                    <input id="g-phone" dir="ltr" inputMode="numeric" placeholder="01xxxxxxxxx" className={cn("field text-start", errors.phone && "!border-rose-400")} {...register("phone")} />
                    <FieldError msg={errors.phone?.message} />
                  </div>
                  <div>
                    <label htmlFor="g-email" className="mb-1.5 block text-xs font-extrabold text-muted">
                      البريد الإلكتروني
                    </label>
                    <input id="g-email" type="email" dir="ltr" className={cn("field text-start", errors.email && "!border-rose-400")} {...register("email")} />
                    <FieldError msg={errors.email?.message} />
                  </div>
                  <div>
                    <label htmlFor="g-hours" className="mb-1.5 block text-xs font-extrabold text-muted">
                      مواعيد العمل
                    </label>
                    <input id="g-hours" className={cn("field", errors.hours && "!border-rose-400")} {...register("hours")} />
                    <FieldError msg={errors.hours?.message} />
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <dl className="divide-y divide-navy/5 rounded-2xl border border-navy/10 bg-white text-sm">
                    {[
                      ["الصيدلية", values.nameAr],
                      ["المسؤول", values.owner],
                      ["الموقع", `${getDistrict(values.districtId)?.nameAr ?? ""} · ${getArea(values.areaId)?.shortAr ?? ""}`],
                      ["العنوان", values.address],
                      ["الموبايل", values.phone],
                      ["المواعيد", values.hours],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between gap-4 px-4 py-2.5">
                        <dt className="font-bold text-muted">{l}</dt>
                        <dd className="font-extrabold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <label className="flex items-start gap-3 text-sm font-semibold">
                    <input type="checkbox" className="mt-1 size-4 accent-[#008F73]" {...register("agree")} />
                    <span>أقرّ بأن هذه بيانات تجريبية للعرض، وأن الطلب لن يُرسل لأي جهة فعلية.</span>
                  </label>
                  <FieldError msg={errors.agree?.message} />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" disabled={step === 0} onClick={() => go(step - 1)} className="btn-light !py-2.5 disabled:opacity-40">
            <ArrowRight className="size-4" /> السابق
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => go(step + 1)} className="btn-primary !py-2.5">
              التالي <ArrowLeft className="size-4" />
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} className="btn-primary !py-2.5">
              {isSubmitting ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : "إرسال الطلب"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
