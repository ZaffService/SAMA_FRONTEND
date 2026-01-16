"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Gift, BookOpen, Star } from "lucide-react";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

// Composant TypewriterText
interface TypewriterTextProps {
  words: string[];
  className?: string;
}

const TypewriterText = ({ words, className = "" }: TypewriterTextProps) => {
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

  return (
    <span className={className}>
      {currentText}
      <span
        className="
    animate-pulse
    !text-blue-600
    !text-sm
    sm:!text-base
    md:!text-xl
    lg:!text-3xl
    xl:!text-4xl
  "
      >
        |
      </span>
    </span>
  );
};

// Données des témoignages
const testimonials = [
  {
    id: 1,
    name: "Youssouf Issa Bilal",
    rating: 5,
    comment:
      "De la découverte en ligne à la réussite professionnelle : mon parcours avec Bibocom Digital",
    color: "from-yellow-400 to-yellow-500",
    initial: "Y",
  },
  {
    id: 2,
    name: "Nogoye Gueye",
    rating: 5,
    comment:
      "Chez Bibocom Digital, chaque formation est une expérience qui révèle des talents, forge des compétences et redéfinit des parcours.",
    color: "from-slate-700 to-slate-800",
    initial: "N",
  },
  {
    id: 3,
    name: "Fatou Sow",
    rating: 5,
    comment:
      "Mon parcours de reconversion avec BiBocom Digital : une renaissance professionnelle",
    color: "from-pink-500 to-pink-600",
    initial: "F",
  },
  {
    id: 4,
    name: "Mamadou Lamine Djiba",
    rating: 5,
    comment: "Quand une simple visite devient une révélation.",
    color: "from-blue-500 to-blue-600",
    initial: "M",
  },
  {
    id: 5,
    name: "El Hadji Ibrahima Fall",
    rating: 5,
    comment:
      "Le Digital a transformé ma vision du monde... grâce à Bibocom Digital.",
    color: "from-red-500 to-red-600",
    initial: "E",
  },
];

const TestimonialCircle = ({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
          {testimonial.initial}
        </div>
      </div>

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
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center shadow-lg`}
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
                {testimonial.initial}
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

export const HeroBanner = () => {
  const { isAuthenticated } = useLocalAuth();

  if (isAuthenticated) {
    return null;
  }

  const titleWords = [
    "Les Réseaux Sociaux",
    "Le Marketing Digital",
    "Le Community Management",
    "Le Content Marketing",
  ];

  return (
    <section className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] bg-white overflow-visible pt-16 lg:pt-5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-slate-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-56 sm:w-80 lg:w-[500px] h-56 sm:h-80 lg:h-[500px] bg-slate-100 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          <div className="space-y-4 sm:space-y-5 lg:space-y-6 animate-fade-in-up">
            <div className="inline-block">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-full border border-blue-200">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-xs sm:text-sm font-semibold text-blue-700">
                  Tutos gratuits disponibles !
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm sm:text-base text-slate-600 mb-2 font-medium">
                Maîtrisez
              </p>
              <h1 className="font-black text-blue-600">
                <TypewriterText
                  words={titleWords}
                  className="
    !text-sm
    sm:!text-base
    md:!text-xl
    lg:!text-3xl
    xl:!text-4xl
    leading-tight
  "
                />
              </h1>
            </div>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
              Devenez un expert du digital grâce à nos formations premium.
            </p>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                Formations pratiques pour réussir en ligne
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Apprenez les stratégies qui fonctionnent vraiment pour booster
                votre présence en ligne.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-sm font-medium text-slate-700">
                  Formation pratique
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-sm font-medium text-slate-700">
                  Résultats garantis
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-sm font-medium text-slate-700">
                  Support inclus
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold rounded-lg transition-all"
                onClick={() => (window.location.href = "/register")}
              >
                Commencer maintenant
                <svg
                  className="w-5 h-5 ml-2"
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
                className="border-2 border-slate-800 text-slate-800 hover:bg-green-500 hover:border-green-500 hover:text-white px-6 py-3 text-base font-semibold rounded-lg transition-all flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Tutos gratuits
              </Button>
            </div>

            <div className="hidden md:block bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex -space-x-3">
                  {testimonials.map((testimonial, index) => (
                    <TestimonialCircle
                      key={testimonial.id}
                      testimonial={testimonial}
                      index={index}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">
                    5,000+ étudiants satisfaits
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-lg">
                    ★
                  </span>
                ))}
                <span className="text-sm text-slate-600">
                  (4.9/5) • 1,200+ avis
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>✨</span>
                <span>Survolez les cercles pour découvrir les témoignages</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in-right">
            <div className="relative bg-gradient-to-br from-cyan-100 to-blue-200 rounded-3xl overflow-hidden">
              <Image
                src="/african-woman-professional-with-tablet-smiling--mo.jpg"
                alt="Femme professionnelle étudiant le marketing digital"
                width={600}
                height={700}
                className="w-full h-auto object-cover"
                priority
              />

              <div className="absolute bottom-6 right-6 bg-white rounded-xl p-4 shadow-lg border-2 border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
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
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default HeroBanner;
