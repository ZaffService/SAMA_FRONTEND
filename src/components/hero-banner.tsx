"use client";
import Image from "next/image";
import { useState } from "react";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import Link from "next/link";

const HeroBanner = () => {
  const { isAuthenticated } = useLocalAuth();
  const [mobileImageLoaded, setMobileImageLoaded] = useState(false);
  const [desktopImageLoaded, setDesktopImageLoaded] = useState(false);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden -mt-[80px]">
      
      {/* ========== VERSION MOBILE ========== */}
      <div className="lg:hidden relative w-full h-[110vh]">
        
        {/* Skeleton Loader - affiché pendant le chargement */}
        {!mobileImageLoaded && (
          <div className="absolute inset-0 bg-gray-300 animate-pulse" />
        )}

        {/* Image de bannière en arrière-plan */}
        <Image
          src="/banner.png"
          alt="BIBOCOM Digital - Formations en ligne"
          fill
          className={`object-cover object-right transition-opacity duration-500 ${
            mobileImageLoaded ? "opacity-100" : "opacity-0"
          }`}
          priority={true}
          quality={90}
          sizes="100vw"
          onLoad={() => setMobileImageLoaded(true)}
        />

        {/* Contenu mobile - CENTRÉ VERTICALEMENT */}
        <div className="absolute inset-0 flex items-center justify-center px-5 z-10">
          <div className="w-full max-w-md space-y-5">
            {/* Titre */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-lg text-center">
              Apprenez dans votre langue.
            </h1>

            {/* Description */}
            <p className="text-white/95 text-base sm:text-lg font-normal leading-relaxed drop-shadow-md text-center">
              Formations Numériques et Créatives 100% pratiques,
              expliquées en langues locales, pour transformer
              la compréhension en compétences réelles et monétisables
              sans barrière technologique.
            </p>

            {/* Boutons d'action */}
            <div className="flex flex-col gap-3 pt-2">
              <Link 
                href="#formations" 
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-6 py-4 rounded-xl font-bold text-base transition-all duration-300 text-center shadow-2xl hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                Découvrir les formations
              </Link>
              <Link 
                href="/register" 
                className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-6 py-4 rounded-xl font-bold text-base transition-all duration-300 text-center backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                Commencer maintenant
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========== VERSION DESKTOP ========== */}
      <div className="hidden lg:block relative w-full h-[110vh] min-h-[700px]">
        
        {/* Skeleton Loader - affiché pendant le chargement */}
        {!desktopImageLoaded && (
          <div className="absolute inset-0 bg-gray-300 animate-pulse" />
        )}

        {/* Image de bannière - positionnée pour montrer la dame */}
        <Image
          src="/2.svg"
          alt="BIBOCOM Digital - Formations en ligne"
          fill
          className={`object-cover object-center transition-opacity duration-500 ${
            desktopImageLoaded ? "opacity-100" : "opacity-0"
          }`}
          priority={true}
          quality={95}
          sizes="100vw"
          onLoad={() => setDesktopImageLoaded(true)}
        />

        {/* Contenu desktop - CENTRÉ VERTICALEMENT comme dans la maquette */}
        <div className="absolute inset-0 flex items-center justify-start px-8 md:px-16 lg:px-20 xl:px-32 z-10">
          <div className="max-w-3xl">
            
            {/* Titre principal */}
            <h1 className="text-5xl xl:text-6xl 2xl:text-7xl font-extrabold text-white leading-[1.15] mb-8 drop-shadow-2xl">
              Apprenez dans votre<br />langue.
            </h1>

            {/* Description */}
            <p className="text-white/95 text-lg xl:text-xl 2xl:text-2xl font-normal leading-relaxed mb-10 max-w-2xl drop-shadow-lg">
              Formations Numériques et Créatives 100% pratiques,
              expliquées en langues locales, pour transformer
              la compréhension en compétences réelles et monétisables
              sans barrière technologique.
            </p>

            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-5">
              <Link 
                href="#formations" 
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-10 py-5 rounded-xl font-bold text-lg xl:text-xl transition-all duration-300 shadow-2xl hover:shadow-red-500/50 hover:scale-[1.05] active:scale-[0.98] inline-block"
              >
                Découvrir les formations
              </Link>
              <Link 
                href="/register" 
                className="bg-transparent border-2 border-white hover:bg-white hover:text-[#1e3a8a] text-white px-10 py-5 rounded-xl font-bold text-lg xl:text-xl transition-all duration-300 backdrop-blur-sm hover:scale-[1.05] active:scale-[0.98] inline-block"
              >
                Commencer maintenant
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
