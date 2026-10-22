"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ChevronDown, LayoutDashboard, Menu, Search, Store, UserRound, X, MapPinned } from "lucide-react";
import Logo from "@/components/shared/Logo";
import LangSwitch from "@/components/shared/LangSwitch";
import { useT } from "@/hooks/useT";
import type { TKey } from "@/locales/ar";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

const LIGHT_HERO = true;

const LINKS: { href: string; key: TKey }[] = [
  { href: "/", key: "nav.home" },
  { href: "/#how", key: "nav.how" },
  { href: "/#pharmacies", key: "nav.pharmacies" },
  { href: "/#coverage", key: "nav.coverage" },
  { href: "/#faq", key: "nav.faq" },
];

const PRODUCTS: { href: string; icon: typeof Search; title: TKey; sub: TKey }[] = [
  { href: "/search", icon: Search, title: "nav.p.search", sub: "nav.p.search.sub" },
  { href: "/pharmacy", icon: LayoutDashboard, title: "nav.p.pharmacy", sub: "nav.p.pharmacy.sub" },
  { href: "/admin", icon: MapPinned, title: "nav.p.admin", sub: "nav.p.admin.sub" },
];

function Dropdown({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn(
            "absolute top-full z-50 mt-3 overflow-hidden rounded-2xl border border-navy/10 bg-white p-2 shadow-lift",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const { t } = useT();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<null | "products" | "login">(null);
  const [mobile, setMobile] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [active, setActive] = useState("/");
  const wrapRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 24);
    if (isHome && y < 240) setActive("/");
  });

  // Highlight the nav item for the section currently in view.
  useEffect(() => {
    if (!isHome) return;
    const els = ["how", "pharmacies", "coverage", "faq"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(`/#${e.target.id}`)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isHome]);

  useEffect(() => {
    setMobile(false);
    setMenu(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setMenu(null), setMobile(false));
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile]);

  // The home hero is light now, so the pill stays in its readable (solid) style from the top.
  const solid = scrolled || !isHome || LIGHT_HERO;
  const current = hover ?? (isHome ? active : "");

  return (
    <header className="fixed inset-x-0 top-0 z-[70] px-3 pt-3 sm:px-5">
      <motion.nav
        ref={wrapRef}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: isHome ? 1.1 : 0 }}
        aria-label="التنقل الرئيسي"
        className={cn(
          "relative mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full px-4 transition-all duration-500 sm:px-6",
          solid
            ? "border border-navy/[0.08] bg-white/80 shadow-soft backdrop-blur-xl"
            : "border border-white/10 bg-white/[0.04] backdrop-blur-md"
        )}
      >
        <Link href="/" aria-label="دوانو - الصفحة الرئيسية" className="shrink-0">
          <Logo tone={solid ? "dark" : "light"} />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setHover(null)}>
          {LINKS.map((l) => (
            <li key={l.href} className="relative">
              <Link
                href={l.href}
                onMouseEnter={() => setHover(l.href)}
                onFocus={() => setHover(l.href)}
                onBlur={() => setHover(null)}
                className={cn(
                  "relative block rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  solid ? "text-navy/80 hover:text-navy" : "text-white/75 hover:text-white"
                )}
              >
                {current === l.href && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className={cn("absolute inset-0 -z-10 rounded-full", solid ? "bg-brand/10" : "bg-white/10")}
                  />
                )}
                {t(l.key)}
              </Link>
            </li>
          ))}

          <li className="relative">
            <button
              type="button"
              aria-expanded={menu === "products"}
              aria-haspopup="menu"
              onClick={() => setMenu(menu === "products" ? null : "products")}
              onMouseEnter={() => setMenu("products")}
              className={cn(
                "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                solid ? "text-navy/80 hover:text-navy" : "text-white/75 hover:text-white"
              )}
            >
              {t("nav.products")}
              <ChevronDown className={cn("size-4 transition-transform", menu === "products" && "rotate-180")} />
            </button>
            <div onMouseLeave={() => setMenu(null)}>
              <Dropdown open={menu === "products"} className="start-0 w-80">
                {PRODUCTS.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    onClick={() => setMenu(null)}
                    className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-brand-mint/60"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-navy/10 bg-white text-brand shadow-soft transition group-hover:scale-105">
                      <p.icon className="size-5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-extrabold text-navy">{t(p.title)}</span>
                      <span className="text-xs font-medium text-muted">{t(p.sub)}</span>
                    </span>
                  </Link>
                ))}
              </Dropdown>
            </div>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <button
              type="button"
              aria-expanded={menu === "login"}
              aria-haspopup="menu"
              onClick={() => setMenu(menu === "login" ? null : "login")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold transition-colors",
                solid ? "text-navy/80 hover:text-navy" : "text-white/75 hover:text-white"
              )}
            >
              {t("nav.login")}
              <ChevronDown className={cn("size-4 transition-transform", menu === "login" && "rotate-180")} />
            </button>
            <Dropdown open={menu === "login"} className="end-0 w-52">
              {([
                { role: "patient", label: t("nav.patient"), icon: UserRound },
                { role: "pharmacy", label: t("nav.pharmacyRole"), icon: Store },
              ] as const).map((r) => (
                <Link
                  key={r.role}
                  href={`/login?role=${r.role}`}
                  onClick={() => setMenu(null)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-start text-sm font-bold text-navy transition hover:bg-brand-mint/60"
                >
                  <r.icon className="size-4 text-brand" />
                  {r.label}
                </Link>
              ))}
            </Dropdown>
          </div>

          <LangSwitch tone={solid ? "dark" : "light"} className="hidden sm:flex" />

          <div className="hidden md:block">
            <Link href="/register" className="btn-primary !px-5 !py-2.5 text-sm">
              {t("nav.register")}
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobile ? t("nav.close") : t("nav.menu")}
            aria-expanded={mobile}
            onClick={() => setMobile((v) => !v)}
            className={cn(
              "grid size-10 place-items-center rounded-full transition lg:hidden",
              solid ? "text-navy hover:bg-navy/5" : "text-white hover:bg-white/10"
            )}
          >
            {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-x-3 top-[5.25rem] z-[69] max-h-[calc(100svh-6.5rem)] overflow-y-auto rounded-3xl border border-white/10 bg-navy-900/95 p-4 shadow-lift backdrop-blur-2xl lg:hidden"
          >
            <ul className="flex flex-col">
              {[...LINKS, { href: "/search", key: "nav.search" as TKey }, { href: "/about", key: "footer.about" as TKey }, { href: "/contact", key: "footer.contact" as TKey }].map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: EASE }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setMobile(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-4 text-lg font-extrabold text-white transition hover:bg-white/5"
                  >
                    {t(l.key)}
                    <span className="text-brand-glow rtl:rotate-0 ltr:rotate-180">←</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
              <Link href="/login" onClick={() => setMobile(false)} className="btn-ghost">
                {t("nav.login")}
              </Link>
              <Link href="/register" onClick={() => setMobile(false)} className="btn-primary">
                {t("nav.register")}
              </Link>
              <LangSwitch tone="light" className="col-span-2 justify-center" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
