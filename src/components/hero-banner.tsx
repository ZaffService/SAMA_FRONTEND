"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import Link from "next/link";

type HeroStat = {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
};

const heroStats: HeroStat[] = [
  { value: 5000, label: "Apprenants",prefix: "+ ", suffix: "" },
  { value: 85, label: "Femmes", suffix: "%" },
  { value: 92, label: "Taux de reussite", prefix: "+ ", suffix: "%" },
];

const HeroBanner = () => {
  const { isAuthenticated } = useLocalAuth();
  const [mobileImageLoaded, setMobileImageLoaded] = useState(false);
  const [desktopImageLoaded, setDesktopImageLoaded] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<number[]>(
    () => heroStats.map(() => 0)
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setAnimatedValues(heroStats.map((stat) => stat.value));
      return;
    }

    const durationMs = 1400;
    let startTime: number | null = null;
    let rafId = 0;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const eased = easeOutCubic(progress);
      setAnimatedValues(
        heroStats.map((stat) => Math.round(stat.value * eased))
      );

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId);
  }, []);

  const formatStatValue = (stat: HeroStat, value: number) =>
    `${stat.prefix ?? ""}${value}${stat.suffix ?? ""}`;

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden -mt-[80px] pt-[80px]">
      
      {/* ========== VERSION MOBILE ========== */}
      <div className="lg:hidden relative w-full h-[105vh] min-h-[650px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]">
        
        {/* Skeleton pendant chargement */}
        {!mobileImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] animate-pulse" />
        )}

        {/* Image de bannière */}
        <Image
          src="/banner.png"
          alt="BIBOCOM Digital - Formations en ligne"
          fill
          className={`object-cover object-right transition-opacity duration-700 ${
            mobileImageLoaded ? "opacity-100" : "opacity-0"
          }`}
          priority={true}
          quality={90}
          sizes="100vw"
          unoptimized={false}
          onLoad={() => setMobileImageLoaded(true)}
        />

        {/* Contenu mobile */}
        <div className="absolute inset-0 flex items-center justify-center px-5 z-10 ">
          <div className="w-full max-w-md space-y-5">
            <h1 
              className="text-3xl sm:text-4xl font-extrabold text-white leading-tight text-center"
              style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}
            >
              Apprenez dans votre langue.
            </h1>

            <p 
              className="text-white/95 text-base sm:text-lg font-normal leading-relaxed text-center"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)' }}
            >
              Formations Numériques et Créatives 100% pratiques,
              expliquées en langues locales, pour transformer
              la compréhension en compétences réelles et monétisables
              sans barrière technologique.
            </p>

            <div className="pt-2 flex flex-col items-center">
              <div className="inline-flex flex-col items-stretch gap-4">
                <div className="flex flex-col gap-3">
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

                <div className="mt-[200px] flex w-full items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
                  {heroStats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className={`flex-1 px-2 text-center ${
                        index > 0 ? "border-l border-white/25" : ""
                      }`}
                    >
                      <div className="text-lg sm:text-xl font-extrabold tracking-tight">
                        {formatStatValue(stat, animatedValues[index] ?? 0)}
                      </div>
                      <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-white/90">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== VERSION DESKTOP ========== */}
      <div className="hidden lg:block relative w-full h-[95vh] min-h-[750px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]">
        
        {/* Skeleton pendant chargement */}
        {!desktopImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] animate-pulse" />
        )}

        {/* Image de bannière */}
        <Image
          src="/banner.png"
          alt="BIBOCOM Digital - Formations en ligne"
          fill
          className={`object-cover object-center transition-opacity duration-700 ${
            desktopImageLoaded ? "opacity-100" : "opacity-0"
          }`}
          priority={true}
          quality={95}
          sizes="100vw"
          unoptimized={false}
          onLoad={() => setDesktopImageLoaded(true)}
        />

        {/* Contenu desktop */}
        <div className="absolute inset-0 flex items-center justify-start px-8 md:px-16 lg:px-20 xl:px-32 z-10">
          <div className="max-w-3xl">
            
            <h1 
              className="text-5xl xl:text-6xl 2xl:text-7xl font-extrabold text-white leading-[1.15] mb-8"
              style={{ textShadow: '0 6px 16px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.7)' }}
            >
              Apprenez dans votre<br />langue.
            </h1>

            <p 
              className="text-white/95 text-lg xl:text-xl 2xl:text-2xl font-normal leading-relaxed mb-10 max-w-2xl"
              style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}
            >
              Formations Numériques et Créatives 100% pratiques,
              expliquées en langues locales, pour transformer
              la compréhension en compétences réelles et monétisables
              sans barrière technologique.
            </p>

            <div className="inline-flex flex-col items-stretch gap-8">
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

              <div className="mt-[200px] flex w-full items-center justify-between gap-6 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-white backdrop-blur-sm">
                {heroStats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`flex-1 px-3 text-center ${
                      index > 0 ? "border-l border-white/25" : ""
                    }`}
                  >
                    <div className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                      {formatStatValue(stat, animatedValues[index] ?? 0)}
                    </div>
                    <div className="text-xs lg:text-sm font-semibold uppercase tracking-wide text-white/90">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
