"use client";
import { useEffect, useState } from "react";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

// Composant Typewriter avec effet machine à écrire
const TypewriterText = ({
  words,
  className,
}: {
  words: string[];
  className?: string;
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    const typingSpeed = isDeleting ? 50 : 100;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < currentWord.length) {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words]);

  console.log("[v0] TypewriterText rendering with className:", className, "currentText:", currentText);
  
  return (
    <span 
      className={className}
      style={{
        fontSize: 'clamp(1.5rem, 5vw, 4rem)',
        fontWeight: 700,
        color: 'white',
        lineHeight: 1.1,
        display: 'block'
      }}
    >
      {currentText}
      <span className="animate-pulse" style={{ color: 'var(--bibocom-red)' }}>|</span>
    </span>
  );
};

const HeroBanner = () => {
  const { isAuthenticated } = useLocalAuth();

  const titleWords = [
    "Apprenez dans votre langue.",
    "Comprenez vraiment.",
    "Réussissez pour de vrai.",
  ];

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden pt-24 sm:pt-28 lg:pt-0">
      <div className="relative w-full min-h-[500px] sm:min-h-[600px] lg:min-h-0">
        <img
          src="/Baniere.png"
          alt="BIBOCOM Digital - Formations en ligne"
          className="w-full h-full object-cover lg:h-auto absolute inset-0 lg:relative lg:inset-auto"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bibocom-blue)]/90 via-[var(--bibocom-blue)]/70 to-transparent lg:from-transparent lg:via-transparent lg:to-transparent" />

        <div className="absolute inset-0 flex items-center px-4 sm:px-8 md:px-12 lg:px-20">
          <div className="max-w-full sm:max-w-xl lg:max-w-3xl">
            
            {/* H1 TYPEWRITER */}
            <div className="mb-4 sm:mb-6 min-h-[80px] sm:min-h-[100px] lg:min-h-[140px]">
              <TypewriterText
                words={titleWords}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.5rem] xl:text-[4rem] font-bold text-[var(--hero-text)] leading-tight lg:leading-[1.1]"
              />
            </div>

            <p className="!text-[var(--hero-text)]/90 !text-sm sm:!text-base lg:!text-[1.1rem] !font-normal mb-6 sm:mb-8 !leading-relaxed">
              Formations Numériques et Créatives 100% pratiques,
              <br className="hidden lg:block" />
              <span className="lg:hidden"> </span>
              expliquées en langues locales, pour transformer
              <br className="hidden lg:block" />
              <span className="lg:hidden"> </span>
              la compréhension en compétences réelles et monétisables
              <br className="hidden lg:block" />
              <span className="lg:hidden"> </span>
              sans barrière technologique.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button className="!bg-[var(--bibocom-red)] hover:!bg-[var(--hero-button-primary-hover)] !text-[var(--hero-text)] px-5 sm:px-7 py-3 rounded-md !font-semibold transition-all !text-sm sm:!text-[0.95rem] shadow-lg w-full sm:w-auto text-center">
                Découvrir les formations
              </button>
              <button className="!bg-transparent !border-2 !border-[var(--hero-button-secondary)] hover:!bg-[var(--hero-button-secondary)]/10 !text-[var(--hero-text)] px-5 sm:px-7 py-3 rounded-md !font-semibold transition-all !text-sm sm:!text-[0.95rem] w-full sm:w-auto text-center">
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
