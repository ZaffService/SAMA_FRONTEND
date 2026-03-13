"use client";

import { CheckCircle, Clock, Award, Users, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Formations 100% Pratiques en Langue Locale: Obtenez des certificats valorisés par les employeurs pour booster votre carrière.",
    description:
      "Des cours conçus pour maximiser votre apprentissage en un minimum de temps",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    icon: Award,
    title: "Accès en ligne et présentiel: Apprenez à votre rythme, quand vous voulez, où vous voulez, sur tout appareil.",
    description: "Obtenez des certificats valorisés par les entreprises",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Users,
    title: "Formateurs experts: Des cours créés par des experts du secteur avec des contenus actualisés et pratiques.",
    description: "Rejoignez des milliers d'apprenants motivés comme vous",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  {
    icon: Clock,
    title: "Compétences pour l'emploi / entrepreneuriat: Renforcement des compétences essentielles pour accéder à l’emploi, créer une activité et devenir autonome professionnellement.",
    description: "Une fois inscrit, accédez à vos cours quand vous voulez",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: Shield,
    title: "Garantie satisfait",
    description: "30 jours pour tester, remboursement si non satisfait",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    icon: CheckCircle,
    title: "Support réactif",
    description: "Une équipe dédiée pour répondre à toutes vos questions",
    color: "text-rose-500",
    bgColor: "bg-rose-50",
  },
];

/**
 * Section avantages/features de la plateforme
 */
export function FeaturesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Pourquoi choisir Bibocom Digital ?
          </h2>
          <p className="text-muted-foreground text-lg">
            Une plateforme pensée pour votre réussite avec des fonctionnalités
            qui font la différence
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div
                className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
