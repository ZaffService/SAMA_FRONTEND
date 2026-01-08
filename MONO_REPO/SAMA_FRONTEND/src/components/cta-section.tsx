"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play } from "lucide-react";

/**
 * Section CTA finale avant footer
 */
export function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-hero" />

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">
              Rejoignez plus de 5000 apprenants
            </span>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Prêt à transformer votre carrière ?
          </h2>

          {/* Description */}
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Commencez dès aujourd'hui avec nos formations en marketing digital.
            Des cours gratuits sont disponibles pour démarrer votre
            apprentissage.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold bg-white text-primary hover:bg-white/90 rounded-xl shadow-lg"
              >
                Créer mon compte gratuit
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/courses?filter=free">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base font-semibold border-2 border-white/30 text-white hover:bg-white/10 rounded-xl bg-transparent"
              >
                <Play className="h-5 w-5 mr-2" />
                Voir les cours gratuits
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">100+</div>
              <div className="text-sm text-white/70">Cours disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">5000+</div>
              <div className="text-sm text-white/70">Étudiants actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">4.8/5</div>
              <div className="text-sm text-white/70">Note moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm text-white/70">Support disponible</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
