"use client";
import { useEffect, useState } from "react";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

// Composant Typewriter avec effet machine à écrire
const TypewriterText = ({ words }: { words: string[] }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    const typingSpeed = isDeleting ? 50 : 100; // Effacement plus rapide

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Phase d'écriture
        if (currentText.length < currentWord.length) {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        } else {
          // Pause de 2 secondes avant d'effacer
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Phase d'effacement
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout); // Cleanup pour éviter les fuites mémoire
  }, [currentText, isDeleting, currentWordIndex, words]);

  return (
    <span className="inline">
      {currentText}
      <span className="animate-pulse text-[#E74C3C]">|</span> {/* Curseur clignotant rouge */}
    </span>
  );
};

const HeroBanner = () => {
  const { isAuthenticated } = useLocalAuth();

  // Textes à afficher dans le Typewriter
  const titleWords = [
    "Apprenez dans votre langue.",
    "Comprenez vraiment.",
    "Réussissez pour de vrai.",
  ];

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden mt-[90px] lg:mt-0">
      {/* Hero Banner Image avec Texte et Boutons */}
      <div className="relative w-full min-h-[500px] sm:min-h-[600px] lg:min-h-0">
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
            {/* Titre H1 avec effet Typewriter */}
            <p className=" text-white font-bold leading-tight mb-4 sm:mb-6 min-h-[100px] sm:min-h-[120px] lg:min-h-[250px]">
  <TypewriterText words={titleWords} />
</p>

            {/* Paragraphe descriptif statique */}
            <p className="text-white/90 text-sm sm:text-base lg:text-[1.1rem] font-normal mb-6 sm:mb-8 leading-relaxed">
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