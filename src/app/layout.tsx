import type { Metadata, Viewport } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/shared/Toaster";
import LangSync from "@/components/shared/LangSync";
import ScrollProgress from "@/components/animations/ScrollProgress";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "دوانو | دواءك أقرب مما تتخيل", template: "%s | دوانو" },
  description:
    "دوانو منصة اكتشاف صيدليات: حدد مكانك، واكتب اسم الدواء، واعرف الصيدليات اللي أعلنت عن توفره. نسخة عرض تجريبية ببيانات خيالية.",
  applicationName: "Dwano",
  keywords: ["دوانو", "Dwano", "صيدلية", "دواء", "الفيوم", "بحث عن دواء"],
};

export const viewport: Viewport = {
  themeColor: "#07131F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`}>
      <body>
        <LangSync />
        <ScrollProgress />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
