"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin brand-colored reading-progress bar. Grows from the right edge in RTL. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: "100% 50%" }}
      className="fixed inset-x-0 top-0 z-[80] h-[3px] bg-gradient-to-l from-brand-glow via-brand to-brand-deep"
    />
  );
}
