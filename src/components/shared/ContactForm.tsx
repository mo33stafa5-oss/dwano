"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "اكتب اسمك (حرفين على الأقل)"),
  email: z.string().trim().email("اكتب بريدًا إلكترونيًا صحيحًا"),
  topic: z.enum(["general", "pharmacy", "feedback"], { message: "اختر الموضوع" }),
  message: z.string().trim().min(10, "الرسالة قصيرة جدًا (١٠ أحرف على الأقل)").max(1000, "الرسالة طويلة جدًا"),
});
type Values = z.infer<typeof schema>;

export function FieldError({ msg }: { msg?: string }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-1.5 text-xs font-bold text-rose-600"
        >
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { topic: "general" } });

  const onSubmit = async (_v: Values) => {
    await new Promise((r) => setTimeout(r, 450)); // simulated network; nothing is sent anywhere
    setSent(true);
    reset();
  };

  return (
    <div className="rounded-[2rem] border border-navy/10 bg-white p-6 shadow-soft sm:p-8">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="grid place-items-center py-10 text-center"
          >
            <span className="grid size-16 place-items-center rounded-full bg-brand-mint text-brand">
              <CheckCircle2 className="size-9" />
            </span>
            <h2 className="mt-5 text-xl font-black">تم استلام الرسالة (محاكاة)</h2>
            <p className="mt-2 max-w-sm text-sm font-medium leading-loose text-muted">
              ده ديمو: الرسالة لم تُرسل لأي جهة فعلية، ولا يتم حفظها في أي مكان.
            </p>
            <button type="button" onClick={() => setSent(false)} className="btn-light mt-6">
              إرسال رسالة أخرى
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" initial={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className="mb-1.5 block text-xs font-extrabold text-muted">
                  الاسم
                </label>
                <input id="c-name" className={cn("field", errors.name && "!border-rose-400")} {...register("name")} />
                <FieldError msg={errors.name?.message} />
              </div>
              <div>
                <label htmlFor="c-email" className="mb-1.5 block text-xs font-extrabold text-muted">
                  البريد الإلكتروني
                </label>
                <input id="c-email" type="email" dir="ltr" className={cn("field text-start", errors.email && "!border-rose-400")} {...register("email")} />
                <FieldError msg={errors.email?.message} />
              </div>
            </div>
            <div>
              <label htmlFor="c-topic" className="mb-1.5 block text-xs font-extrabold text-muted">
                الموضوع
              </label>
              <select id="c-topic" className="field" {...register("topic")}>
                <option value="general">استفسار عام</option>
                <option value="pharmacy">أنا صيدلي وأريد الانضمام</option>
                <option value="feedback">اقتراح أو ملاحظة</option>
              </select>
              <FieldError msg={errors.topic?.message} />
            </div>
            <div>
              <label htmlFor="c-msg" className="mb-1.5 block text-xs font-extrabold text-muted">
                الرسالة
              </label>
              <textarea id="c-msg" rows={5} className={cn("field resize-none", errors.message && "!border-rose-400")} {...register("message")} />
              <FieldError msg={errors.message?.message} />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
              {isSubmitting ? (
                <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  <Send className="size-4" /> إرسال
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
