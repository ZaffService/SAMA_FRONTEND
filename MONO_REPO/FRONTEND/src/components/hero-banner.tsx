"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Gift, BookOpen, Star } from "lucide-react";
import { AnimatedMascot } from "@/components/animated-mascot";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

// Typewriter hook
function useTypewriter(words: string[], speed = 100, delayBetween = 2000) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[index];

    if (!isDeleting && subIndex < current.length) {
      setTimeout(() => setSubIndex(subIndex + 1), speed);
      return;
    }

    if (!isDeleting && subIndex === current.length) {
      setTimeout(() => setIsDeleting(true), delayBetween);
      return;
    }

    if (isDeleting && subIndex > 0) {
      setTimeout(() => setSubIndex(subIndex - 1), speed / 2);
      return;
    }

    if (isDeleting && subIndex === 0) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }
  }, [subIndex, isDeleting, index, words, speed, delayBetween]);

  return words[index].substring(0, subIndex);
}


// Données des témoignages - VRAIS TÉMOIGNAGES BIBOCOM DIGITAL
const testimonials = [
  {
    id: 1,
    name: "Youssouf Issa Bilal",
    image: "/avatars/avatar1.jpg",
    rating: 5,
    comment:
      "De la découverte en ligne à la réussite professionnelle : mon parcours avec Bibocom Digital",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: 2,
    name: "Nogoye Gueye",
    image: "/avatars/avatar2.jpg",
    rating: 5,
    comment:
      "Chez Bibocom Digital, chaque formation est une expérience qui révèle des talents, forge des compétences et redéfinit des parcours.",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: 3,
    name: "Fatou Sow",
    image: "/avatars/avatar3.jpg",
    rating: 5,
    comment:
      "Mon parcours de reconversion avec BiBocom Digital : une renaissance professionnelle",
    color: "from-pink-500 to-pink-600",
  },
  {
    id: 4,
    name: "Mamadou Lamine Djiba",
    image: "/avatars/avatar4.jpg",
    rating: 5,
    comment:
      "Quand une simple visite devient une révélation.",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    id: 5,
    name: "El Hadji Ibrahima Fall",
    image: "/avatars/avatar5.jpg",
    rating: 5,
    comment:
      "Le Digital a transformé ma vision du monde... grâce à Bibocom Digital.",
    color: "from-teal-500 to-teal-600",
  },
];

