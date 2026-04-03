"use client";

import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

const PresentielSection = () => {
  const { isAuthenticated } = useLocalAuth();

  if (isAuthenticated) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1d2b6a] via-[#1b245b] to-[#16214f] py-14 sm:py-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-10 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-4xl text-center text-white">
          <div className="flex items-center justify-center gap-3 text-2xl sm:text-3xl md:text-4xl font-extrabold">
            <GraduationCap className="h-8 w-8 sm:h-9 sm:w-9 text-[#facc15]" />
            <span>Formations Présentielles</span>
          </div>

          <p className="mt-4 text-base sm:text-lg text-white/85 leading-relaxed">
            Rejoignez nos formations en présentiel et apprenez directement avec
            nos formateurs experts. Informatique bureautique, design,
            développement web et bien plus !
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/courses"
              className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-[#e53935] px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-[#d1455b]/40 transition-all duration-300 hover:scale-[1.03] hover:bg-[#c13d52] active:scale-[0.98] animate-cta-blink motion-reduce:animate-none"
            >
              <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
              <span className="relative">Voir les formations présentielles</span>
              <ArrowRight className="relative h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PresentielSection;
