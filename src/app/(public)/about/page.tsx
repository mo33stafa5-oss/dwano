import type { Metadata } from "next";
import { Compass, Eye, HeartPulse, ShieldCheck } from "lucide-react";
import RevealText from "@/components/animations/RevealText";
import Reveal from "@/components/animations/Reveal";
import FinalCta from "@/components/home/FinalCta";

export const metadata: Metadata = {
  title: "من نحن",
  description: "رسالة دوانو ورؤيتها وقصة الفكرة: دواءك أقرب مما تتخيل.",
};

const VALUES = [
  { icon: ShieldCheck, title: "الشفافية", text: "نعرض وقت آخر تحديث لكل معلومة، ونعلّم البيانات القديمة بوضوح." },
  { icon: HeartPulse, title: "احترام المريض", text: "لا نقدّم استشارات طبية ولا نرشّح بدائل: دورنا أن نختصر عليك البحث فقط." },
  { icon: Compass, title: "البساطة", text: "بحث واضح وسريع بالعربية، يعمل جيدًا على أي هاتف." },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-900 pb-24 pt-36 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(0,143,115,.5),transparent_60%)]" />
          <div className="grid-lines absolute inset-0" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-glow">من نحن</span>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
            <RevealText text="بنقرّب" immediate /> <RevealText text="الدوا منك" immediate delay={0.15} wordClassName="text-gradient" />
          </h1>
          <Reveal delay={0.3}>
            <p className="mx-auto mt-6 max-w-xl text-base font-medium leading-loose text-white/70">
              دوانو فكرة بسيطة: بدل ما تلف على صيدليات كتير، تعرف من مكانك أنهي صيدلية أعلنت عن توفر دواءك.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-ice py-20">
        <div className="mx-auto grid max-w-5xl gap-6 px-5 md:grid-cols-2">
          <Reveal>
            <div className="card h-full p-8">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white">
                <Compass className="size-6" />
              </span>
              <h2 className="mt-5 text-2xl font-black">رسالتنا</h2>
              <p className="mt-3 text-sm font-medium leading-loose text-muted">
                تسهيل الوصول إلى معلومات توافر الأدوية في الصيدليات القريبة، بطريقة واضحة وصادقة وسريعة.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="card h-full p-8">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-mint text-brand-deep">
                <Eye className="size-6" />
              </span>
              <h2 className="mt-5 text-2xl font-black">رؤيتنا</h2>
              <p className="mt-3 text-sm font-medium leading-loose text-muted">
                أن تصبح دوانو الخطوة الأولى لأي شخص يبحث عن دواء في مصر، بدءًا من محافظة الفيوم ثم باقي المحافظات.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mx-auto mt-16 max-w-5xl px-5">
          <h2 className="text-center text-3xl font-black">قيمنا</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="card h-full p-7 hover:-translate-y-1 hover:shadow-lift">
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-mint text-brand-deep">
                    <v.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-black">{v.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-loose text-muted">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl rounded-2xl border border-navy/10 bg-white p-4 text-center text-xs font-semibold leading-relaxed text-muted">
            هذه نسخة عرض تجريبية. كل الصيدليات والأرقام وأرقام الهواتف خيالية، ولا يوجد فريق أو شركاء حقيقيون معروضون هنا.
          </p>
        </div>
      </section>
      <FinalCta />
    </>
  );
}