// Composant pour chaque cercle de témoignage (DESKTOP uniquement)
const TestimonialCircle = ({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cercle principal */}
      <div
        className={`w-11 h-11 rounded-full bg-gradient-to-br ${testimonial.color} border-3 border-white cursor-pointer
          transition-all duration-300 hover:scale-110 hover:shadow-lg relative z-10
          ${isHovered ? "ring-4 ring-white ring-opacity-50 scale-110" : ""}`}
        style={{
          animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
          animationDelay: `${index * 0.2}s`,
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
          {testimonial.name.charAt(0)}
        </div>
      </div>

      {/* Carte de témoignage au survol - SORT PAR LE HAUT */}
      {isHovered && (
        <div
          className="fixed z-[9999] animate-slide-down-bounce"
          style={{
            left: "50%",
            top: "20%",
            transform: "translateX(-50%)",
            minWidth: "320px",
            maxWidth: "380px",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-slate-100 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center shadow-lg animate-ping-once`}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 mt-2">
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
              >
                {testimonial.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-base">
                  {testimonial.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 mb-3">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="text-xs text-slate-500 ml-2">
                ({testimonial.rating}.0/5)
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="text-blue-600 font-bold text-xl">"</span>
              {testimonial.comment}
              <span className="text-blue-600 font-bold text-xl">"</span>
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-green-600">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">Témoignage vérifié</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant Carte de témoignage pour mobile (MOBILE uniquement)
const TestimonialCard = ({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0];
}) => {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg shadow-md`}
        >
          {testimonial.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="font-bold text-slate-900 text-sm">
            {testimonial.name}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-2">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      <p className="text-sm text-slate-600 leading-relaxed italic">
        "{testimonial.comment}"
      </p>
    </div>
  );
};

export const HeroBanner = () => {
  const { isAuthenticated } = useLocalAuth();

  // Masquer la bannière si l'utilisateur est connecté
  if (isAuthenticated) {
    return null;
  }

  const titleWords = [
    "Marketing Digital",
    "Community Management",
    "Content Marketing",
    "Social Media",
  ];
  const animatedText = useTypewriter(titleWords, 90, 1600);

  const [showCursor, setShowCursor] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] bg-white overflow-visible pt-16 lg:pt-0">
      {/* Background subtil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-slate-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-56 sm:w-80 lg:w-[500px] h-56 sm:h-80 lg:h-[500px] bg-slate-100 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* LEFT CONTENT */}
          <div className="space-y-4 sm:space-y-5 lg:space-y-6 animate-fade-in-up">
            {/* BADGE */}
            <div className="inline-block">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 rounded-full border border-green-200">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span className="text-xs sm:text-sm font-semibold text-green-700">
                  Tutos gratuits disponibles !
                </span>
              </div>
            </div>

            {/* TITLE H1 */}
            <h1 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
              <span className="block text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-semibold tracking-wide text-slate-700 mb-2 sm:mb-3">
                Maîtrisez
              </span>
              <span className="text-blue-600 font-extrabold">
                Le {animatedText}
              </span>
            </h1>

            {/* Mini ligne descriptive */}
            <p className="text-xs sm:text-sm lg:text-base text-slate-500 italic -mt-2 sm:-mt-3 lg:-mt-4">
              Devenez un expert du digital grâce à nos formations premium.
            </p>

            {/* SUB HEADING */}
            <p className="text-lg sm:text-xl lg:text-3xl font-semibold text-slate-700 leading-tight">
              Formations pratiques pour réussir en ligne
            </p>

            {/* DESCRIPTION */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed font-medium">
              Apprenez les stratégies qui fonctionnent vraiment pour booster
              votre présence en ligne.
            </p>

            {/* Points clés */}
            <div className="flex flex-wrap gap-3 sm:gap-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-green-500 text-base sm:text-lg">✓</span>
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  Formation pratique
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-green-500 text-base sm:text-lg">✓</span>
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  Résultats garantis
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-green-500 text-base sm:text-lg">✓</span>
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  Support inclus
                </span>
              </div>
            </div>

            {/* CTA BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <Button
                size="lg"
                className="group bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg font-bold rounded-xl transition-all hover:scale-105"
                onClick={() =>
                  document
                    .getElementById("formations")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Commencer maintenant
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-4 sm:px-6 py-4 sm:py-6 text-sm sm:text-base font-semibold rounded-xl transition-all hover:scale-105 flex items-center gap-1.5 sm:gap-2"
                onClick={() => {
                  // Déclencher l'événement pour activer les tutos gratuits
                  window.dispatchEvent(
                    new CustomEvent("activateFreeTutorials"),
                  );
                  // Scroll vers la section formations
                  document
                    .getElementById("formations")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                Tutos gratuits
              </Button>
            </div>

            {/* SOCIAL PROOF - VERSION DESKTOP uniquement (masqué complètement sur mobile) */}
            <div className="hidden md:block bg-white rounded-2xl p-5 border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Cercles de témoignages interactifs */}
                <div className="flex -space-x-3 relative">
                  {testimonials.map((testimonial, index) => (
                    <TestimonialCircle
                      key={testimonial.id}
                      testimonial={testimonial}
                      index={index}
                    />
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      5,000+
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      étudiants satisfaits
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="text-yellow-400 text-base">
                        ★
                      </span>
                    ))}
                    <span className="text-xs text-slate-500 ml-1">
                      (4.9/5) • 1,200+ avis
                    </span>
                  </div>
                </div>
              </div>

              {/* Message d'instruction */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 text-center">
                  ✨ Survolez les cercles pour découvrir les témoignages
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative animate-fade-in-right">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-2xl blur-2xl transform rotate-6 opacity-30" />
              <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200">
                <Image
                  src="/african-woman-professional-with-tablet-smiling--mo.jpg"
                  alt="Femme professionnelle étudiant le marketing digital"
                  width={600}
                  height={700}
                  className="w-full h-auto object-cover"
                  priority
                />

                {/* FLOATING CARD */}
                <div className="absolute bottom-6 right-6 bg-white rounded-xl p-4 border-2 border-green-100 animate-float-delayed">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        Formation validée
                      </div>
                      <div className="text-xs text-green-600 font-semibold">
                        98% de satisfaction
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DECORATIONS */}
            <div className="absolute -top-4 -right-4 w-16 h-16 border-4 border-slate-200 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 border-4 border-slate-200 rounded-full" />
          </div>
        </div>
      </div>
      {/* FOOT GRADIENT */}

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default HeroBanner;