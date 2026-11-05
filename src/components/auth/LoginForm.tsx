
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FieldError } from "@/components/shared/ContactForm";
import { api, errMsg } from "@/lib/api";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

const schema = z.object({
  username: z.string().trim().min(3, "اكتب اسم المستخدم"),
  password: z.string().min(1, "اكتب كلمة المرور"),
});

type Values = z.infer<typeof schema>;

const HOME: Record<string, string> = {
  admin: "/admin/operations",
  pharmacy: "/pharmacy/souqak",
  warehouse: "/warehouse",
};

/** Only same-site relative paths are accepted as a post-login destination. */
const safeNext = (n: string | null) =>
  n && /^\/(?!\/)[\w\-./?=&%]*$/.test(n) ? n : null;

export default function LoginForm() {
  const params = useSearchParams();
  const { t } = useT();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (v: Values) => {
    setError("");

    try {
      const r = await api<{ role: string }>("/api/auth/login", {
        method: "POST",
        json: v,
      });

      if (!r.ok) {
        setError(
          r.status === 401
            ? "اسم المستخدم أو كلمة المرور غير صحيحة."
            : errMsg(r.error)
        );
        return;
      }

      const destination =
        safeNext(params.get("next")) ??
        HOME[r.data.role] ??
        "/";

      // Full navigation to load the new session cookie.
      window.location.assign(destination);
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-black">
        {t("auth.login")}
      </h1>

      <p className="mt-2 text-sm font-medium text-muted">
        للصيدليات والمخازن وفريق الإدارة. العملاء لا يحتاجون حسابًا.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor="l-user"
            className="mb-1.5 block text-xs font-extrabold text-muted"
          >
            اسم المستخدم
          </label>

          <input
            id="l-user"
            dir="ltr"
            autoComplete="username"
            className={cn(
              "field text-start",
              errors.username && "!border-rose-400"
            )}
            {...register("username")}
          />

          <FieldError msg={errors.username?.message} />
        </div>

        <div>
          <label
            htmlFor="l-pass"
            className="mb-1.5 block text-xs font-extrabold text-muted"
          >
            {t("auth.password")}
          </label>

          <input
            id="l-pass"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            className={cn(
              "field text-start",
              errors.password && "!border-rose-400"
            )}
            {...register("password")}
          />

          <FieldError msg={errors.password?.message} />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full"
        >
          {isSubmitting ? (
            <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            t("auth.login")
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm font-medium text-muted">
        صيدلية جديدة؟{" "}
        <Link
          href="/register"
          className="font-extrabold text-brand hover:underline"
        >
          {t("auth.register")}
        </Link>
      </p>

      <p className="mt-4 rounded-2xl border border-navy/10 bg-white p-3 text-center text-[11px] font-semibold leading-relaxed text-muted">
        حسابات المخازن تُنشأ بواسطة إدارة دوانو. حسابات الصيدليات الجديدة تُفعَّل بعد موافقة الإدارة.
      </p>
    </div>
  );
}
