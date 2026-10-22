"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle2, Copy, Crosshair, Loader2, Mail, MapPin, MessageCircle, Phone, Pill, RotateCcw, ShieldCheck, User } from "lucide-react";
import { FieldError } from "@/components/shared/ContactForm";
import { getArea, getDistrict, governorates } from "@/data/locations";
import {
  generateRequestId,
  requestSchema,
  submitMedicineRequest,
  type Coordinates,
  type MedicineRequest,
  type RequestFormInput,
  type RequestFormValues,
} from "@/lib/requests";
import { toast } from "@/store/toast";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type GeoState = "idle" | "loading" | "captured" | "denied" | "unavailable" | "error";

interface Props {
  medicineId?: string;
  medicineName: string;
  districtId: string;
  areaId: string;
  onReset: () => void;
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-extrabold text-muted">
      {children} <span className="text-rose-500">*</span>
    </label>
  );
}

export default function MedicineRequestForm({ medicineId, medicineName, districtId, areaId, onReset }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormInput, unknown, RequestFormValues>({ resolver: zodResolver(requestSchema), mode: "onTouched" });
  const [geo, setGeo] = useState<GeoState>("idle");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [done, setDone] = useState<MedicineRequest | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const lock = useRef(false); // synchronous guard against double clicks

  const shareLocation = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return setGeo("unavailable");
    setGeo("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: Math.round(p.coords.accuracy), capturedAt: new Date().toISOString() });
        setGeo("captured");
      },
      (err) => setGeo(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const onSubmit = async (v: RequestFormValues) => {
    if (lock.current) return;
    lock.current = true;
    setSubmitError("");
    const district = getDistrict(districtId);
    const area = getArea(areaId);
    const payload: Omit<MedicineRequest, "status" | "seen"> = {
      id: generateRequestId(),
      createdAt: new Date().toISOString(),
      medicine: { id: medicineId, name: medicineName },
      customer: { fullName: v.fullName, email: v.email, phone: v.phone, whatsapp: v.whatsapp },
      location: {
        governorate: { id: governorates[0].id, name: governorates[0].nameAr },
        district: district && { id: district.id, name: district.nameAr },
        area: area && { id: area.id, name: area.shortAr },
        address: v.address || undefined,
        coordinates: coords ?? undefined,
      },
    };
    try {
      setDone(await submitMedicineRequest(payload));
    } catch {
      setSubmitError("تعذّر إرسال الطلب. حاول مرة أخرى بعد قليل.");
      lock.current = false;
    }
  };

  const newRequest = () => {
    lock.current = false;
    setDone(null);
    setCoords(null);
    setGeo("idle");
    reset();
    onReset();
  };

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(done!.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("انسخ الرقم يدويًا من الشاشة.");
    }
  };

  const err = (k: keyof RequestFormInput) => errors[k]?.message as string | undefined;
  const icon = "pointer-events-none absolute start-4 top-[2.55rem] size-[18px] text-brand";

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mx-auto max-w-2xl rounded-[2rem] border border-navy/[0.07] bg-white p-7 text-center shadow-lift sm:p-10"
          role="status"
        >
          <motion.span
            initial={{ scale: 0.4, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
            className="mx-auto grid size-16 place-items-center rounded-full bg-brand-mint text-brand"
          >
            <CheckCircle2 className="size-9" />
          </motion.span>
          <h2 className="mt-5 text-2xl font-black">
            {done.status === "submitted" ? "تم إرسال طلبك إلى فريق دوانو" : "تم حفظ طلبك على جهازك"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-loose text-muted">
            طلب دواء «{done.medicine.name}». احتفظ برقم المرجع التالي.
          </p>
          <button
            type="button"
            onClick={copyRef}
            aria-label="نسخ رقم الطلب"
            className="mx-auto mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-brand/40 bg-brand-mint/60 px-6 py-3 transition hover:bg-brand-mint"
          >
            <span dir="ltr" className="font-mono text-xl font-black tracking-wider text-brand-deep">
              {done.id}
            </span>
            {copied ? <Check className="size-4 text-brand" /> : <Copy className="size-4 text-brand" />}
          </button>
          {done.status === "saved-locally" && (
            <p className="mx-auto mt-5 max-w-md rounded-2xl bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-800">
              تم حفظ طلبك على جهازك لكنه لم يصل إلى فريق دوانو، لأن خدمة الإرسال غير مفعّلة حاليًا. احتفظ برقم المرجع وحاول لاحقًا.
            </p>
          )}
          <button type="button" onClick={newRequest} className="btn-light mt-6">
            <RotateCcw className="size-4" /> طلب دواء آخر
          </button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.6, ease: EASE }}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="نموذج طلب دواء"
          className="mx-auto max-w-3xl rounded-[2rem] border border-navy/[0.07] bg-white p-5 shadow-lift sm:p-8"
        >
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-mint text-brand-deep">
              <Pill className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-black sm:text-2xl">اطلب دواءك</h2>
              <p className="mt-1 text-sm font-medium leading-relaxed text-muted">املأ بياناتك وسجّل طلبك، وهنوضّح لك الخطوة التالية بعد التسجيل.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="r-med" className="mb-1.5 block text-xs font-extrabold text-muted">
                اسم الدواء
              </label>
              <div className="relative">
                <Pill className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-brand" />
                <input id="r-med" readOnly value={medicineName} className="field !ps-11 bg-ice font-extrabold" />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-muted">يتغيّر تلقائيًا حسب بحثك بالأعلى.</p>
            </div>

            <div className="relative">
              <Label htmlFor="r-name">الاسم بالكامل</Label>
              <User className={icon} />
              <input id="r-name" autoComplete="name" className={cn("field !ps-11", errors.fullName && "!border-rose-400")} aria-invalid={!!errors.fullName} {...register("fullName")} />
              <FieldError msg={err("fullName")} />
            </div>
            <div className="relative">
              <Label htmlFor="r-email">البريد الإلكتروني</Label>
              <Mail className={icon} />
              <input id="r-email" type="email" dir="ltr" autoComplete="email" className={cn("field !ps-11 text-start", errors.email && "!border-rose-400")} aria-invalid={!!errors.email} {...register("email")} />
              <FieldError msg={err("email")} />
            </div>
            <div className="relative">
              <Label htmlFor="r-phone">رقم الهاتف</Label>
              <Phone className={icon} />
              <input id="r-phone" type="tel" inputMode="tel" dir="ltr" autoComplete="tel" placeholder="01012345678" className={cn("field !ps-11 text-start", errors.phone && "!border-rose-400")} aria-invalid={!!errors.phone} {...register("phone")} />
              <FieldError msg={err("phone")} />
            </div>
            <div className="relative">
              <Label htmlFor="r-wa">رقم الواتساب</Label>
              <MessageCircle className={icon} />
              <input id="r-wa" type="tel" inputMode="tel" dir="ltr" placeholder="01012345678" className={cn("field !ps-11 text-start", errors.whatsapp && "!border-rose-400")} aria-invalid={!!errors.whatsapp} {...register("whatsapp")} />
              <FieldError msg={err("whatsapp")} />
            </div>

            <div className="relative sm:col-span-2">
              <label htmlFor="r-addr" className="mb-1.5 block text-xs font-extrabold text-muted">
                اسم الموقع / العنوان <span className="font-semibold">(اختياري)</span>
              </label>
              <MapPin className="pointer-events-none absolute start-4 top-[2.55rem] size-[18px] text-brand" />
              <input id="r-addr" placeholder="الشارع، أو علامة مميزة قريبة منك" className="field !ps-11" {...register("address")} />
              <FieldError msg={err("address")} />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-navy/10 bg-ice p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold">موقعك الحالي (اختياري)</p>
                <p className="mt-0.5 text-xs font-medium text-muted">لن نطلب موقعك إلا عند الضغط على الزر وموافقتك في المتصفح.</p>
              </div>
              <button type="button" onClick={shareLocation} disabled={geo === "loading"} className="btn-light !py-2.5 text-sm">
                {geo === "loading" ? <Loader2 className="size-4 animate-spin" /> : geo === "captured" ? <RotateCcw className="size-4" /> : <Crosshair className="size-4" />}
                {geo === "loading" ? "جاري تحديد الموقع…" : geo === "captured" ? "تحديث الموقع" : geo === "idle" ? "شارك موقعي" : "إعادة المحاولة"}
              </button>
            </div>
            <div aria-live="polite" className="mt-2 text-xs font-bold">
              {geo === "captured" && coords && (
                <p className="flex flex-wrap items-center gap-2 text-brand-deep">
                  <CheckCircle2 className="size-4" /> تم التقاط موقعك
                  <span dir="ltr" className="font-mono font-semibold text-muted">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                  <button type="button" onClick={() => (setCoords(null), setGeo("idle"))} className="text-rose-600 underline">
                    إزالة
                  </button>
                </p>
              )}
              {geo === "denied" && <p className="text-rose-600">تم رفض إذن الموقع. فعّله من إعدادات المتصفح ثم اضغط «إعادة المحاولة»، أو اكتب عنوانك يدويًا.</p>}
              {geo === "unavailable" && <p className="text-rose-600">المتصفح لا يدعم تحديد الموقع. اكتب عنوانك يدويًا.</p>}
              {geo === "error" && <p className="text-rose-600">تعذّر تحديد موقعك. حاول مرة أخرى أو اكتب عنوانك يدويًا.</p>}
            </div>
          </div>

          {submitError && (
            <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
              {submitError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary mt-6 w-full min-h-[52px] text-base disabled:opacity-70">
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : null}
            {isSubmitting ? "جاري الإرسال…" : "Submit Medicine Request — إرسال طلب الدواء"}
          </button>
          <p className="mt-3 flex items-start justify-center gap-2 text-center text-[11px] font-semibold leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
            معلومات توافر الأدوية استرشادية، ويُرجى التأكد من الصيدلية قبل التوجه إليها.
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
