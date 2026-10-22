import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/RecoveryForms";

export const metadata: Metadata = { title: "نسيت كلمة المرور" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
