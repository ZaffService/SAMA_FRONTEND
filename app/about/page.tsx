"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Image from "next/image";
import { Award, BookOpen, Users, Zap, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Formations de Qualité",
    description: "Des cours créés par des experts du secteur avec des contenus actualisés et pratiques.",
  },
  {
    icon: Users,
    title: "Communauté Active",
    description: "Rejoignez une communauté d'apprenants passionnés et échangez avec nos formateurs.",
  },
  {
    icon: Award,
    title: "Certificats Reconnus",
    description: "Obtenez des certificats valorisés par les employeurs pour booster votre carrière.",
  },
  {
    icon: Zap,
    title: "Apprentissage Flexible",
    description: "Apprenez à votre rythme, quand vous voulez, où vous voulez, sur tout appareil.",
  },
];

// const stats = [
//   { value: "50+", label: "Formations disponibles" },
//   { value: "5K+", label: "Apprenants formés" },
//   { value: "98%", label: "Taux de satisfaction" },
//   { value: "24/7", label: "Support disponible" },
// ];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-[var(--bibocom-blue)] text-white mt-2">
        <div className="container mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              À Propos de BIBOCOM Digital
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Nous démocratisons l'accès à la formation professionnelle en Afrique.
              Notre mission : permettre à chacun de développer ses compétences digitales
              et professionnelles pour réussir dans le monde du travail moderne.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {/* <div className="bg-[var(--bibocom-blue)] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Notre Mission */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
              Notre Mission
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 border border-gray-100">
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Chez BIBOCOM Digital, nous croyons que l'éducation est la clé du développement
                personnel et professionnel. Notre plateforme offre des formations en ligne de
                haute qualité dans les domaines du Marketing Digital, du Développement Web,
                de la Gestion de Projet et bien plus encore.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Notre approche pédagogique combine théorie et pratique pour garantir
                l'acquisition de compétences immédiatement applicables. Chaque cours est
                conçu par des professionnels expérimentés qui partagent leur expertise
                et leurs meilleures pratiques.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            Pourquoi Choisir BIBOCOM Digital ?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-[var(--bibocom-blue)]/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-[var(--bibocom-blue)]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nos Engagements */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
              Nos Engagements
            </h2>
            <div className="grid gap-6">
              {[
                "Contenu régulièrement mis à jour pour refléter les dernières tendances",
                "Support pédagogique réactif et personnalisé",
                "Certificats reconnus par les entreprises partenaires",
                "Garantie satisfait ou remboursé sous 7 jours",
                "Accès à vie aux formations achetées",
              ].map((commitment, index) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 text-lg">{commitment}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-[var(--bibocom-blue)] text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Prêt à Commencer Votre Avenir ?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Rejoignez des milliers d'apprenants qui transforment leur carrière avec BIBOCOM Digital.
            </p>
            {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/courses"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[var(--bibocom-blue)] rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg"
              >
                Découvrir nos formations
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Nous contacter
              </a>
            </div> */}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
