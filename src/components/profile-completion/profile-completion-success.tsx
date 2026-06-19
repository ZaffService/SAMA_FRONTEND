"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function ProfileCompletionSuccess() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-10 text-center sm:py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.50_0.24_268)] to-[oklch(0.62_0.22_285)] shadow-lg shadow-[oklch(0.50_0.24_268)]/30"
      >
        <CheckCircle2 className="h-10 w-10 text-white" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-slate-900 sm:text-3xl"
      >
        Profil complété !
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-base"
      >
        Tout est prêt. Bienvenue sur Bibocom — votre parcours personnalisé vous
        attend.
      </motion.p>
    </motion.div>
  );
}
