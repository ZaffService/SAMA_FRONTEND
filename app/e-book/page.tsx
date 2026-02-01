"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BookOpen, Download, Star, ArrowRight, CheckCircle } from "lucide-react";

const ebooks = [
  {
    id: 1,
    title: "Guide Complet du Marketing Digital",
    description: "Apprenez les bases du marketing digital pour développer votre présence en ligne.",
    price: 5000,
    author: "BIBOCOM Digital",
    rating: 4.8,
    reviews: 124,
    image: "/ebook-marketing.png",
  },
  {
    id: 2,
    title: "SEO pour Débutants",
    description: "Optimisez votre site pour les moteurs de recherche et augmentez votre visibilité.",
    price: 3500,
    author: "Expert SEO",
    rating: 4.6,
    reviews: 89,
    image: "/ebook-seo.png",
  },
  {
    id: 3,
    title: "Social Media Marketing 2024",
    description: "Stratégies avancées pour Facebook, Instagram, LinkedIn et TikTok.",
    price: 4500,
    author: "BIBOCOM Digital",
    rating: 4.9,
    reviews: 156,
    image: "/ebook-social.png",
  },
  {
    id: 4,
    title: "Email Marketing Professionnel",
    description: "Créez des campagnes email qui convertissent et fidelisent vos clients.",
    price: 4000,
    author: "Expert CRM",
    rating: 4.7,
    reviews: 98,
    image: "/ebook-email.png",
  },
];

const features = [
  "Formats PDF et ePub",
  "Accessible sur tous les appareils",
  "Mises à jour gratuites",
  "Exemples pratiques",
  "Certificat de completion",
];

export default function EbookPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-[var(--bibocom-blue)] text-white">
        <div className="container mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <BookOpen className="w-10 h-10" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              E-Books & Guides Gratuits
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Téléchargez nos guides complets et apprenez à votre rythme.
              Des ressources de qualité pour développer vos compétences digitales,
              disponibles immédiatement en téléchargement.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[var(--bibocom-blue)] text-white py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">20+</div>
              <div className="text-blue-200 text-sm">E-Books disponibles</div>
            </div>
            <div>
              <div className="text-3xl font-bold">15K+</div>
              <div className="text-blue-200 text-sm">Téléchargements</div>
            </div>
            <div>
              <div className="text-3xl font-bold">4.8</div>
              <div className="text-blue-200 text-sm">Note moyenne</div>
            </div>
            <div>
              <div className="text-3xl font-bold">100%</div>
              <div className="text-blue-200 text-sm">Gratuit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured E-Books */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Nos E-Books Populaires
            </h2>
            <p className="text-gray-600">
              Découvrez nos guides les plus téléchargés et commencez votre apprentissage dès aujourd'hui.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {ebooks.map((ebook) => (
              <div
                key={ebook.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-[var(--bibocom-blue)] to-blue-400 flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-white/50" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="ml-1 text-sm font-medium">{ebook.rating}</span>
                    </div>
                    <span className="text-gray-400 text-sm">({ebook.reviews} avis)</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{ebook.title}</h3>
                  <p className="text-gray-600 mb-4">{ebook.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Par {ebook.author}</span>
                    <span className="text-2xl font-bold text-[var(--bibocom-blue)]">
                      {ebook.price.toLocaleString()} CFA
                    </span>
                  </div>
                  <button className="w-full mt-4 py-3 bg-[var(--bibocom-blue)] text-white font-semibold rounded-lg hover:bg-[var(--bibocom-blue)]/90 transition-all duration-300 flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Télécharger
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8">
                Pourquoi télécharger nos E-Books ?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-[var(--bibocom-blue)] text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Restez informé des nouvelles publications
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Inscrivez-vous à notre newsletter pour être alerté des nouveaux E-Books et guides.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="px-6 py-3 bg-white text-[var(--bibocom-blue)] font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2">
                S'inscrire
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
