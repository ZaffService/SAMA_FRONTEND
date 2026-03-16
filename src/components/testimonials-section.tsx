"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Mariama Bailo Diallo",
    role: "Informatique Bureautique",
    content:
      "Grâce à cette formation en bureautique, je maîtrise désormais Word, Excel et PowerPoint. Aujourd’hui, je travaille avec assurance et efficacité dans mon entreprise.",
    rating: 5,
    avatar: "/Mariama.jpg",
  },
  {
    id: 2,
    name: "Mamadou Lamine Djiba",
    role: "Audiovisuel",
    content:
      "J’ai appris le montage vidéo, la prise de vue et le sound design. Les cours sont pratiques et m’ont permis de produire mes propres contenus professionnels.",
    rating: 5,
    avatar: "/Djiba.jpg",
  },
  {
    id: 3,
    name: "Mamadou Kali Diallo",
    role: "Infographie",
    content:
      "Grâce à la formation en infographie, je crée maintenant des logos, flyers et visuels professionnels. J’ai même commencé à travailler en freelance.",
    rating: 5,
    avatar: "/Momo.jpg",
  },
  {
    id: 4,
    name: "Fatou Sow",
    role: "Gestion de caisse",
    content:
      "La formation en gestion de caisse m’a permis de mieux comprendre les opérations commerciales, la gestion des stocks et le suivi des ventes. Je suis beaucoup plus organisée maintenant.",
    rating: 4,
    avatar: "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: 5,
    name: "Youssouf Issa Bilal",
    role: "Marketing Digital",
    content:
      "J’ai appris à gérer les réseaux sociaux, lancer des campagnes publicitaires et analyser les performances. Aujourd’hui, je développe la visibilité de plusieurs entreprises.",
    rating: 5,
    avatar: "/Youssou.jpg",
  },
];

const TestimonialCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0, scale: 0.95 }),
  };

  const t = testimonials[current];

  return (
    <section className="bg-[#0A2A66] py-20 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-[#d93030] font-semibold text-sm uppercase tracking-widest mb-3"
          >
            Témoignages
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white"
          >
            Ce que disent nos apprenants
          </motion.h2>
        </div>

        {/* Carousel */}
        <div className="relative min-h-[320px] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={t.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute w-full max-w-2xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 md:p-10 text-center">
                {/* Quote icon */}
                <Quote className="w-10 h-10 text-[#d93030] mx-auto mb-6 opacity-80" />

                {/* Content */}
                <p className="text-white/90 text-lg md:text-xl leading-relaxed mb-8 italic">
                  "{t.content}"
                </p>

                {/* Stars */}
                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < t.rating
                          ? "text-[#d93030] fill-[#d93030]"
                          : "text-white/30"
                      }`}
                    />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                 <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#d93030] shadow-lg flex-shrink-0">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                                  <div className="text-left">
                    <p className="text-white font-semibold">
                      {t.name}
                    </p>
                    <p className="text-white/60 text-sm">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-20">
          <button
            onClick={prev}
            className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-[#d93030] hover:border-[#d93030] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex gap-2 items-center">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDirection(i > current ? 1 : -1);
                  setCurrent(i);
                }}
                className="group flex items-center justify-center p-0"
                aria-label={`Aller au témoignage ${i + 1}`}
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-10 bg-[#d93030]"
                      : "w-3 bg-white/30 group-hover:bg-white/50"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            onClick={next}
            className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-[#d93030] hover:border-[#d93030] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <Link
            href="/contact"
            className="inline-block bg-[#d93030] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#b82828] transition-colors"
          >
            Rejoignez Bibocom digital
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;
