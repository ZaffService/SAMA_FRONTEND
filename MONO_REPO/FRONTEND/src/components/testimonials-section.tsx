"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    name: "Aminata Diallo",
    role: "Community Manager",
    company: "Startup Dakar",
    avatar: "/professional-african-woman.png",
    rating: 5,
    text: "Les cours de marketing digital m'ont permis de décrocher mon premier emploi en tant que Community Manager. Le contenu est clair, pratique et directement applicable. Je recommande à 100% !",
  },
  {
    id: 2,
    name: "Moussa Ndiaye",
    role: "Entrepreneur",
    company: "E-commerce Sénégal",
    avatar: "/professional-african-man-portrait-smiling.jpg",
    rating: 5,
    text: "Grâce à Bibocom Digital, j'ai pu lancer ma boutique en ligne et maîtriser les techniques de marketing digital. Les formateurs sont accessibles et le support est excellent.",
  },
  {
    id: 3,
    name: "Fatou Sow",
    role: "Responsable Marketing",
    company: "Agence Web",
    avatar: "/professional-african-woman-business-portrait.png",
    rating: 5,
    text: "La qualité des cours est exceptionnelle. J'ai suivi plusieurs formations et chaque fois, j'ai appris des techniques concrètes que j'applique immédiatement dans mon travail.",
  },
];

/**
 * Section témoignages avec carousel
 */
export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  return (
    <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ce que disent nos étudiants
          </h2>
          <p className="text-muted-foreground text-lg">
            Des milliers d'apprenants nous font confiance pour développer leurs
            compétences
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-lg">
            {/* Quote Icon */}
            <div className="absolute -top-6 left-8 md:left-12">
              <div className="bg-primary p-4 rounded-2xl shadow-lg">
                <Quote className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="pt-4">
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-lg md:text-xl text-foreground leading-relaxed mb-8">
                "{testimonials[currentIndex].text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <Image
                  src={testimonials[currentIndex].avatar || "/placeholder.svg"}
                  alt={testimonials[currentIndex].name}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-foreground">
                    {testimonials[currentIndex].name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonials[currentIndex].role} •{" "}
                    {testimonials[currentIndex].company}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full bg-transparent"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-primary"
                      : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full bg-transparent"
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
