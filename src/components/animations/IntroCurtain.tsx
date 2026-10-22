import { LogoMark } from "@/components/shared/Logo";

/**
 * Brand intro (~1.5s). Pure CSS so it needs no JS, never blocks input
 * (pointer-events-none) and disappears instantly for reduced-motion users.
 */
export default function IntroCurtain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex animate-intro-out items-center justify-center bg-navy-900 motion-reduce:hidden"
    >
      <div className="flex animate-intro-logo flex-col items-center gap-4">
        <LogoMark size={72} />
        <span className="text-3xl font-extrabold tracking-tight text-white">دوانو</span>
      </div>
    </div>
  );
}
