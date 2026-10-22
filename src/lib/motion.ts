import type { Variants } from "framer-motion";

/** One easing curve for the whole product so motion feels coherent. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DURATION = { fast: 0.25, base: 0.6, slow: 0.9 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base + 0.1, ease: EASE } },
};

export const staggerParent = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});
