import type { Metadata } from "next";
import { FlaskConical, Mail, MapPin } from "lucide-react";
import ContactForm from "@/components/shared/ContactForm";
import RevealText from "@/components/animations/RevealText";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "أرسل استفسارك أو اقتراحك لفريق دوانو (نموذج تجريبي).",
};

export default function ContactPage() {
  return (
    <div className="bg-ice pb-24 pt-32">
      <div className="mx-auto grid max-w-5xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">تواصل معنا</span>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            <RevealText text="سيبلنا رسالة" immediate />
          </h1>
          <p className="mt-4 text-base font-medium leading-loose text-muted">أي سؤال أو اقتراح، أو لو أنت صيدلي وعايز تنضم، اكتبلنا.</p>
          <ul className="mt-8 space-y-4 text-sm font-semibold">
            <li className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-mint text-brand-deep">
                <MapPin className="size-5" />
              </span>
              محافظة الفيوم، مصر
            </li>
            <li className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-mint text-brand-deep">
                <Mail className="size-5" />
              </span>
              <span dir="ltr">hello@dwano.example</span>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-navy/10 bg-white p-4 text-xs font-medium leading-relaxed text-muted">
              <FlaskConical className="mt-0.5 size-4 shrink-0 text-brand" />
              البريد والنموذج هنا للعرض فقط، ولن تصل أي رسالة لأي جهة.
            </li>
          </ul>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
