"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, MailCheck } from "lucide-react";
import { FieldError } from "@/components/shared/ContactForm";
import { cn } from "@/lib/utils";

const forgotSchema = z.object({ email: z.string().trim().email("اكتب بريدًا إلكترونيًا صحيحًا") });

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });

  if (sent)
    return (
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-mint text-brand">
          <MailCheck className="size-8" />
        </span>
        <h1 className="mt-5 text-2xl font-black">تحقق من بريدك (محاكاة)</h1>
        <p className="mt-2 text-sm font-medium leading-loose text-muted">
          ده ديمو: لم يتم إرسال أي بريد فعلي. تقدر تجرّب شاشة إعادة التعيين من الزر التالي.
        </p>
        <Link href="/reset-password" className="btn-primary mt-6 w-full">
          فتح شاشة إعادة التعيين
        </Link>
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-black">نسيت كلمة المرور؟</h1>
      <p className="mt-2 text-sm font-medium text-muted">اكتب بريدك وهنوريك خطوات الاسترجاع (محاكاة فقط).</p>
      <form
        onSubmit={handleSubmit(async () => {
          await new Promise((r) => setTimeout(r, 400));
          setSent(true);
        })}
        noValidate
        className="mt-6 space-y-4"
      >
        <div>
          <label htmlFor="f-email" className="mb-1.5 block text-xs font-extrabold text-muted">
            البريد الإلكتروني
          </label>
          <input id="f-email" type="email" dir="ltr" className={cn("field text-start", errors.email && "!border-rose-400")} {...register("email")} />
          <FieldError msg={errors.email?.message} />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : "إرسال رابط الاسترجاع"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm font-medium text-muted">
        <Link href="/login" className="font-extrabold text-brand hover:underline">
          الرجوع لتسجيل الدخول
        </Link>
      </p>
    </div>
  );
}

const resetSchema = z
  .object({
    password: z.string().min(8, "كلمة المرور ٨ أحرف على الأقل"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "كلمتا المرور غير متطابقتين" });

export function ResetPasswordForm() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  if (done)
    return (
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-mint text-brand">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-5 text-2xl font-black">تمت المحاكاة بنجاح</h1>
        <p className="mt-2 text-sm font-medium leading-loose text-muted">لم يتم تغيير أي كلمة مرور فعلية ولا تخزينها. هذه واجهة عرض فقط.</p>
        <Link href="/login" className="btn-primary mt-6 w-full">
          الذهاب لتسجيل الدخول
        </Link>
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-black">إعادة تعيين كلمة المرور</h1>
      <p className="mt-2 text-sm font-medium text-muted">اختر كلمة مرور جديدة (لن يتم حفظها).</p>
      <form
        onSubmit={handleSubmit(async () => {
          await new Promise((r) => setTimeout(r, 400));
          setDone(true);
        })}
        noValidate
        className="mt-6 space-y-4"
      >
        <div>
          <label htmlFor="r-pass" className="mb-1.5 block text-xs font-extrabold text-muted">
            كلمة المرور الجديدة
          </label>
          <input id="r-pass" type="password" dir="ltr" autoComplete="off" className={cn("field text-start", errors.password && "!border-rose-400")} {...register("password")} />
          <FieldError msg={errors.password?.message} />
        </div>
        <div>
          <label htmlFor="r-conf" className="mb-1.5 block text-xs font-extrabold text-muted">
            تأكيد كلمة المرور
          </label>
          <input id="r-conf" type="password" dir="ltr" autoComplete="off" className={cn("field text-start", errors.confirm && "!border-rose-400")} {...register("confirm")} />
          <FieldError msg={errors.confirm?.message} />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : "حفظ كلمة المرور"}
        </button>
      </form>
    </div>
  );
}
