import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/RecoveryForms";

export const metadata: Metadata = { title: "إعادة تعيين كلمة المرور" };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
