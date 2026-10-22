"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Inbox,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  FileBarChart2,
  FlaskConical,
  GitBranch,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pill,
  Repeat,
  Search,
  Settings,
  Store,
  X,
} from "lucide-react";
import Logo, { LogoMark } from "@/components/shared/Logo";
import LangSwitch from "@/components/shared/LangSwitch";
import { useHydrated } from "@/hooks/useHydrated";
import { useT } from "@/hooks/useT";
import { useSessionStore } from "@/store/session";
import { useDashStore } from "@/store/pharmacyDash";
import { toast } from "@/store/toast";
import type { TKey } from "@/locales/ar";
import { EASE } from "@/lib/motion";
import { useRequests } from "@/hooks/useRequests";
import { cn } from "@/lib/utils";

type Kind = "pharmacy" | "admin";
interface Item {
  href: string;
  key: TKey;
  icon: typeof LayoutDashboard;
}

const NAV: Record<Kind, Item[]> = {
  pharmacy: [
    { href: "/pharmacy", key: "dash.overview", icon: LayoutDashboard },
    { href: "/pharmacy/inventory", key: "dash.inventory", icon: Package },
    { href: "/pharmacy/profile", key: "dash.profile", icon: Store },
    { href: "/pharmacy/branches", key: "dash.branches", icon: GitBranch },
    { href: "/pharmacy/analytics", key: "dash.analytics", icon: BarChart3 },
    { href: "/pharmacy/settings", key: "dash.settings", icon: Settings },
  ],
  admin: [
    { href: "/admin", key: "dash.overview", icon: LayoutDashboard },
    { href: "/admin/requests", key: "dash.requests", icon: Inbox },
    { href: "/admin/pharmacies", key: "dash.pharmacies", icon: Building2 },
    { href: "/admin/medicines", key: "dash.medicines", icon: Pill },
    { href: "/admin/geography", key: "dash.geography", icon: Globe2 },
    { href: "/admin/analytics", key: "dash.analytics", icon: BarChart3 },
    { href: "/admin/reports", key: "dash.reports", icon: FileBarChart2 },
    { href: "/admin/settings", key: "dash.settings", icon: Settings },
  ],
};

const NOTIFS: Record<Kind, { id: number; text: string }[]> = {
  pharmacy: [
    { id: 1, text: "٣ أدوية لم يتم تحديثها منذ أكثر من ٧٢ ساعة (تنبيه تجريبي)." },
    { id: 2, text: "تم عرض ملف صيدليتك ١٢ مرة اليوم (رقم تجريبي)." },
    { id: 3, text: "مرحبًا بك في لوحة دوانو التجريبية." },
  ],
  admin: [
    { id: 1, text: "٤ طلبات صيدليات بانتظار المراجعة (تجريبي)." },
    { id: 2, text: "ارتفاع عمليات البحث عن «كتافلام» هذا الأسبوع (تجريبي)." },
    { id: 3, text: "مرحبًا بك في لوحة الإدارة التجريبية." },
  ],
};

