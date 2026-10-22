import Link from "next/link";
import { FlaskConical } from "lucide-react";
import Logo, { LogoMark } from "@/components/shared/Logo";
import LangSwitch from "@/components/shared/LangSwitch";
import { MEDICAL_DISCLAIMER } from "@/lib/status";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(0,143,115,.55),transparent_60%)]" />
          <div className="grid-lines absolute inset-0" />
          <div className="absolute -bottom-24 -end-24 size-[420px] animate-drift rounded-full bg-brand/30 blur-[110px]" />
        </div>
        <Link href="/" className="relative">
          <Logo tone="light" />
        </Link>
        <div className="relative">
          <LogoMark size={56} />
          <h2 className="mt-6 text-4xl font-black leading-tight">
            دواءك أقرب <span className="text-gradient">مما تتخيل</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm font-medium leading-loose text-white/65">{MEDICAL_DISCLAIMER}</p>
        </div>
        <p className="relative text-xs font-medium text-white/40">© ٢٠٢٦ دوانو · نسخة عرض تجريبية</p>
      </aside>
      <main className="relative flex flex-col bg-ice px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-800">
              <FlaskConical className="size-3.5" /> وضع الديمو
            </span>
            <LangSwitch />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
