"use client";

import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface Props {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  strength?: number;
  ariaLabel?: string;
}

/** Subtle magnetic pull. Only active on fine-pointer, motion-allowed devices. */
export default function MagneticButton({ children, className, href, onClick, strength = 0.22, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy }} onPointerMove={onMove} onPointerLeave={reset} className="inline-block">
      {href ? (
        <Link href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
          {children}
        </Link>
      ) : (
        <button type="button" className={className} onClick={onClick} aria-label={ariaLabel}>
          {children}
        </button>
      )}
    </motion.div>
  );
}