export default function DashboardShell({ kind, children }: { kind: Kind; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const { t } = useT();
  const { name, role, signIn, signOut } = useSessionStore();
  const ensureSeed = useDashStore((s) => s.ensureSeed);
  const profileName = useDashStore((s) => s.profile.name);

  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState<null | "notif" | "user">(null);
  const [read, setRead] = useState<number[]>([]);
  const { requests, unseen, markAllSeen } = useRequests(kind === "admin");
  const reqUnseen = kind === "admin" ? unseen : 0;
  const [q, setQ] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  const items = NAV[kind];

  useEffect(() => {
    if (!hydrated) return;
    ensureSeed();
    // Dashboards are a frontend demo: open as the matching demo role if nobody is signed in.
    if (!role) signIn(kind === "admin" ? "admin" : "pharmacy");
  }, [hydrated, role, kind, signIn, ensureSeed]);

  useEffect(() => {
    setMobile(false);
    setMenu(null);
  }, [pathname]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setMenu(null), setMobile(false));
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const matches = useMemo(() => {
    const n = q.trim();
    return n ? items.filter((i) => t(i.key).toLowerCase().includes(n.toLowerCase())) : [];
  }, [q, items, t]);

  const unread = NOTIFS[kind].filter((n) => !read.includes(n.id)).length + reqUnseen;
  const isActive = (href: string) => (href === `/${kind}` ? pathname === href : pathname.startsWith(href));
  const title = kind === "pharmacy" ? profileName : "لوحة الإدارة";

  const sidebar = (compact: boolean) => (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b border-white/10 px-4", compact && "justify-center px-0")}>
        {compact ? <LogoMark size={34} /> : <Logo tone="light" />}
      </div>
      <nav aria-label="قائمة اللوحة" className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              title={compact ? t(it.key) : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                compact && "justify-center",
                active ? "text-white" : "text-white/55 hover:text-white"
              )}
            >
              {active && <motion.span layoutId={`dash-pill-${compact ? "c" : "f"}`} transition={{ type: "spring", stiffness: 420, damping: 36 }} className="absolute inset-0 -z-10 rounded-xl bg-white/10 ring-1 ring-white/10" />}
              {active && <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-brand-glow" />}
              <it.icon className="size-[18px] shrink-0" />
              {!compact && t(it.key)}
              {it.href === "/admin/requests" && reqUnseen > 0 && (
                <span className="ms-auto grid min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">{reqUnseen.toLocaleString("ar-EG")}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className={cn("border-t border-white/10 p-3", compact && "hidden")}>
        <p className="rounded-xl bg-white/5 p-3 text-[11px] font-semibold leading-relaxed text-white/55">
          بيانات هذه اللوحة تجريبية وتُحفظ في متصفحك فقط.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-svh bg-[#F1F5F9]">
      {/* desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 bg-navy-900 text-white transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        {sidebar(collapsed)}
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobile && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobile(false)} className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: EASE }}
              className="absolute inset-y-0 end-0 w-72 bg-navy-900 text-white"
            >
              {sidebar(false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-navy/[0.07] bg-white/85 backdrop-blur-xl">
          <div ref={wrap} className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button type="button" onClick={() => setMobile(true)} aria-label={t("nav.menu")} className="grid size-10 place-items-center rounded-full hover:bg-navy/5 lg:hidden">
              <Menu className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={t("dash.collapse")}
              className="hidden size-9 place-items-center rounded-full text-muted transition hover:bg-navy/5 hover:text-navy lg:grid"
            >
              {collapsed ? <ChevronsLeft className="size-5" /> : <ChevronsRight className="size-5" />}
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-black">{title}</p>
              <p className="hidden text-[11px] font-semibold text-muted sm:block">{kind === "pharmacy" ? "لوحة الصيدلية" : "السوبر أدمن"}</p>
            </div>

            <div className="relative ms-auto hidden w-64 md:block">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <label htmlFor="dash-q" className="sr-only">
                انتقال سريع
              </label>
              <input
                id="dash-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && matches[0]) {
                    router.push(matches[0].href);
                    setQ("");
                  }
                }}
                placeholder="انتقال سريع للصفحات…"
                className="w-full rounded-full border border-navy/10 bg-white py-2 pe-4 ps-9 text-sm font-semibold outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
              />
              {matches.length > 0 && (
                <ul className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-navy/10 bg-white p-1.5 shadow-lift">
                  {matches.map((m) => (
                    <li key={m.href}>
                      <Link href={m.href} onClick={() => setQ("")} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-brand-mint/60">
                        <m.icon className="size-4 text-brand" /> {t(m.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <span className="hidden items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-800 sm:flex">
              <FlaskConical className="size-3.5" /> {t("common.demoMode")}
            </span>
            <LangSwitch className="hidden sm:flex" />

            {/* notifications */}
            <div className="relative">
              <button
                type="button"
                aria-label={t("dash.notifications")}
                aria-expanded={menu === "notif"}
                onClick={() => setMenu(menu === "notif" ? null : "notif")}
                className="relative grid size-10 place-items-center rounded-full hover:bg-navy/5"
              >
                <Bell className="size-5" />
                {unread > 0 && <span className="absolute end-2 top-2 size-2.5 rounded-full border-2 border-white bg-rose-500" />}
              </button>
              <AnimatePresence>
                {menu === "notif" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute end-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-lift"
                  >
                    <div className="flex items-center justify-between border-b border-navy/5 px-4 py-3">
                      <p className="text-sm font-black">{t("dash.notifications")}</p>
                      <button type="button" onClick={() => (setRead(NOTIFS[kind].map((n) => n.id)), markAllSeen())} className="text-xs font-extrabold text-brand">
                        تعليم الكل كمقروء
                      </button>
                    </div>
                    <ul>
                      {kind === "admin" &&
                        requests.slice(0, 5).map((r) => (
                          <li key={r.id}>
                            <Link href="/admin/requests" className={cn("flex gap-3 px-4 py-3 text-sm font-medium transition hover:bg-ice", !r.seen && "bg-brand-mint/40")}>
                              <span className={cn("mt-2 size-2 shrink-0 rounded-full", r.seen ? "bg-navy/15" : "bg-brand")} />
                              <span>
                                <b className="font-extrabold">طلب دواء جديد:</b> {r.medicine.name} · {r.customer.fullName}
                              </span>
                            </Link>
                          </li>
                        ))}
                      {NOTIFS[kind].map((n) => (
                        <li key={n.id} className={cn("flex gap-3 px-4 py-3 text-sm font-medium", !read.includes(n.id) && "bg-brand-mint/40")}>
                          <span className={cn("mt-2 size-2 shrink-0 rounded-full", read.includes(n.id) ? "bg-navy/15" : "bg-brand")} />
                          {n.text}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* user menu */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={menu === "user"}
                aria-label="قائمة المستخدم"
                onClick={() => setMenu(menu === "user" ? null : "user")}
                className="flex items-center gap-2 rounded-full border border-navy/10 bg-white py-1 pe-3 ps-1 transition hover:border-brand/40"
              >
                <span className="grid size-8 place-items-center rounded-full bg-brand text-xs font-black text-white">{(name || "د").slice(0, 1)}</span>
                <span className="hidden max-w-[110px] truncate text-xs font-extrabold sm:block">{name || "…"}</span>
              </button>
              <AnimatePresence>
                {menu === "user" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute end-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-navy/10 bg-white p-1.5 shadow-lift"
                  >
                    <p className="px-3 py-2 text-[11px] font-bold text-muted">{t("dash.switchRole")} (ديمو)</p>
                    {[
                      { label: "صيدلية", r: "pharmacy" as const, to: "/pharmacy" },
                      { label: "مشرف", r: "admin" as const, to: "/admin" },
                      { label: "مريض (الموقع)", r: "patient" as const, to: "/" },
                    ].map((x) => (
                      <button
                        key={x.r}
                        type="button"
                        onClick={() => {
                          signIn(x.r);
                          toast(`تم التبديل إلى دور «${x.label}» (ديمو).`);
                          router.push(x.to);
                        }}
                        className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm font-bold hover:bg-brand-mint/60", role === x.r && "text-brand")}
                      >
                        <Repeat className="size-4" /> {x.label}
                      </button>
                    ))}
                    <div className="my-1 h-px bg-navy/5" />
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        router.push("/login");
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm font-bold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="size-4" /> {t("dash.signout")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {hydrated ? (
            <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
              {children}
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="skeleton h-10 w-60" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-28 !rounded-[1.5rem]" />
                ))}
              </div>
              <div className="skeleton h-72 !rounded-[1.5rem]" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
