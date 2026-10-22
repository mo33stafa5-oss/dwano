import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96" />}>
      <LoginForm />
    </Suspense>
  );
}
