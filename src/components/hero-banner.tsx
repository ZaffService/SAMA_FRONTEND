"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Gift, BookOpen, Star } from "lucide-react";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

const HeroBanner = () => {
  const { isAuthenticated } = useLocalAuth();

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero Banner Image avec Texte et Boutons */}
      <div className="relative w-full min-h-[500px] sm:min-h-[600px] lg:min-h-0 pt-[68px] lg:pt-0">
        {/* Image de fond avec padding-top mobile pour éviter la troncature */}
        <img
          src="/Baniere.png"
          alt="BIBOCOM Digital - Formations en ligne"
          className="w-full h-full object-cover absolute inset-0 lg:relative lg:inset-auto lg:h-auto pt-8 sm:pt-10 lg:pt-0"
        />

        {/* Overlay gradient pour mobile - meilleure lisibilité du texte blanc */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bibocom-blue)]/90 via-[var(--bibocom-blue)]/70 to-transparent lg:from-transparent lg:via-transparent lg:to-transparent" />

        {/* Contenu superposé */}
        <div className="absolute inset-0 flex items-center px-4 sm:px-8 md:pl-12 lg:pl-20 pt-4 lg:pt-0">
          <div className="max-w-full sm:max-w-xl lg:max-w-3xl">
            {/* Titre principal - Responsive avec tailles adaptées */}
            <h1 className="text-white font-bold text-2xl sm:text-3xl md:text-4xl lg:text-[3.5rem] xl:text-[4rem] leading-tight lg:leading-[1.1] mb-4 sm:mb-6">
              Développez vos compétences
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              digitales et professionnelles
            </h1>

            {/* Sous-titre - Responsive */}
            <p className="text-white/95 sm:text-white text-sm sm:text-base lg:text-[1.1rem] font-normal mb-6 sm:mb-8 leading-relaxed">
              Formations certifiantes 100% en ligne avec
              <br className="hidden lg:block" />
              <span className="lg:hidden"> </span>
              BIBOCOM Digital
            </p>

            {/* Boutons CTA - Empilés en colonne sur mobile, en ligne sur desktop */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Bouton rouge plein */}
              <button className="bg-[var(--hero-button-primary)] hover:bg-[var(--hero-button-primary-hover)] text-[var(--hero-text)] px-5 sm:px-7 py-3 rounded-md font-semibold transition-all duration-200 text-sm sm:text-[0.95rem] shadow-lg w-full sm:w-auto text-center">
                Découvrir les formations
              </button>

              {/* Bouton outline blanc */}
              <button className="bg-transparent border-2 border-[var(--hero-text)] hover:bg-[var(--hero-text)]/10 text-[var(--hero-text)] px-5 sm:px-7 py-3 rounded-md font-semibold transition-all duration-200 text-sm sm:text-[0.95rem] w-full sm:w-auto text-center">
                Commencer maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;