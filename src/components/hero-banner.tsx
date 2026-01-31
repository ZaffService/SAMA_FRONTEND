"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Gift, BookOpen, Star } from "lucide-react";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

const HeroBanner = () => {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero Banner Image avec Texte et Boutons */}
      <div className="relative w-full">
        <img
          src="/Baniere.png"
          alt="BIBOCOM Digital - Formations en ligne"
          className="w-full h-auto object-cover"
        />

        {/* Contenu superposé - EXACTEMENT comme le vrai design */}
        <div className="absolute inset-0 flex items-center pl-12 md:pl-20">
          <div className="max-w-3xl">
            {/* Titre principal - GROS et GRAS sur 2 lignes */}
            <h1 className="text-white font-bold text-[3.5rem] md:text-[4rem] leading-[1.1] mb-6">
              Développez vos compétences
              <br />
              digitales et professionnelles
            </h1>

            {/* Sous-titre - Plus petit et normal */}
            <p className="text-white text-[1.1rem] font-normal mb-8 leading-relaxed">
              Formations certifiantes 100% en ligne avec
              <br />
              BIBOCOM Digital
            </p>

            {/* Boutons CTA - EXACTEMENT comme le design */}
            <div className="flex gap-4">
              {/* Bouton rouge plein */}
              <button className="bg-[#E74C3C] hover:bg-[#C0392B] text-white px-7 py-3 rounded-md font-semibold transition-all text-[0.95rem] shadow-lg">
                Découvrir les formations
              </button>

              {/* Bouton bleu outline */}
              <button className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-7 py-3 rounded-md font-semibold transition-all text-[0.95rem]">
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
