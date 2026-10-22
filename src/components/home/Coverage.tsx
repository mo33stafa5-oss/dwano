"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/animations/AnimatedCounter";
import RevealText from "@/components/animations/RevealText";
import Reveal from "@/components/animations/Reveal";
import { districts } from "@/data/locations";
import { pharmacies } from "@/data/pharmacies";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/** Schematic node positions (NOT geographically exact). */
const NODES: Record<string, { x: number; y: number }> = {
  "youssef-el-seddik": { x: 150, y: 110 },
  ibshaway: { x: 105, y: 215 },
  fayoum: { x: 290, y: 205 },
  sinnuris: { x: 215, y: 135 },
  tamiya: { x: 400, y: 150 },
  itsa: { x: 235, y: 320 },
};

const LINKS: [string, string][] = [
  ["fayoum", "sinnuris"],
  ["fayoum", "tamiya"],
  ["fayoum", "itsa"],
  ["sinnuris", "youssef-el-seddik"],
  ["ibshaway", "youssef-el-seddik"],
  ["ibshaway", "itsa"],
  ["sinnuris", "ibshaway"],
];

export default function Coverage() {
  const [hover, setHover] = useState<string | null>(null);
  const counts = Object.fromEntries(districts.map((d) => [d.id, pharmacies.filter((p) => p.districtId === d.id).length]));

  return (
    <section id="coverage" className="bg-ice py-24 sm:py-32" aria-labelledby="coverage-title">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">التغطية الجغرافية</span>
          <h2 id="coverage-title" className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            <RevealText text="بنبدأ من الفيوم" /> <RevealText text="وبعدين مصر كلها" wordClassName="text-gradient-dark" delay={0.2} />
          </h2>
        </div>

        <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <div className="card relative overflow-hidden bg-gradient-to-br from-white to-brand-mint/40 p-4 sm:p-6">
              <svg viewBox="0 0 500 400" className="h-auto w-full" role="img" aria-label="رسم تخطيطي لمراكز الفيوم الستة">
                <defs>
                  <pattern id="cv-dots" width="22" height="22" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.2" fill="rgba(16,42,67,.12)" />
                  </pattern>
                </defs>
                <rect width="500" height="400" fill="url(#cv-dots)" />
                <path
                  d="M70 190 C70 100 150 50 240 62 S420 80 455 160 S430 330 330 360 S110 350 80 280 Z"
                  fill="rgba(0,143,115,.07)"
                  stroke="rgba(0,143,115,.35)"
                  strokeWidth="2"
                  strokeDasharray="5 7"
                />
                <ellipse cx="120" cy="125" rx="55" ry="22" fill="rgba(14,165,233,.12)" stroke="rgba(14,165,233,.3)" />
                {LINKS.map(([a, b], i) => (
                  <motion.line
                    key={i}
                    x1={NODES[a].x}
                    y1={NODES[a].y}
                    x2={NODES[b].x}
                    y2={NODES[b].y}
                    stroke="rgba(0,143,115,.35)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, margin: "-20%" }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.1, ease: EASE }}
                  />
                ))}
                {districts.map((d, i) => {
                  const n = NODES[d.id];
                  const on = hover === d.id;
                  return (
                    <g
                      key={d.id}
                      onMouseEnter={() => setHover(d.id)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(d.id)}
                      onBlur={() => setHover(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${d.nameAr}: ${counts[d.id]} صيدلية تجريبية`}
                      className="cursor-pointer outline-none"
                    >
                      <motion.circle
                        cx={n.x}
                        cy={n.y}
                        r={on ? 30 : 22}
                        fill="rgba(43,217,176,.22)"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 160, damping: 14 }}
                        style={{ transformOrigin: `${n.x}px ${n.y}px`, transition: "r .3s" }}
                      />
                      <circle cx={n.x} cy={n.y} r={on ? 12 : 9} fill={on ? "#008F73" : "#fff"} stroke="#008F73" strokeWidth="3" style={{ transition: "all .3s" }} />
                      <text x={n.x} y={n.y + 38} textAnchor="middle" fontSize="15" fontWeight="800" fill="#102A43">
                        {d.nameAr}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p className="mt-2 text-center text-[11px] font-semibold text-muted">
                رسم تخطيطي توضيحي غير دقيق جغرافيًا · نقاط التغطية تجريبية.
              </p>
            </div>
          </Reveal>

          <div>
            <div className="grid grid-cols-2 gap-3">
              {districts.map((d, i) => (
                <Reveal key={d.id} delay={i * 0.06}>
                  <div
                    onMouseEnter={() => setHover(d.id)}
                    onMouseLeave={() => setHover(null)}
                    className={cn(
                      "card p-4 transition",
                      hover === d.id && "border-brand/50 shadow-glow -translate-y-0.5"
                    )}
                  >
                    <p className="text-sm font-extrabold">{d.nameAr}</p>
                    <p className="mt-1 text-2xl font-black text-brand">
                      <AnimatedCounter value={counts[d.id]} />
                    </p>
                    <p className="text-[11px] font-semibold text-muted">صيدلية تجريبية</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <p className="mt-4 rounded-2xl border border-navy/10 bg-white p-4 text-xs font-semibold leading-relaxed text-muted">
              الأرقام هنا بيانات خيالية لعرض التجربة، ولا تعني وجود صيدليات حقيقية مسجلة في دوانو حاليًا.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
