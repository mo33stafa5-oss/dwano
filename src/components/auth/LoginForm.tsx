"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LayoutDashboard, ShieldCheck, Store, UserRound } from "lucide-react";
import { FieldError } from "@/components/shared/ContactForm";
import { useSessionStore } from "@/store/session";
import { demoToast } from "@/store/toast";
import { useT } from "@/hooks/useT";
import type { DemoRole } from "@/data/users";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().email("اكتب بريدًا إلكترونيًا صحيحًا"),
  password: z.string().min(6, "كلمة المرور ٦ أحرف على الأقل"),
});
type Values = z.infer<typeof schema>;

const ROLES: { id: DemoRole; label: string; icon: typeof UserRound; to: string; email: string }[] = [
  { id: "patient", label: "مريض", icon: UserRound, to: "/", email: "patient@demo.dwano" },
  { id: "pharmacy", label: "صيدلية", icon: Store, to: "/pharmacy", email: "pharmacy@demo.dwano" },
  { id: "admin", label: "مشرف", icon: ShieldCheck, to: "/admin", email: "admin@demo.dwano" },
];

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();
  const signIn = useSessionStore((s) => s.signIn);
  const initial = (params.get("role") as DemoRole | null) ?? "patient";
  const [role, setRole] = useState<DemoRole>(ROLES.some((r) => r.id === initial) ? initial : "patient");
  const current = ROLES.find((r) => r.id === role)!;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const enter = (r: DemoRole) => {
    const target = ROLES.find((x) => x.id === r)!;
    signIn(r);
    demoToast(`تم الدخول كـ «${target.label}» في وضع الديمو. لا يوجد حساب حقيقي.`);
    router.push(target.to);
  };

  // Credentials are validated for shape only and are never stored or sent anywhere.
  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 350));
    enter(role);
  };

  return (
    <div>
      <h1 className="text-3xl font-black">{t("auth.login")}</h1>
      <p className="mt-2 text-sm font-medium text-muted">اختر نوع الحساب ثم ادخل. كل شيء هنا تجريبي.</p>

      <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-white p-1.5 shadow-soft" role="tablist" aria-label="نوع الحساب">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={role === r.id}
            onClick={() => setRole(r.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-extrabold transition",
              role === r.id ? "bg-brand text-white shadow-soft" : "text-muted hover:text-navy"
            )}
          >
            <r.icon className="size-4" /> {r.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="l-email" className="mb-1.5 block text-xs font-extrabold text-muted">
            {t("auth.email")}
          </label>
          <input
            id="l-email"
            type="email"
            dir="ltr"
            placeholder={current.email}
            className={cn("field text-start", errors.email && "!border-rose-400")}
            {...register("email")}
          />
          <FieldError msg={errors.email?.message} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="l-pass" className="text-xs font-extrabold text-muted">
              {t("auth.password")}
            </label>
            <Link href="/forgot-password" className="text-xs font-extrabold text-brand hover:underline">
              {t("auth.forgot")}
            </Link>
          </div>
          <input id="l-pass" type="password" dir="ltr" autoComplete="off" className={cn("field text-start", errors.password && "!border-rose-400")} {...register("password")} />
          <FieldError msg={errors.password?.message} />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : t("auth.login")}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-bold text-muted">
        <span className="h-px flex-1 bg-navy/10" /> أو <span className="h-px flex-1 bg-navy/10" />
      </div>

      <button type="button" onClick={() => enter(role)} className="btn-light w-full">
        <LayoutDashboard className="size-4" /> دخول تجريبي سريع كـ «{current.label}»
      </button>

      <p className="mt-6 text-center text-sm font-medium text-muted">
        صيدلية جديدة؟{" "}
        <Link href="/register" className="font-extrabold text-brand hover:underline">
          {t("auth.register")}
        </Link>
      </p>
      <p className="mt-4 rounded-2xl border border-navy/10 bg-white p-3 text-center text-[11px] font-semibold leading-relaxed text-muted">
        لا يتم حفظ كلمات المرور أو إرسالها لأي خادم. يُحفظ فقط الاسم والدور التجريبي في متصفحك.
      </p>
    </div>
  );
}
