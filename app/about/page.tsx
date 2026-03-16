"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Award, BookOpen, Users, Zap, CheckCircle, Target, Eye, Rocket } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Formations 100% Pratiques en Langue Locale",
    description: "Obtenez des certificats valorisés par les employeurs pour booster votre carrière.",
  },
  {
    icon: Users,
    title: "Accès en ligne et présentiel",
    description: "Apprenez à votre rythme, quand vous voulez, où vous voulez, sur tout appareil.",
  },
  {
    icon: Award,
    title: "Formateurs experts",
    description: "Des cours créés par des experts du secteur avec des contenus actualisés et pratiques.",
  },
  {
    icon: Zap,
    title: "Emploi / entrepreneuriat",
    description: "Renforcement des compétences essentielles pour accéder à l’emploi, créer une activité et devenir autonome professionnellement.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-[var(--bibocom-blue)] text-white mt-2">
        <div className="container mx-auto px-6 py-14 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-5">
              À Propos de BIBOCOM Digital
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed text-justify">
              BIBOCOM DIGITAL est une entreprise EdTech africaine spécialisée dans la formation aux métiers du numérique, de la création et de l'entrepreneuriat.
              Nous développons des programmes hybrides (en ligne et en présentiel) accessibles en langues locales pour aider les jeunes, les femmes et les professionnels à acquérir des compétences pratiques et à accéder à des opportunités d'emploi ou d'auto-emploi.
            </p>
          </div>
        </div>
      </div>

      {/* Mission / Vision / Ambition — 3 cards côte à côte */}
      <section className="py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">

            {/* Notre Mission */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 flex flex-col">
              <div className="w-12 h-12 bg-[var(--bibocom-blue)]/10 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-[var(--bibocom-blue)]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[var(--bibocom-blue)]">Notre Mission</h3>
              <p className="text-gray-600 leading-relaxed">
               La mission de BIBOCOM DIGITAL est de contribuer à l’insertion socio-professionnelle des jeunes et des femmes en Afrique en offrant des formations accessibles, pratiques et certifiantes dans les métiers du digital, de la création et de l’entrepreneuriat, grâce à une plateforme d’apprentissage hybride en langues locales combinant technologie, mentorat humain et immersion professionnelle.
              </p>
            </div>

            {/* Notre Vision */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 flex flex-col">
              <div className="w-12 h-12 bg-[var(--bibocom-blue)]/10 rounded-xl flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-[var(--bibocom-blue)]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[var(--bibocom-blue)]">Notre Vision</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                Notre vision est de contribuer à une Afrique où chaque jeune possède les compétences nécessaires pour travailler, entreprendre et réussir dans l’économie numérique et créatif.
              </p>
              <p className="text-gray-600 leading-relaxed">
                BIBOCOM DIGITAL s'inscrit dans une dynamique de transformation sociale et économique.
              </p>
            </div>

            {/* Notre Ambition */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 flex flex-col">
              <div className="w-12 h-12 bg-[var(--bibocom-blue)]/10 rounded-xl flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-[var(--bibocom-blue)]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[var(--bibocom-blue)]">Notre Ambition</h3>
              <p className="text-gray-600 leading-relaxed">
                Rendre la formation digitale accessible à tous et de contribuer à l'employabilité des jeunes en Afrique grâce à l'innovation, au mentorat et à la pratique.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pourquoi Choisir BIBOCOM Digital ? */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0a3183] mb-4">
            Pourquoi choisir <strong className="text-[#e53c35] text-2xl md:text-3xl font-bold" >BIBOCOM</strong> Digital ?
          </h2>
        </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-[var(--bibocom-blue)]/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[var(--bibocom-blue)]" />
                </div>
                <h6 className="font-bold mb-2 text-sm">{feature.title}</h6>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nos Engagements + Domaines — côte à côte */}
      <section className="py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">

            {/* Nos Engagements */}
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-6">
                Nos Engagements
              </h2>
              <div className="grid gap-4">
                {[
                  "Contenu régulièrement mis à jour pour refléter les dernières tendances",
                  "Support pédagogique réactif et personnalisé",
                  "Certificats reconnus par les entreprises partenaires",
                  "Garantie satisfait ou remboursé sous 7 jours",
                  "Accès à vie aux formations achetées",
                ].map((commitment, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{commitment}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* À travers notre écosystème */}
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-6">
                À travers notre écosystème, nous intervenons dans plusieurs domaines :
              </h2>
              <div className="grid gap-4">
                {[
                  "Formation aux métiers du digital et du multimédia ",
                  "Industries culturelles et créatives",
                  "Entrepreneuriat et innovation",
                  "Éducation numérique et citoyenneté digitale",
                  "Accompagnement de projets et insertion professionnelle",
                ].map((commitment, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{commitment}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 lg:py-16 bg-[var(--bibocom-blue)] text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Prêt à Commencer Votre Avenir ?
            </h2>
            <p className="text-xl text-blue-100">
              Rejoignez des milliers d'apprenants qui transforment leur carrière avec BIBOCOM Digital.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-[var(--bibocom-red)] text-white rounded-xl font-semibold shadow-lg hover:bg-[var(--bibocom-red)]/90 transition-all duration-300 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Commencer maintenant
              </Link>
            </div>
            {/* <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
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
