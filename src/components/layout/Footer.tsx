"use client";

import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { useT } from "@/hooks/useT";
import type { TKey } from "@/locales/ar";

const COLS: { title: TKey; links: { href: string; key: TKey }[] }[] = [
  {
    title: "footer.platform",
    links: [
      { href: "/", key: "nav.home" },
      { href: "/search", key: "nav.search" },
      { href: "/how-it-works", key: "footer.how" },
      { href: "/#coverage", key: "nav.coverage" },
    ],
  },
  {
    title: "footer.pharmacies",
    links: [
      { href: "/register", key: "nav.register" },
      { href: "/login?role=pharmacy", key: "nav.login" },
      { href: "/pharmacy", key: "nav.p.pharmacy" },
    ],
  },
  {
    title: "footer.company",
    links: [
      { href: "/about", key: "footer.about" },
      { href: "/contact", key: "footer.contact" },
      { href: "/faq", key: "footer.faq" },
    ],
  },
];

export default function Footer() {
  const { t } = useT();
  return (
    <footer className="relative overflow-hidden bg-navy-900 text-white">
      <div className="pointer-events-none absolute -top-40 start-1/2 size-[520px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-sm font-medium leading-loose text-white/60">{t("footer.tagline")}</p>
          <p className="mt-6 max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-semibold leading-relaxed text-white/70">
            {t("common.disclaimer")}
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-extrabold text-white">{t(c.title)}</h3>
            <ul className="mt-5 space-y-3">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm font-medium text-white/60 transition hover:text-brand-glow">
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs font-medium text-white/45 sm:flex-row">
          <span>{t("footer.copy")}</span>
          <span>{t("footer.fiction")}</span>
        </div>
      </div>
    </footer>
  );
}
