"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";

/** Enter-only transition: it never delays or blocks navigation or back/forward. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
      {children}
    </motion.div>
  );
}
