"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  /** animate right away on mount instead of when scrolled into view */
  immediate?: boolean;
}

/** Word-by-word masked reveal. Splits on words (never letters) so Arabic joining stays intact. */
export default function RevealText({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.07,
  immediate = false,
}: Props) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <span className={cn("inline", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} aria-hidden>
          <span className="inline-block overflow-hidden pb-[0.18em] align-bottom -mb-[0.18em] pt-[0.1em] -mt-[0.1em]">
            <motion.span
              className={cn("inline-block will-change-transform", wordClassName)}
              initial={reduce ? false : { y: "115%", opacity: 0 }}
              {...(immediate
                ? { animate: { y: 0, opacity: 1 } }
                : { whileInView: { y: 0, opacity: 1 }, viewport: { once: true, margin: "-8% 0px" } })}
              transition={{ duration: 0.85, ease: EASE, delay: delay + i * stagger }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
