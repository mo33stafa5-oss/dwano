import type { Metadata } from "next";
import RegisterWizard from "@/components/auth/RegisterWizard";

export const metadata: Metadata = { title: "تسجيل صيدلية" };

export default function RegisterPage() {
  return <RegisterWizard />;
}
